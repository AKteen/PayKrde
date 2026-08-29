import type { NextFunction, Request, Response } from 'express';
import { sendServerError } from '../lib/helpers.js';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return;

  const typed = err as { type?: string; status?: number; message?: string };
  if (typed?.type === 'entity.too.large' || typed?.status === 413) {
    res.status(413).json({ error: 'Payload too large' });
    return;
  }
  if (typed?.status === 400 && typed.message) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  sendServerError(res, err);
}
