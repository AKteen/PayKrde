import { Router } from 'express';
import * as controller from '../controllers/investments.controller.js';

export const investmentsRouter = Router();

investmentsRouter.get('/', controller.list);
investmentsRouter.post('/', controller.create);
investmentsRouter.patch('/:id', controller.update);
investmentsRouter.delete('/:id', controller.remove);
