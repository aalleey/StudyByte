import { Outlet } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { GradePicker } from '../components/grade/GradePicker';
import { useAuth } from '../context/AuthContext';

/**
 * Blocking gate for students who have no grade yet (everyone who signed up
 * before grade selection existed). It wraps the whole student route subtree,
 * so it cannot be bypassed by typing a URL, and never renders for admins.
 */
export function RequireGrade() {
  const { user } = useAuth();

  if (!user || user.role !== 'STUDENT' || user.classId) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-lg">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Select your grade</h1>
        <p className="mb-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
          Everything you study - subjects, chapters and notes - is tailored to your grade. You can change it later
          from the account menu.
        </p>
        <GradePicker confirmLabel="Continue" />
      </Card>
    </div>
  );
}
