import rateLimit from 'express-rate-limit';
import { serverConfig as config } from '../config.js';

/**
 * Express rate limiter that protects the server (and the GitHub token's quota)
 * from abusive clients.  Defaults to 30 requests/min per IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: config.rateLimitPerMinute,
  standardHeaders: 'draft-7', // Return rate-limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    error: 'too_many_requests',
    message: 'Too many requests from this IP. Please wait a minute and try again.',
    retryAfter: 60,
  },
  handler(req, res, next, options) {
    res.status(429).json(options.message);
  },
});

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'too_many_requests',
    message: 'Chat rate limit exceeded (maximum 10 questions per minute). Please wait and try again.',
    retryAfter: 60,
  },
  handler(req, res, next, options) {
    res.status(429).json(options.message);
  },
});
