
import React from 'react';
import { useAppContext } from '../../context/AppContext';
// FIX: Removed local declarations of UserCircle and LogOut that conflicted with these imports.
import { LogOut, UserCircle, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { currentUser, logout } = useAppContext();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 text-slate-100 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 p-2 text-white/80 shadow-sm transition hover:bg-white/20 hover:text-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300 md:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 text-white font-semibold shadow-lg shadow-primary-900/40">
            TH
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-300">
              IGCSE
            </span>
            <h1 className="text-lg font-bold leading-none text-white">Teacher&apos;s Hub</h1>
          </div>
        </div>
        {currentUser && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 shadow-inner shadow-slate-900/40">
              <UserCircle className="text-primary-200" />
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{currentUser.name}</p>
                <p className="text-xs uppercase tracking-wide text-slate-300">{currentUser.type}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-400/60"
              title="Logout"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
