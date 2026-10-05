import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/ApiError';
import { ROLES } from '../types/common';

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    // SUPERADMIN passes every role check - it supersedes ADMIN everywhere and
    // can also reach STUDENT-only routes (e.g. student-scoped bookmarks/notes
    // endpoints used when previewing the student experience), without
    // touching every authorize(...) call site individually.
    if (req.user.role === ROLES.SUPERADMIN) {
      next();
      return;
    }
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}
