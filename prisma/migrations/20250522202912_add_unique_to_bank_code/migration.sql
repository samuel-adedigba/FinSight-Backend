/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Bank` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Bank_code_key" ON "Bank"("code");
