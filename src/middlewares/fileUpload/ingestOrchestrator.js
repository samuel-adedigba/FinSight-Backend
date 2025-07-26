// services/ingestOrchestrator.js
import createHttpError from "http-errors";
import { parseFile } from "./fileParser.js";
import { transformBatch } from "./transactionTransformer.js";
import { categorizeBatch } from "./categorizeBatchTransaction.js";
import { persistBatch } from "./persistBatch.js";
import { analyzeUserTransactions } from "../../services/recurringTransaction.js";
import { publishEvent } from "../../messaging/redisPublisher.js";
import redis from "../../db/redis.js";
import crypto from 'crypto';
import { RUN_RECURRING, STATEMENT_IMPORTED } from "../../types/event.js";

/**
 * ingestStatement
 *
 * Orchestrates a full bank‐statement ingestion:
 *  1) parse raw buffer → rows
 *  2) transform rows → normalized transactions
 *  3) categorize → assign categoryId
 *  4) persist → atomically insert & update account balance
 *  5) post‑ingest hooks → cache invalidation, analysis, notifications
 *
 * @param {object}   params
 * @param {number}   params.userId
 * @param {Buffer}   params.fileBuffer     the raw PDF/CSV/XLSX bytes
 * @param {string}   params.fileExt        one of "csv"|"xlsx"|"xls"
 * @param {object}   [params.headerOptions] optional hints for parseFile
 * @param {string?}  [params.sourceFileHash] optional dedupe key
 *
 * @returns {Promise<{ createdTxns: import('@prisma/client').Transaction[]; header: object }>}
 */
export async function ingestStatement({
  userId,
  fileBuffer,
  fileExt,
  headerOptions = {},
  sourceFileHash = null,
}) {

  // compute once if not provided
  if (!sourceFileHash) {
    sourceFileHash = crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');
  }

  await redis.del(`statement-imported:${userId}`);
  // 1) Parse raw file into an array of row‐objects
  let rawRows;
  try {
    rawRows = await parseFile(fileBuffer, fileExt, headerOptions);
    console.log('Raw rows parsed:', rawRows);
  } catch (err) {
    throw createHttpError(400, `Failed to parse ${fileExt}: ${err.message}`);
  }

  // 2) Transform into { header, transactions[], errors[] }
  const { header, transactions: txns, errors } = transformBatch(rawRows);
  console.log('Parsed header:', header);
  if (!header.accountNumber || !/^\d{6,20}$/.test(header.accountNumber)) {
  throw new Error(`Invalid account number in parsed header: ${header.accountNumber}`);
}

  if (errors.length) {
    // you can choose to fail here, or return errors to client
    console.warn("Some rows failed to transform:", errors);
  }
  if (txns.length === 0) {
    throw createHttpError(400, "No valid transactions found in file");
  }

  // 3) Categorize all transactions in batch
  let categorized;
  try {
    // console.log("userId:", typeof userId, userId);
    // console.log("txns:", txns);

    categorized = await categorizeBatch(txns, parseInt(userId, 10));
  } catch (err) {
    throw createHttpError(500, `Categorization failed: ${err.message}`);
  }

  // 4) Persist them atomically and get back the created rows
  let createdTxns;
  try {
    createdTxns = await persistBatch(
      userId,
      header,
      categorized,
      sourceFileHash
    );
  } catch (err) {
    // persistBatch already throws HttpError
    throw err;
  }

  // 5a) Invalidate any safe‑to‑spend cache
  try {
    await redis.del(`safe-to-spend:${userId}`);
  } catch (e) {
    console.error("Failed to clear safe‑to‑spend cache:", e);
  }

  // 5b) Trigger on‑login style recurring‑txn analysis
  // analyzeUserTransactions(userId).catch((err) =>
  //   console.error(`Post‑import analysis failed for user ${userId}:`, err)
  // );

  // 5c) Publish “STATEMENT_IMPORTED” event for notifications / sockets
  publishEvent(STATEMENT_IMPORTED, {
    userId,
    importedCount: createdTxns.length,
    sourceFileHash
  }).catch(err =>
    console.error('Failed to publish STATEMENT_IMPORTED:', err)
  );

  publishEvent(RUN_RECURRING, {
    userId,
  })
  return { createdTxns, header };
}
