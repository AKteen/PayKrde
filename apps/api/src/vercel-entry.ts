import type { IncomingMessage, ServerResponse } from 'node:http';
import { app } from './app.js';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    app(req, res);
  } catch (err) {
    if (res.headersSent) return;
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    const message = err instanceof Error ? err.message : 'Function failed';
    res.end(JSON.stringify({ error: message }));
  }
}
