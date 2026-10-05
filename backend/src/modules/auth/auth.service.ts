import { addDays, addMinutes } from '../../lib/date';
import { ApiError } from '../../lib/ApiError';
import { hashPassword, verifyPassword } from '../../lib/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { generateRawToken, hashToken } from '../../lib/tokenHash';
import { env } from '../../config/env';
import { ROLES } from '../../types/common';
import { authRepository } from './auth.repository';
import type { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from './auth.validation';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  classId: string | null;
  class: { id: string; title: string } | null;
}

function toPublicUser(user: {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  classId: string | null;
  role: { name: string };
  class: { id: string; title: string } | null;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    isActive: user.isActive,
    createdAt: user.createdAt,
    classId: user.classId,
    class: user.class,
  };
}

/**
 * A grade can only ever be set to a class that exists and is published -
 * shared by registration and the later "change grade" action.
 */
async function assertPublishedClass(classId: string): Promise<void> {
  const cls = await authRepository.findPublishedClassById(classId);
  if (!cls) {
    throw ApiError.badRequest('Selected class does not exist or is not available');
  }
}

function refreshTokenExpiryDate(): Date {
  // 7d default; parse the configured expiresIn if it is in "Nd" form, else fall back to 7 days.
  const match = /^(\d+)d$/.exec(env.jwt.refreshExpiresIn);
  const days = match ? Number(match[1]) : 7;
  return addDays(new Date(), days);
}

async function issueTokens(userId: string, role: string) {
  const accessToken = signAccessToken({ sub: userId, role });
  // jti ensures two refresh tokens issued for the same user within the same
  // second are never byte-identical (JWT `iat` only has second precision).
  const refreshTokenRaw = signRefreshToken({ sub: userId, jti: generateRawToken() });
  const tokenHash = hashToken(refreshTokenRaw);

  await authRepository.createRefreshToken({
    userId,
    tokenHash,
    expiresAt: refreshTokenExpiryDate(),
  });

  return { accessToken, refreshTokenRaw };
}

export const authService = {
  async register(input: RegisterInput): Promise<PublicUser> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const studentRole = await authRepository.findRoleByName(ROLES.STUDENT);
    if (!studentRole) {
      throw ApiError.internal('STUDENT role is not configured');
    }

    // classId is optional at the API level (older clients and the existing
    // tests register without one); the web form makes it required.
    if (input.classId) {
      await assertPublishedClass(input.classId);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await authRepository.createUser({
      email: input.email,
      name: input.name,
      passwordHash,
      role: { connect: { id: studentRole.id } },
      class: input.classId ? { connect: { id: input.classId } } : undefined,
    });

    return toPublicUser(user);
  },

  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const validPassword = await verifyPassword(user.passwordHash, input.password);
    if (!validPassword) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const { accessToken, refreshTokenRaw } = await issueTokens(user.id, user.role.name);

    return { accessToken, refreshTokenRaw, user: toPublicUser(user) };
  },

  async refresh(refreshTokenRaw: string | undefined) {
    if (!refreshTokenRaw) {
      throw ApiError.unauthorized('Missing refresh token');
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshTokenRaw);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshTokenRaw);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token is no longer valid');
    }

    const user = await authRepository.findUserById(payload.sub);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    // Rotate: revoke the presented token, issue a brand new one.
    await authRepository.revokeRefreshToken(storedToken.id);
    const { accessToken, refreshTokenRaw: newRefreshTokenRaw } = await issueTokens(user.id, user.role.name);

    return { accessToken, refreshTokenRaw: newRefreshTokenRaw, user: toPublicUser(user) };
  },

  async logout(refreshTokenRaw: string | undefined): Promise<void> {
    if (!refreshTokenRaw) {
      return;
    }
    const tokenHash = hashToken(refreshTokenRaw);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);
    if (storedToken && !storedToken.revokedAt) {
      await authRepository.revokeRefreshToken(storedToken.id);
    }
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await authRepository.findUserByEmail(input.email);

    // Always behave the same way regardless of whether the email exists, so
    // we never leak account existence to a caller.
    if (!user) {
      return;
    }

    const rawToken = generateRawToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = addMinutes(new Date(), env.passwordResetTokenTtlMin);

    await authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const resetLink = `${env.frontendUrl}/reset-password?token=${rawToken}`;
    // Stage 1 has no real email delivery - log the link so it can be used manually/in dev.
    // eslint-disable-next-line no-console
    console.log(`Reset link: ${resetLink}`);
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashToken(input.token);
    const storedToken = await authRepository.findValidPasswordResetTokenByHash(tokenHash);

    if (!storedToken) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(input.password);
    await authRepository.updateUserPassword(storedToken.userId, passwordHash);
    await authRepository.markPasswordResetTokenUsed(storedToken.id);
    await authRepository.revokeAllRefreshTokensForUser(storedToken.userId);
  },

  async me(userId: string): Promise<PublicUser> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return toPublicUser(user);
  },

  /**
   * Sets (or changes) the caller's own grade. Any authenticated user may set
   * their own - this backs both the first-login "select your grade" gate and
   * the later "change grade" action.
   */
  async setMyClass(userId: string, classId: string): Promise<PublicUser> {
    await assertPublishedClass(classId);
    const user = await authRepository.updateUserClass(userId, classId);
    return toPublicUser(user);
  },
};
