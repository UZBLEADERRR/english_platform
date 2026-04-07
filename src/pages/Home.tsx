import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { BookA, BookOpen, PenTool, Headphones, Mic, Book, Video, Bot, Film, Smile, SpellCheck, Lightbulb } from 'lucide-react';

export default function Home() {
  const t = useTranslation();
  const navigate = useNavigate();

  const categories = [
    { id: 'grammar', label: t('grammar'), icon: BookA, color: 'bg-blue-500', path: '/category/grammar' },
    { id: 'reading', label: t('reading'), icon: BookOpen, color: 'bg-green-500', path: '/category/reading' },
    { id: 'writing', label: t('writing'), icon: PenTool, color: 'bg-yellow-500', path: '/category/writing' },
    { id: 'listening', label: t('listening'), icon: Headphones, color: 'bg-purple-500', path: '/category/listening' },
    { id: 'speaking', label: t('speaking'), icon: Mic, color: 'bg-pink-500', path: '/category/speaking' },
    { id: 'vocabulary', label: t('vocabulary'), icon: Book, color: 'bg-indigo-500', path: '/category/vocabulary' },
    { id: 'movies', label: t('movies'), icon: Film, color: 'bg-orange-500', path: '/category/movies' },
    { id: 'comics', label: t('comics'), icon: Smile, color: 'bg-emerald-500', path: '/category/comics' },
    { id: 'grammarChecker', label: t('grammarChecker'), icon: SpellCheck, color: 'bg-cyan-500', path: '/virtual-teacher' },
    { id: 'tips', label: t('tips'), icon: Lightbulb, color: 'bg-amber-500', path: '/category/tips' },
    { id: 'reels', label: t('reels'), icon: Video, color: 'bg-red-500', path: '/reels' },
    { id: 'virtualTeacher', label: t('virtualTeacher'), icon: Bot, color: 'bg-teal-500', path: '/virtual-teacher' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Carousel / Banner */}
      <div className="w-full h-48 md:h-64 lg:h-80 rounded-2xl overflow-hidden relative group cursor-pointer shadow-lg">
        <img 
          src="https://picsum.photos/seed/english/1200/600" 
          alt="Banner" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
          <div className="text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Master English Today</h2>
            <p className="text-sm md:text-base opacity-90">Start your journey with our interactive lessons.</p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-main">Categories</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => navigate(cat.path)}
                className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-surface border border-theme hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-full ${cat.color} text-white flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <span className="font-medium text-main text-xs sm:text-base text-center">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
