import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  // Optional here on purpose: API clients that predate grade selection keep
  // working and the student is gated in the UI until they pick one.
  classId: z.string().uuid('Invalid classId').optional(),
});

export const updateMyClassSchema = z.object({
  classId: z.string().uuid('Invalid classId'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateMyClassInput = z.infer<typeof updateMyClassSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
