import { rateLimit } from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

function jsonMessage(message: string) {
  return (_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) => {
    res.status(429).json({ error: message });
  };
}

/** Broad cap so a single IP cannot hammer health + auth + reads. */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 300 : 2_000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.originalUrl === '/api/health',
  handler: jsonMessage('Too many requests, try again later'),
});

/** Tighter cap on writes (creates, updates, deletes, balance adjusts). */
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 80 : 1_000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonMessage('Too many changes, slow down a bit'),
});

/** Extra cap on JWT verification failures to limit token spraying. */
export const authFailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 40 : 400,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: jsonMessage('Too many failed sign-in attempts'),
});
