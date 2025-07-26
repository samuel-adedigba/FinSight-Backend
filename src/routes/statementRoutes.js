// routes/statementRoutes.js
import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from "../auth/middleware.js";
import { uploadStatementController } from '../middlewares/fileUploadContoller/statementController.js';

const statementRoutes = Router();
const upload = multer();  // in-memory

// Protect with auth, accept single “statement” file upload
statementRoutes.post(
  '/upload',
  authMiddleware,
  upload.single('statement'),
  uploadStatementController
);

export default statementRoutes;
