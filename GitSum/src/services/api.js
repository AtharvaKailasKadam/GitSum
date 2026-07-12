/**
 * src/services/api.js
 *
 * All network calls go through here. Points at the GitSum Express backend
 * rather than api.github.com directly — the backend attaches the GitHub PAT
 * server-side, handles caching, and translates HTTP errors into clean shapes.
 *
 * Error classes allow components to branch cleanly:
 *   if (error instanceof NotFoundError)  → show <NotFoundUser />
 *   if (error instanceof RateLimitError) → show <RateLimited retryAfter={n} />
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001/api';

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
    throw new NetworkError();
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
    throw new NetworkError();
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
    throw new NetworkError();
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
