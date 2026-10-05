export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  data: null;
  message: string;
  errors?: unknown;
}

export interface AdminDashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  totalChapters: number;
  totalQuestions: number;
}
