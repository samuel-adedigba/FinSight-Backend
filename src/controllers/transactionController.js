import { clearUserTransactions, getTransactionById, getTransactionsByAccountId, getTransactionsForAUser } from "../services/transactionService.js";



// Fetch all transactions for a specific bank account
export async function getTransactionsByAccountController(req, res) {
  try {
    const accountId = Number(req.params.accountId);
    if (!Number.isInteger(accountId)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }

    const transactions = await getTransactionsByAccountId(accountId);
    res.status(200).json({ message: `List of transactions for a specific bank account`, transactions });
  } catch (error) {
    console.error("Fetching transactions by account failed:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

// Fetch all transactions for a specific user
export async function getTransactionsForUserController(req, res) {
  try {
    const userId = req.user.id; 
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    const transactions = await getTransactionsForAUser(userId);
    res.status(200).json({ message: `List of transactions for this user id ${userId} `, transactions });
  } catch (error) {
    console.error("Fetching user's transactions failed:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

// Fetch a specific transaction by ID
export async function getTransactionByIdController(req, res) {
  try {
    const transactionId = req.params.transactionId;

    const transaction = await getTransactionById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (transaction.account.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied to this transaction" });
    }

    res.status(200).json({ message: `List of transactions for a specific transaction by ID: ${transactionId}`, transaction });
  } catch (error) {
    console.error("Fetching transaction by ID failed:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

export async function clearUserTransactionsHandler(
  req,
  res,
  next
) {
  try {
    const userId = Number(req.user.id);
    const accountId = Number(req.params.accountId);
    if (isNaN(accountId)) {
      return res.status(400).json({ error: 'Invalid accountId' });
    }
    const { deletedCount } = await clearUserTransactions({ userId, accountId });
    return res
      .status(200)
      .json({ message: 'Transactions cleared', deletedCount });
  } catch (error) {
    next(error);
  }
}
