import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import classesRoutes from '../modules/classes/classes.routes';
import subjectsRoutes from '../modules/subjects/subjects.routes';
import chaptersRoutes from '../modules/chapters/chapters.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import questionsRoutes from '../modules/questions/questions.routes';
import notesRoutes from '../modules/notes/notes.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/classes', classesRoutes);
router.use('/subjects', subjectsRoutes);
router.use('/chapters', chaptersRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/questions', questionsRoutes);
router.use('/notes', notesRoutes);

export default router;
