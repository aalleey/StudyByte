import { ApiError } from '../../lib/ApiError';
import { subjectsRepository } from './subjects.repository';
import type { CreateSubjectInput, UpdateSubjectInput } from './subjects.validation';

export const subjectsService = {
  async list(isAdmin: boolean, classId?: string, scopeClassId?: string) {
    if (isAdmin) {
      return subjectsRepository.findAllForAdmin(classId);
    }
    // A scoped student is locked to their own class, whatever classId they ask for.
    return subjectsRepository.findAllPublished(scopeClassId ?? classId, scopeClassId);
  },

  async getById(id: string, isAdmin: boolean, scopeClassId?: string) {
    const subject = await subjectsRepository.findById(id);
    if (!subject || (!isAdmin && !subject.isPublished) || (scopeClassId && subject.classId !== scopeClassId)) {
      throw ApiError.notFound('Subject not found');
    }
    return subject;
  },

  async create(input: CreateSubjectInput, createdById: string) {
    const parentClass = await subjectsRepository.findClassById(input.classId);
    if (!parentClass) {
      throw ApiError.badRequest('Parent class does not exist');
    }

    const existing = await subjectsRepository.findByClassAndSlug(input.classId, input.slug);
    if (existing) {
      throw ApiError.conflict('A subject with this slug already exists in this class');
    }

    return subjectsRepository.create({
      title: input.title,
      slug: input.slug,
      order: input.order,
      class: { connect: { id: input.classId } },
      createdBy: { connect: { id: createdById } },
    });
  },

  async update(id: string, input: UpdateSubjectInput) {
    const existing = await subjectsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Subject not found');
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await subjectsRepository.findByClassAndSlug(existing.classId, input.slug);
      if (slugTaken) {
        throw ApiError.conflict('A subject with this slug already exists in this class');
      }
    }

    return subjectsRepository.update(id, input);
  },

  async remove(id: string) {
    const existing = await subjectsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Subject not found');
    }
    await subjectsRepository.remove(id);
  },

  async setPublished(id: string, isPublished: boolean) {
    const existing = await subjectsRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Subject not found');
    }
    return subjectsRepository.setPublished(id, isPublished);
  },
};
