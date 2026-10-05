import { Outlet } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export function AuthLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="fixed right-4 top-4 rounded-md p-2 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-brand-700 dark:text-brand-400">Computer CS Platform</h1>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
