import { Router } from 'express';
import * as controller from '../controllers/balance.controller.js';
import { asyncHandler } from '../middleware/async.js';

export const balanceRouter = Router();

balanceRouter.get('/', asyncHandler(controller.getBalance));
balanceRouter.post('/adjust', asyncHandler(controller.adjust));
balanceRouter.get('/history', asyncHandler(controller.history));
