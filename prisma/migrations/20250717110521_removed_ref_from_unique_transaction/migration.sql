/*
  Warnings:

  - A unique constraint covering the columns `[accountId,sourceFileHash,createdAt]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Transaction_accountId_sourceFileHash_reference_createdAt_key";

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_accountId_sourceFileHash_createdAt_key" ON "Transaction"("accountId", "sourceFileHash", "createdAt");
