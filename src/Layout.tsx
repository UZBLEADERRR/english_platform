import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from './i18n';
import { Video, Bot, User, Home, Box, GraduationCap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const t = useTranslation();
  const location = useLocation();

  const navItems = [
    { path: '/', label: t('home'), icon: Home },
    { path: '/artifacts', label: t('artifacts'), icon: Box },
    { path: '/reels', label: t('reels'), icon: Video },
    { path: '/virtual-teacher', label: t('virtualTeacher'), icon: Bot },
    { path: '/profile', label: t('profile'), icon: User },
  ];

  const isVirtualTeacher = location.pathname === '/virtual-teacher';
  const isReels = location.pathname === '/reels';

  return (
    <div className={cn(
      "flex flex-col",
      (isVirtualTeacher || isReels) ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]"
    )}>
      {/* Top Navbar */}
      <header className="sticky top-2 z-50 mx-auto w-fit rounded-full border border-theme/30 bg-surface/50 backdrop-blur-xl shadow-lg mt-2 mb-2">
        <nav className="px-6 h-12 flex items-center justify-center gap-4 sm:gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={cn(
                  "p-2 rounded-full transition-all duration-300",
                  isActive ? "text-primary bg-primary/10 shadow-sm" : "text-muted hover:bg-elevated hover:text-main"
                )}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 w-full mx-auto flex flex-col relative",
        (isVirtualTeacher || isReels) ? "max-w-none p-0 overflow-hidden" : "max-w-7xl p-4 md:p-6 lg:p-8"
      )}>
        <Outlet />
      </main>
    </div>
  );
}
