import { Router } from 'express';
import { authMiddleware } from '../auth/middleware.js';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js';


const notificationRoutes = Router();
notificationRoutes.use(authMiddleware);
notificationRoutes.get('/', getNotifications);         
notificationRoutes.post('/:id/read', markNotificationRead); 
export default notificationRoutes;