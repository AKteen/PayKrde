import express from 'express';
import cors from 'cors';
import { requireAuth } from './middleware/auth.js';
import { transactionsRouter } from './routes/transactions.js';
import { balanceRouter } from './routes/balance.js';
import { investmentsRouter } from './routes/investments.js';
import { profileRouter } from './routes/profile.js';

export const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/transactions', requireAuth, transactionsRouter);
app.use('/api/balance', requireAuth, balanceRouter);
app.use('/api/investments', requireAuth, investmentsRouter);
app.use('/api/profile', requireAuth, profileRouter);
