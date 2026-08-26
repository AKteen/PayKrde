import { Router } from 'express';
import * as controller from '../controllers/profile.controller.js';

export const profileRouter = Router();

profileRouter.get('/', controller.getProfile);
profileRouter.patch('/', controller.patchProfile);
