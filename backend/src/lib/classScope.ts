import { Prisma } from '@prisma/client';
import { ROLES } from '../types/common';
import type { AuthenticatedUser } from '../types/express';

/**
 * A student is locked to the grade (Class) they picked: every content
 * listing/detail endpoint must be restricted to it. Admins are never
 * restricted, and neither are students who have not picked a grade yet
 * (they are blocked by the "select your grade" gate in the UI instead).
 *
 * Returns the classId to restrict to, or undefined when no restriction
 * applies. Modules feed this into the `classScopeWhere.*` builders below,
 * which produce the Prisma `where` fragment for the right join depth - that
 * way the rule lives in exactly one place instead of being re-derived in a
 * dozen services.
 */
export function classScopeOf(user: AuthenticatedUser | undefined): string | undefined {
  if (!user || user.role !== ROLES.STUDENT) {
    return undefined;
  }
  return user.classId ?? undefined;
}

/**
 * Per-entity `where` fragments for a class scope, each reaching the Class from
 * that entity's own position in the Class -> Subject -> Chapter -> Question tree.
 * They return undefined when there is nothing to scope, so callers can do:
 *
 *   const scoped = classScopeWhere.question(scopeClassId);
 *   if (scoped) where.AND = [scoped];
 *
 * (AND rather than a spread, so a scope can never clash with a filter the
 * caller already put on the same key.)
 */
export const classScopeWhere = {
  class: (scopeClassId?: string): Prisma.ClassWhereInput | undefined =>
    scopeClassId ? { id: scopeClassId } : undefined,

  subject: (scopeClassId?: string): Prisma.SubjectWhereInput | undefined =>
    scopeClassId ? { classId: scopeClassId } : undefined,

  chapter: (scopeClassId?: string): Prisma.ChapterWhereInput | undefined =>
    scopeClassId ? { subject: { classId: scopeClassId } } : undefined,

  question: (scopeClassId?: string): Prisma.QuestionWhereInput | undefined =>
    scopeClassId ? { chapter: { subject: { classId: scopeClassId } } } : undefined,
};
