import { Router } from 'express';
import { classesController } from './classes.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { ROLES } from '../../types/common';
import { idParamSchema, publishBodySchema } from '../common/common.validation';
import { createClassSchema, updateClassSchema } from './classes.validation';

const router = Router();

router.get('/', optionalAuthenticate, classesController.list);
router.get('/:id', optionalAuthenticate, validate({ params: idParamSchema }), classesController.getOne);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ body: createClassSchema }),
  classesController.create,
);

router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema, body: updateClassSchema }),
  classesController.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  classesController.remove,
);

router.patch(
  '/:id/publish',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema, body: publishBodySchema }),
  classesController.publish,
);

export default router;
