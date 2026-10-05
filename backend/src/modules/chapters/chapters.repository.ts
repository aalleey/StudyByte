import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { classScopeWhere } from '../../lib/classScope';

export const chaptersRepository = {
  findAllForAdmin(subjectId?: string) {
    return prisma.chapter.findMany({
      where: subjectId ? { subjectId } : undefined,
      orderBy: { order: 'asc' },
      include: { _count: { select: { questions: true } } },
    });
  },

  findAllPublished(subjectId?: string, scopeClassId?: string) {
    const scoped = classScopeWhere.chapter(scopeClassId);
    return prisma.chapter.findMany({
      where: { isPublished: true, ...(subjectId ? { subjectId } : {}), ...(scoped ? { AND: [scoped] } : {}) },
      orderBy: { order: 'asc' },
    });
  },

  findById(id: string, scopeClassId?: string) {
    const scoped = classScopeWhere.chapter(scopeClassId);
    if (!scoped) {
      return prisma.chapter.findUnique({ where: { id } });
    }
    return prisma.chapter.findFirst({ where: { id, AND: [scoped] } });
  },

  findBySubjectAndSlug(subjectId: string, slug: string) {
    return prisma.chapter.findUnique({ where: { subjectId_slug: { subjectId, slug } } });
  },

  findSubjectById(subjectId: string) {
    return prisma.subject.findUnique({ where: { id: subjectId } });
  },

  create(data: Prisma.ChapterCreateInput) {
    return prisma.chapter.create({ data });
  },

  update(id: string, data: Prisma.ChapterUpdateInput) {
    return prisma.chapter.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.chapter.delete({ where: { id } });
  },

  setPublished(id: string, isPublished: boolean) {
    return prisma.chapter.update({ where: { id }, data: { isPublished } });
  },

  count() {
    return prisma.chapter.count();
  },
};
