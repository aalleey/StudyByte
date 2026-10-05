import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/axios';

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post<{ message: string }>('/auth/forgot-password', { email });
      return res.data;
    },
  });
}
