import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { classScopeWhere } from '../../lib/classScope';
import type { ListQuestionsQuery } from './questions.validation';

function buildWhere(
  filters: Partial<ListQuestionsQuery>,
  publishedOnly: boolean,
  scopeClassId?: string,
): Prisma.QuestionWhereInput {
  const where: Prisma.QuestionWhereInput = {};
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
  // A class-scoped student is pinned to their own grade regardless of the
  // classId (or chapter/subject of another grade) they asked for.
  const scoped = classScopeWhere.question(scopeClassId);
  if (scoped) {
    where.AND = [scoped];
  }
  if (filters.type) {
    where.type = filters.type;
  }
  return where;
}

export const questionsRepository = {
  async findManyPaginated(filters: ListQuestionsQuery, publishedOnly: boolean, scopeClassId?: string) {
    const where = buildWhere(filters, publishedOnly, scopeClassId);
    const skip = (filters.page - 1) * filters.pageSize;

    const [items, total] = await prisma.$transaction([
      prisma.question.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.pageSize,
        include: { options: true, chapter: true },
      }),
      prisma.question.count({ where }),
    ]);

    return { items, total };
  },

  findById(id: string, scopeClassId?: string) {
    const scoped = classScopeWhere.question(scopeClassId);
    if (!scoped) {
      return prisma.question.findUnique({
        where: { id },
        include: { options: true, chapter: true },
      });
    }
    return prisma.question.findFirst({
      where: { id, AND: [scoped] },
      include: { options: true, chapter: true },
    });
  },

  findManyByIds(ids: string[]) {
    return prisma.question.findMany({
      where: { id: { in: ids } },
      include: { options: true },
    });
  },

  findChapterById(chapterId: string) {
    return prisma.chapter.findUnique({ where: { id: chapterId } });
  },

  create(data: Prisma.QuestionCreateInput) {
    return prisma.question.create({ data, include: { options: true, chapter: true } });
  },

  async updateWithOptions(
    id: string,
    data: Prisma.QuestionUpdateInput,
    options?: { text: string; isCorrect: boolean }[],
  ) {
    return prisma.$transaction(async (tx) => {
      if (options) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
      }
      return tx.question.update({
        where: { id },
        data: {
          ...data,
          ...(options ? { options: { create: options } } : {}),
        },
        include: { options: true, chapter: true },
      });
    });
  },

  remove(id: string) {
    return prisma.question.delete({ where: { id } });
  },

  setPublished(id: string, isPublished: boolean) {
    return prisma.question.update({
      where: { id },
      data: { isPublished },
      include: { options: true, chapter: true },
    });
  },
};
