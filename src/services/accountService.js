import { prisma } from "../db/prisma.js";

export async function createUserBankAccount( {
    userId, bankCode,bankName, accountNumber, currency,balance, id
} ) {
    const details = await prisma.bankAccount.create({
        data: {
             id, userId, bankCode, accountNumber, currency,bankName, balance
        }
    });

    return details
};

export async function getUserBankAccount(userId) {
  return prisma.user.findUnique({
    where: { id: Number(userId) },
    include: { accounts: true }
  });
};

export async function getActiveBankAccounts(userId) {
  return prisma.bankAccount.findMany({
    where: { userId: Number(userId), isActive: true }
  });
}

export async function setActiveBankAccounts(userId, accountIds) {
  // 1) reset everyone
  await prisma.bankAccount.updateMany({
    where: { userId: Number(userId) },
    data:  { isActive: false }
  });
  // 2) mark selected
  await prisma.bankAccount.updateMany({
    where: { userId: Number(userId), id: { in: accountIds } },
    data:  { isActive: true }
  });
}