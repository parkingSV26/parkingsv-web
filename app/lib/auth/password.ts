import { hash as hashArgon2, verify as verifyArgon2 } from "@node-rs/argon2";
import bcrypt from "bcryptjs";

const ARGON2ID_ALGORITHM = 2;

const ARGON2_OPTIONS = {
  algorithm: ARGON2ID_ALGORITHM,
  memoryCost: 65536,
  outputLen: 32,
  parallelism: 1,
  timeCost: 4,
} as const;

function normalizeLegacyBcryptHash(hash: string) {
  // Some legacy hashes come with the PHP prefix, and bcryptjs expects the modern variant.
  if (hash.startsWith("$2y$")) {
    return `$2b$${hash.slice(4)}`;
  }

  return hash;
}

export async function verifyPassword(password: string, passwordHash: string) {
  // Support Argon2 and bcrypt while new and legacy passwords coexist.
  if (passwordHash.startsWith("$argon2")) {
    return verifyArgon2(passwordHash, password);
  }

  return bcrypt.compare(password, normalizeLegacyBcryptHash(passwordHash));
}

export async function hashPassword(password: string) {
  return hashArgon2(password, ARGON2_OPTIONS);
}
