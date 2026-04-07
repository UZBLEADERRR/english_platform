import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { ArrowLeft, Star } from 'lucide-react';

export default function CategoryView() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslation();
  const navigate = useNavigate();

  // Generate 6 levels
  const levels = Array.from({ length: 6 }, (_, i) => i + 1);

  const categoryName = id ? t(id as any) : '';

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-elevated transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-main" />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-main capitalize">{categoryName}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {levels.map((level) => (
          <div 
            key={level}
            className="bg-surface border border-theme rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                {level}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map((star) => (
                  <Star key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                ))}
              </div>
            </div>
            <h3 className="text-xl font-bold text-main mb-2">{t('level')} {level}</h3>
            <p className="text-muted text-sm">
              Complete this level to unlock the next one. Contains various exercises and tests.
            </p>
            <div className="mt-6 w-full bg-elevated rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full w-0 group-hover:w-1/3 transition-all duration-500"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
