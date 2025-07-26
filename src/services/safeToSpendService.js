import { prisma } from "../db/prisma.js";
import { differenceInMonths, endOfMonth } from "date-fns";
import redis from "../db/redis.js";

export async function calculateSafeToSpend(userId) {
  await redis.del(`safe-to-spend:${userId}`);
  const cacheKey = `safe-to-spend:${userId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.error("Redis cache read error:", e);
    // If cache fails, we don't stop. We proceed to calculate.
  }

  try {
    // 1) sum balances
    const accts = await prisma.bankAccount.findMany({
      where: { userId },
      select: { balance: true },
    });
    const currentBalance = accts.reduce((s, a) => s + a.balance, 0);

    // 2) upcoming bills
    const now = new Date();
    const endOfCycle = endOfMonth(now);

    const upcomingBillsList = await prisma.recurringTransaction.findMany({
      where: { userId, predictedDate: { gte: now, lte: endOfCycle } },
      select: { name: true, predictedAmount: true, predictedDate: true },
    });
    // Calculate the total from the list we already fetched
    const upcomingBillsTotal = upcomingBillsList.reduce(
      (sum, bill) => sum + bill.predictedAmount,
      0
    );

    // 3) savings goals
    const activeGoals = await prisma.savingsGoal.findMany({
      where: { userId, targetDate: { gte: now } },
    });
    let monthlyGoalContributionsTotal = 0;
    const goalBreakdown = [];

    for (const goal of activeGoals) {
      const monthsRemaining = differenceInMonths(goal.targetDate, now) || 1; // Use 1 if due this month
      const amountStillNeeded =
        parseFloat(goal.targetAmount || 0) -
        parseFloat(goal.currentAmount || 0);

      if (amountStillNeeded > 0) {
        const contribution = amountStillNeeded / monthsRemaining;
        monthlyGoalContributionsTotal += contribution;
        goalBreakdown.push({
          name: goal.name,
          monthlyContribution: contribution,
          targetAmount: goal.targetAmount || 0,
          currentAmount: goal.currentAmount || 0,
          targetDate: goal.targetDate.toISOString(),
        });
      }
    }

    // 4) compute
    const safeToSpend =
      currentBalance - upcomingBillsTotal - monthlyGoalContributionsTotal;
    const result = {
      label:
        "Safe‑to‑Spend = (All Account Balances) − (Upcoming Bills) − (Savings Commitments)",
      safeToSpend,
      breakdown: {
        currentBalance: currentBalance || 0,
        upcomingBillsTotal: upcomingBillsTotal || 0,
        monthlyGoalContributionsTotal: monthlyGoalContributionsTotal || 0,
        upcomingBillsList: upcomingBillsList.map((b) => ({
          ...b,
          predictedAmount: b.predictedAmount,
        })),
        savingList: goalBreakdown,
      },
      calculationTimestamp: new Date(),
    };

    // ONLY CACHE ON SUCCESS!
    try {
      await redis.set(cacheKey, JSON.stringify(result), "EX", 21600); // 6 hours
    } catch (e) {
      console.error("Redis cache write error:", e);
      // Don't let a cache write error fail the whole request
    }
    return result;
  } catch (error) {
    console.error(
      `Failed to calculate safe-to-spend for user ${userId}:`,
      error
    );
    // Re-throw the error so the controller can catch it and send a 500
    throw new Error("Calculation failed in service");
  }
}
