import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const title = z.string().trim().min(2, 'Title must be at least 2 characters').max(200);
const slug = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(150)
  .regex(slugRegex, 'Use lowercase letters, numbers and hyphens only (e.g. my-title)');
const order = z.coerce.number().int('Order must be a whole number').min(0, 'Order must be 0 or greater');

export const classFormSchema = z.object({
  title,
  slug,
  order,
});
export type ClassFormValues = z.infer<typeof classFormSchema>;

export const subjectFormSchema = z.object({
  classId: z.string().uuid('Select a class'),
  title,
  slug,
  order,
});
export type SubjectFormValues = z.infer<typeof subjectFormSchema>;

export const chapterFormSchema = z.object({
  subjectId: z.string().uuid('Select a subject'),
  title,
  slug,
  order,
});
export type ChapterFormValues = z.infer<typeof chapterFormSchema>;
