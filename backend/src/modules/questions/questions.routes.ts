import { Router } from 'express';
import multer from 'multer';
import { questionsController } from './questions.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { ROLES } from '../../types/common';
import { idParamSchema, publishBodySchema } from '../common/common.validation';
import { createQuestionSchema, listQuestionsQuerySchema, updateQuestionSchema } from './questions.validation';

const router = Router();

// CSV import is parsed in-memory and never written to disk - no need for a
// disk-storage uploader.
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/', optionalAuthenticate, validate({ query: listQuestionsQuerySchema }), questionsController.list);
router.get('/:id', optionalAuthenticate, validate({ params: idParamSchema }), questionsController.getOne);

router.post(
  '/',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ body: createQuestionSchema }),
  questionsController.create,
);

router.post('/import', authenticate, authorize(ROLES.ADMIN), csvUpload.single('file'), questionsController.importCsv);

router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema, body: updateQuestionSchema }),
  questionsController.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema }),
  questionsController.remove,
);

router.patch(
  '/:id/publish',
  authenticate,
  authorize(ROLES.ADMIN),
  validate({ params: idParamSchema, body: publishBodySchema }),
  questionsController.publish,
);

export default router;
