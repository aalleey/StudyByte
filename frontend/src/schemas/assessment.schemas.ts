import { z } from 'zod';

const optionSchema = z.object({
  text: z.string().trim().min(1, 'Option text is required'),
  isCorrect: z.boolean(),
});

export const questionTypeEnum = z.enum(['MCQ', 'TRUE_FALSE', 'FILL_BLANK', 'SHORT_ANSWER', 'LONG_ANSWER']);

export const questionFormSchema = z
  .object({
    chapterId: z.string().uuid('Select a chapter'),
    type: questionTypeEnum,
    text: z.string().trim().min(1, 'Question text is required'),
    explanation: z.string().trim().optional(),
    correctAnswerText: z.string().trim().optional(),
    options: z.array(optionSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'MCQ' || data.type === 'TRUE_FALSE') {
      if (data.options.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least 2 options are required', path: ['options'] });
      } else if (data.options.filter((o) => o.isCorrect).length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Exactly one option must be marked correct',
          path: ['options'],
        });
      }
    }
    if (data.type === 'FILL_BLANK' && (!data.correctAnswerText || data.correctAnswerText.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Correct answer text is required for FILL_BLANK',
        path: ['correctAnswerText'],
      });
    }
  });
export type QuestionFormSchemaValues = z.infer<typeof questionFormSchema>;
