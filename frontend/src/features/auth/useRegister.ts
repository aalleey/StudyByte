import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import type { User } from '../../types/auth';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  /** Optional at the API level; the sign-up form always sends one. */
  classId?: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const res = await api.post<{ data: User }>('/auth/register', payload);
      return res.data.data;
    },
  });
}
