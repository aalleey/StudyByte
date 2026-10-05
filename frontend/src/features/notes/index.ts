import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import type { PaginatedResult } from '../../types/questions';
import type { NoteEntity, NoteFilters } from '../../types/notes';

/**
 * Notes are read-only and paginated with several independent filters, so - like
 * useQuestions - this is a bespoke hook rather than a createContentHooks
 * instance, following the same TanStack Query key conventions.
 */
export function useNotes(filters: NoteFilters) {
  return useQuery({
    queryKey: ['notes', 'list', filters],
    queryFn: async () => {
      const res = await api.get<{ data: PaginatedResult<NoteEntity> }>('/notes', { params: filters });
      return res.data.data;
    },
  });
}
