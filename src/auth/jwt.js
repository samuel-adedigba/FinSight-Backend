// auth/jwt.js
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export const generateToken = payload =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });

export const verifyToken = token =>
  jwt.verify(token, config.jwtSecret);
