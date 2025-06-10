import { generateBankAccountId } from "../lib/randomBankCode.js";
import { createUserBankAccount, getActiveBankAccounts, getUserBankAccount, setActiveBankAccounts } from "../services/accountService.js"
import { getBankByCode } from "../services/banks.js";

export async function createUserBankAccountController(req, res) {
  try {
    const { userId, bankCode, accountNumber, currency, balance } = req.body;
    const bank = await getBankByCode(Number(bankCode));
    if (!bank) {
      return res.status(404).json({ message: 'Bank not found' });
    }

    // 1) Generate your custom numeric account ID
    const id = generateBankAccountId();

    // 2) Create the record
    const accountDetails = await createUserBankAccount({
      id,
      userId:        Number(userId),
      bankCode:      bank.code,
      bankName:      bank.name,
      accountNumber,
      currency,
      balance:       Number(balance)
    });

    return res.status(201).json({
      message: 'Account created successfully',
      account: accountDetails
    });
  } catch (error) {
    console.error('Bank account creation failed:', error);
    return res.status(500).json({
      message: 'Error creating bank account',
      error: error.message
    });
  }
};

export async function getUserBankAccountController(req, res) {
  try {
    const id = req.user.id;

    const bank_account = await getUserBankAccount(id);

    if (!bank_account) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User bank account details",
      bank_account
    });
  } catch (error) {
    console.error("Bank account fetching failed:", error);
    res.status(500).json({
      message: "Error getting bank account",
      error: error.message,
    });
  }
};


export async function listActiveAccountsController(req, res) {
  const userId = req.user.id;
  const active = await getActiveBankAccounts(userId);
  res.json({ active });
}

export async function setActiveAccountsController(req, res) {
  try {
    const userId = req.user.id;
    const { accountIds } = req.body;
    if (!Array.isArray(accountIds)) {
      return res.status(400).json({ error: 'accountIds must be an array' });
    }
    await setActiveBankAccounts(userId, accountIds);
    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update active accounts' });
  }
}

