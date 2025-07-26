/*
  Warnings:

  - You are about to alter the column `amount` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the column `createdAt` on the `SavingsGoal` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyContribution` on the `SavingsGoal` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SavingsGoal` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `goalType` to the `SavingsGoal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetAmount` to the `SavingsGoal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetDate` to the `SavingsGoal` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('ONE_TIME', 'RECURRING_FUND');

-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "SavingsGoal" DROP COLUMN "createdAt",
DROP COLUMN "monthlyContribution",
DROP COLUMN "updatedAt",
ADD COLUMN     "currentAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "goalType" "GoalType" NOT NULL,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "targetAmount" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "targetDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "categoryId" INTEGER,
ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_name_key" ON "Category"("userId", "name");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
