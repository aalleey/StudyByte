import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 md:flex">
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col md:ml-0">
        <Topbar onMenuClick={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
