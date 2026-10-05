import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

type AnyZodSchema = AnyZodObject | ZodEffects<AnyZodObject>;

interface ValidationSchemas {
  body?: AnyZodSchema;
  params?: AnyZodSchema;
  query?: AnyZodSchema;
}

/**
 * Runs the given Zod schemas against req.body/params/query, replacing them
 * with the parsed (and coerced/defaulted) values. Validation failures are
 * forwarded to the centralized error handler as ZodError.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
