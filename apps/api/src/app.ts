import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import { globalLimiter, writeLimiter } from './middleware/rate-limit.js';
import { isSupabaseConfigured } from './lib/supabase-admin.js';
import { transactionsRouter } from './routes/transactions.js';
import { balanceRouter } from './routes/balance.js';
import { investmentsRouter } from './routes/investments.js';
import { profileRouter } from './routes/profile.js';
import { vehiclesRouter } from './routes/vehicles.js';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  }),
);

function allowedOrigins(): string[] {
  const fromEnv = (process.env.CORS_ORIGIN ?? process.env.WEB_ORIGIN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== 'production') {
    return [...new Set([...fromEnv, 'http://localhost:5173', 'http://127.0.0.1:5173'])];
  }
  return fromEnv;
}

app.use((req, res, next) => {
  cors({
    origin(origin, cb) {
      if (!origin) {
        cb(null, true);
        return;
      }
      try {
        if (new URL(origin).host === req.headers.host) {
          cb(null, true);
          return;
        }
      } catch {
        cb(null, false);
        return;
      }
      cb(null, allowedOrigins().includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  })(req, res, next);
});

app.use(express.json({ limit: '900kb' }));
app.use(globalLimiter);
app.use((req, res, next) => {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    writeLimiter(req, res, next);
    return;
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: isSupabaseConfigured() });
});

app.use('/api/transactions', requireAuth, transactionsRouter);
app.use('/api/balance', requireAuth, balanceRouter);
app.use('/api/investments', requireAuth, investmentsRouter);
app.use('/api/vehicles', requireAuth, vehiclesRouter);
app.use('/api/profile', requireAuth, profileRouter);

app.use('/api', notFound);
app.use(errorHandler);
