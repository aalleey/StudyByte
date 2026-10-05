import { Router } from 'express';
import { chaptersController } from './chapters.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { ROLES } from '../../types/common';
import { idParamSchema, publishBodySchema } from '../common/common.validation';
import { createChapterSchema, listChaptersQuerySchema, updateChapterSchema } from './chapters.validation';

const router = Router();

router.get('/', optionalAuthenticate, validate({ query: listChaptersQuerySchema }), chaptersController.list);
router.get('/:id', optionalAuthenticate, validate({ params: idParamSchema }), chaptersController.getOne);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ body: createChapterSchema }),
  chaptersController.create,
);

router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema, body: updateChapterSchema }),
  chaptersController.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  chaptersController.remove,
);

router.patch(
  '/:id/publish',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema, body: publishBodySchema }),
  chaptersController.publish,
);

export default router;
