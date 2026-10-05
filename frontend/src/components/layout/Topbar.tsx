import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../ui/Modal';
import { GradePicker } from '../grade/GradePicker';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [gradeModalOpen, setGradeModalOpen] = useState(false);
  const inStudentArea = location.pathname.startsWith('/student');

  async function handleLogout() {
    setMenuOpen(false);
    try {
      await logout();
      showToast('Logged out successfully', 'success');
      navigate('/login', { replace: true });
    } catch {
      showToast('Failed to log out, please try again', 'error');
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
        className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
      >
        ☰
      </button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-3">
        {user?.role === 'SUPERADMIN' && (
          <div
            role="group"
            aria-label="Viewing as"
            className="flex items-center rounded-md border border-slate-200 p-0.5 text-xs font-medium dark:border-slate-700"
          >
            <button
              type="button"
              onClick={() => navigate('/admin')}
              aria-pressed={!inStudentArea}
              className={`rounded px-2.5 py-1 transition-colors ${
                !inStudentArea
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Admin view
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/notes')}
              aria-pressed={inStudentArea}
              className={`rounded px-2.5 py-1 transition-colors ${
                inStudentArea
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              Student view
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </span>
            <span className="hidden sm:inline">{user?.name}</span>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <p>{user?.email}</p>
                {user?.role === 'STUDENT' && user?.class?.title && (
                  <p className="mt-0.5 font-medium text-slate-600 dark:text-slate-300">{user.class.title}</p>
                )}
              </div>
              {user?.role === 'STUDENT' && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setGradeModalOpen(true);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Change grade
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={gradeModalOpen} onClose={() => setGradeModalOpen(false)} title="Change grade">
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Your subjects, chapters and notes all follow the grade you pick here.
        </p>
        <GradePicker
          confirmLabel="Save grade"
          onSaved={() => setGradeModalOpen(false)}
          secondaryAction={{ label: 'Cancel', onClick: () => setGradeModalOpen(false) }}
        />
      </Modal>
    </header>
  );
}
