import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
}

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/classes', label: 'Classes' },
  { to: '/admin/subjects', label: 'Subjects' },
  { to: '/admin/chapters', label: 'Chapters' },
  { to: '/admin/questions', label: 'Questions' },
];

const studentNav: NavItem[] = [{ to: '/student/notes', label: 'Notes' }];

interface SidebarProps {
  isOpen: boolean;
  onNavigate: () => void;
}

export function Sidebar({ isOpen, onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  // Keyed off the current section rather than just role, so a SUPERADMIN
  // (who can reach both trees) sees the nav that matches where they actually
  // are instead of always the admin list.
  const inStudentArea = location.pathname.startsWith('/student');
  const items = user?.role === 'STUDENT' || (user?.role === 'SUPERADMIN' && inStudentArea) ? studentNav : adminNav;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onNavigate}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-800">
          <span className="text-lg font-bold text-brand-700 dark:text-brand-400">Computer CS</span>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
