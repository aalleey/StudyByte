import { z } from 'zod';

/**
 * Notes are a study view over the "exercise" questions (SHORT_ANSWER /
 * LONG_ANSWER) plus their model answers, so the filters mirror the questions
 * list - minus `type`, which is fixed by definition.
 */
export const listNotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  chapterId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  q: z.string().trim().optional(),
});

export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;
