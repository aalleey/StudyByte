import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { authService } from '../src/modules/auth/auth.service';
import { authRepository } from '../src/modules/auth/auth.repository';
import { ApiError } from '../src/lib/ApiError';
import { generateRawToken, hashToken } from '../src/lib/tokenHash';
import { hashPassword, verifyPassword } from '../src/lib/password';

const testEmail = `auth-test-${Date.now()}@example.com`;

describe('authService', () => {
  beforeAll(async () => {
    await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
    await prisma.role.upsert({ where: { name: 'STUDENT' }, update: {}, create: { name: 'STUDENT' } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: 'auth-test-' } } });
    await prisma.$disconnect();
  });

  it('registers a new user as STUDENT', async () => {
    const user = await authService.register({
      name: 'Test User',
      email: testEmail,
      password: 'StrongPass123',
    });

    expect(user.email).toBe(testEmail);
    expect(user.role).toBe('STUDENT');
  });

  it('rejects registration with a duplicate email', async () => {
    await expect(
      authService.register({
        name: 'Test User 2',
        email: testEmail,
        password: 'StrongPass123',
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('logs in with correct credentials and rejects wrong password', async () => {
    const { accessToken, refreshTokenRaw, user } = await authService.login({
      email: testEmail,
      password: 'StrongPass123',
    });

    expect(accessToken).toEqual(expect.any(String));
    expect(refreshTokenRaw).toEqual(expect.any(String));
    expect(user.email).toBe(testEmail);

    await expect(
      authService.login({ email: testEmail, password: 'WrongPassword' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('rotates refresh tokens on refresh and revokes the old one', async () => {
    const { refreshTokenRaw } = await authService.login({
      email: testEmail,
      password: 'StrongPass123',
    });

    const oldHash = hashToken(refreshTokenRaw);
    const oldRow = await authRepository.findRefreshTokenByHash(oldHash);
    expect(oldRow).not.toBeNull();

    const { refreshTokenRaw: newRaw } = await authService.refresh(refreshTokenRaw);
    expect(newRaw).not.toBe(refreshTokenRaw);

    const rotatedOld = await authRepository.findRefreshTokenByHash(oldHash);
    expect(rotatedOld?.revokedAt).not.toBeNull();

    // Reusing the old (now revoked) refresh token must fail.
    await expect(authService.refresh(refreshTokenRaw)).rejects.toBeInstanceOf(ApiError);
  });

  it('completes the forgot-password / reset-password flow end to end', async () => {
    const user = await authRepository.findUserByEmail(testEmail);
    expect(user).not.toBeNull();

    // Simulate what forgotPassword does internally, so we can capture the raw token
    // (forgotPassword only logs it, by design, since Stage 1 has no real email delivery).
    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    await authRepository.createPasswordResetToken({
      userId: user!.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    await authService.resetPassword({ token: rawToken, password: 'NewStrongPass456' });

    const updatedUser = await authRepository.findUserByEmail(testEmail);
    const passwordMatches = await verifyPassword(updatedUser!.passwordHash, 'NewStrongPass456');
    expect(passwordMatches).toBe(true);

    // Token must be single-use.
    await expect(
      authService.resetPassword({ token: rawToken, password: 'AnotherPass789' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('forgotPassword resolves silently for unknown emails (no enumeration)', async () => {
    await expect(authService.forgotPassword({ email: 'nobody-here@example.com' })).resolves.toBeUndefined();
  });

  it('hashPassword/verifyPassword round-trip correctly', async () => {
    const hash = await hashPassword('SomePassword1');
    expect(await verifyPassword(hash, 'SomePassword1')).toBe(true);
    expect(await verifyPassword(hash, 'WrongOne')).toBe(false);
  });
});
