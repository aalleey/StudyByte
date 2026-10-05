import { z } from 'zod';
import { orderSchema, slugSchema, titleSchema } from '../common/common.validation';

export const createClassSchema = z.object({
  title: titleSchema,
  slug: slugSchema,
  order: orderSchema,
});

export const updateClassSchema = z
  .object({
    title: titleSchema.optional(),
    slug: slugSchema.optional(),
    order: orderSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
