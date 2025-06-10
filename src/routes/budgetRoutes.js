import { Router } from 'express';
import {
  createBudgetController,
  listBudgetsController,
  updateBudgetController,
  deleteBudgetController
} from '../controllers/budgetController.js';
import { authMiddleware } from '../auth/middleware.js';


const budgetRoutes = Router();
/** Create a new budget */
budgetRoutes.post('/', authMiddleware,createBudgetController);

/** List all budgets for the user */
budgetRoutes.get('/',authMiddleware, listBudgetsController);

/** Update a budget by id */
budgetRoutes.put('/:id', authMiddleware, updateBudgetController);

/** Delete a budget by id */
budgetRoutes.delete('/:id',authMiddleware, deleteBudgetController);

export default budgetRoutes;
