import React, { useEffect, useState } from 'react';
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
  const [showReg, setShowReg] = useState(false);
  const [regData, setRegData] = useState({ first_name: '', age: '', gender: '' });

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

  useEffect(() => {
    if (user && (!user.age || !user.gender)) {
      setRegData({ first_name: user.first_name || '', age: '', gender: '' });
      setShowReg(true);
    } else {
      setShowReg(false);
    }
  }, [user]);

  const handleRegister = async () => {
    if (!regData.first_name || !regData.age || !regData.gender) return alert('Iltimos, barcha maydonlarni to\'ldiring!');
    try {
      const u = await api.updateProfile({ 
        first_name: regData.first_name, 
        age: parseInt(regData.age), 
        gender: regData.gender 
      });
      setUser(u);
      setShowReg(false);
    } catch (e) {
      alert('Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
    }
  };

  const navItems = [
    { path: '/', label: t('home'), icon: Home },
    { path: '/apps', label: t('apps'), icon: Box },
    { path: '/reels', label: t('reels'), icon: Video },
    { path: '/ai-chat', label: t('aiChat'), icon: Bot },
    { path: '/profile', label: t('profile'), icon: User },
  ];

  const mainNavPaths = ['/', '/apps', '/reels', '/ai-chat', '/profile'];
  const hideNavbar = !mainNavPaths.includes(location.pathname);

  const isFullBleed = /^\/(reels|ai-chat)$/i.test(location.pathname);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-bg relative">
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
          "mx-auto flex flex-col relative page-enter w-full duration-500",
          isFullBleed ? "flex-1 h-[calc(100dvh)] pt-[60px]" : "flex-1 max-w-7xl px-4 pb-4 min-h-[100dvh]",
          !hideNavbar && !isFullBleed ? "pt-20" : "",
          hideNavbar && !isFullBleed ? "pt-6" : ""
        )}
      >
        <Outlet />
      </main>

      {/* Registration Modal */}
      {showReg && (
        <div className="fixed inset-0 z-[999] bg-bg flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface border border-theme rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center mb-3">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-2xl font-extrabold text-main">Xush kelibsiz!</h2>
              <p className="text-muted text-sm mt-2">Ilovadan foydalanish uchun o'zingiz haqingizda ma'lumot qoldiring.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-main mb-1.5">Ismingiz</label>
                <input 
                  type="text" 
                  value={regData.first_name} 
                  onChange={e => setRegData({...regData, first_name: e.target.value})}
                  className="w-full bg-elevated border border-theme rounded-xl px-4 py-3 text-main outline-none focus:border-primary transition-colors"
                  placeholder="Ismingizni kiriting..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-main mb-1.5">Yoshingiz</label>
                  <input 
                    type="number" 
                    value={regData.age} 
                    onChange={e => setRegData({...regData, age: e.target.value})}
                    className="w-full bg-elevated border border-theme rounded-xl px-4 py-3 text-main outline-none focus:border-primary transition-colors"
                    placeholder="Masalan: 18"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-main mb-1.5">Jinsingiz</label>
                  <select 
                    value={regData.gender}
                    onChange={e => setRegData({...regData, gender: e.target.value})}
                    className="w-full bg-elevated border border-theme rounded-xl px-4 py-3 text-main outline-none focus:border-primary transition-colors appearance-none"
                  >
                    <option value="" disabled>Tanlang</option>
                    <option value="male">Erkak</option>
                    <option value="female">Ayol</option>
                  </select>
                </div>
              </div>
              
              <button 
                onClick={handleRegister}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:-translate-y-1 transition-transform"
              >
                Boshlash 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
