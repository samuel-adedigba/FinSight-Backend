import { generateBankCode } from "../lib/randomBankCode.js";
import { createBank, getAllBanks } from "../services/banks.js";


export async function CreateBankController(req, res) {
  try {
    const { bankName } = req.body;
    
    const bank_code = generateBankCode();
   const code = Number(bank_code)
   console.log("bank code", code)

    const new_bank = await createBank({ bankName, code });

    res.status(201).json({
      message: "Bank created successfully",
      new_bank,
    });
  } catch (error) {
    console.error("Bank creation failed:", error);
    res.status(500).json({
      message: "Failed to create bank",
      error: error.message,
    });
  }
};

export async function getAllBanksController(req, res) {
  try {
    const banks = await getAllBanks();
    res.status(200).json({
      message: "All Banks",
      data: banks,
    });
  } catch (error) {
    console.error("Error fetching banks:", error);
    res.status(500).json({
      message: "Failed to retrieve banks",
      error: error.message,
    });
  }
}
