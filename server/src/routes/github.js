import express from 'express';
import { config } from '../config.js';
import { cacheGet, cacheSet } from '../middleware/cache.js';
import { NotFoundError, RateLimitError } from '../middleware/errorHandler.js';
import { callLLM, callLLMChat } from '../services/llm.js';
import { fetchContributions } from '../services/githubGraphQL.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';

export const githubRouter = express.Router();

/** Build Authorization header if a PAT is configured. */
function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'GitSum-Server/1.0',
  };
  if (config.githubToken) {
    headers['Authorization'] = `Bearer ${config.githubToken}`;
  }
  return headers;
}

/**
 * Fetch from GitHub API and translate HTTP errors into our own error classes.
 * @param {string} url
 */
async function githubFetch(url) {
  const res = await fetch(url, { headers: githubHeaders() });

  if (res.status === 404) throw new NotFoundError('GitHub asset not found.');
  if (res.status === 403 || res.status === 429) {
    const retryAfter = parseInt(res.headers.get('X-RateLimit-Reset') ?? '60', 10);
    const secondsUntilReset = Math.max(0, retryAfter - Math.floor(Date.now() / 1000));
    throw new RateLimitError(secondsUntilReset || 60);
  }
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

  return res.json();
}

/**
 * GET /api/user/:username
 * Returns the GitHub user profile.
 */
