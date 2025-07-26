import { findBestMatch } from "string-similarity";
import { batchCategorizeAI, precomputeCategoryEmbeddings } from "./aiCategorizerService.js";
import { getTransactionsForAUser } from "../../services/transactionService.js";
import {
  listUserCategories,
  createCategory,
} from "../../services/categoryService.js";

// In-memory cache of category embeddings per user
// This must be shared across categorizeBatch calls at runtime
const categoryCache = {};

const HARD_RULES = {
  netflix:     "Subscriptions",
  spotify:     "Music",
  uber:        "Transport",
  supermarket: "Groceries",
  pos: "Withdrawal",
  blaze: "Others",
  shop: "Food",
  dworm: "Drug",
  transfer: "Withdrawal",
  overdraft: "Loan charges",
  stamp: "Bank charges",
  yam: "Food",
  chinchin: "Food",
};

async function ensureBaseCategories(userId) {
  const existing = await listUserCategories(userId);
  if (existing.length) return existing;

  const seed = [
    { name: "Income",        type: "INCOME"  },
    { name: "Groceries",     type: "EXPENSE" },
    { name: "Transport",     type: "EXPENSE" },
    { name: "Rent",          type: "EXPENSE" },
    { name: "Utilities",     type: "EXPENSE" },
    { name: "Dining Out",    type: "EXPENSE" },
    { name: "Subscriptions", type: "EXPENSE" },
    { name: "Healthcare",    type: "EXPENSE" },
    { name: "Entertainment", type: "EXPENSE" },
    { name: "Other",         type: "EXPENSE" },
  ];

  const created = await Promise.all(
    seed.map(cat => createCategory({ userId, ...cat }))
  );
  return created;
}

export async function categorizeBatch(transactions, userId) {
  // 0) Seed or fetch categories
  const categories = await ensureBaseCategories(userId);

  // 1) Build hard-rule map
  const ruleMap = {};
  for (const [kw, name] of Object.entries(HARD_RULES)) {
    const cat = categories.find(c => c.name === name);
    if (cat) ruleMap[kw] = cat.id;
  }

  // 2) Build history pool
  const pastTxns = await getTransactionsForAUser(userId);
  const pastDescMap = pastTxns
    .filter(t => typeof t.description === "string")
    .map(t => ({ desc: t.description.toLowerCase(), categoryId: t.categoryId }));
  const historyPool = pastDescMap.map(p => p.desc);

  // 3) First pass: hard-rules & history
  const result   = [];
  const unknowns = [];

  for (const txn of transactions) {
    const desc = (txn.description || "").toLowerCase();

    // 3a) Hard-rule
    const ruleKey = Object.keys(ruleMap).find(kw => desc.includes(kw));
    if (ruleKey) {
      txn.categoryId = ruleMap[ruleKey];
      result.push(txn);
      continue;
    }

    // 3b) History-based
    if (historyPool.length && desc) {
      const { bestMatch } = findBestMatch(desc, historyPool);
      if (bestMatch.rating >= 0.8) {
        const match = pastDescMap.find(p => p.desc === bestMatch.target);
        txn.categoryId = match.categoryId;
        result.push(txn);
        continue;
      }
    }

    // 3c) Defer to AI
    unknowns.push(txn);
  }

  // 4) AI fallback (only if necessary)
if (unknowns.length > 0) {
    // 4a) Ensure category embeddings are cached for this user
    if (!categoryCache[userId]) {
      // Fetch fresh list & precompute
      const userCats = await listUserCategories(userId);
      const names = userCats.map(c => c.name);
      categoryCache[userId] = await precomputeCategoryEmbeddings(names);
    }
    const embeddings = categoryCache[userId];

    // 4b) Prepare descriptions and run batchCategorizeAI
    const descriptions = unknowns.map(txn => txn.description || "");
    const aiResults = await batchCategorizeAI(descriptions, embeddings);

    // 4c) Assign or create categories based on AI results
    for (let i = 0; i < unknowns.length; i++) {
      const txn = unknowns[i];
      const catName = aiResults.get(txn.description) || 'Needs Review';
      const inferredType = txn.type === 'credit' ? 'INCOME' : 'EXPENSE';

      let cat = categories.find(c => c.name === catName);
      if (!cat) {
        // Persist new category
        cat = await createCategory({ userId, name: catName, type: inferredType });
        categories.push(cat);
        // Optionally embed and cache the new category name
        // (omitted here for brevity, but recommended for next runs)
      }

      txn.categoryId = cat.id;
      result.push(txn);
    }
  }

  return result;
}
