import { Request, Response } from 'express';
import { parse } from 'csv-parse/sync';
import { asyncHandler } from '../../lib/asyncHandler';
import { created, noContent, ok } from '../../lib/apiResponse';
import { ApiError } from '../../lib/ApiError';
import { ROLES } from '../../types/common';
import { classScopeOf } from '../../lib/classScope';
import { questionsService } from './questions.service';
import type { ListQuestionsQuery } from './questions.validation';

function isAdmin(req: Request): boolean {
  return req.user?.role === ROLES.ADMIN || req.user?.role === ROLES.SUPERADMIN;
}

export const questionsController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const filters = req.query as unknown as ListQuestionsQuery;
    const result = await questionsService.list(filters, isAdmin(req), classScopeOf(req.user));
    ok(res, result);
  }),

  getOne: asyncHandler(async (req: Request, res: Response) => {
    const item = await questionsService.getById(req.params.id, isAdmin(req), classScopeOf(req.user));
    ok(res, item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await questionsService.create(req.body, req.user!.id);
    created(res, item, 'Question created');
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await questionsService.update(req.params.id, req.body);
    ok(res, item, 'Question updated');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await questionsService.remove(req.params.id);
    noContent(res);
  }),

  publish: asyncHandler(async (req: Request, res: Response) => {
    const item = await questionsService.setPublished(req.params.id, req.body.isPublished);
    ok(res, item, item.isPublished ? 'Question published' : 'Question unpublished');
  }),

  importCsv: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw ApiError.badRequest('A CSV file is required (field name "file")');
    }
    const chapterId = typeof req.body.chapterId === 'string' ? req.body.chapterId : '';
    if (!chapterId) {
      throw ApiError.badRequest('chapterId is required');
    }
    const isPublished = req.body.publish === 'true' || req.body.publish === true;

    let records: Record<string, string>[];
    try {
      records = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        // Real-world CSVs edited in Excel/Sheets frequently have a row with
        // one too few/many trailing commas - don't abort the whole import
        // over that, let mapCsvRow/createQuestionSchema catch it per-row
        // instead (a missing required field just fails validation for that
        // row, same as a truly empty cell would).
        relax_column_count: true,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'unknown error';
      throw ApiError.badRequest(`Could not parse the CSV file - check it is valid CSV with a header row (${detail})`);
    }

    if (records.length === 0) {
      throw ApiError.badRequest('The CSV file has no data rows');
    }
    if (records.length > 500) {
      throw ApiError.badRequest('CSV import is limited to 500 rows at a time');
    }

    const result = await questionsService.importFromCsv(chapterId, records, req.user!.id, isPublished);
    ok(res, result, `Imported ${result.created} of ${result.totalRows} question(s)`);
  }),
};
