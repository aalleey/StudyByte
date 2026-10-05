import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/ApiError';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';

/**
 * Verifies the access token from the Authorization header and loads the
 * current user (with role) onto req.user. Throws 401 if missing/invalid,
 * or if the user no longer exists / has been deactivated.
 */
export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing or invalid Authorization header');
  }

  const token = header.slice('Bearer '.length);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired access token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User not found or inactive');
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    classId: user.classId,
  };

  next();
});

/**
 * Like authenticate, but does not fail when there is no/invalid token -
 * used on public browse routes that behave differently for admins.
 */
export const optionalAuthenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        classId: user.classId,
      };
    }
  } catch {
    // ignore invalid token on optional auth
  }

  next();
});
