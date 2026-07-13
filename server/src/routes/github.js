import express from 'express';
import { cacheGet, cacheSet } from '../middleware/cache.js';
import { NotFoundError, RateLimitError } from '../middleware/errorHandler.js';
import { callLLM, callLLMChat } from '../services/llm.js';
import { fetchContributions } from '../services/githubGraphQL.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';

export const githubRouter = express.Router();

const GITHUB_API_BASE = 'https://api.github.com';

/** Build Authorization header if a PAT is configured. */
function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'GitSum-Server/1.0',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
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

    const data = await githubFetch(`${GITHUB_API_BASE}/users/${username}`);
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
      `${GITHUB_API_BASE}/users/${username}/repos?sort=stars&per_page=100`
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
        `${GITHUB_API_BASE}/repos/${username}/${username}/readme`
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
        `${GITHUB_API_BASE}/users/${username}/repos?sort=stars&per_page=100`
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
          `${GITHUB_API_BASE}/repos/${username}/${repo.name}/contents`
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


/** Helper to render a beautiful local GitHub stats card */
function renderStatsSvg(username, stats, theme) {
  const isLight = theme === 'light';
  const bg = isLight ? '#ffffff' : '#0d1117';
  const border = isLight ? '#e1e4e8' : '#30363d';
  const text = isLight ? '#24292e' : '#c9d1d9';
  const title = isLight ? '#ff6200' : '#ff9c42';
  const accent = isLight ? '#ff6200' : '#ff9c42';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="195" viewBox="0 0 400 195">
  <rect width="398" height="193" x="1" y="1" rx="10" fill="${bg}" stroke="${border}" stroke-width="1"/>
  
  <!-- Title -->
  <text x="25" y="35" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="18" font-weight="600" fill="${title}">${username}'s GitHub Stats</text>
  
  <!-- Total Stars -->
  <g transform="translate(25, 55)">
    <path fill="${accent}" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" transform="scale(1.1)"/>
    <text x="25" y="12" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" font-weight="600" fill="${text}">Total Stars:</text>
    <text x="140" y="12" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" font-weight="bold" fill="${accent}">${stats.totalStars}</text>
  </g>

  <!-- Total Commits -->
  <g transform="translate(25, 82)">
    <path fill="${accent}" d="M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.43.75a4.002 4.002 0 0 0-7.86 0H.75a.75.75 0 1 0 0 1.5h3.32a4.002 4.002 0 0 0 7.86 0h3.32a.75.75 0 1 0 0-1.5h-3.32Z" transform="scale(1.1)"/>
    <text x="25" y="12" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" font-weight="600" fill="${text}">Total Commits:</text>
    <text x="140" y="12" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" font-weight="bold" fill="${accent}">${stats.totalCommits}</text>
  </g>

  <!-- Total Forks -->
  <g transform="translate(25, 109)">
    <path fill="${accent}" d="M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v5.256a2.251 2.251 0 1 0 1.5 0V5.372Zm-1.25 7.378a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm7.5-10a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm0 2.122a2.25 2.25 0 1 0-1.5 0v.628A2.25 2.25 0 0 0 7.5 7.75h-.75a.75.75 0 0 0 0 1.5h.75a3.75 3.75 0 0 1 3.75 3.75v.628a2.251 2.251 0 1 0 1.5 0V5.494ZM11.25 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" transform="scale(1.1)"/>
    <text x="25" y="12" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" font-weight="600" fill="${text}">Total Forks:</text>
    <text x="140" y="12" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" font-weight="bold" fill="${accent}">${stats.totalForks}</text>
  </g>

  <!-- Public Repos -->
  <g transform="translate(25, 136)">
    <path fill="${accent}" d="M3 2.75C3 1.784 3.784 1 4.75 1h7.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 12 15H4.75A1.75 1.75 0 0 1 3 13.25V2.75Zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h7.25a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25H4.75Z" transform="scale(1.1)"/>
    <text x="25" y="12" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" font-weight="600" fill="${text}">Public Repos:</text>
    <text x="140" y="12" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" font-weight="bold" fill="${accent}">${stats.publicRepos}</text>
  </g>

  <!-- Followers -->
  <g transform="translate(25, 163)">
    <path fill="${accent}" d="M5.5 3.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM2 2.5a3.5 3.5 0 1 1 7 0v.5H2v-.5Zm10 1a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-1.5.5a3.5 3.5 0 0 1 4.25 3.429v.571h-5v-.5a3.486 3.486 0 0 0-1.684-3H10.5ZM1.025 8.006A6.002 6.002 0 0 1 11 9.5v.5H1v-.5c0-1.155.324-2.234.896-3.153ZM10 9.5a4.49 4.49 0 0 0-.896-2.653A5.495 5.495 0 0 1 14 9.5v.5h-4v-.5Z" transform="scale(1.1)"/>
    <text x="25" y="12" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" font-weight="600" fill="${text}">Followers:</text>
    <text x="140" y="12" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" font-weight="bold" fill="${accent}">${stats.followers}</text>
  </g>
</svg>`;
}

/** Helper to render a beautiful local GitHub top languages card */
function renderTopLangsSvg(username, sortedLangs, theme) {
  const isLight = theme === 'light';
  const bg = isLight ? '#ffffff' : '#0d1117';
  const border = isLight ? '#e1e4e8' : '#30363d';
  const text = isLight ? '#24292e' : '#c9d1d9';
  const title = isLight ? '#ff6200' : '#ff9c42';
  const accent = isLight ? '#ff6200' : '#ff9c42';

  const langColors = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Python: '#3572A5',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Go: '#00ADD8',
    Rust: '#dea584',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#F05138',
    Shell: '#89e051',
    Dart: '#00B4AB'
  };

  let langItems = '';
  if (sortedLangs.length === 0) {
    langItems = `<text x="25" y="80" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" fill="${text}">No languages detected in public repositories.</text>`;
  } else {
    sortedLangs.forEach((lang, index) => {
      const yOffset = 58 + index * 26;
      const color = langColors[lang.name] || '#858585';
      const pctWidth = Math.round(lang.percentage * 1.5); // Max width of progress bar is 150px
      langItems += `
    <g transform="translate(25, ${yOffset})">
      <circle cx="5" cy="6" r="5" fill="${color}" />
      <text x="18" y="10" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="12" font-weight="600" fill="${text}">${lang.name}</text>
      <text x="125" y="10" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="12" font-weight="600" fill="${text}">${lang.percentage}%</text>
      
      <!-- Progress Bar -->
      <rect x="175" y="1" width="150" height="8" rx="4" fill="${isLight ? '#e1e4e8' : '#21262d'}" />
      <rect x="175" y="1" width="${pctWidth}" height="8" rx="4" fill="${color}" />
    </g>`;
    });
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="195" viewBox="0 0 400 195">
  <rect width="398" height="193" x="1" y="1" rx="10" fill="${bg}" stroke="${border}" stroke-width="1"/>
  
  <!-- Title -->
  <text x="25" y="35" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="18" font-weight="600" fill="${title}">Top Languages</text>
  
  ${langItems}
</svg>`;
}

/** Render error stats card */
function getErrorStatsSvg(username, theme, message) {
  const isLight = theme === 'light';
  const bg = isLight ? '#ffffff' : '#0d1117';
  const border = isLight ? '#e1e4e8' : '#30363d';
  const text = isLight ? '#24292e' : '#c9d1d9';
  const title = isLight ? '#ff6200' : '#ff9c42';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="195" viewBox="0 0 400 195">
  <rect width="398" height="193" x="1" y="1" rx="10" fill="${bg}" stroke="${border}" stroke-width="1"/>
  <text x="25" y="35" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="18" font-weight="600" fill="${title}">Error Loading Stats</text>
  <text x="25" y="80" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif" font-size="14" fill="${text}">${message}</text>
</svg>`;
}

