import { Router } from 'express';
import * as controller from '../controllers/investments.controller.js';
import { asyncHandler } from '../middleware/async.js';
import { requireUuidParam } from '../middleware/require-uuid.js';

export const investmentsRouter = Router();

investmentsRouter.get('/', asyncHandler(controller.list));
investmentsRouter.post('/', asyncHandler(controller.create));
investmentsRouter.patch('/:id', requireUuidParam(), asyncHandler(controller.update));
investmentsRouter.delete('/:id', requireUuidParam(), asyncHandler(controller.remove));
