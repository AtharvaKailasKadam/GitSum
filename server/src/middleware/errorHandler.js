/**
 * Centralised error-handling middleware.
 *
 * Translates raw GitHub API errors (and our own thrown errors) into a
 * consistent JSON shape so the frontend can branch cleanly on `error.type`.
 *
 * Error shapes:
 *   { error: 'not_found',      message: string }
 *   { error: 'rate_limited',   message: string, retryAfter: number }
 *   { error: 'server_error',   message: string }
 */

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // GitHub 404 — user does not exist
  if (err.status === 404 || err.name === 'NotFoundError') {
    return res.status(404).json({
      error: 'not_found',
      message: err.message ?? 'GitHub user not found.',
    });
  }

  // GitHub 403 / rate limit exceeded
  if (err.status === 403 || err.status === 429 || err.name === 'RateLimitError') {
    const retryAfter = err.retryAfter ?? 60;
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'rate_limited',
      message: 'GitHub API rate limit reached. Try again shortly.',
      retryAfter,
    });
  }

  // Fallback — unexpected server error
  console.error('[error]', err);
  return res.status(500).json({
    error: 'server_error',
    message: 'An unexpected error occurred.',
  });
}

/** Custom error classes for clean throws inside route handlers. */
export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

export class RateLimitError extends Error {
  constructor(retryAfter = 60) {
    super('GitHub API rate limit exceeded.');
    this.name = 'RateLimitError';
    this.status = 429;
    this.retryAfter = retryAfter;
  }
}
