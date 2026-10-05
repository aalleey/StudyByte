import { ApiError } from '../../lib/ApiError';
import { classesRepository } from './classes.repository';
import type { CreateClassInput, UpdateClassInput } from './classes.validation';

export const classesService = {
  async list(isAdmin: boolean, scopeClassId?: string) {
    return isAdmin ? classesRepository.findAllForAdmin() : classesRepository.findAllPublished(scopeClassId);
  },

  async getById(id: string, isAdmin: boolean, scopeClassId?: string) {
    const cls = await classesRepository.findById(id);
    if (!cls || (!isAdmin && !cls.isPublished) || (scopeClassId && cls.id !== scopeClassId)) {
      throw ApiError.notFound('Class not found');
    }
    return cls;
  },

  async create(input: CreateClassInput, createdById: string) {
    const existing = await classesRepository.findBySlug(input.slug);
    if (existing) {
      throw ApiError.conflict('A class with this slug already exists');
    }
    return classesRepository.create({
      title: input.title,
      slug: input.slug,
      order: input.order,
      createdBy: { connect: { id: createdById } },
    });
  },

  async update(id: string, input: UpdateClassInput) {
    const existing = await classesRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Class not found');
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await classesRepository.findBySlug(input.slug);
      if (slugTaken) {
        throw ApiError.conflict('A class with this slug already exists');
      }
    }

    return classesRepository.update(id, input);
  },

  async remove(id: string) {
    const existing = await classesRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Class not found');
    }
    await classesRepository.remove(id);
  },

  async setPublished(id: string, isPublished: boolean) {
    const existing = await classesRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Class not found');
    }
    return classesRepository.setPublished(id, isPublished);
  },
};
