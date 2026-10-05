import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { classScopeWhere } from '../../lib/classScope';

export const classesRepository = {
  findAllForAdmin() {
    return prisma.class.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { subjects: true } } },
    });
  },

  findAllPublished(scopeClassId?: string) {
    const scoped = classScopeWhere.class(scopeClassId);
    return prisma.class.findMany({
      where: { isPublished: true, ...(scoped ? { AND: [scoped] } : {}) },
      orderBy: { order: 'asc' },
    });
  },

  findById(id: string) {
    return prisma.class.findUnique({ where: { id } });
  },

  findBySlug(slug: string) {
    return prisma.class.findUnique({ where: { slug } });
  },

  create(data: Prisma.ClassCreateInput) {
    return prisma.class.create({ data });
  },

  update(id: string, data: Prisma.ClassUpdateInput) {
    return prisma.class.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.class.delete({ where: { id } });
  },

  setPublished(id: string, isPublished: boolean) {
    return prisma.class.update({ where: { id }, data: { isPublished } });
  },

  count() {
    return prisma.class.count();
  },
};
