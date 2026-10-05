export interface ContentCounts {
  subjects?: number;
  chapters?: number;
  questions?: number;
}

export interface ClassEntity {
  id: string;
  title: string;
  slug: string;
  order: number;
  isPublished: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: ContentCounts;
}

export interface SubjectEntity {
  id: string;
  classId: string;
  title: string;
  slug: string;
  order: number;
  isPublished: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: ContentCounts;
}

export interface ChapterEntity {
  id: string;
  subjectId: string;
  title: string;
  slug: string;
  order: number;
  isPublished: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: ContentCounts;
}
