import 'dotenv/config';

/**
 * Centralised configuration — loaded once at startup.
 * All process.env access should go through here.
 */
export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),

  /**
   * GitHub PAT.  Optional — if omitted, unauthenticated calls are made (60 req/hr).
   * When present, the token is attached server-side and NEVER sent to the client.
   */
  githubToken: process.env.GITHUB_TOKEN ?? null,

  /** Only this origin may call the API in production. */
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',

  /** Cache TTL in milliseconds (default 5 minutes). */
  cacheTtlMs: parseInt(process.env.CACHE_TTL_MS ?? '300000', 10),

  /** Max GitHub API calls per IP per minute on this server. */
  rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_RPM ?? '30', 10),

  githubApiBase: 'https://api.github.com',
};
