import { Router } from 'express';
import {
  createCategoryController,
  listCategoriesController,
  updateCategoryController,
  deleteCategoryController
} from '../controllers/categoryController.js';
import { authMiddleware } from '../auth/middleware.js';

const categoryRouter = Router()

/** Create a new category */
categoryRouter.post('/', authMiddleware, createCategoryController);

/** List all user categories */
categoryRouter.get('/', authMiddleware, listCategoriesController);

/** Update a category by id */
categoryRouter.put('/:id', authMiddleware, updateCategoryController);

/** Delete a category by id */
categoryRouter.delete('/:id',authMiddleware, deleteCategoryController);

export default categoryRouter;
