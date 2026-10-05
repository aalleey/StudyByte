import { createContentHooks } from '../common/createContentHooks';
import type { ChapterEntity } from '../../types/content';
import type { ChapterFormValues } from '../../schemas/content.schemas';

export const {
  useList: useChapters,
  useOne: useChapter,
  useCreate: useCreateChapter,
  useUpdate: useUpdateChapter,
  useRemove: useDeleteChapter,
  usePublish: usePublishChapter,
} = createContentHooks<ChapterEntity, ChapterFormValues, Partial<ChapterFormValues>>({
  basePath: '/chapters',
  queryKey: 'chapters',
  parentParam: 'subjectId',
});
