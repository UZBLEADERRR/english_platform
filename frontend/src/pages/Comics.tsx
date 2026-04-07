import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { ArrowLeft, Lock } from 'lucide-react';

export default function Comics() {
  const t = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [comics, setComics] = useState<any[]>([]);

  useEffect(() => {
    api.getComics().then(setComics).catch(() => {
      setComics(Array.from({ length: 9 }, (_, i) => ({
        id: `mock-${i}`, title: `Comic Book ${i + 1}`,
        cover_url: `https://picsum.photos/seed/comic${i}/300/400`,
        description: 'An exciting comic book for English learners',
        is_locked: i > 3,
      })));
    });
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-elevated"><ArrowLeft className="w-5 h-5 text-main" /></button>
        <h1 className="text-xl font-bold text-main">{t('comics')}</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {comics.map(comic => {
          const isLocked = comic.is_locked && user?.subscription !== 'premium' && user?.subscription !== 'ultra';
          return (
            <button key={comic.id} onClick={() => !isLocked ? navigate(`/comic/${comic.id}`) : navigate('/pricing')} className="relative rounded-xl overflow-hidden group aspect-[3/4]">
              <img src={comic.cover_url} alt={comic.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <span className="absolute bottom-2 left-2 right-2 text-white text-[11px] font-bold line-clamp-2">{comic.title}</span>
              {isLocked && (
                <div className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full"><Lock className="w-3 h-3 text-yellow-400" /></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
