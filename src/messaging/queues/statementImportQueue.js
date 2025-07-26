// src/queues/statementImportQueue.js
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import config from '../../config/index.js';
import { STATEMENT_IMPORTED } from '../../types/event.js';

const connection = new IORedis(config.redisUrl);

// Name must match what your worker is listening on
export const importQueue = new Queue(STATEMENT_IMPORTED, { connection });
