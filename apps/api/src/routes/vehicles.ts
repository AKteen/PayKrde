import { Router } from 'express';
import * as controller from '../controllers/vehicles.controller.js';
import { asyncHandler } from '../middleware/async.js';
import { requireUuidParam } from '../middleware/require-uuid.js';

export const vehiclesRouter = Router();

vehiclesRouter.get('/', asyncHandler(controller.list));
vehiclesRouter.post('/', asyncHandler(controller.create));
vehiclesRouter.get('/summary', asyncHandler(controller.summary));
vehiclesRouter.patch('/:id', requireUuidParam(), asyncHandler(controller.update));
vehiclesRouter.delete('/:id', requireUuidParam(), asyncHandler(controller.remove));
vehiclesRouter.get('/:id/expenses', requireUuidParam(), asyncHandler(controller.listExpenses));
vehiclesRouter.post('/:id/expenses', requireUuidParam(), asyncHandler(controller.addExpense));
