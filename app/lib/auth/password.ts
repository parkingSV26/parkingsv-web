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
  // Algunos hashes heredados vienen con prefijo PHP y bcryptjs espera la variante moderna.
  if (hash.startsWith("$2y$")) {
    return `$2b$${hash.slice(4)}`;
  }

  return hash;
}

export async function verifyPassword(password: string, passwordHash: string) {
  // Soportamos Argon2 y bcrypt mientras conviven contraseñas nuevas y legado.
  if (passwordHash.startsWith("$argon2")) {
    return verifyArgon2(passwordHash, password);
  }

  return bcrypt.compare(password, normalizeLegacyBcryptHash(passwordHash));
}

export async function hashPassword(password: string) {
  return hashArgon2(password, ARGON2_OPTIONS);
}
