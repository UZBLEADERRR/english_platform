import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from './i18n';
import { useAppStore } from './store';
import { Home, Box, Film as Video, Bot, User } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from './api';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export default function Layout() {
  const t = useTranslation();
  const location = useLocation();
  const { user, setUser } = useAppStore();

  useEffect(() => {
    // Try Telegram WebApp init
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser && !user) {
        api.setTelegramId(tgUser.id.toString());
        api.loginTelegram({
          telegram_id: tgUser.id,
          username: tgUser.username,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          avatar_url: tgUser.photo_url,
          referral_code: new URLSearchParams(tg.initDataUnsafe?.start_param || '').get('ref'),
        }).then(({ user: u }) => {
          api.setUserId(u.id);
          setUser(u);
        }).catch(console.error);
      }
    }
    // Dev mode: mock user
    if (!tg && !user) {
      api.setTelegramId('123456789');
      api.loginTelegram({
        telegram_id: 123456789,
        username: 'dev_user',
        first_name: 'Dev',
        last_name: 'User',
      }).then(({ user: u }) => {
        api.setUserId(u.id);
        setUser(u);
      }).catch(() => {
        // Server not running - set mock user
        setUser({
          id: 'mock-id', telegram_id: 123456789, username: 'dev_user',
          first_name: 'Dev', role: 'user', subscription: 'free',
          ai_credits_used: 0, ai_messages_today: 0, grammar_checks_today: 0, is_blocked: false,
        });
      });
    }
  }, []);

  const navItems = [
    { path: '/', label: t('home'), icon: Home },
    { path: '/apps', label: t('apps'), icon: Box },
    { path: '/reels', label: t('reels'), icon: Video },
    { path: '/ai-chat', label: t('aiChat'), icon: Bot },
    { path: '/profile', label: t('profile'), icon: User },
  ];

  const isFullscreen = ['/ai-chat', '/reels'].some(p => location.pathname.startsWith(p));

  return (
    <div className={cn("flex flex-col", isFullscreen ? "h-[100dvh] overflow-hidden" : "min-h-[100dvh]")}>
      {/* Main Content */}
      <main className={cn(
        "flex-1 w-full mx-auto flex flex-col relative",
        isFullscreen ? "max-w-none p-0 overflow-hidden" : "max-w-7xl p-4 pb-20"
      )}>
        <Outlet />
      </main>

      {/* Bottom Navbar */}
      {!isFullscreen && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-t border-theme safe-area-bottom">
          <div className="max-w-lg mx-auto flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-300 min-w-[56px]",
                    isActive ? "text-primary" : "text-muted hover:text-main"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all",
                    isActive && "bg-primary/10"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
