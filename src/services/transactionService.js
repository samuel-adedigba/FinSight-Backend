// services/transactionService.ts
import { prisma } from '../db/prisma.js';
import { publishEvent } from "../messaging/redisPublisher.js";

export async function createUserTransfer({
  userId,
  fromAccountId,
  toAccountId,
  amount,
  fromBankCode,
  toBankCode,
  idempotencyKey,
  fromTag,
  toTag
}) {
  // 1) Idempotency check
  const existing = await prisma.transfer.findUnique({
    where: { idempotencyKey }
  });
  if (existing) return existing;

  // 2) Fetch both accounts, including their user details, in one batch
  const [fromAcct, toAcct] = await Promise.all([
    prisma.bankAccount.findUnique({
      where: { id: fromAccountId },
      include: { user: true }
    }),
    prisma.bankAccount.findUnique({
      where: { id: toAccountId },
      include: { user: true }
    })
  ]);
  if (!fromAcct || fromAcct.userId !== userId) {
    throw new Error('Invalid or unauthorized source account');
  }
  if (!toAcct) {
    throw new Error('Destination account not found');
  }
  if (fromAcct.bankCode !== fromBankCode || toAcct.bankCode !== toBankCode) {
    throw new Error('Bank code mismatch');
  }
  if (amount <= 0 || amount > fromAcct.balance) {
    throw new Error('Invalid transfer amount');
  }
  if (fromAcct.currency !== toAcct.currency) {
    throw new Error('Currency mismatch');
  }
  if (fromAccountId === toAccountId) {
    throw new Error('Cannot transfer to the same account');
  }

  // 3) Single transaction: update balances, create transfer + two transaction rows
  const [_, __, transfer] = await prisma.$transaction([
    prisma.bankAccount.update({
      where: { id: fromAccountId },
      data: { balance: fromAcct.balance - amount }
    }),
    prisma.bankAccount.update({
      where: { id: toAccountId },
      data: { balance: toAcct.balance + amount }
    }),
    prisma.transfer.create({
      data: {
        fromAccountId,
        toAccountId,
        amount,
        idempotencyKey
      }
    }),
    // Insert both ledger entries in the same tx
    prisma.transaction.createMany({
      data: [
        {
          accountId:   fromAccountId,
          type:        'debit',
          amount,
          tag:         fromTag,
          description: `Sent ${amount}${fromAcct.currency} to ${toAcct.user.name}`,
          sentTo:     toAcct.user.name,
          senderAccountNumber: fromAcct.accountNumber
        },
        {
          accountId:   toAccountId,
          type:        'credit',
          amount,
          tag:         toTag,
          description: `Received ${amount}${toAcct.currency} from ${fromAcct.user.name}`,
          receivedFrom: fromAcct.user.name,
          receiverAccountNumber: toAcct.accountNumber,
        }
      ]
    })
  ]);

  // 4) Mark transfer completed
  const completed = await prisma.transfer.update({
    where: { id: transfer.id },
    data: { status: 'completed', completedAt: new Date() }
  });

  // 5) Fire-and-forget: publish notification without holding up response
  publishEvent('TRANSFER_COMPLETED', {
    transferId: completed.id,
    fromUserId: fromAcct.userId,
    toUserId:   toAcct.userId
  }).catch(err => console.error('Publish failed', err));

  return completed;
};

//fetch all transactions for a specific bank account
export async function getTransactionsByAccountId(accountId) {
  return prisma.transaction.findMany({
    where:      { accountId: Number(accountId) },
    orderBy:    { createdAt: 'desc' },
    include:    { account: true }
  });
};


// Fetch all transactions across all bank account for a specific user
export async function getTransactionsForAUser(userId) {
  return prisma.transaction.findMany({
    where: {
      account: {
        userId: Number(userId)
      }
    },
    orderBy: { createdAt: 'desc' },
    include: { account: true }
  });
};

// fetch a specific transaction by its ID
export async function getTransactionById(transactionId) {
  return prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { account: true }
  });
};



