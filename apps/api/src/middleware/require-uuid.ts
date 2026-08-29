import type { NextFunction, Request, Response } from 'express';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function requireUuidParam(param = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[param];
    if (!value || !UUID_RE.test(value)) {
      res.status(400).json({ error: 'Invalid id' });
      return;
    }
    next();
  };
}
