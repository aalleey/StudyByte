import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { ROLES } from '../../types/common';

const router = Router();

router.get('/admin', authenticate, authorize(ROLES.ADMIN), dashboardController.adminStats);

export default router;
