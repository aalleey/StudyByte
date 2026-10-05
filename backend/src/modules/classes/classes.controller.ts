import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { created, noContent, ok } from '../../lib/apiResponse';
import { ROLES } from '../../types/common';
import { classScopeOf } from '../../lib/classScope';
import { classesService } from './classes.service';

function isAdmin(req: Request): boolean {
  return req.user?.role === ROLES.ADMIN || req.user?.role === ROLES.SUPERADMIN;
}

export const classesController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await classesService.list(isAdmin(req), classScopeOf(req.user));
    ok(res, items);
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const item = await classesService.getById(req.params.id, isAdmin(req), classScopeOf(req.user));
    ok(res, item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await classesService.create(req.body, req.user!.id);
    created(res, item, 'Class created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await classesService.update(req.params.id, req.body);
    ok(res, item, 'Class updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await classesService.remove(req.params.id);
    noContent(res);
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const item = await classesService.setPublished(req.params.id, req.body.isPublished);
    ok(res, item, item.isPublished ? 'Class published' : 'Class unpublished');
  }),
};
