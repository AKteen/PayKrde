import { Router } from 'express';
import * as controller from '../controllers/transactions.controller.js';
import { asyncHandler } from '../middleware/async.js';
import { requireUuidParam } from '../middleware/require-uuid.js';

export const transactionsRouter = Router();

transactionsRouter.get('/summary', asyncHandler(controller.summary));
transactionsRouter.get('/', asyncHandler(controller.list));
transactionsRouter.post('/', asyncHandler(controller.create));
transactionsRouter.patch('/:id', requireUuidParam(), asyncHandler(controller.update));
transactionsRouter.delete('/:id', requireUuidParam(), asyncHandler(controller.remove));
