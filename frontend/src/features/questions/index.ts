import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import type {
  CsvImportResult,
  PaginatedResult,
  QuestionEntity,
  QuestionFilters,
  QuestionFormValues,
} from '../../types/questions';

/**
 * Questions need pagination + several independent filters at once, which
 * doesn't fit createContentHooks' single-parentParam shape - so this is a
 * bespoke hook, following the same TanStack Query key/invalidation
 * conventions as the generated content hooks.
 */
export function useQuestions(filters: QuestionFilters) {
  return useQuery({
    queryKey: ['questions', 'list', filters],
    queryFn: async () => {
      const res = await api.get<{ data: PaginatedResult<QuestionEntity> }>('/questions', { params: filters });
      return res.data.data;
    },
  });
}

export function useQuestion(id: string | undefined) {
  return useQuery({
    queryKey: ['questions', 'detail', id],
    queryFn: async () => {
      const res = await api.get<{ data: QuestionEntity }>(`/questions/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateQuestion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: QuestionFormValues) => {
      const res = await api.post<{ data: QuestionEntity }>('/questions', input);
      return res.data.data;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function useUpdateQuestion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<QuestionFormValues> }) => {
      const res = await api.patch<{ data: QuestionEntity }>(`/questions/${id}`, input);
      return res.data.data;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function useDeleteQuestion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/questions/${id}`);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function usePublishQuestion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const res = await api.patch<{ data: QuestionEntity }>(`/questions/${id}/publish`, { isPublished });
      return res.data.data;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}

export function useImportQuestionsCsv() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ chapterId, file, publish }: { chapterId: string; file: File; publish: boolean }) => {
      const formData = new FormData();
      formData.append('chapterId', chapterId);
      formData.append('publish', String(publish));
      formData.append('file', file);
      const res = await api.post<{ data: CsvImportResult; message: string }>('/questions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['questions'] });
    },
  });
}
