import { prisma } from '../db/prisma.js';

export async function createSavingGoal(userId, name, targetAmount, targetDate) {
  const goalData = {
    name,
    targetAmount,
    targetDate: new Date(targetDate),
    currentAmount: 0, // Initialize current amount to 0
    createdAt: new Date(),
    updatedAt: new Date()
  };
  try {
    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        ...goalData
      }
    });
    return goal;
  } catch (error) {
    console.error('Error creating saving goal:', error);
    throw new Error('Could not create saving goal');
  }
}