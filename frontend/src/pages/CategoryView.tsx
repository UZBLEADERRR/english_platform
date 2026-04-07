import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { ArrowLeft, Lock } from 'lucide-react';
import { cn } from '../Layout';

export default function CategoryView() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [levels, setLevels] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    api.getLevels(id).then(setLevels).catch(() => {
      setLevels(Array.from({ length: 6 }, (_, i) => ({
        id: `mock-${i}`, category_id: id, level_number: i + 1,
        title: `Level ${i + 1}`, is_locked: i > 0,
      })));
    });
  }, [id]);

  const colors = [
    'from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600',
    'from-violet-500 to-violet-600', 'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600', 'from-cyan-500 to-cyan-600',
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-elevated transition-colors">
          <ArrowLeft className="w-5 h-5 text-main" />
        </button>
        <h1 className="text-2xl font-bold text-main capitalize">{id ? t(id as any) : ''}</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {levels.map((level, i) => {
          const isLocked = level.is_locked && user?.subscription === 'free';
          return (
            <button
              key={level.id}
              onClick={() => !isLocked && navigate(`/level/${id}/${level.id}`)}
              disabled={isLocked}
              className={cn(
                "relative p-5 rounded-2xl transition-all duration-300 text-left group overflow-hidden",
                isLocked ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.03] hover:shadow-xl cursor-pointer",
                `bg-gradient-to-br ${colors[i % colors.length]}`
              )}
            >
              <div className="relative z-10">
                <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  {t('level')}
                </span>
                <h3 className="text-white text-2xl font-bold mt-1">{level.level_number}</h3>
                <p className="text-white/80 text-sm mt-2 line-clamp-2">{level.title}</p>
              </div>
              {isLocked && (
                <div className="absolute top-3 right-3 p-2 bg-black/30 rounded-full">
                  <Lock className="w-4 h-4 text-white" />
                </div>
              )}
              {/* Decorative circle */}
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
