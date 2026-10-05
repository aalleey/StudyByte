import crypto from 'crypto';

/**
 * Random, high-entropy tokens (refresh tokens, password reset tokens) are
 * hashed with SHA-256 before being stored, so the DB never holds a value an
 * attacker could replay directly even if the table leaks. This is distinct
 * from argon2 password hashing, which exists to slow down brute-forcing a
 * low-entropy human-chosen secret - these tokens are already 256 bits of
 * randomness so a fast, deterministic hash is appropriate and lets us look
 * the row up by hash directly.
 */
export function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
