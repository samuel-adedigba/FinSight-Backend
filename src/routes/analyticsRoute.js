import { Router } from "express";
import { authMiddleware } from "../auth/middleware.js";
import { summaryController , categoryBreakdownController, getBoardByCategoryController, getAnalyticsTrendController, budgetProgressController} from "../controllers/analyticsController.js";

const analyticsRoute = Router();

analyticsRoute.get('/summary', authMiddleware, summaryController);
analyticsRoute.get('/category-breakdown', authMiddleware, categoryBreakdownController);
analyticsRoute.get('/category-analytics-breakdown', authMiddleware, getBoardByCategoryController);
analyticsRoute.get('/trends', authMiddleware, getAnalyticsTrendController);
analyticsRoute.get('/budget-progress', authMiddleware, budgetProgressController);
export default analyticsRoute;