import { prisma } from '../../lib/prisma';
import { ROLES } from '../../types/common';

export interface AdminDashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  totalChapters: number;
  totalQuestions: number;
}

export const dashboardService = {
  async getAdminStats(): Promise<AdminDashboardStats> {
    const [totalStudents, totalClasses, totalSubjects, totalChapters, totalQuestions] = await Promise.all([
      prisma.user.count({ where: { role: { name: ROLES.STUDENT } } }),
      prisma.class.count(),
      prisma.subject.count(),
      prisma.chapter.count(),
      prisma.question.count(),
    ]);

    return {
      totalStudents,
      totalClasses,
      totalSubjects,
      totalChapters,
      totalQuestions,
    };
  },
};
