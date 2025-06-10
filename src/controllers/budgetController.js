import {
  createBudget,
  listBudgets,
  updateBudget,
  deleteBudget
} from '../services/budgetService.js';

export async function createBudgetController(req, res) {
  try {
    const userId = req.user.id;
    const { categoryId, amount, startDate, endDate, name } = req.body;

    if (!categoryId || !amount || !startDate, name) {
      return res.status(400).json({ error: 'categoryId, amount, and startDate are required' });
    }

    const budget = await createBudget({
      userId,
      categoryId: Number(categoryId),
      amount:     Number(amount),
      startDate,
      endDate
    });

    res.status(201).json({ budget });
  } catch (err) {
    console.error('Create budget failed:', err);
    res.status(err.message.includes('access denied') ? 403 : 500).json({ error: err.message });
  }
}

export async function listBudgetsController(req, res) {
  try {
    const userId = req.user.id;
    const budgets = await listBudgets(userId);
    res.json({
      message: "Get your budget list",
      budgets
    });
  } catch (err) {
    console.error('List budgets failed:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateBudgetController(req, res) {
  try {
    const userId = req.user.id;
    const id     = Number(req.params.id);
    const { amount, startDate, endDate } = req.body;

    if (!amount || !startDate) {
      return res.status(400).json({ error: 'amount and startDate are required' });
    }

    const budget = await updateBudget({
      id,
      userId,
      amount:     Number(amount),
      startDate,
      endDate
    });

    res.json({ budget });
  } catch (err) {
    console.error('Update budget failed:', err);
    res.status(err.message.includes('access denied') ? 403 : 500).json({ error: err.message });
  }
}

export async function deleteBudgetController(req, res) {
  try {
    const userId = req.user.id;
    const id     = Number(req.params.id);
    await deleteBudget({ id, userId });
    res.sendStatus(204);
  } catch (err) {
    console.error('Delete budget failed:', err);
    res.status(err.message.includes('access denied') ? 403 : 500).json({ error: err.message });
  }
}