githubRouter.get('/user/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const cacheKey = `user:${username.toLowerCase()}`;

    const cached = cacheGet(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    const data = await githubFetch(`${config.githubApiBase}/users/${username}`);
    cacheSet(cacheKey, data);
    res.set('X-Cache', 'MISS');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/repos/:username
 * Returns repos sorted by stars (top 100).
 */
githubRouter.get('/repos/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const cacheKey = `repos:${username.toLowerCase()}`;

    const cached = cacheGet(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    const data = await githubFetch(
      `${config.githubApiBase}/users/${username}/repos?sort=stars&per_page=100`
    );
    cacheSet(cacheKey, data);
    res.set('X-Cache', 'MISS');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/contributions/:username
 * Returns GraphQL-sourced contribution calendar. Caches for 1 hour.
 */
githubRouter.get('/contributions/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const cacheKey = `contributions:${username.toLowerCase()}`;

    const cached = cacheGet(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    const data = await fetchContributions(username);
    cacheSet(cacheKey, data, 3600); // 1 hour TTL
    res.set('X-Cache', 'MISS');
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profile-readme/:username
 * Checks for a repo `{username}/{username}` and returns decoded markdown README content. Caches for 1 hour.
 */
githubRouter.get('/profile-readme/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const cacheKey = `profile-readme:${username.toLowerCase()}`;

    const cached = cacheGet(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json({ readme: cached });
    }

    try {
      const data = await githubFetch(
        `${config.githubApiBase}/repos/${username}/${username}/readme`
      );
      
      let decoded = '';
      if (data.content) {
        // Remove newlines from base64 string and decode
        const cleanBase64 = data.content.replace(/\s/g, '');
        decoded = Buffer.from(cleanBase64, 'base64').toString('utf8');
      }

      cacheSet(cacheKey, decoded, 3600); // 1 hour TTL
      res.set('X-Cache', 'MISS');
      res.json({ readme: decoded });
    } catch (e) {
      // If 404 or empty, return null gracefully (don't fail the page)
      cacheSet(cacheKey, '', 3600);
      res.json({ readme: '' });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/insights/:username
 * Returns AI-generated factual summary. Caches for 24 hours.
 */
githubRouter.post('/insights/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const { profile, languages = [], frameworks = [], stats = {} } = req.body;
    const bypassCache = req.query.bypassCache === 'true';
    const cacheKey = `insights:${username.toLowerCase()}`;

    if (!bypassCache) {
      const cached = cacheGet(cacheKey);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json({ summary: cached });
      }
    }

    // Build default rule-based fallback summary
    const langNames = languages.slice(0, 3).map(l => l.name).join(', ');
    const fwNames = frameworks.slice(0, 3).map(f => f.name).join(', ');
    const fallbackSummary = `Developer @${username} is active on GitHub with ${stats.totalRepos ?? 'some'} public repositories, earning a total of ${stats.totalStars ?? 0} stars and ${stats.totalForks ?? 0} forks. Their programming language focus is primarily in ${langNames || 'general developments'}.${fwNames ? ` There is also notable usage of toolsets like ${fwNames}.` : ''} The developer shows consistent project updates and maintains an active learning workspace.`;

    if (process.env.ENABLE_AI_FEATURES !== 'true') {
      return res.json({ summary: fallbackSummary, note: 'AI disabled, using fallback' });
    }

    const systemPrompt = `Write a 2-3 paragraph, third-person, factual summary of this developer's public GitHub activity. Do not invent facts not present in the data. Cover: apparent specialization, activity level, notable strengths, and one honest observation about potential gaps (e.g. no tests visible, mostly personal projects vs collaborative, etc.). Return plain text only.`;
    
    const userPrompt = `
      Username: @${profile.login}
      Name: ${profile.name || 'N/A'}
      Bio: ${profile.bio || 'None'}
      Followers: ${profile.followers} | Following: ${profile.following}
      Public Repos: ${profile.public_repos}
      Total Stars: ${stats.totalStars} | Total Forks: ${stats.totalForks}
      Total Storage: ${stats.totalSizeFormatted}
      Top Languages: ${languages.map(l => `${l.name} (${l.percentage}%)`).join(', ')}
      Detected Frameworks/Tools: ${frameworks.map(f => `${f.name} (${f.confidence} confidence)`).join(', ')}
    `;

    try {
      const summary = await callLLM(userPrompt, systemPrompt);
      cacheSet(cacheKey, summary, 86400); // 24 hours TTL
      res.set('X-Cache', 'MISS');
      res.json({ summary });
    } catch (llmErr) {
      console.error(`LLM call failed for insights: ${llmErr.message}. Serving fallback summary.`);
      res.json({ summary: fallbackSummary, note: 'LLM failed, using fallback' });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/chat/:username
 * Multi-turn chat assistant. Restricted to 10 questions/min per IP.
 */
githubRouter.post('/chat/:username', chatRateLimiter, async (req, res, next) => {
  try {
    const { username } = req.params;
    const { question, conversationHistory = [], context = {} } = req.body;

    if (process.env.ENABLE_AI_FEATURES !== 'true') {
      return res.status(400).json({ error: 'ai_disabled', message: 'AI Chat is currently disabled.' });
    }

    const langNames = context.languages?.map(l => `${l.name} (${l.percentage}%)`).join(', ') || 'N/A';
    const fwNames = context.frameworks?.map(f => f.name).join(', ') || 'None detected';

    const systemPrompt = `
      You are an AI analyst discussing the GitHub profile of the developer @${username}.
      Here is the factual context about their activity:
      - Name: ${context.name || 'N/A'}
      - Bio: ${context.bio || 'None'}
      - Followers: ${context.followers ?? 0} | Following: ${context.following ?? 0}
      - Public Repos: ${context.publicRepos ?? 0}
      - Stars earned: ${context.totalStars ?? 0} | Forks: ${context.totalForks ?? 0}
      - Top Languages: ${langNames}
      - Detected Frameworks/Tools: ${fwNames}

      Rules:
      1. Answer the user's question conversationally but factually, based ONLY on the data above.
      2. If asked about information not contained here (such as salary, age, location, passwords, code snippets in files not listed), respond politely with: "I don't have that information."
      3. Keep responses relatively concise (1-3 sentences).
    `;

    try {
      const reply = await callLLMChat(systemPrompt, conversationHistory, question);
      res.json({ reply });
    } catch (llmErr) {
      console.error(`LLM Chat error: ${llmErr.message}`);
      res.status(500).json({ error: 'llm_error', message: 'The AI service is temporarily unavailable.' });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/repos/health/:username
 * Scans root contents of top 10 repos to calculate a repository health score. Caches for 6 hours.
 */
githubRouter.get('/repos/health/:username', async (req, res, next) => {
  try {
    const { username } = req.params;
    const cacheKey = `health:${username.toLowerCase()}`;

    const cached = cacheGet(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Step 1: Fetch user's repos (from cache or api)
    const reposCacheKey = `repos:${username.toLowerCase()}`;
    let repos = cacheGet(reposCacheKey);
    if (!repos) {
      repos = await githubFetch(
        `${config.githubApiBase}/users/${username}/repos?sort=stars&per_page=100`
      );
      cacheSet(reposCacheKey, repos);
    }

    const top10 = repos.slice(0, 10);
    const healthScores = {};

    // Step 2: Fetch contents listing for top 10 repos in parallel
    const checklistPromises = top10.map(async (repo) => {
      let score = 0;
      const details = {
        hasReadme: false,
        hasLicense: false,
        hasCI: false,
        hasTests: false,
        updatedRecently: false,
        hasDescription: false,
      };

      try {
        const contents = await githubFetch(
          `${config.githubApiBase}/repos/${username}/${repo.name}/contents`
        );
        
        if (Array.isArray(contents)) {
          details.hasReadme = contents.some(item => /readme/i.test(item.name));
          details.hasLicense = contents.some(item => /license/i.test(item.name) || /copying/i.test(item.name));
          details.hasCI = contents.some(item => 
            (item.type === 'dir' && item.name === '.github') || 
            /\.(gitlab-ci\.yml|travis\.yml|appveyor\.yml)/i.test(item.name)
          );
          details.hasTests = contents.some(item => 
            /^(test|tests|__tests__)$/i.test(item.name) ||
            /\.(test|spec)\.[a-z0-9]+$/i.test(item.name)
          );
        }
      } catch (err) {
        // If repo is empty or matches 404, we treat contents as empty checklist
        console.warn(`Failed to inspect file contents for ${username}/${repo.name}: ${err.message}`);
      }

      // Compute scores
      if (details.hasReadme) score += 20;
      if (details.hasLicense) score += 15;
      if (details.hasCI) score += 20;
      if (details.hasTests) score += 20;

      const lastUpdated = new Date(repo.updated_at);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      if (lastUpdated >= sixMonthsAgo) {
        details.updatedRecently = true;
        score += 15;
      }

      if (repo.description) {
        details.hasDescription = true;
        score += 10;
      }

      healthScores[repo.id] = { score, details };
    });

    await Promise.all(checklistPromises);

    cacheSet(cacheKey, healthScores, 21600); // 6 hours TTL
    res.set('X-Cache', 'MISS');
    res.json(healthScores);
  } catch (err) {
    next(err);
  }
});

/** Helper to generate fallback SVG when github-readme-stats is down */
function getFallbackStatsSvg(username, theme, isTopLangs = false) {
  const isLight = theme === 'light';
  const bg = isLight ? '#ffffff' : '#0d1117';
  const border = isLight ? '#e1e4e8' : '#30363d';
  const text = isLight ? '#24292e' : '#c9d1d9';
  const textMuted = isLight ? '#586069' : '#8b949e';
  const title = isLight ? '#ff6200' : '#ff9c42';

  if (isTopLangs) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="195" viewBox="0 0 400 195">
  <rect width="398" height="193" x="1" y="1" rx="10" fill="${bg}" stroke="${border}" stroke-width="1"/>
  <text x="25" y="35" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="18" font-weight="600" fill="${title}">Top Languages</text>
  <text x="25" y="80" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" fill="${text}">Languages stats temporarily unavailable</text>
  <text x="25" y="105" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="12" fill="${textMuted}">The external statistics service is currently offline.</text>
  <text x="25" y="125" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="12" fill="${textMuted}">You can view the local language analytics charts below.</text>
</svg>`;
  } else {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="195" viewBox="0 0 400 195">
  <rect width="398" height="193" x="1" y="1" rx="10" fill="${bg}" stroke="${border}" stroke-width="1"/>
  <text x="25" y="35" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="18" font-weight="600" fill="${title}">GitHub Stats</text>
  <text x="25" y="80" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" fill="${text}">Stats temporarily unavailable</text>
  <text x="25" y="105" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="12" fill="${textMuted}">The external statistics service is currently offline.</text>
  <text x="25" y="125" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="12" fill="${textMuted}">Your profile overview and repository details are available below.</text>
</svg>`;
  }
}

/**
 * GET /api/stats-card/:username
 * Proxies to github-readme-stats.vercel.app and caches the SVG to prevent rate limiting.
 * Returns local fallback SVG on failure with 200 status to avoid console errors.
 */
githubRouter.get('/stats-card/:username', async (req, res) => {
  const { username } = req.params;
  const theme = req.query.theme || 'dark';
  const textClr = theme === 'light' ? '111118' : 'f0f0f5';
  const accentClr = theme === 'light' ? 'ff6200' : 'ff9c42';
  
  const cacheKey = `stats-card:${username.toLowerCase()}:${theme}`;
  const cachedSvg = cacheGet(cacheKey);
  
  if (cachedSvg) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('X-Cache', 'HIT');
    return res.send(cachedSvg);
  }

  const targetUrl = `https://github-readme-stats.vercel.app/api?username=${encodeURIComponent(username)}&show_icons=true&theme=transparent&hide_border=true&text_color=${textClr}&icon_color=${accentClr}&title_color=${accentClr}`;

  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const svgText = await response.text();
      cacheSet(cacheKey, svgText, 14400); // Cache for 4 hours
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('X-Cache', 'MISS');
      return res.send(svgText);
    } else {
      console.warn(`External stats-card returned status ${response.status} for ${username}`);
    }
  } catch (err) {
    console.warn(`Failed to fetch external stats-card for ${username}: ${err.message}`);
  }

  const fallback = getFallbackStatsSvg(username, theme, false);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(fallback);
});

/**
 * GET /api/top-langs-card/:username
 * Proxies to github-readme-stats.vercel.app and caches the SVG to prevent rate limiting.
 * Returns local fallback SVG on failure with 200 status to avoid console errors.
 */
githubRouter.get('/top-langs-card/:username', async (req, res) => {
  const { username } = req.params;
  const theme = req.query.theme || 'dark';
  const textClr = theme === 'light' ? '111118' : 'f0f0f5';
  const accentClr = theme === 'light' ? 'ff6200' : 'ff9c42';
  
  const cacheKey = `top-langs-card:${username.toLowerCase()}:${theme}`;
  const cachedSvg = cacheGet(cacheKey);
  
  if (cachedSvg) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('X-Cache', 'HIT');
    return res.send(cachedSvg);
  }

  const targetUrl = `https://github-readme-stats.vercel.app/api/top-langs/?username=${encodeURIComponent(username)}&layout=compact&theme=transparent&hide_border=true&text_color=${textClr}&title_color=${accentClr}`;

  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const svgText = await response.text();
      cacheSet(cacheKey, svgText, 14400); // Cache for 4 hours
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('X-Cache', 'MISS');
      return res.send(svgText);
    } else {
      console.warn(`External top-langs-card returned status ${response.status} for ${username}`);
    }
  } catch (err) {
    console.warn(`Failed to fetch external top-langs-card for ${username}: ${err.message}`);
  }

  const fallback = getFallbackStatsSvg(username, theme, true);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(fallback);
});
