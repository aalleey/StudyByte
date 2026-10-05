import { Prisma, QuestionType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { classScopeWhere } from '../../lib/classScope';
import type { ListNotesQuery } from './notes.validation';

const NOTE_TYPES = [QuestionType.SHORT_ANSWER, QuestionType.LONG_ANSWER];

/**
 * Only the fields a note card needs. Deliberately excludes
 * correctAnswerText and the options' isCorrect flags: irrelevant for
 * free-text questions, and the platform never ships answer keys to
 * non-admins anyway.
 */
const noteSelect = {
  id: true,
  text: true,
  explanation: true,
  type: true,
  chapterId: true,
  chapter: { select: { id: true, title: true, subjectId: true } },
} satisfies Prisma.QuestionSelect;

function buildWhere(
  filters: Partial<ListNotesQuery>,
  publishedOnly: boolean,
  scopeClassId?: string,
): Prisma.QuestionWhereInput {
  const where: Prisma.QuestionWhereInput = { type: { in: NOTE_TYPES } };
  if (publishedOnly) {
    where.isPublished = true;
  }
  if (filters.chapterId) {
    where.chapterId = filters.chapterId;
  } else if (filters.subjectId) {
    where.chapter = { subjectId: filters.subjectId };
  } else if (filters.classId) {
    where.chapter = { subject: { classId: filters.classId } };
  }
  if (filters.q) {
    where.text = { contains: filters.q, mode: 'insensitive' };
  }
  const scoped = classScopeWhere.question(scopeClassId);
  if (scoped) {
    where.AND = [scoped];
  }
  return where;
}

export const notesRepository = {
  async findManyPaginated(filters: ListNotesQuery, publishedOnly: boolean, scopeClassId?: string) {
    const where = buildWhere(filters, publishedOnly, scopeClassId);
    const skip = (filters.page - 1) * filters.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.question.findMany({
        where,
        // Grouped by chapter so the set reads straight through in course
        // order, newest first within a chapter.
        orderBy: [{ chapter: { order: 'asc' } }, { createdAt: 'desc' }],
        skip,
        take: filters.pageSize,
        select: noteSelect,
      }),
      prisma.question.count({ where }),
    ]);

    return { items, total };
  },
};

export type NoteRecord = Prisma.QuestionGetPayload<{ select: typeof noteSelect }>;
