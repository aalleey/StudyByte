import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/axios';
import type { AdminDashboardStats } from '../../types/api';

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const res = await api.get<{ data: AdminDashboardStats }>('/dashboard/admin');
      return res.data.data;
    },
  });
}
