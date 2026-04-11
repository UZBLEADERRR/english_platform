import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { Lock } from 'lucide-react';
import { cn } from '../utils';

// Categories that use the level system
const LEVELED_CATEGORIES = ['grammar', 'vocabulary'];

export default function CategoryView() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [levels, setLevels] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isLeveled = LEVELED_CATEGORIES.includes(id || '');

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    if (isLeveled) {
      // Grammar/Vocabulary: show levels
      api.getLevels(id).then(data => {
        setLevels(data || []);
        setLoading(false);
      }).catch(() => {
        setLevels(Array.from({ length: 6 }, (_, i) => ({
          id: `mock-${i}`, category_id: id, level_number: i + 1,
          title: `Level ${i + 1}`, is_locked: i > 0,
        })));
        setLoading(false);
      });
    } else {
      // Reading/Listening/Writing/Speaking: load topics directly (no levels)
      // We use a special API call to get all topics for a category directly
      api.getLevels(id).then(levelsData => {
        if (levelsData && levelsData.length > 0) {
          // Load all topics from all levels
          Promise.all(levelsData.map((l: any) => api.getTopics(l.id)))
            .then(results => {
              const allTopics = results.flat();
              setTopics(allTopics);
              setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
          setTopics([]);
          setLoading(false);
        }
      }).catch(() => {
        setTopics([]);
        setLoading(false);
      });
    }
  }, [id, isLeveled]);

  const colors = [
    'from-blue-500 to-blue-600', 'from-emerald-500 to-emerald-600',
    'from-violet-500 to-violet-600', 'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600', 'from-cyan-500 to-cyan-600',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Leveled categories (Grammar, Vocabulary)
  if (isLeveled) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
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
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Non-leveled categories (Reading, Listening, Writing, Speaking) — show topics directly
  return (
    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
      {topics.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted">Hozircha darslar yo'q. Admin qo'shishi kerak.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topics.map((topic, i) => {
            const isLocked = topic.is_locked && (topic.is_premium ? user?.subscription !== 'ultra' : user?.subscription === 'free');
            return (
              <button
                key={topic.id}
                onClick={() => !isLocked && navigate(`/lesson/${topic.id}`)}
                disabled={isLocked}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border",
                  isLocked 
                    ? "opacity-50 cursor-not-allowed bg-elevated border-theme" 
                    : "bg-surface border-theme hover:border-primary/50 hover:shadow-md cursor-pointer hover:-translate-y-0.5"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0",
                  `bg-gradient-to-br ${colors[i % colors.length]}`
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-bold text-main text-sm truncate">{topic.title}</p>
                </div>
                {isLocked && (
                  <div className="p-2 bg-black/10 rounded-full shrink-0">
                    <Lock className="w-4 h-4 text-muted" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
