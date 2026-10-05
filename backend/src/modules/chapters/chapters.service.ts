import { ApiError } from '../../lib/ApiError';
import { chaptersRepository } from './chapters.repository';
import type { CreateChapterInput, UpdateChapterInput } from './chapters.validation';

export const chaptersService = {
  async list(isAdmin: boolean, subjectId?: string, scopeClassId?: string) {
    return isAdmin
      ? chaptersRepository.findAllForAdmin(subjectId)
      : chaptersRepository.findAllPublished(subjectId, scopeClassId);
  },

  async getById(id: string, isAdmin: boolean, scopeClassId?: string) {
    const chapter = await chaptersRepository.findById(id, scopeClassId);
    if (!chapter || (!isAdmin && !chapter.isPublished)) {
      throw ApiError.notFound('Chapter not found');
    }
    return chapter;
  },

  async create(input: CreateChapterInput, createdById: string) {
    const parentSubject = await chaptersRepository.findSubjectById(input.subjectId);
    if (!parentSubject) {
      throw ApiError.badRequest('Parent subject does not exist');
    }

    const existing = await chaptersRepository.findBySubjectAndSlug(input.subjectId, input.slug);
    if (existing) {
      throw ApiError.conflict('A chapter with this slug already exists in this subject');
    }

    return chaptersRepository.create({
      title: input.title,
      slug: input.slug,
      order: input.order,
      subject: { connect: { id: input.subjectId } },
      createdBy: { connect: { id: createdById } },
    });
  },

  async update(id: string, input: UpdateChapterInput) {
    const existing = await chaptersRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Chapter not found');
    }

    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await chaptersRepository.findBySubjectAndSlug(existing.subjectId, input.slug);
      if (slugTaken) {
        throw ApiError.conflict('A chapter with this slug already exists in this subject');
      }
    }

    return chaptersRepository.update(id, input);
  },

  async remove(id: string) {
    const existing = await chaptersRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Chapter not found');
    }
    await chaptersRepository.remove(id);
  },

  async setPublished(id: string, isPublished: boolean) {
    const existing = await chaptersRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Chapter not found');
    }
    return chaptersRepository.setPublished(id, isPublished);
  },
};
