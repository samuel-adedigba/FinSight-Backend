// services/transactionTransformer.js
import { isValid, parse } from "date-fns";
import Decimal from "decimal.js";
import crypto from "crypto";

// 1) Top‑section header keys
const HEADER_FIELD_MAP = {
  bankName: ["bank", "bank name", "institution", "bank logo"],
  statementTitle: [
    "statement of account",
    "customer statement",
    "account statement",
  ],
  accountHolder: ["name", "account holder", "agent name"],
  accountNumber: [
    "account",
    "account no",
    "wallet id",
    "account id",
    "account number",
  ],
  accountType: ["type", "statement type"],
  currency: ["currency", "format"],
  period: ["period", "date range"],
  generatedDate: ["generated date", "printed date", "create time"],
};

// 2) Transaction table columns
const TABLE_HEADER_MAP = {
  date: ["date", "date/time", "trans date", "trans.date", "transaction date"],
  debit: ["money out", "debit", "withdrawal", "outward transfer"],
  credit: ["money in", "credit", "deposit", "inward transfer"],
  description: ["description", "narration", "details"],
  category: ["category", "tag"],
  counterparty: [
    "to / from",
    "counter party",
    "sentto",
    "receivedfrom",
    "transfer to",
    "transfer from",
  ],
  reference: ["reference", "trans.id", "transaction id"],
  balance: ["balance"],
};

/**
 * normalizeKey: lowercase, strip punctuation (except .), collapse spaces
 */
function normalizeKey(k) {
  if (typeof k !== "string") return "";
  return k
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9. ]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
// Pre‑normalize all the TABLE_HEADER_MAP variants to the same key format
const NORMALIZED_TABLE_HEADER_MAP = Object.fromEntries(
  Object.entries(TABLE_HEADER_MAP).map(([std, variants]) => [
    std,
    new Set(variants.map(normalizeKey)),
  ])
);

/**
 * extractHeader: picks HEADER_FIELD_MAP values out of the very first rawRow
 */
function extractHeader(rawRow) {
  const header = {};
  for (const [stdKey, variants] of Object.entries(HEADER_FIELD_MAP)) {
    for (const [rawKey, rawVal] of Object.entries(rawRow)) {
      if (variants.includes(normalizeKey(rawKey))) {
        header[stdKey] = rawVal;
        break;
      }
    }
  }
  return header;
}

function buildTableLookup(headerRow) {
  const lookup = {};
  for (const [rawKey, rawVal] of Object.entries(headerRow)) {
    if (!rawVal || typeof rawVal !== "string") continue;

    const nk = normalizeKey(rawVal); // normalize "Date/Time", "Money out", etc.
    for (const [stdField, variants] of Object.entries(
      NORMALIZED_TABLE_HEADER_MAP
    )) {
      if (variants.has(nk)) {
        lookup[stdField] = rawKey; // e.g. lookup.date = "__EMPTY"
        break;
      }
    }
  }
  return lookup;
}

/**
 * pickTableFields: pick only the eight fields from a data row
 */
function pickTableFields(rawRow, lookup) {
  const out = {};
  for (const stdField of Object.keys(TABLE_HEADER_MAP)) {
    if (lookup[stdField]) {
      out[stdField] = rawRow[lookup[stdField]];
    }
  }
  return out;
}

/**
 * transformRow: given { date, debit, credit, description, … }, normalize each value
 */