/**
 * GET /api/stats-card/:username
 * Dynamically computes and renders the stats card SVG locally.
 */
githubRouter.get('/stats-card/:username', async (req, res) => {
  const { username } = req.params;
  const theme = req.query.theme || 'dark';
  
  const cacheKey = `stats-card:${username.toLowerCase()}:${theme}`;
  const cachedSvg = cacheGet(cacheKey);
  
  if (cachedSvg) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('X-Cache', 'HIT');
    return res.send(cachedSvg);
  }

  try {
    // 1. Fetch user profile
    const userCacheKey = `user:${username.toLowerCase()}`;
    let user = cacheGet(userCacheKey);
    if (!user) {
      user = await githubFetch(`${GITHUB_API_BASE}/users/${username}`);
      cacheSet(userCacheKey, user);
    }

    // 2. Fetch repos
    const reposCacheKey = `repos:${username.toLowerCase()}`;
    let repos = cacheGet(reposCacheKey);
    if (!repos) {
      repos = await githubFetch(
        `${GITHUB_API_BASE}/users/${username}/repos?sort=stars&per_page=100`
      );
      cacheSet(reposCacheKey, repos);
    }

    // 3. Fetch contributions
    const contributionsCacheKey = `contributions:${username.toLowerCase()}`;
    let contributions = cacheGet(contributionsCacheKey);
    if (!contributions) {
      try {
        contributions = await fetchContributions(username);
        cacheSet(contributionsCacheKey, contributions, 3600);
      } catch (err) {
        contributions = { totalContributions: 0 };
      }
    }

    // 4. Calculate stats
    const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0);
    const totalForks = repos.reduce((sum, r) => sum + (r.forks_count ?? 0), 0);
    const totalCommits = contributions.totalContributions ?? 0;
    const publicRepos = user.public_repos ?? 0;
    const followers = user.followers ?? 0;

    const svg = renderStatsSvg(username, {
      totalStars,
      totalCommits,
      totalForks,
      publicRepos,
      followers
    }, theme);

    cacheSet(cacheKey, svg, 14400); // Cache for 4 hours
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('X-Cache', 'MISS');
    return res.send(svg);

  } catch (err) {
    console.error(`Failed to generate stats-card for ${username}: ${err.message}`);
    const errorSvg = getErrorStatsSvg(username, theme, err.message || 'Unknown error');
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(errorSvg);
  }
});

