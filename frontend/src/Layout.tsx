import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from './i18n';
import { useAppStore } from './store';
import { Home, Box, Film as Video, Bot, User, ArrowLeft } from 'lucide-react';
import api from './api';
import { cn } from './utils';

export { cn };

// Section routes that should hide navbar and show section header
const sectionRoutes: { pattern: RegExp; name: string }[] = [
  { pattern: /^\/category\//, name: '' }, // dynamic name from path
  { pattern: /^\/level\//, name: 'Mavzular' },
  { pattern: /^\/lesson\//, name: 'Dars' },
  { pattern: /^\/movies$/, name: 'Movies' },
  { pattern: /^\/movie\//, name: 'Kino' },
  { pattern: /^\/comics$/, name: 'Comics' },
  { pattern: /^\/comic\//, name: 'Komiks' },
  { pattern: /^\/songs$/, name: 'Songs' },
  { pattern: /^\/library$/, name: 'Library' },
  { pattern: /^\/grammar-checker$/, name: 'Grammar Checker' },
  { pattern: /^\/tips$/, name: 'Tips' },
  { pattern: /^\/pricing$/, name: 'Tariflar' },
  { pattern: /^\/vocabulary\//, name: 'Vocabulary' },
];

const getCategoryName = (path: string): string => {
  const catNames: Record<string, string> = {
    grammar: 'Grammar', vocabulary: 'Vocabulary', reading: 'Reading',
    listening: 'Listening', writing: 'Writing', speaking: 'Speaking',
  };
  const match = path.match(/^\/category\/(.+)/);
  if (match) return catNames[match[1]] || match[1];
  return '';
};

export default function Layout() {
  const t = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, isNavbarHidden: isHiddenByStore, setIsNavbarHidden } = useAppStore();
  const [showReg, setShowReg] = useState(false);
  const [regData, setRegData] = useState({ first_name: '', age: '', gender: '' });

  // Reset navbar visibility when navigating between pages
  useEffect(() => {
    setIsNavbarHidden(false);
  }, [location.pathname, setIsNavbarHidden]);

  // Determine if current route is a section page  
  const matchedSection = sectionRoutes.find(s => s.pattern.test(location.pathname));
  const isInSection = !!matchedSection;
  const sectionName = matchedSection?.name || getCategoryName(location.pathname);

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

  const hideNavbar = isHiddenByStore || isInSection;

  const isFullBleed = /^\/(reels|ai-chat)$/i.test(location.pathname) || isHiddenByStore;

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

      {/* Section Header (replaces navbar in section pages) */}
      {isInSection && !isHiddenByStore && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-surface/95 backdrop-blur-xl border-b border-theme">
          <div className="max-w-lg mx-auto flex items-center h-14 px-4 gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-elevated transition-colors">
              <ArrowLeft className="w-5 h-5 text-main" />
            </button>
            <h1 className="text-lg font-bold text-main truncate">{sectionName}</h1>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main 
        key={location.pathname}
        className={cn(
          "mx-auto flex flex-col relative page-enter w-full duration-500",
          isFullBleed ? "flex-1 h-[calc(100dvh)] pt-[60px]" : "flex-1 max-w-7xl px-4 pb-4 min-h-[100dvh]",
          !hideNavbar && !isFullBleed ? "pt-20" : "",
          isInSection && !isHiddenByStore ? "pt-16" : "",
          hideNavbar && !isInSection && !isFullBleed ? "pt-6" : ""
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
