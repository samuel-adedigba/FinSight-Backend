import { Router } from 'express';
import { authMiddleware } from '../auth/middleware.js';
import { createUserBankAccountController, getUserBankAccountController, listActiveAccountsController, setActiveAccountsController } from '../controllers/accountController.js';

const accountRouter = Router()


accountRouter.post('/create-user',authMiddleware,createUserBankAccountController);
accountRouter.get('/', authMiddleware, getUserBankAccountController);
accountRouter.get('/active', authMiddleware, listActiveAccountsController);
accountRouter.post('/active',authMiddleware, setActiveAccountsController);

export default accountRouter;