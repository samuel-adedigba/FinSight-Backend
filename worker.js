import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
import config from './src/config/index.js';
import { listUserCategories } from './src/services/categoryService.js';
import { ingestStatement } from './src/middlewares/fileUpload/ingestOrchestrator.js';
import { precomputeCategoryEmbeddings } from './src/middlewares/fileUpload/aiCategorizerService.js';
import { STATEMENT_IMPORTED } from './src/types/event.js';
import { publishEvent } from './src/messaging/redisPublisher.js';

const connection = new IORedis(config.redisUrl);
const importQueue = new Queue('statementImport', { connection });

// In‑memory cache: { [userId]: [ { name, embedding: number[] } ] }
const categoryCache = {};

/**
 * Load and cache embeddings for a given user.
 */
async function loadCategoryCacheForUser(userId) {
  // 1) Fetch category rows from DB
  const categories = await listUserCategories(userId);
  const names = categories.map(c => c.name);
  
  // 2) Compute embeddings in one batch
  const embeddings = await precomputeCategoryEmbeddings(names);
  
  // 3) Store in our in‑mem cache
  categoryCache[userId] = embeddings;
}

// Kick off cache warm‑up lazily when first job arrives
export async function ensureCache(userId) {
  if (!categoryCache[userId]) {
    await loadCategoryCacheForUser(userId);
  }
}

new Worker(STATEMENT_IMPORTED, async job => {
//  const { userId, filePath, fileExt } = job.data;
    const { userId, fileBase64, fileExt, sourceFileHash } = job.data;


  // Rehydrate the CSV/XLSX buffer
  const buffer = Buffer.from(fileBase64, 'base64');
  
  // Ensure we have embeddings ready
  await ensureCache(userId);
  
  // Now run your full ingestion (including categorization)
//  const fs = await import('fs/promises');
  //const buffer = await fs.readFile(filePath);
//   return ingestStatement({ userId, fileBuffer: buffer, fileExt });
// }, { connection });

  const { createdTxns, header } = await ingestStatement({
    userId,
    fileBuffer: buffer,
    fileExt,
    sourceFileHash,
  });

  publishEvent(STATEMENT_IMPORTED, {
    userId,
    importedCount: createdTxns.length,
    sourceFileHash
  }).catch(err =>
    console.error('Failed to publish STATEMENT_IMPORTED:', err)
  );
  return { importedCount: createdTxns.length, header };
}, { connection });
