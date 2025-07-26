// services/persistBatch.js

import createHttpError from 'http-errors';
import { prisma } from '../../db/prisma.js';

/**
 * Looks up an existing BankAccount by accountNumber (and userId),
 * or throws if none is found.
 */
async function findAccountOrThrow(userId, header) {
  const acct = await prisma.bankAccount.findFirst({
    where: {
      accountNumber: header.accountNumber,
      userId
    }
  });
  if (!acct) {
    throw createHttpError(
      400,
      `Bank account ${header.accountNumber} not linked to your user`
    );
  }
  return acct;
}

/**
 * Maps the transformed transactions into the shape Prisma expects,
 * attaching an optional `sourceFileHash` to dedupe on re‑uploads.
 */
function mapToRecords(acctId, userId, txns, sourceFileHash) {
  return txns.map((t) => ({
    accountId:            acctId,
    userId,
    type:                 t.type,
    amount:               t.amount,
    description:          t.description,
    tag:                  t.tag,
    sentTo:               t.sentTo   || null,
    senderAccountNumber:  t.senderAccountNumber   || null,
    receivedFrom:         t.receivedFrom || null,
    receiverAccountNumber:t.receiverAccountNumber || null,
    reference:            t.reference   || null,
    categoryId:           t.categoryId  || null,
    createdAt:            t.date,
    sourceFileHash:       sourceFileHash || null
  }));
}

/**
 * Bulk‑persists a batch of transactions for a user + accountNumber,
 * updating the account’s balance only if the imported data is newer,
 * all in one atomic transaction.
 *
 * @param {number}       userId
 * @param {object}       header           // must include header.accountNumber & optionally header.generatedDate
 * @param {object[]}     txns             // from transform + categorize pipeline
 * @param {string|null}  sourceFileHash   // dedupe key for this upload
 *
 * @returns {Promise<import('@prisma/client').Transaction[]>}
 */
export async function persistBatch(
  userId,
  header,
  txns,
  sourceFileHash = null
) {
  if (!Array.isArray(txns) || txns.length === 0) {
    throw createHttpError(400, 'No transactions to save');
  }

  // 1) Lookup bank account
  const acct = await findAccountOrThrow(userId, header.accountNumber);

  // 2) Map into Prisma shape
  const records = mapToRecords(acct.id, userId, txns, sourceFileHash);

  // 3) Perform atomic update + insert
  try {
    const created = await prisma.$transaction(async (tx) => {
      // 3a) Conditionally update account.balance if import is newer
      const lastImported = txns[txns.length - 1];
      const lastImportedDate = lastImported.date;
      const acctUpdatedAt     = acct.updatedAt; // when account row was last modified

      // Use header.generatedDate if provided, otherwise lastImportedDate
      const importCutoff = header.generatedDate
        ? new Date(header.generatedDate)
        : lastImportedDate;

      if (importCutoff > acctUpdatedAt && typeof lastImported.balance === 'number') {
        await tx.bankAccount.update({
          where: { id: acct.id },
          data: {
            balance:   lastImported.balance,
            updatedAt: new Date()
          }
        });
      }

      // 3b) Bulk‐insert new transactions
      await tx.transaction.createMany({
        data:          records,
        skipDuplicates: true // requires unique constraint on (accountId, sourceFileHash, reference, createdAt)
      })

      // 3c) Fetch & return only those rows from this batch
      return tx.transaction.findMany({
        where: {
          accountId:       acct.id,
          sourceFileHash:  sourceFileHash || undefined
        },
        orderBy: { createdAt: 'asc' }
      });
    });

    return created;

  } catch (e) {
    // Handle Prisma unique‑constraint violation
    if (e.code === 'P2002') {
      throw createHttpError(409, 'Some transactions already exist');
    }
    console.error('persistBatch failed:', e);
    throw createHttpError(500, 'Failed to save transactions');
  }
}
