import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { RequireGrade } from './RequireGrade';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';

import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

import { AdminDashboardPage } from '../pages/admin/DashboardPage';
import { AdminClassesPage } from '../pages/admin/ClassesPage';
import { AdminSubjectsPage } from '../pages/admin/SubjectsPage';
import { AdminChaptersPage } from '../pages/admin/ChaptersPage';
import { AdminQuestionsPage } from '../pages/admin/QuestionsPage';

import { StudentNotesPage } from '../pages/student/NotesPage';

import { ForbiddenPage } from '../pages/ForbiddenPage';
import { NotFoundPage } from '../pages/NotFoundPage';

function HomeRedirect() {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <Spinner label="Loading..." />;
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  // SUPERADMIN defaults to the admin dashboard; they switch into the student
  // view explicitly via the Topbar view switcher.
  return <Navigate to={user.role === 'STUDENT' ? '/student' : '/admin'} replace />;
}

export const router = createBrowserRouter([
  { path: '/', element: <HomeRedirect /> },

  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={['ADMIN']} />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/admin', element: <AdminDashboardPage /> },
          { path: '/admin/classes', element: <AdminClassesPage /> },
          { path: '/admin/subjects', element: <AdminSubjectsPage /> },
          { path: '/admin/chapters', element: <AdminChaptersPage /> },
          { path: '/admin/questions', element: <AdminQuestionsPage /> },
        ],
      },
    ],
  },

  {
    element: <ProtectedRoute allowedRoles={['STUDENT']} />,
    children: [
      {
        // Wraps the entire student subtree, so a student with no grade yet
        // cannot reach any student page by typing its URL.
        element: <RequireGrade />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: '/student', element: <Navigate to="/student/notes" replace /> },
              { path: '/student/notes', element: <StudentNotesPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: '/403', element: <ForbiddenPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
