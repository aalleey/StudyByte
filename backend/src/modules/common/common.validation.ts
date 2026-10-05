import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
});

export const publishBodySchema = z.object({
  isPublished: z.boolean(),
});

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(150)
  .regex(slugRegex, 'Slug must be lowercase letters, numbers and hyphens only');

export const titleSchema = z.string().trim().min(2, 'Title must be at least 2 characters').max(200);

export const orderSchema = z.coerce.number().int().min(0).default(0);
