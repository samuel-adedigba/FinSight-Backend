import { prisma } from '../db/prisma.js';

export async function createBudget({ amount, startDate, endDate, userId, categoryId, name }) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || category.userId !== userId) {
    throw new Error('Category not found or access denied');
  }

  return prisma.budget.create({
    data: {
      userId,
      categoryId,
      name,
      amount,
      startDate: new Date(startDate),
      endDate:   endDate ? new Date(endDate) : null
    }
  });
}

export async function listBudgets(userId) {
  return prisma.budget.findMany({
    where: { userId },
    include: {
      category: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateBudget({ id, amount, startDate, endDate, userId }) {
  // Verify ownership
  const existing = await prisma.budget.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error('Budget not found or access denied');
  }

  return prisma.budget.update({
    where: { id },
    data: {
      amount,
      startDate: new Date(startDate),
      endDate:   endDate ? new Date(endDate) : null
    }
  });
}

export async function deleteBudget({ id, userId }) {
  const existing = await prisma.budget.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error('Budget not found or access denied');
  }
  return prisma.budget.delete({ where: { id } });
}
