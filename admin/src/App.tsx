import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Image, FolderOpen, GraduationCap, Film, BookOpen, Lightbulb, Box, Video, Users, CreditCard, Share2, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import adminApi from './api';
import Dashboard from './pages/Dashboard';
import CarouselPage from './pages/CarouselPage';
import CategoriesPage from './pages/CategoriesPage';
import LessonsPage from './pages/LessonsPage';
import MoviesPage from './pages/MoviesPage';
import ComicsPage from './pages/ComicsPage';
import TipsPage from './pages/TipsPage';
import AppsPage from './pages/AppsPage';
import ReelsPage from './pages/ReelsPage';
import UsersPage from './pages/UsersPage';
import PaymentsPage from './pages/PaymentsPage';
import ReferralsPage from './pages/ReferralsPage';
import SongsPage from './pages/SongsPage';
import LibraryPage from './pages/LibraryPage';
import PricingPage from './pages/PricingPage';
import VocabularyPage from './pages/VocabularyPage';

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError('');
    try {
      const { token } = await adminApi.login(password);
      adminApi.setToken(token);
      onLogin();
    } catch { setError('Noto\'g\'ri parol'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm card space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">English Learning Platform</p>
        </div>
        <div className="space-y-3">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Admin parol" className="input" autoFocus />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleLogin} disabled={loading} className="btn-primary w-full">
            {loading ? 'Kirish...' : 'Kirish'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/carousel', label: 'Karusel', icon: Image },
    { path: '/categories', label: 'Kategoriyalar', icon: FolderOpen },
    { path: '/lessons', label: 'Darslar', icon: GraduationCap },
    { path: '/movies', label: 'Kinolar', icon: Film },
    { path: '/comics', label: 'Komikslar', icon: BookOpen },
    { path: '/tips', label: 'Maslahatlar', icon: Lightbulb },
    { path: '/apps', label: 'Ilovalar', icon: Box },
    { path: '/reels', label: 'Reels', icon: Video },
    { path: '/users', label: 'Foydalanuvchilar', icon: Users },
    { path: '/payments', label: "To'lovlar", icon: CreditCard },
    { path: '/referrals', label: 'Referral', icon: Share2 },
    { path: '/songs', label: 'Qo\'shiqlar', icon: Film },
    { path: '/library', label: 'Kutubxona', icon: BookOpen },
    { path: '/pricing', label: 'Narxlar', icon: CreditCard },
    { path: '/vocabulary', label: 'Vocabulary', icon: BookOpen },
  ];

  const handleLogout = () => { localStorage.removeItem('admin_token'); window.location.reload(); };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static z-40 h-full w-64 bg-[#0e0e1a] border-r border-[#1e1e30] flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-[#1e1e30] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white">Admin</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive ? 'active' : ''}`}>
                <Icon className="w-4 h-4" /> {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#1e1e30]">
          <button onClick={handleLogout} className="sidebar-item w-full text-red-400 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" /> Chiqish
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-14 border-b border-[#1e1e30] bg-[#0e0e1a]/80 backdrop-blur flex items-center px-4 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 mr-2"><Menu className="w-5 h-5" /></button>
          <h2 className="font-bold text-white text-sm">
            {navItems.find(n => n.path === location.pathname)?.label || 'Admin'}
          </h2>
        </header>
        <div className="p-4 lg:p-6">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="carousel" element={<CarouselPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="lessons" element={<LessonsPage />} />
            <Route path="movies" element={<MoviesPage />} />
            <Route path="comics" element={<ComicsPage />} />
            <Route path="tips" element={<TipsPage />} />
            <Route path="apps" element={<AppsPage />} />
            <Route path="reels" element={<ReelsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="referrals" element={<ReferralsPage />} />
            <Route path="songs" element={<SongsPage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="vocabulary" element={<VocabularyPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('admin_token'));

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) { adminApi.setToken(token); setIsAuth(true); }
  }, []);

  if (!isAuth) return <LoginPage onLogin={() => setIsAuth(true)} />;

  return (
    <BrowserRouter>
      <AdminLayout />
    </BrowserRouter>
  );
}
