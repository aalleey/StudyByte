import { Request, Response } from 'express';

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    data: null,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}
