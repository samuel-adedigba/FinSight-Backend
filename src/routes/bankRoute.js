import { Router } from "express";
import { CreateBankController, getAllBanksController } from "../controllers/bankController.js";
import { authMiddleware } from "../auth/middleware.js";


const bankRouter = Router();

bankRouter.post('/create',CreateBankController);
bankRouter.get('/all',getAllBanksController);
export default bankRouter;