export function transformRow(row) {
  // 1) Date
  let d = row.date;
  if (!d) throw new Error("Missing date");
  let parsed = parse(String(d), "dd/MM/yy HH:mm:ss", new Date());

  if (!isValid(parsed)) {
    const [dd, mm, yy] = String(d).split(/[\/\-\s:]+/);
    parsed = new Date(`20${yy}-${mm}-${dd}`);
  }
  if (!isValid(parsed)) throw new Error(`Invalid date: ${d}`);

  // 2) Amount & type
  const deb = row.debit?.toString().replace(/[^0-9.\-]/g, "") || "";
  const cred = row.credit?.toString().replace(/[^0-9.\-]/g, "") || "";
  if (!deb && !cred) throw new Error("Missing debit/credit");
  const amt = new Decimal(cred || deb);
  const type = cred && amt.gte(0) ? "credit" : "debit";
  const amount = amt.abs().toNumber();

  let counterparty = row.counterparty?.toString().trim() || null;
  let senderAccountNumber = null;
  let receiverAccountNumber = null;
  let sentTo = null;
  let receivedFrom = null;

  if (counterparty) {
    const parts = counterparty.split("/");
    const name = parts[0]?.trim() || null;
    const acctNum = parts.find((p) => /^\d{6,20}$/.test(p)) || null;

    if (type === "credit") {
      receivedFrom = name;
      senderAccountNumber = acctNum;
    } else {
      sentTo = name;
      receiverAccountNumber = acctNum;
    }
  }

  // 3) Other fields
  const description = row.description?.toString().trim() || null;
  const tag = row.category?.toString().trim() || null;
  // after you build description, amount, date, etc.:
  const refPayload = `${parsed.toISOString()}|${amount}|${description}|${tag}`;
  const syntheticReference = crypto
    .createHash("sha256")
    .update(refPayload)
    .digest("hex");
  const reference = row.reference?.toString().trim() || syntheticReference;
  const balance =
    row.balance != null
      ? Number(String(row.balance).replace(/[^0-9.\-]/g, ""))
      : null;

  return {
    date: parsed,
    type,
    amount,
    description,
    tag,
    sentTo,
    receivedFrom,
    reference,
    balance,
    receiverAccountNumber,
    senderAccountNumber,
  };
}

export function transformBatch(rawRows = []) {
  if (!Array.isArray(rawRows) || !rawRows.length) {
    return { header: {}, transactions: [], errors: [] };
  }

  // Function to detect header row based on values
  function isHeaderRow(row) {
    const values = Object.values(row).map((v) => normalizeKey(v));
    const hasDate = values.some((v) => NORMALIZED_TABLE_HEADER_MAP.date.has(v));
    const hasMoney = values.some(
      (v) =>
        NORMALIZED_TABLE_HEADER_MAP.debit.has(v) ||
        NORMALIZED_TABLE_HEADER_MAP.credit.has(v)
    );
    return hasDate && hasMoney;
  }

  // A) Find the header row
  let hdrIdx = -1;
  for (let i = 0; i < rawRows.length; i++) {
    if (isHeaderRow(rawRows[i])) {
      hdrIdx = i;
      break;
    }
  }
  if (hdrIdx < 0) {
    throw new Error("No recognizable transaction table header found");
  }

  // B) Extract metadata from rows before header
  const header = {};
  for (let i = 0; i < hdrIdx; i++) {
    Object.assign(header, extractHeader(rawRows[i]));
    // Look for ANY field in this row that is 6–20 digits long:
    for (const val of Object.values(rawRows[i])) {
      const s = String(val).replace(/\s+/g, "");
      if (/^\d{6,20}$/.test(s)) {
        header.accountNumber = s;
        break;
      }
    }
    if (header.accountNumber) break;
  }

  // If we still didn’t find a pure‐digit accountNumber, error early:
  if (!header.accountNumber) {
    throw new Error(
      `Could not locate a valid accountNumber in the pre-table rows`
    );
  }

  // C) Map column keys to header names
  const headerMapping = {};
  for (const [colKey, headerValue] of Object.entries(rawRows[hdrIdx])) {
    if (headerValue && headerValue.trim()) {
      headerMapping[colKey] = headerValue.trim();
    }
  }

  // D) Transform data rows with correct keys
  const transactionsRaw = [];
  for (let i = hdrIdx + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    const transaction = {};
    for (const [colKey, headerKey] of Object.entries(headerMapping)) {
      transaction[headerKey] = row[colKey];
    }
    transactionsRaw.push(transaction);
  }

  // E) Build lookup and process transactions
  // const lookup = buildTableLookup(transactionsRaw[0] || {});
  // E) Build lookup from the *header row* (not from a data row)
  const headerRow = rawRows[hdrIdx];
  const lookup = buildTableLookup(headerRow);

  const transactions = [];
  const errors = [];

  for (let i = hdrIdx + 1; i < rawRows.length; i++) {
    try {
      const picked = pickTableFields(rawRows[i], lookup);
      transactions.push(transformRow(picked));
    } catch (err) {
      if (!/Missing date/.test(err.message)) {
        errors.push({ row: i, message: err.message });
      }
    }
  }

  if (!transactions.length) {
    console.warn("No valid transactions parsed", errors);
  }

  return { header, transactions, errors };
}
