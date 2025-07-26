// controllers/statementController.js
import createHttpError from "http-errors";
import { ingestStatement } from "../fileUpload/ingestOrchestrator.js";
import redis from "../../db/redis.js";
import { importQueue } from "../../messaging/queues/statementImportQueue.js";
import { STATEMENT_IMPORTED } from "../../types/event.js";
import { publishEvent } from "../../messaging/redisPublisher.js";


/**
 * POST /api/statements/upload
 * Expects:
 *  - file field “statement” (CSV/XLSX buffer)
 *  - optional sourceFileHash header
 */
export async function uploadStatementController(req, res, next) {
  try {
    const userId = req.user.id; // from auth middleware
    if (!req.file) throw createHttpError(400, "No file uploaded");

    const sourceFileHash = req.headers["x-file-hash"] || null;
    const ext = req.file.originalname.split(".").pop();

    const { createdTxns, header } = await ingestStatement({
      userId,
      fileBuffer: req.file.buffer,
      fileExt: ext,
      headerOptions: {}, // e.g. overrides for parseFile if you need
      sourceFileHash,
    });
  publishEvent(STATEMENT_IMPORTED, {
    userId,
    importedCount: createdTxns.length,
    sourceFileHash
  }).catch(err =>
    console.error('Failed to publish STATEMENT_IMPORTED:', err)
  );

    res.status(201).json({
      message: "Statement ingested successfully",
      importedCount: createdTxns?.length,
      header,
      transactions: createdTxns,
    });

     // 1) Prepare job payload: embed the file as base64 so worker can decode
    // const fileBase64 = req.file.buffer.toString('base64');

    // // 2) Enqueue background job
    // await importQueue.add(STATEMENT_IMPORTED, {
    //   userId,
    //   fileBase64,
    //   fileExt: ext,
    //   sourceFileHash,
    // });

    // // 3) Immediate response
    // res
    //   .status(202)
    //   .json({
    //     message: 'Upload received; processing in background.',
    //     next: 'You’ll be notified on completion or can poll status endpoint.',
    //   });

  } catch (err) {
    next(err);
  }
}
