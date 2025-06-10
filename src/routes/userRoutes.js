// routes/userRoutes.js
import { Router } from 'express';
import { authMiddleware } from '../auth/middleware.js';
import { createUserController, getUserByIdController,
   getUserByEmailController, updateUserDetailsController,
   getAllUsersController, deleteUserByIdController,
   updateUserIdentityController, 
   } from '../controllers/userController.js';

const router = Router();
router.post('/signup', createUserController );
router.get('/:id', authMiddleware, getUserByIdController);
router.post('/login', getUserByEmailController );
router.put('/', authMiddleware, updateUserDetailsController);
router.get('/all-users/:id', getAllUsersController);
router.delete('/delete-user/:id', authMiddleware, deleteUserByIdController);
router.put('/identity', authMiddleware, updateUserIdentityController);
// router.get('/accounts/:id', authMiddleware, getUserBankAccountController);
export default router;
   