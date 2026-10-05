import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { created, noContent, ok } from '../../lib/apiResponse';
import { ROLES } from '../../types/common';
import { classScopeOf } from '../../lib/classScope';
import { subjectsService } from './subjects.service';

function isAdmin(req: Request): boolean {
  return req.user?.role === ROLES.ADMIN || req.user?.role === ROLES.SUPERADMIN;
}

export const subjectsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const classId = req.query.classId as string | undefined;
    const items = await subjectsService.list(isAdmin(req), classId, classScopeOf(req.user));
    ok(res, items);
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const item = await subjectsService.getById(req.params.id, isAdmin(req), classScopeOf(req.user));
    ok(res, item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await subjectsService.create(req.body, req.user!.id);
    created(res, item, 'Subject created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await subjectsService.update(req.params.id, req.body);
    ok(res, item, 'Subject updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await subjectsService.remove(req.params.id);
    noContent(res);
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const item = await subjectsService.setPublished(req.params.id, req.body.isPublished);
    ok(res, item, item.isPublished ? 'Subject published' : 'Subject unpublished');
  }),
};
