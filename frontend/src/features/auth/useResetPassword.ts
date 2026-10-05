import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const res = await api.post<{ message: string }>('/auth/reset-password', { token, password });
      return res.data;
    },
  });
}
