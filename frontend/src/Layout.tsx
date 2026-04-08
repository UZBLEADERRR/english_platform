import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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
    const urlParams = new URLSearchParams(window.location.search);
    const forceTgId = urlParams.get('tg_id');
    
    let tgUser = tg?.initDataUnsafe?.user;
    if (forceTgId) {
      tgUser = { 
        id: parseInt(forceTgId), 
        username: urlParams.get('username') || '',
        first_name: urlParams.get('first_name') || 'External User',
        last_name: '',
        photo_url: ''
      };
    }
    
    if (tgUser) {
      tg?.ready?.();
      tg?.expand?.();
      api.setTelegramId(tgUser.id.toString());
      api.loginTelegram({
        telegram_id: tgUser.id,
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        avatar_url: tgUser.photo_url,
        referral_code: new URLSearchParams(tg?.initDataUnsafe?.start_param || '').get('ref'),
      }).then(({ user: u }) => {
        api.setUserId(u.id);
        setUser(u);
      }).catch(console.error);
    } else if (!user || user.telegram_id === 123456789) {
      // Dev mode
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
        setUser({
          id: 'mock-id', telegram_id: 123456789, username: 'dev_user',
          first_name: 'Dev', role: 'user', subscription: 'free',
          ai_credits_used: 0, ai_messages_today: 0, grammar_checks_today: 0, is_blocked: false,
        });
      });
    } else if (user && user.telegram_id !== 123456789) {
      api.setTelegramId(user.telegram_id.toString());
      api.setUserId(user.id);
    }
  }, []);

  const navItems = [
    { path: '/', label: t('home'), icon: Home },
    { path: '/apps', label: t('apps'), icon: Box },
    { path: '/reels', label: t('reels'), icon: Video },
    { path: '/ai-chat', label: t('aiChat'), icon: Bot },
    { path: '/profile', label: t('profile'), icon: User },
  ];

  // Specific paths where we don't want to show the navbar
  const isDetailedPage = /^\/(movies|apps|comics|library|grammar|reading|writing|listening|speaking|vocabulary|grammar_checker|tips|songs)\/.+/i.test(location.pathname);
  const hideNavbar = isDetailedPage;

  const isFullBleed = /^\/(reels|ai-chat)$/i.test(location.pathname);

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Top Navbar */}
      {!hideNavbar && (
      <nav className="fixed top-2 left-4 right-4 z-[100] bg-surface/90 backdrop-blur-xl border border-theme rounded-full drop-shadow-xl">
        <div className="max-w-lg mx-auto flex items-center justify-around h-12">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-center p-2 rounded-full transition-all duration-300",
                  isActive ? "text-primary bg-primary/10" : "text-muted hover:text-main hover:bg-surface"
                )}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
              </Link>
            );
          })}
        </div>
      </nav>
      )}

      {/* Main Content */}
      <main 
        key={location.pathname}
        className={cn(
          "mx-auto flex flex-col relative page-enter w-full",
          isFullBleed ? "flex-1 h-[100dvh]" : "flex-1 max-w-7xl px-4 pb-4",
          !hideNavbar && !isFullBleed ? "pt-20" : "",
          !hideNavbar && isFullBleed ? "pt-[60px]" : "",
          hideNavbar ? "pt-4" : ""
        )}
      >
        <Outlet />
      </main>
    </div>
  );
}
