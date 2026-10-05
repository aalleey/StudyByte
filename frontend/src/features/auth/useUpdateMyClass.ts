import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types/auth';

/**
 * Sets (or changes) the signed-in student's grade. The whole app is scoped to
 * it server-side, so on success the cached user is replaced and every content
 * query is invalidated - otherwise the previous grade's subjects/chapters
 * would linger in the cache.
 */
export function useUpdateMyClass() {
  const { setUser } = useAuth();
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (classId: string) => {
      const res = await api.patch<{ data: User }>('/auth/me/class', { classId });
      return res.data.data;
    },
    onSuccess: (user) => {
      setUser(user);
      void client.invalidateQueries();
    },
  });
}
