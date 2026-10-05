import type { PaginatedResult } from '../../types/common';
import { notesRepository } from './notes.repository';
import type { NoteRecord } from './notes.repository';
import type { ListNotesQuery } from './notes.validation';

export const notesService = {
  async list(
    filters: ListNotesQuery,
    isAdmin: boolean,
    scopeClassId?: string,
  ): Promise<PaginatedResult<NoteRecord>> {
    const { items, total } = await notesRepository.findManyPaginated(filters, !isAdmin, scopeClassId);
    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  },
};
