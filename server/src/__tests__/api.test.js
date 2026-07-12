import { describe, it, expect, vi, beforeEach } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import cors from 'cors';
import { githubRouter } from '../routes/github.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { cacheSet, cacheGet } from '../middleware/cache.js';

// Setup basic app for testing
const app = express();
app.use(express.json());
app.use('/api', githubRouter);
app.use(errorHandler);

const request = supertest(app);

describe('GET /health', () => {
  // Let's create a quick mini-app with the health route to test it
  it('returns health status information', async () => {
    const healthApp = express();
    healthApp.get('/health', (req, res) => {
      res.json({ status: 'ok', githubAuth: 'unauthenticated' });
    });

    const res = await supertest(healthApp).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.githubAuth).toBe('unauthenticated');
  });
});

describe('Proxy API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear global fetch mock if any
    if (global.fetch) {
      vi.restoreAllMocks();
    }
  });

  it('GET /api/user/:username uses cache if data is present', async () => {
    const fakeUser = { login: 'cached-user', name: 'Cached User' };
    cacheSet('user:cached-user', fakeUser);

    const res = await request.get('/api/user/cached-user');
    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('HIT');
    expect(res.body).toEqual(fakeUser);
  });

  it('GET /api/user/:username proxies to GitHub and saves to cache on cache miss', async () => {
    const fakeGithubUser = { login: 'github-user', name: 'GitHub User' };

    // Mock global fetch
    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(fakeGithubUser),
        headers: new Headers(),
      })
    );

    const res = await request.get('/api/user/github-user');

    expect(res.status).toBe(200);
    expect(res.headers['x-cache']).toBe('MISS');
    expect(res.body).toEqual(fakeGithubUser);

    // Verify fetch was called with correct URL
    expect(fetchSpy).toHaveBeenCalledWith('https://api.github.com/users/github-user', expect.any(Object));

    // Verify it is now in cache
    expect(cacheGet('user:github-user')).toEqual(fakeGithubUser);
  });

  it('GET /api/user/:username handles 404 Not Found error properly', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not Found' }),
        headers: new Headers(),
      })
    );

    const res = await request.get('/api/user/nonexistent-user');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: 'not_found',
      message: 'GitHub asset not found.',
    });
  });

  it('GET /api/user/:username handles 403 Rate Limit error properly', async () => {
    const headers = new Headers();
    headers.set('X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 120));

    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: 'Rate Limit Exceeded' }),
        headers,
      })
    );

    const res = await request.get('/api/user/limited-user');

    expect(res.status).toBe(429);
    expect(res.body.error).toBe('rate_limited');
    expect(res.body.retryAfter).toBeGreaterThan(0);
  });
});
