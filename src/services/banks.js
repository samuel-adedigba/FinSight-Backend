import { prisma } from "../db/prisma.js";

export async function createBank({ bankName, code }) {
  const existing = await prisma.bank.findUnique({
    where: { name: bankName },
  });
  if (existing) throw new Error("Bank already exists");
  return prisma.bank.create({ data: { name: bankName, code } });
};
export async function getBankByCode(code) {
  const bank = await prisma.bank.findUnique({
    where: { code },
  });
  if (!bank) {
    throw new Error("Bank not found");
  }
  return bank; 
}


export async function getAllBanks() {
    return prisma.bank.findMany()
}