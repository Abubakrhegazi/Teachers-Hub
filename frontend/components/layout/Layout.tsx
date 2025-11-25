
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.15)_0%,_rgba(15,23,42,0)_55%)]" aria-hidden />
      <Header onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex pt-20">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 w-full px-4 py-10 transition-all text-slate-100 sm:px-6 md:pl-10 md:pr-8 md:ml-72">
          <div className="w-full space-y-10 rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-slate-100 shadow-[0_40px_120px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-8 md:p-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
