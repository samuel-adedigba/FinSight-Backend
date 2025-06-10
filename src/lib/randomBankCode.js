import { randomInt } from 'crypto';
export function generateBankCode() {
  const n = randomInt(0, 1000);
  return String(n).padStart(4, '0');
};

export function generateBankAccountId() {
  const prefix = 19; // Your desired prefix (like "bk" → 19)
  const randomPart = randomInt(0, 10000); // Four digits
  const id = Number(`${prefix}${String(randomPart).padStart(3, '0')}`);
  return id; // Returns a numeric value like 19234
};
