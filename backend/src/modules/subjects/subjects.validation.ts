import { z } from 'zod';
import { orderSchema, slugSchema, titleSchema } from '../common/common.validation';

export const createSubjectSchema = z.object({
  classId: z.string().uuid('Invalid classId'),
  title: titleSchema,
  slug: slugSchema,
  order: orderSchema,
});

export const updateSubjectSchema = z
  .object({
    title: titleSchema.optional(),
    slug: slugSchema.optional(),
    order: orderSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export const listSubjectsQuerySchema = z.object({
  classId: z.string().uuid('Invalid classId').optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>;
export type ListSubjectsQuery = z.infer<typeof listSubjectsQuerySchema>;
