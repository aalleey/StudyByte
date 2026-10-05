import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateMyClassSchema,
} from './auth.validation';

const router = Router();

router.use(authRateLimiter);

router.post('/register', validate({ body: registerSchema }), authController.register);
router.post('/login', validate({ body: loginSchema }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), authController.resetPassword);
router.get('/me', authenticate, authController.me);
router.patch('/me/class', authenticate, validate({ body: updateMyClassSchema }), authController.updateMyClass);

export default router;
