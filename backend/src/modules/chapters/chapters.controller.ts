import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { created, noContent, ok } from '../../lib/apiResponse';
import { ROLES } from '../../types/common';
import { classScopeOf } from '../../lib/classScope';
import { chaptersService } from './chapters.service';

function isAdmin(req: Request): boolean {
  return req.user?.role === ROLES.ADMIN || req.user?.role === ROLES.SUPERADMIN;
}

export const chaptersController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const subjectId = req.query.subjectId as string | undefined;
    const items = await chaptersService.list(isAdmin(req), subjectId, classScopeOf(req.user));
    ok(res, items);
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const item = await chaptersService.getById(req.params.id, isAdmin(req), classScopeOf(req.user));
    ok(res, item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await chaptersService.create(req.body, req.user!.id);
    created(res, item, 'Chapter created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await chaptersService.update(req.params.id, req.body);
    ok(res, item, 'Chapter updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await chaptersService.remove(req.params.id);
    noContent(res);
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const item = await chaptersService.setPublished(req.params.id, req.body.isPublished);
    ok(res, item, item.isPublished ? 'Chapter published' : 'Chapter unpublished');
  }),
};
