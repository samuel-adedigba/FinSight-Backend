import { Router } from "express";
import { authMiddleware } from "../auth/middleware.js";
import { createTransferController } from "../controllers/transferController.js";



const transferRouter = Router()
transferRouter.post('/', authMiddleware, createTransferController)

export default transferRouter;