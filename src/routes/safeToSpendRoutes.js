import { Router } from 'express';
import { authMiddleware } from '../auth/middleware.js';
import { getSafeToSpend } from '../controllers/safeToSpendController.js';

const safeToSpendRouter = Router();
safeToSpendRouter.get('/', authMiddleware, getSafeToSpend);
export default safeToSpendRouter;