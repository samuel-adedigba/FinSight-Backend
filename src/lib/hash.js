// src/lib/hash.js
import bcrypt from 'bcrypt';
import config from '../config/index.js';

/**
 * Hashes a plaintext value (e.g., a password) using bcrypt.
 *
 * @param {string} plainText - The value to hash.
 * @returns {Promise<string>} - The resulting hash.
 * @returns {Promise<boolean>} - True if match, false otherwise.
 */
export async function hashValue(plainText) {
  // Number of salt rounds controls the cost. Default to 12 if not specified.
  const saltRounds = config.hashSaltRounds || 12;

  // Generate a salt and hash the value in one step
  const hash = await bcrypt.hash(plainText, saltRounds);
  return hash;
}

export async function verifyValue(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}