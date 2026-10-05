import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

// Every user lookup that feeds an API response carries the picked grade, so
// /login, /register and /me can all report classId + a nested class label.
const withRoleAndClass = {
  role: true,
  class: { select: { id: true, title: true } },
} as const;

export const authRepository = {
  findRoleByName(name: string) {
    return prisma.role.findUnique({ where: { name } });
  },

  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: withRoleAndClass,
    });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: withRoleAndClass,
    });
  },

  createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data, include: withRoleAndClass });
  },

  updateUserClass(userId: string, classId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { classId },
      include: withRoleAndClass,
    });
  },

  findPublishedClassById(classId: string) {
    return prisma.class.findFirst({ where: { id: classId, isPublished: true } });
  },

  updateUserPassword(userId: string, passwordHash: string) {
    return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },

  createRefreshToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.refreshToken.create({ data });
  },

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findFirst({ where: { tokenHash } });
  },

  revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  },

  revokeAllRefreshTokensForUser(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  createPasswordResetToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return prisma.passwordResetToken.create({ data });
  },

  findValidPasswordResetTokenByHash(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash, used: false, expiresAt: { gt: new Date() } },
    });
  },

  markPasswordResetTokenUsed(id: string) {
    return prisma.passwordResetToken.update({ where: { id }, data: { used: true } });
  },
};
