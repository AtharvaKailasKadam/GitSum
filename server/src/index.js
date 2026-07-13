import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { githubRouter } from './routes/github.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { cacheStats } from './middleware/cache.js';

const app = express();

app.set('trust proxy', 1);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(morgan('dev'));

app.use(cors((req, callback) => {
  const origin = req.header('Origin');
  let isAllowed = false;
  
  // Allow server-to-server or tools (no origin header)
  if (!origin) {
    isAllowed = true;
  } else {
    // 1. Check if same-origin (origin host matches current request host)
    let originHost = '';
    try {
      originHost = new URL(origin).host;
    } catch (e) {}
    
    const host = req.get('host');
    if (originHost && host && originHost === host) {
      isAllowed = true;
    }
    
    // 2. Dynamic matching for any local development port
    if (!isAllowed && (/^https?:\/\/localhost:\d+$/.test(origin) || /^https?:\/\/127\.0\.0\.1:\d+$/.test(origin))) {
      isAllowed = true;
    }
    
    // 3. Check allowed origins from env
    if (!isAllowed) {
      const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map(o => o.trim());
      if (allowedOrigins.includes(origin)) {
        isAllowed = true;
      }
    }
  }

  if (isAllowed) {
    callback(null, { origin: true, optionsSuccessStatus: 200 });
  } else {
    callback(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json());

// Apply rate limiting to all /api routes
app.use('/api', apiRateLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    githubAuth: process.env.GITHUB_TOKEN ? 'token present (5000 req/hr)' : 'unauthenticated (60 req/hr)',
    cache: cacheStats(),
  });
});

app.use('/api', githubRouter);

// ─── Error handler (must be last) ─────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001', 10);
// Watch reload trigger
app.listen(PORT, () => {
  console.log(`✅ GitSum server running on http://localhost:${PORT}`);
  console.log(`   GitHub auth: ${process.env.GITHUB_TOKEN ? '🔐 PAT configured' : '⚠️  No token (60 req/hr)'}`);
  console.log(`   CORS origin: ${process.env.CLIENT_ORIGIN}`);
});
