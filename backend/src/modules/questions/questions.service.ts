import { Prisma, Question, QuestionOption, QuestionType } from '@prisma/client';
import { ApiError } from '../../lib/ApiError';
import type { PaginatedResult } from '../../types/common';
import { questionsRepository } from './questions.repository';
import { assertQuestionTypeRules, createQuestionSchema } from './questions.validation';
import type { CreateQuestionInput, ListQuestionsQuery, UpdateQuestionInput } from './questions.validation';

export interface CsvImportRowResult {
  row: number;
  message: string;
}

export interface CsvImportResult {
  totalRows: number;
  created: number;
  failed: CsvImportRowResult[];
}

/**
 * Normalizes a raw CSV row (arbitrary header casing/whitespace) into the same
 * shape createQuestionSchema expects, so row validation reuses the exact
 * MCQ/TRUE_FALSE/FILL_BLANK rules already enforced for the regular create API
 * instead of duplicating them.
 */
function mapCsvRow(rawRow: Record<string, string>, chapterId: string, isPublished: boolean): unknown {
  const row: Record<string, string> = {};
  for (const [key, value] of Object.entries(rawRow)) {
    row[key.trim().toLowerCase()] = (value ?? '').trim();
  }

  const type = (row.type ?? '').toUpperCase();
  const optionTexts = [row.option1, row.option2, row.option3, row.option4].filter((v) => !!v && v.length > 0);
  const correctOptionRaw = (row.correctoption ?? '').trim();

  let options: { text: string; isCorrect: boolean }[] = [];
  if (type === QuestionType.MCQ) {
    const correctIndex = Number.parseInt(correctOptionRaw, 10);
    options = optionTexts.map((text, i) => ({ text, isCorrect: i + 1 === correctIndex }));
  } else if (type === QuestionType.TRUE_FALSE) {
    const correct = correctOptionRaw.toLowerCase();
    options = [
      { text: 'True', isCorrect: correct === 'true' },
      { text: 'False', isCorrect: correct === 'false' },
    ];
  }

  return {
    chapterId,
    type,
    text: row.text ?? '',
    explanation: row.explanation || undefined,
    isPublished,
    correctAnswerText: row.correctanswertext || undefined,
    options,
  };
}

type QuestionWithOptions = Question & { options: QuestionOption[] };

/**
 * Strips answer-revealing fields for non-admin callers: QuestionOption.isCorrect
 * and Question.correctAnswerText must never reach a student response.
 */
function toPublicQuestion(question: QuestionWithOptions, isAdmin: boolean) {
  if (isAdmin) return question;
  const { correctAnswerText: _correctAnswerText, ...rest } = question;
  return {
    ...rest,
    options: question.options.map(({ isCorrect: _isCorrect, ...opt }) => opt),
  };
}

export const questionsService = {
  async list(
    filters: ListQuestionsQuery,
    isAdmin: boolean,
    scopeClassId?: string,
  ): Promise<PaginatedResult<unknown>> {
    const { items, total } = await questionsRepository.findManyPaginated(filters, !isAdmin, scopeClassId);
    return {
      items: items.map((q) => toPublicQuestion(q, isAdmin)),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  },

  async getById(id: string, isAdmin: boolean, scopeClassId?: string) {
    const question = await questionsRepository.findById(id, scopeClassId);
    if (!question || (!isAdmin && !question.isPublished)) {
      throw ApiError.notFound('Question not found');
    }
    return toPublicQuestion(question, isAdmin);
  },

  async create(input: CreateQuestionInput, createdById: string) {
    const chapter = await questionsRepository.findChapterById(input.chapterId);
    if (!chapter) {
      throw ApiError.badRequest('Parent chapter does not exist');
    }

    return questionsRepository.create({
      chapter: { connect: { id: input.chapterId } },
      createdBy: { connect: { id: createdById } },
      type: input.type,
      text: input.text,
      explanation: input.explanation,
      isPublished: input.isPublished,
      correctAnswerText: input.type === QuestionType.FILL_BLANK ? input.correctAnswerText : null,
      options: input.options.length > 0 ? { create: input.options } : undefined,
    });
  },

  async update(id: string, input: UpdateQuestionInput) {
    const existing = await questionsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Question not found');
    }

    if (input.chapterId) {
      const chapter = await questionsRepository.findChapterById(input.chapterId);
      if (!chapter) {
        throw ApiError.badRequest('Parent chapter does not exist');
      }
    }

    const finalType = input.type ?? existing.type;
    const finalOptions = input.options ?? existing.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }));
    const finalCorrectAnswerText =
      input.correctAnswerText !== undefined ? input.correctAnswerText : existing.correctAnswerText;

    const error = assertQuestionTypeRules(finalType, finalOptions, finalCorrectAnswerText);
    if (error) {
      throw ApiError.badRequest(error);
    }

    const data: Prisma.QuestionUpdateInput = {
      chapter: input.chapterId ? { connect: { id: input.chapterId } } : undefined,
      type: input.type,
      text: input.text,
      explanation: input.explanation,
      isPublished: input.isPublished,
      correctAnswerText: finalType === QuestionType.FILL_BLANK ? finalCorrectAnswerText : null,
    };

    return questionsRepository.updateWithOptions(id, data, input.options);
  },

  async remove(id: string) {
    const existing = await questionsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Question not found');
    }
    await questionsRepository.remove(id);
  },

  async setPublished(id: string, isPublished: boolean) {
    const existing = await questionsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Question not found');
    }
    return questionsRepository.setPublished(id, isPublished);
  },

  /**
   * Bulk-creates questions from parsed CSV rows, all attached to one chapter.
   * Rows are validated and created independently so a mistake in one row
   * (e.g. a missing correct option) doesn't block the rest - the caller gets
   * a per-row error list back instead of an all-or-nothing failure.
   */
  async importFromCsv(
    chapterId: string,
    rows: Record<string, string>[],
    createdById: string,
    isPublished: boolean,
  ): Promise<CsvImportResult> {
    const chapter = await questionsRepository.findChapterById(chapterId);
    if (!chapter) {
      throw ApiError.badRequest('Parent chapter does not exist');
    }

    const failed: CsvImportRowResult[] = [];
    let created = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const rowNumber = i + 2; // +1 for 1-based, +1 because the header is row 1
      const candidate = mapCsvRow(rows[i], chapterId, isPublished);
      const parsed = createQuestionSchema.safeParse(candidate);
      if (!parsed.success) {
        const message = parsed.error.issues.map((issue) => issue.message).join('; ');
        failed.push({ row: rowNumber, message });
        continue;
      }
      try {
        await questionsService.create(parsed.data, createdById);
        created += 1;
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Could not create question';
        failed.push({ row: rowNumber, message });
      }
    }

    return { totalRows: rows.length, created, failed };
  },
};
