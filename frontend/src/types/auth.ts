export type Role = 'SUPERADMIN' | 'ADMIN' | 'STUDENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  /** The grade a student is locked to; null for admins and for students who have not picked one yet. */
  classId: string | null;
  class?: { id: string; title: string } | null;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
