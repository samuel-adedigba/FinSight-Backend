import {
  createUserTransfer
} from "../services/transactionService.js";

// Transfer creation controller
export async function createTransferController(req, res) {
  try {
    const userId = req.user.id;
    const fromAccountId = Number(req.body.fromAccountId);
    const toAccountId = Number(req.body.toAccountId);
    const amount = Number(req.body.amount);
    const fromBankCode = Number(req.body.fromBankCode);
    const toBankCode = Number(req.body.toBankCode);
    const fromTag = req.body.fromTag || "others";
    const validFromTag = fromTag && typeof fromTag === 'string' && fromTag.trim().length > 0 && fromTag.toLowerCase();
    const toTag = req.body.toTag || "others";
    const validToTag = toTag && typeof toTag === 'string' && toTag.trim().length > 0 && toTag.toLowerCase();
    const idempotencyKey = req.header("Idempotency-Key");

    if (!idempotencyKey) {
      return res.status(400).json({ error: "Missing Idempotency-Key header" });
    }

    if (
      ![fromAccountId, toAccountId, fromBankCode, toBankCode].every(Number.isInteger) ||
      typeof amount !== "number"
    ) {
      return res.status(400).json({ error: "Invalid input types" });
    }

    if (amount <= 0 || amount > 1_000_000) {
      return res.status(400).json({ error: "Invalid transfer amount" });
    }

    const transfer = await createUserTransfer({
      userId,
      fromAccountId,
      toAccountId,
      amount,
      fromBankCode,
      toBankCode,
      idempotencyKey,
      fromTag: validFromTag,
      toTag: validToTag
    });

    res.status(201).json({ message: "Transfer completed", transfer });
  } catch (error) {
    console.error("Transfer failed:", error);
    const status = error.message.includes("unauthorized") || error.message.includes("Invalid") ? 403 : 500;
    res.status(status).json({ error: error.message || "Transfer failed" });
  }
};