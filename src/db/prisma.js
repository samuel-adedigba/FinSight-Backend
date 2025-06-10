// db/prisma.js
import { PrismaClient } from '@prisma/client';
import config from '../config/index.js';
export const prisma = new PrismaClient({ datasources: { db: { url: config.dbUrl } } });
