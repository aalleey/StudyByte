import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-slate-950">
      <p className="text-6xl font-bold text-brand-600 dark:text-brand-400">404</p>
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Page not found</h1>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link to="/">
        <Button>Go home</Button>
      </Link>
    </div>
  );
}
