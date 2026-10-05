import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { ApiError } from '../lib/ApiError';
import { env } from '../config/env';

interface ErrorBody {
  success: false;
  data: null;
  message: string;
  errors?: unknown;
  stack?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = err.flatten();
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = `A record with this ${((err.meta?.target as string[]) ?? ['value']).join(', ')} already exists`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Invalid reference to a related record';
    } else {
      statusCode = 400;
      message = 'Database request error';
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  } else if (err instanceof MulterError) {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file is too large' : `Upload error: ${err.message}`;
  } else if (err instanceof Error) {
    message = env.isProduction ? message : err.message;
  }

  if (!env.isProduction) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const body: ErrorBody = {
    success: false,
    data: null,
    message,
  };

  if (errors !== undefined) {
    body.errors = errors;
  }

  if (!env.isProduction && err instanceof Error) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}
