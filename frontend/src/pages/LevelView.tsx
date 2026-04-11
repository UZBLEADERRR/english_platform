import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { ArrowLeft, Lock, Check } from 'lucide-react';
import { cn } from '../utils';

export default function LevelView() {
  const { categoryId, levelId } = useParams();
  const t = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [topics, setTopics] = useState<any[]>([]);
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>([]);

  useEffect(() => {
    if (!levelId) return;
    
    // Fetch Topics
    api.getTopics(levelId).then(setTopics).catch(() => {
      setTopics(Array.from({ length: 8 }, (_, i) => ({
        id: `mock-topic-${i}`, title: `Topic ${i + 1}`,
        icon_url: `https://api.dicebear.com/7.x/shapes/svg?seed=topic${i}`,
        is_locked: i > 2, is_premium: i > 4,
      })));
    });

    // Fetch Progress
    if (user?.id) {
      api.getUserProgress(user.id).then(setCompletedTopicIds).catch(console.error);
    }
  }, [levelId, user?.id]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {topics.map((topic) => {
          const isLocked = topic.is_locked && (topic.is_premium ? user?.subscription !== 'ultra' : user?.subscription === 'free');
          const isCompleted = completedTopicIds.includes(topic.id);
          
          return (
            <button
              key={topic.id}
              onClick={() => {
                if (isLocked) return;
                if (categoryId === 'vocabulary') {
                  navigate(`/vocabulary/${topic.id}`);
                } else {
                  navigate(`/lesson/${topic.id}`);
                }
              }}
              disabled={isLocked}
              className={cn(
                "flex flex-col items-center p-3 rounded-2xl transition-all duration-300 group relative",
                isLocked ? "opacity-50 cursor-not-allowed bg-elevated" : "bg-surface border border-theme hover:border-primary/50 hover:shadow-md cursor-pointer",
                isCompleted && !isLocked && "bg-green-500/5 border-green-500/50 shadow-sm shadow-green-500/10"
              )}
            >
              <div className={cn(
                "relative w-14 h-14 rounded-xl overflow-hidden mb-2 bg-elevated flex items-center justify-center transition-all",
                isCompleted && "ring-2 ring-green-500 ring-offset-2 ring-offset-bg bg-green-500/10"
              )}>
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

                {isCompleted && !isLocked && (
                  <div className="absolute top-0 right-0 p-0.5 bg-green-500 rounded-bl-lg shadow-md z-10">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium text-center line-clamp-2",
                isCompleted ? "text-green-500 font-extrabold" : "text-main"
              )}>{topic.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
