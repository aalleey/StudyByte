import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';

interface ContentHooksConfig {
  /** e.g. "/classes" */
  basePath: string;
  /** e.g. "classes" - used as the react-query cache key */
  queryKey: string;
  /** e.g. "classId" - query string param used to scope list() to a parent, if any */
  parentParam?: string;
}

/**
 * Shared CRUD + publish hook factory for the Class -> Subject -> Chapter
 * hierarchy - every one of these modules exposes an
 * identical REST shape (list/get/create/update/delete/publish), so the
 * TanStack Query wiring is generated once here and given a typed, named
 * export per feature folder (see features/classes/index.ts etc.).
 */
export function createContentHooks<TEntity extends { id: string }, TCreateInput, TUpdateInput>(
  config: ContentHooksConfig,
) {
  const { basePath, queryKey, parentParam } = config;

  function listKey(parentId?: string) {
    return parentId ? [queryKey, 'list', parentId] : [queryKey, 'list'];
  }

  function useList(parentId?: string, options?: { enabled?: boolean }) {
    return useQuery({
      queryKey: listKey(parentId),
      enabled: options?.enabled ?? true,
      queryFn: async () => {
        const params = parentId && parentParam ? { [parentParam]: parentId } : undefined;
        const res = await api.get<{ data: TEntity[] }>(basePath, { params });
        return res.data.data;
      },
    });
  }

  function useOne(id: string | undefined) {
    return useQuery({
      queryKey: [queryKey, 'detail', id],
      queryFn: async () => {
        const res = await api.get<{ data: TEntity }>(`${basePath}/${id}`);
        return res.data.data;
      },
      enabled: !!id,
    });
  }

  function useCreate() {
    const client = useQueryClient();
    return useMutation({
      mutationFn: async (input: TCreateInput) => {
        const res = await api.post<{ data: TEntity }>(basePath, input);
        return res.data.data;
      },
      onSuccess: () => {
        void client.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useUpdate() {
    const client = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, input }: { id: string; input: TUpdateInput }) => {
        const res = await api.patch<{ data: TEntity }>(`${basePath}/${id}`, input);
        return res.data.data;
      },
      onSuccess: () => {
        void client.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function useRemove() {
    const client = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await api.delete(`${basePath}/${id}`);
      },
      onSuccess: () => {
        void client.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  function usePublish() {
    const client = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
        const res = await api.patch<{ data: TEntity }>(`${basePath}/${id}/publish`, { isPublished });
        return res.data.data;
      },
      onSuccess: () => {
        void client.invalidateQueries({ queryKey: [queryKey] });
      },
    });
  }

  return { useList, useOne, useCreate, useUpdate, useRemove, usePublish };
}
