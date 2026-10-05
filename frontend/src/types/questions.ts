export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK' | 'SHORT_ANSWER' | 'LONG_ANSWER';

export interface QuestionOptionEntity {
  id: string;
  text: string;
  isCorrect?: boolean; // stripped for non-admin responses
}

export interface QuestionEntity {
  id: string;
  chapterId: string;
  type: QuestionType;
  text: string;
  explanation?: string | null;
  isPublished: boolean;
  createdById: string;
  correctAnswerText?: string | null; // stripped for non-admin responses
  options: QuestionOptionEntity[];
  chapter?: { id: string; title: string; subjectId: string };
  createdAt: string;
  updatedAt: string;
}

export interface QuestionFormValues {
  chapterId: string;
  type: QuestionType;
  text: string;
  explanation?: string;
  correctAnswerText?: string;
  options: { text: string; isCorrect: boolean }[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QuestionFilters {
  page?: number;
  pageSize?: number;
  chapterId?: string;
  subjectId?: string;
  classId?: string;
  type?: QuestionType;
}

export interface CsvImportRowError {
  row: number;
  message: string;
}

export interface CsvImportResult {
  totalRows: number;
  created: number;
  failed: CsvImportRowError[];
}
