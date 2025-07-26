import { calculateSafeToSpend } from '../services/safeToSpendService.js';

export async function getSafeToSpend(req, res) {
  try {
    const userId = req.user.id;
    const data = await calculateSafeToSpend(userId);
    res.json(data);
  } catch(e) {
    console.error('SafeToSpend error', e);
    res.status(500).json({ error:'Could not calculate safe-to-spend' });
  }
}