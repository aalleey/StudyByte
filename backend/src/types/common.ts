export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  STUDENT: 'STUDENT',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