/**
 * GET /api/top-langs-card/:username
 * Dynamically computes and renders the top languages SVG locally.
 */
githubRouter.get('/top-langs-card/:username', async (req, res) => {
  const { username } = req.params;
  const theme = req.query.theme || 'dark';
  
  const cacheKey = `top-langs-card:${username.toLowerCase()}:${theme}`;
  const cachedSvg = cacheGet(cacheKey);
  
  if (cachedSvg) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('X-Cache', 'HIT');
    return res.send(cachedSvg);
  }

  try {
    // Fetch repos
    const reposCacheKey = `repos:${username.toLowerCase()}`;
    let repos = cacheGet(reposCacheKey);
    if (!repos) {
      repos = await githubFetch(
        `${GITHUB_API_BASE}/users/${username}/repos?sort=stars&per_page=100`
      );
      cacheSet(reposCacheKey, repos);
    }

    // Calculate top languages
    const langMap = {};
    let totalCount = 0;
    repos.forEach(repo => {
      if (repo.language) {
        langMap[repo.language] = (langMap[repo.language] || 0) + 1;
        totalCount += 1;
      }
    });

    const sortedLangs = Object.entries(langMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const svg = renderTopLangsSvg(username, sortedLangs, theme);

    cacheSet(cacheKey, svg, 14400); // Cache for 4 hours
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('X-Cache', 'MISS');
    return res.send(svg);

  } catch (err) {
    console.error(`Failed to generate top-langs-card for ${username}: ${err.message}`);
    const errorSvg = getErrorStatsSvg(username, theme, err.message || 'Unknown error');
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(errorSvg);
  }
});
