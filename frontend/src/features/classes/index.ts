import { createContentHooks } from '../common/createContentHooks';
import type { ClassEntity } from '../../types/content';
import type { ClassFormValues } from '../../schemas/content.schemas';

export const {
  useList: useClasses,
  useOne: useClass,
  useCreate: useCreateClass,
  useUpdate: useUpdateClass,
  useRemove: useDeleteClass,
  usePublish: usePublishClass,
} = createContentHooks<ClassEntity, ClassFormValues, Partial<ClassFormValues>>({
  basePath: '/classes',
  queryKey: 'classes',
});
