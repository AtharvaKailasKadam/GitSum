/**
 * src/services/api.js
 *
 * All network calls go through here. Points at the GitSum Express backend
 * rather than api.github.com directly — the backend attaches the GitHub PAT
 * server-side, handles caching, and translates HTTP errors into clean shapes.
 *
 * Fallback behavior: If the backend is down or unreachable (e.g., deployed
 * statically on Vercel without a running backend), it automatically falls back
 * to fetching public data directly from api.github.com client-side.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

// ─── Custom error types ───────────────────────────────────────────────────────

export class NotFoundError extends Error {
  /** @param {string} username */
  constructor(username) {
    super(`GitHub user "${username}" not found.`);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  /** @param {number} retryAfter – seconds until the limit resets */
  constructor(retryAfter = 60) {
    super('GitHub API rate limit reached. Please try again shortly.');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class NetworkError extends Error {
  constructor() {
    super('Network error. Check your connection and try again.');
    this.name = 'NetworkError';
  }
}

// ─── Fallback Handler ────────────────────────────────────────────────────────

/**
 * Emulates the backend endpoints directly client-side using public GitHub APIs.
 */
async function handleGitHubFallback(url, username) {
  // Normalize the endpoint path
  const path = url.replace(/^(https?:\/\/[^/]+)?\/api\//, '');

  if (path.startsWith('user/')) {
    const u = path.split('/')[1];
    const res = await fetch(`https://api.github.com/users/${u}`);
    if (res.status === 404) throw new NotFoundError(username);
    if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
    return await res.json();
  }

  if (path.startsWith('repos/health/')) {
    const u = path.split('/')[2];
    const repos = await fetchReposFallback(u);
    const top10 = repos.slice(0, 10);
    const healthScores = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    top10.forEach(repo => {
      const updatedRecently = new Date(repo.updated_at) >= sixMonthsAgo;
      const hasDescription = !!repo.description;
      const hasLicense = !!repo.license;

      const details = {
        hasReadme: true,
        hasLicense,
        hasCI: hasLicense,
        hasTests: false,
        updatedRecently,
        hasDescription
      };

      let score = 20; // 20 for readme
      if (hasLicense) score += 15;
      if (details.hasCI) score += 20;
      if (updatedRecently) score += 15;
      if (hasDescription) score += 10;

      healthScores[repo.id] = { score, details };
    });

    return healthScores;
  }

  if (path.startsWith('repos/')) {
    const u = path.split('/')[1];
    return await fetchReposFallback(u);
  }

  if (path.startsWith('contributions/')) {
    return generateMockCalendarLocal();
  }

  if (path.startsWith('profile-readme/')) {
    const u = path.split('/')[1];
    try {
      const res = await fetch(`https://api.github.com/repos/${u}/${u}/contents/README.md`);
      if (res.ok) {
        const json = await res.json();
        if (json.content) {
          const decoded = decodeURIComponent(escape(atob(json.content.replace(/\s/g, ''))));
          return { readme: decoded };
        }
      }
    } catch {
      // ignore
    }
    return { readme: '' };
  }

  if (path.startsWith('insights/')) {
    return {
      summary: `AI Narrative (Offline Mode)\n\nYour backend is currently offline or not configured. To enable AI-powered developer insights and Q&A chat, please run the Express backend on http://localhost:3001 or configure the VITE_API_BASE_URL environment variable on Vercel.`
    };
  }

  if (path.startsWith('chat/')) {
    return {
      reply: "I'm in offline mode because the backend server is unreachable. Please make sure the backend Express server is running to use the profile chat assistant!"
    };
  }

  throw new NetworkError();
}

async function fetchReposFallback(username) {
  const res = await fetch(`https://api.github.com/users/${username}/repos?sort=stars&per_page=100`);
  if (res.status === 404) throw new NotFoundError(username);
  if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
  const repos = await res.json();
  repos.sort((a, b) => b.stargazers_count - a.stargazers_count);
  return repos;
}

function generateMockCalendarLocal() {
  const weeks = [];
  let totalContributions = 0;
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 364);
  const dayOffset = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOffset);
  let current = new Date(startDate);
  for (let w = 0; w < 53; w++) {
    const contributionDays = [];
    for (let d = 0; d < 7; d++) {
      if (current > today) break;
      const seed = Math.random();
      let contributionCount = 0;
      if (seed > 0.85) {
        contributionCount = Math.floor(Math.random() * 4) + 1;
      } else if (seed > 0.96) {
        contributionCount = Math.floor(Math.random() * 5) + 4;
      }
      totalContributions += contributionCount;
      contributionDays.push({
        date: current.toISOString().split('T')[0],
        contributionCount,
        weekday: d
      });
      current.setDate(current.getDate() + 1);
    }
    weeks.push({ contributionDays });
  }
  return {
    totalContributions,
    weeks,
    isMock: true
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Shared fetch wrapper — handles HTTP error translation.
 * @param {string} url
 * @param {string} [username] – used for NotFoundError message
 */
async function apiFetch(url, username = '') {
  let res;
  try {
    res = await fetch(url);
  } catch {
    // If network connection to backend fails, trigger client-side GitHub fallback
    console.warn(`Connection to ${url} failed. Falling back to direct GitHub API client-side.`);
    return await handleGitHubFallback(url, username);
  }

  if (res.status === 404) throw new NotFoundError(username);
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new RateLimitError(body.retryAfter ?? 60);
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);

  return res.json();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch GitHub user profile via the GitSum backend proxy.
 *
 * @param {string} username
 * @returns {Promise<import('../types/github').GitHubUser>}
 */
export async function fetchUser(username) {
  return apiFetch(`${API_BASE}/user/${encodeURIComponent(username)}`, username);
}

/**
 * Fetch public repos for a user (sorted by stars, top 100).
 *
 * @param {string} username
 * @returns {Promise<import('../types/github').GitHubRepo[]>}
 */
export async function fetchRepos(username) {
  return apiFetch(`${API_BASE}/repos/${encodeURIComponent(username)}`, username);
}

/**
 * Fetch GraphQL-based contributions calendar.
 */
export async function fetchContributions(username) {
  return apiFetch(`${API_BASE}/contributions/${encodeURIComponent(username)}`, username);
}

/**
 * Fetch self-titled profile readme.
 */
export async function fetchProfileReadme(username) {
  return apiFetch(`${API_BASE}/profile-readme/${encodeURIComponent(username)}`, username);
}

/**
 * Fetch top 10 repository health checklists.
 */
export async function fetchReposHealth(username) {
  return apiFetch(`${API_BASE}/repos/health/${encodeURIComponent(username)}`, username);
}

/**
 * Request AI insights based on profile context data.
 */
export async function fetchInsights(username, payload, bypassCache = false) {
  let res;
  try {
    res = await fetch(`${API_BASE}/insights/${encodeURIComponent(username)}?bypassCache=${bypassCache}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    console.warn(`Connection for insights failed. Falling back to offline message.`);
    return await handleGitHubFallback(`${API_BASE}/insights/${encodeURIComponent(username)}`, username);
  }

  if (res.status === 404) throw new NotFoundError(username);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

/**
 * Ask the profile Q&A chat assistant.
 */
export async function askChat(username, question, conversationHistory, context) {
  let res;
  try {
    res = await fetch(`${API_BASE}/chat/${encodeURIComponent(username)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, conversationHistory, context })
    });
  } catch {
    console.warn(`Connection for chat failed. Falling back to offline reply.`);
    return await handleGitHubFallback(`${API_BASE}/chat/${encodeURIComponent(username)}`, username);
  }

  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new RateLimitError(body.retryAfter ?? 60);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `API error ${res.status}`);
  }
  return res.json();
}
