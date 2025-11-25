
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { UserType } from '../../types';

// FIX: Moved inline Lucide components before they are referenced in navLinks to fix declaration errors.
// Simple inline Lucide components to avoid extra dependency
const LucideIcon = ({ children, ...props }: { children: React.ReactNode, [key: string]: any }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
  
const LayoutDashboard: React.FC<any> = (props) => (
    <LucideIcon {...props}>
        <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
    </LucideIcon>
);

const Users: React.FC<any> = (props) => (
    <LucideIcon {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </LucideIcon>
);

const BarChart3: React.FC<any> = (props) => (
    <LucideIcon {...props}>
        <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </LucideIcon>
);

const FileText: React.FC<any> = (props) => (
    <LucideIcon {...props}>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>
    </LucideIcon>
);

const Phone: React.FC<any> = (props) => (
    <LucideIcon {...props}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </LucideIcon>
);

const Info: React.FC<any> = (props) => (
    <LucideIcon {...props}>
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </LucideIcon>
);

const UserProfile: React.FC<any> = (props) => (
  <LucideIcon {...props}>
    <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4"/><path d="M6 20v-.5a3.5 3.5 0 0 1 3.5-3.5h5A3.5 3.5 0 0 1 18 19.5V20"/>
  </LucideIcon>
);

const navLinks = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [UserType.Student, UserType.Teacher, UserType.Parent] },
  { path: '/admin', label: 'User Management', icon: Users, roles: [UserType.Admin] },
  { path: '/roadmap', label: 'Roadmap', icon: BarChart3, roles: [UserType.Student, UserType.Teacher, UserType.Parent] },
  { path: '/about', label: 'About Us', icon: Info, roles: Object.values(UserType) },
  { path: '/contact', label: 'Contact Us', icon: Phone, roles: Object.values(UserType) },
  { path: '/profile', label: 'Profile', icon: UserProfile, roles: Object.values(UserType) }
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAppContext();

  if (!currentUser) return null;

  const activeLinkClass = "bg-primary-600/90 text-white shadow-md shadow-primary-900/40";
  const inactiveLinkClass = "text-slate-300 hover:bg-white/10 hover:text-white";

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/15 bg-slate-950/70 px-6 pb-8 pt-24 shadow-[0_30px_90px_rgba(2,6,23,0.6)] backdrop-blur-xl transition-transform duration-300 md:static md:z-auto md:bg-slate-950/60 md:px-6 md:shadow-none md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex flex-col gap-2 text-slate-100">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Navigate</span>
          <nav className="flex-1 space-y-2 text-sm font-medium">
            {navLinks
              .filter(link => link.roles.includes(currentUser.type))
              .map(link => (
                <NavLink
                  key={link.label}
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 transition ${isActive ? activeLinkClass : inactiveLinkClass}`
                  }
                  onClick={onClose}
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </NavLink>
              ))}
          </nav>
        </div>
      </aside>
    </>
  );
};
