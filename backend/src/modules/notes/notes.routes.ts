import { Router } from 'express';
import { notesController } from './notes.controller';
import { validate } from '../../middleware/validate.middleware';
import { optionalAuthenticate } from '../../middleware/auth.middleware';
import { listNotesQuerySchema } from './notes.validation';

const router = Router();

router.get('/', optionalAuthenticate, validate({ query: listNotesQuerySchema }), notesController.list);

export default router;
