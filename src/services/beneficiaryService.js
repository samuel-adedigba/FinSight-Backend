import { prisma } from '../db/prisma.js';
import { publishEvent } from "../messaging/redisPublisher.js";

export async function createBeneficiary({
  userId,
  accountId,
  beneficiaryName,
  beneficiaryBankCode,
  beneficiaryAccountNumber,
  beneficiaryCurrency,
  idempotencyKey
}) {
  // 1) Idempotency check
  const existing = await prisma.beneficiary.findUnique({
    where: { idempotencyKey }
  });
  if (existing) return existing;

  // 2) Fetch the user's account to validate ownership
  const account = await prisma.bankAccount.findUnique({
    where: { id: accountId },
    include: { user: true }
  });
  
  if (!account || account.userId !== userId) {
    throw new Error('Invalid or unauthorized account');
  }

  // 3) Create the beneficiary
  const beneficiary = await prisma.beneficiary.create({
    data: {
      userId,
      accountId,
      name: beneficiaryName,
      bankCode: beneficiaryBankCode,
      accountNumber: beneficiaryAccountNumber,
      currency: beneficiaryCurrency,
      idempotencyKey
    }
  });

  // Publish event for async processing (e.g., notifications)
  publishEvent('beneficiary.created', { userId, beneficiary });

  return beneficiary;
}
export async function getBeneficiariesForUser(userId) {
  return prisma.beneficiary.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}
export async function deleteBeneficiary(userId, beneficiaryId) {
  // Check if the beneficiary exists and belongs to the user
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: beneficiaryId }
  });
  
  if (!beneficiary || beneficiary.userId !== userId) {
    throw new Error('Beneficiary not found or unauthorized');
  }

  // Delete the beneficiary
  await prisma.beneficiary.delete({
    where: { id: beneficiaryId }
  });

  // Publish event for async processing (e.g., notifications)
  publishEvent('beneficiary.deleted', { userId, beneficiaryId });

  return { message: 'Beneficiary deleted successfully' };
}
export async function updateBeneficiary({
  userId,
  beneficiaryId,
  beneficiaryName,
  beneficiaryBankCode,
  beneficiaryAccountNumber,
  beneficiaryCurrency
}) {
  // Check if the beneficiary exists and belongs to the user
  const beneficiary = await prisma.beneficiary.findUnique({
    where: { id: beneficiaryId }
  });
  
  if (!beneficiary || beneficiary.userId !== userId) {
    throw new Error('Beneficiary not found or unauthorized');
  }

  // Update the beneficiary details
  const updatedBeneficiary = await prisma.beneficiary.update({
    where: { id: beneficiaryId },
    data: {
      name: beneficiaryName,
      bankCode: beneficiaryBankCode,
      accountNumber: beneficiaryAccountNumber,
      currency: beneficiaryCurrency
    }
  });

  // Publish event for async processing (e.g., notifications)
  publishEvent('beneficiary.updated', { userId, updatedBeneficiary });

  return updatedBeneficiary;
}

export async function getBeneficiaryByName(userId, name, bankCode, accountNumber) {
  // Fetch beneficiaries matching the name
  return prisma.beneficiary.findMany({
    where: {
      userId,
      bankCode,
      accountNumber,
      name: {
        contains: name,
        mode: 'insensitive' // Case-insensitive search
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};