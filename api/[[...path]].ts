import serverless from 'serverless-http';
import { app } from '../apps/api/src/app.js';

export default serverless(app);
