import { z } from 'zod';
import { QuestionType } from '@prisma/client';

const optionInputSchema = z.object({
  text: z.string().trim().min(1, 'Option text is required'),
  isCorrect: z.boolean().optional().default(false),
});

export type OptionInput = z.infer<typeof optionInputSchema>;

/**
 * Shared cross-field rule: MCQ/TRUE_FALSE need >=2 options with exactly one
 * correct; FILL_BLANK needs a correctAnswerText; SHORT/LONG_ANSWER need
 * neither (no auto-grading). Used both at create time (Zod superRefine,
 * where the full picture is always available) and again in the service
 * layer on update (where the final type/options/correctAnswerText may be a
 * merge of the existing row and a partial patch).
 */
export function assertQuestionTypeRules(
  type: QuestionType,
  options: OptionInput[],
  correctAnswerText: string | null | undefined,
): string | null {
  if (type === QuestionType.MCQ || type === QuestionType.TRUE_FALSE) {
    if (options.length < 2) {
      return 'MCQ/TRUE_FALSE questions require at least 2 options';
    }
    if (options.filter((o) => o.isCorrect).length !== 1) {
      return 'MCQ/TRUE_FALSE questions require exactly one correct option';
    }
  }
  if (type === QuestionType.FILL_BLANK) {
    if (!correctAnswerText || correctAnswerText.trim().length === 0) {
      return 'FILL_BLANK questions require correctAnswerText';
    }
  }
  return null;
}

export const createQuestionSchema = z
  .object({
    chapterId: z.string().uuid('Invalid chapterId'),
    type: z.nativeEnum(QuestionType, {
      errorMap: () => ({ message: 'Type must be MCQ, TRUE_FALSE, FILL_BLANK, SHORT_ANSWER or LONG_ANSWER' }),
    }),
    text: z.string().trim().min(1, 'Question text is required'),
    explanation: z.string().trim().optional(),
    isPublished: z.boolean().optional().default(false),
    correctAnswerText: z.string().trim().optional(),
    options: z.array(optionInputSchema).default([]),
  })
  .superRefine((data, ctx) => {
    const error = assertQuestionTypeRules(data.type, data.options, data.correctAnswerText);
    if (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: error, path: ['options'] });
    }
  });

export const updateQuestionSchema = z
  .object({
    chapterId: z.string().uuid('Invalid chapterId').optional(),
    type: z.nativeEnum(QuestionType).optional(),
    text: z.string().trim().min(1, 'Question text is required').optional(),
    explanation: z.string().trim().optional(),
    isPublished: z.boolean().optional(),
    correctAnswerText: z.string().trim().optional(),
    options: z.array(optionInputSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided' });

export const listQuestionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  chapterId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  type: z.nativeEnum(QuestionType).optional(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type ListQuestionsQuery = z.infer<typeof listQuestionsQuerySchema>;
