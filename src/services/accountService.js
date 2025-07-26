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
  const user_Id = Number(userId);
  if (!user_Id) {
    throw new Error("User ID is required");
  }
  const user = await prisma.user.findUnique({
     where: { id: user_Id },
    include: { accounts: true }
  });
  if (!user) {
    throw new Error(`User with ID ${user_Id} not found`);
  }
  const balanceAgg = await prisma.bankAccount.aggregate({
    where: { userId: user_Id },
    _sum: { balance: true } 
  })
  return { total_account_balance: balanceAgg._sum.balance || 0, user };
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