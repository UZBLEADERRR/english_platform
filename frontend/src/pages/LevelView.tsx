import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { ArrowLeft, Lock } from 'lucide-react';
import { cn } from '../Layout';

export default function LevelView() {
  const { categoryId, levelId } = useParams();
  const t = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [topics, setTopics] = useState<any[]>([]);

  useEffect(() => {
    if (!levelId) return;
    api.getTopics(levelId).then(setTopics).catch(() => {
      setTopics(Array.from({ length: 8 }, (_, i) => ({
        id: `mock-topic-${i}`, title: `Topic ${i + 1}`,
        icon_url: `https://api.dicebear.com/7.x/shapes/svg?seed=topic${i}`,
        is_locked: i > 2, is_premium: i > 4,
      })));
    });
  }, [levelId]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-elevated transition-colors">
          <ArrowLeft className="w-5 h-5 text-main" />
        </button>
        <h1 className="text-xl font-bold text-main">Mavzular</h1>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {topics.map((topic) => {
          const isLocked = topic.is_locked && (topic.is_premium ? user?.subscription !== 'ultra' : user?.subscription === 'free');
          return (
            <button
              key={topic.id}
              onClick={() => !isLocked && navigate(`/lesson/${topic.id}`)}
              disabled={isLocked}
              className={cn(
                "flex flex-col items-center p-3 rounded-2xl transition-all duration-300 group",
                isLocked ? "opacity-50 cursor-not-allowed bg-elevated" : "bg-surface border border-theme hover:border-primary/50 hover:shadow-md cursor-pointer"
              )}
            >
              <div className="relative w-14 h-14 rounded-xl overflow-hidden mb-2 bg-elevated flex items-center justify-center">
                {topic.icon_url ? (
                  <img src={topic.icon_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-2xl">📚</span>
                )}
                {isLocked && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-main text-center line-clamp-2">{topic.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
