import { Router } from 'express';
import { subjectsController } from './subjects.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { ROLES } from '../../types/common';
import { idParamSchema, publishBodySchema } from '../common/common.validation';
import { createSubjectSchema, listSubjectsQuerySchema, updateSubjectSchema } from './subjects.validation';

const router = Router();

router.get('/', optionalAuthenticate, validate({ query: listSubjectsQuerySchema }), subjectsController.list);
router.get('/:id', optionalAuthenticate, validate({ params: idParamSchema }), subjectsController.getOne);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ body: createSubjectSchema }),
  subjectsController.create,
);

router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema, body: updateSubjectSchema }),
  subjectsController.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  subjectsController.remove,
);

router.patch(
  '/:id/publish',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema, body: publishBodySchema }),
  subjectsController.publish,
);

export default router;
