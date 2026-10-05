import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { classScopeWhere } from '../../lib/classScope';

export const subjectsRepository = {
  findAllForAdmin(classId?: string) {
    return prisma.subject.findMany({
      where: classId ? { classId } : undefined,
      orderBy: { order: 'asc' },
      include: { _count: { select: { chapters: true } } },
    });
  },

  findAllPublished(classId?: string, scopeClassId?: string) {
    const scoped = classScopeWhere.subject(scopeClassId);
    return prisma.subject.findMany({
      where: { isPublished: true, ...(classId ? { classId } : {}), ...(scoped ? { AND: [scoped] } : {}) },
      orderBy: { order: 'asc' },
    });
  },

  findById(id: string) {
    return prisma.subject.findUnique({ where: { id } });
  },

  findByClassAndSlug(classId: string, slug: string) {
    return prisma.subject.findUnique({ where: { classId_slug: { classId, slug } } });
  },

  findClassById(classId: string) {
    return prisma.class.findUnique({ where: { id: classId } });
  },

  create(data: Prisma.SubjectCreateInput) {
    return prisma.subject.create({ data });
  },

  update(id: string, data: Prisma.SubjectUpdateInput) {
    return prisma.subject.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.subject.delete({ where: { id } });
  },

  setPublished(id: string, isPublished: boolean) {
    return prisma.subject.update({ where: { id }, data: { isPublished } });
  },

  count() {
    return prisma.subject.count();
  },
};
