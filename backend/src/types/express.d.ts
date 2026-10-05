import 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  /** The grade a student is locked to; null for admins and for students who have not picked one yet. */
  classId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
