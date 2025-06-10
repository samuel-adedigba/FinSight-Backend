import { Router } from 'express';
import { authMiddleware } from '../auth/middleware.js';
import { getTransactionByIdController, getTransactionsByAccountController, getTransactionsForUserController } from '../controllers/transactionController.js';


const transactionRouter = Router();

// Get all transactions for a specific bank account
transactionRouter.get('/accounts/:accountId', authMiddleware,getTransactionsByAccountController);

// Get all transactions for the logged-in user
transactionRouter.get('/',authMiddleware, getTransactionsForUserController);

// Get a specific transaction by its ID
transactionRouter.get('/:transactionId', authMiddleware, getTransactionByIdController);

export default transactionRouter;