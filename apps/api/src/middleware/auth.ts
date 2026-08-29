import type { Request, Response, NextFunction } from 'express';
import { isSupabaseConfigured, supabaseAdmin } from '../lib/supabase-admin.js';
import { authFailLimiter } from './rate-limit.js';

const MAX_TOKEN_LENGTH = 4_096;

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isSupabaseConfigured()) {
      res.status(503).json({ error: 'Server is not configured' });
      return;
    }

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      authFailLimiter(req, res, () => {
        res.status(401).json({ error: 'Unauthorized' });
      });
      return;
    }

    const token = header.slice(7).trim();
    if (!token || token.length > MAX_TOKEN_LENGTH) {
      authFailLimiter(req, res, () => {
        res.status(401).json({ error: 'Unauthorized' });
      });
      return;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      authFailLimiter(req, res, () => {
        res.status(401).json({ error: 'Unauthorized' });
      });
      return;
    }

    req.userId = data.user.id;
    next();
  } catch (err) {
    next(err);
  }
}
