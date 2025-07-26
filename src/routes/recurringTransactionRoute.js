import { Router } from 'express';
import { authMiddleware } from '../auth/middleware.js';
import { getAnalyzeUserTransactions, getCurrentRecurring, getUpcomingBillsController } from '../controllers/recurringTransactionController.js';

const recurringTransactionRouter = Router();

// Analyze and detect recurring transactions
recurringTransactionRouter.get('/', authMiddleware, getAnalyzeUserTransactions);

// Get current recurring transactions (for debugging)
recurringTransactionRouter.get('/current', authMiddleware, getCurrentRecurring);

// Get upcoming bills for Safe-to-Spend calculation
recurringTransactionRouter.get('/upcoming', authMiddleware, getUpcomingBillsController);

export default recurringTransactionRouter;