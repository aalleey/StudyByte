import { z } from 'zod';
import { orderSchema, slugSchema, titleSchema } from '../common/common.validation';

export const createChapterSchema = z.object({
  subjectId: z.string().uuid('Invalid subjectId'),
  title: titleSchema,
  slug: slugSchema,
  order: orderSchema,
});

export const updateChapterSchema = z
  .object({
    title: titleSchema.optional(),
    slug: slugSchema.optional(),
    order: orderSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export const listChaptersQuerySchema = z.object({
  subjectId: z.string().uuid('Invalid subjectId').optional(),
});

export type CreateChapterInput = z.infer<typeof createChapterSchema>;
export type UpdateChapterInput = z.infer<typeof updateChapterSchema>;
export type ListChaptersQuery = z.infer<typeof listChaptersQuerySchema>;
