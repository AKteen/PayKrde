import { Router } from 'express';
import * as controller from '../controllers/profile.controller.js';
import { asyncHandler } from '../middleware/async.js';

export const profileRouter = Router();

profileRouter.get('/', asyncHandler(controller.getProfile));
profileRouter.patch('/', asyncHandler(controller.patchProfile));
