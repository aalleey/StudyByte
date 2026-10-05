/** Notes are the exercise (short/long answer) questions plus their model answers. */
export type NoteType = 'SHORT_ANSWER' | 'LONG_ANSWER';

export interface NoteEntity {
  id: string;
  text: string;
  /** The model answer; may be null if an admin hasn't written one yet. */
  explanation: string | null;
  type: NoteType;
  chapterId: string;
  chapter: { id: string; title: string; subjectId: string };
}

export interface NoteFilters {
  page?: number;
  pageSize?: number;
  chapterId?: string;
  subjectId?: string;
  classId?: string;
  q?: string;
}
