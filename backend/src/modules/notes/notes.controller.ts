import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ok } from '../../lib/apiResponse';
import { ROLES } from '../../types/common';
import { classScopeOf } from '../../lib/classScope';
import { notesService } from './notes.service';
import type { ListNotesQuery } from './notes.validation';

function isAdmin(req: Request): boolean {
  return req.user?.role === ROLES.ADMIN || req.user?.role === ROLES.SUPERADMIN;
}

export const notesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query as unknown as ListNotesQuery;
    const result = await notesService.list(filters, isAdmin(req), classScopeOf(req.user));
    ok(res, result);
  }),
};
