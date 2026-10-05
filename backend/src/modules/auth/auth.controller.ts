import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { created, ok } from '../../lib/apiResponse';
import { ApiError } from '../../lib/ApiError';
import { env } from '../../config/env';
import { authService } from './auth.service';

const REFRESH_COOKIE_NAME = 'refreshToken';

// In dev, frontend (localhost:5173) and backend (localhost:4000) share the
// same registrable domain ("localhost"), so the cookie is same-site and
// `lax` is sent on the XHR refresh request. In production the frontend
// (Vercel) and backend (Render) are on genuinely different domains, so the
// request is cross-site - without `sameSite: 'none'` (which requires
// `secure: true`, already true in production) the browser would silently
// drop the cookie and the refresh flow would never fire.
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: (env.isProduction ? 'none' : 'lax') as 'none' | 'lax',
  path: '/api/v1/auth',
};

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...refreshCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.register(req.body);
    created(res, user, 'Registration successful');
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const { accessToken, refreshTokenRaw, user } = await authService.login(req.body);
    setRefreshCookie(res, refreshTokenRaw);
    ok(res, { accessToken, user }, 'Login successful');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const incoming = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    const { accessToken, refreshTokenRaw, user } = await authService.refresh(incoming);
    setRefreshCookie(res, refreshTokenRaw);
    ok(res, { accessToken, user }, 'Token refreshed');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const incoming = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    await authService.logout(incoming);
    clearRefreshCookie(res);
    ok(res, null, 'Logged out');
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body);
    ok(res, null, 'If an account with that email exists, a reset link has been sent');
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body);
    ok(res, null, 'Password has been reset');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const user = await authService.me(req.user.id);
    ok(res, user);
  }),

  updateMyClass: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    const user = await authService.setMyClass(req.user.id, req.body.classId);
    ok(res, user, 'Grade updated');
  }),
};
