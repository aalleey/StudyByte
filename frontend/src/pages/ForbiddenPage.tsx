import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-slate-950">
      <p className="text-6xl font-bold text-brand-600 dark:text-brand-400">403</p>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Access denied</h1>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        You don&apos;t have permission to view this page. If you think this is a mistake, contact an administrator.
      </p>
      <Link to="/">
        <Button>Go home</Button>
      </Link>
    </div>
  );
}
