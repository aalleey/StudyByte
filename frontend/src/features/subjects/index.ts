import { createContentHooks } from '../common/createContentHooks';
import type { SubjectEntity } from '../../types/content';
import type { SubjectFormValues } from '../../schemas/content.schemas';

export const {
  useList: useSubjects,
  useOne: useSubject,
  useCreate: useCreateSubject,
  useUpdate: useUpdateSubject,
  useRemove: useDeleteSubject,
  usePublish: usePublishSubject,
} = createContentHooks<SubjectEntity, SubjectFormValues, Partial<SubjectFormValues>>({
  basePath: '/subjects',
  queryKey: 'subjects',
  parentParam: 'classId',
});
