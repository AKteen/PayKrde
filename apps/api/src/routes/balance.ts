import { Router } from 'express';
import * as controller from '../controllers/balance.controller.js';

export const balanceRouter = Router();

balanceRouter.get('/', controller.getBalance);
balanceRouter.post('/adjust', controller.adjust);
balanceRouter.get('/history', controller.history);
