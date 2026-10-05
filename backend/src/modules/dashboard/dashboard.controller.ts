import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { ok } from '../../lib/apiResponse';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  adminStats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await dashboardService.getAdminStats();
    ok(res, stats);
  }),
};
