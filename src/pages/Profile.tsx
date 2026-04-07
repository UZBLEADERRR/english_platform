import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import { Settings, Award, BookOpen, CheckCircle, XCircle, Edit2, Check, X, Moon, Sun, Globe } from 'lucide-react';
import { cn } from '../Layout';

export default function Profile() {
  const t = useTranslation();
  const { userProfile, updateProfile, theme, toggleTheme, language, setLanguage } = useAppStore();
  const [activeTab, setActiveTab] = useState<'lessons' | 'known' | 'unknown'>('lessons');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editAvatar, setEditAvatar] = useState(userProfile.avatar);

  const stats = [
    { label: t('completedLessons'), value: 24, icon: BookOpen, color: 'text-blue-500' },
    { label: t('knownWords'), value: 156, icon: CheckCircle, color: 'text-green-500' },
    { label: t('unknownWords'), value: 32, icon: XCircle, color: 'text-red-500' },
  ];

  const handleSave = () => {
    updateProfile({ name: editName, avatar: editAvatar });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(userProfile.name);
    setEditAvatar(userProfile.avatar);
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center pt-4 md:pt-8 pb-4 relative w-full">
        <div className="flex justify-end w-full gap-2 mb-4">
          <button
            onClick={() => setLanguage(language === 'en' ? 'uz' : 'en')}
            className="p-2 rounded-full bg-surface border border-theme hover:bg-elevated transition-colors flex items-center gap-1 text-sm font-medium"
            title="Change Language"
          >
            <Globe className="w-4 h-4 md:w-5 md:h-5" />
            <span className="uppercase text-xs md:text-sm">{language}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-surface border border-theme hover:bg-elevated transition-colors"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4 md:w-5 md:h-5" /> : <Sun className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
        </div>

        <div className="relative mb-4 group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-surface shadow-xl">
            <img 
              src={isEditing ? editAvatar : userProfile.avatar} 
              alt="Profile" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="w-full max-w-sm space-y-4 mt-4 bg-surface p-6 rounded-2xl border border-theme shadow-sm">
            <h3 className="font-bold text-main text-lg mb-4">{t('editProfile')}</h3>
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-muted">{t('name')}</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-elevated border border-theme rounded-lg px-4 py-2 text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium text-muted">{t('avatarUrl')}</label>
              <input
                type="text"
                value={editAvatar}
                onChange={(e) => setEditAvatar(e.target.value)}
                className="w-full bg-elevated border border-theme rounded-lg px-4 py-2 text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button 
                onClick={handleCancel}
                className="px-4 py-2 text-muted hover:bg-elevated rounded-lg transition-colors font-medium"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                {t('save')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-main mb-1">{userProfile.name}</h1>
            <p className="text-muted font-medium flex items-center gap-1 justify-center">
              <Award className="w-4 h-4 text-yellow-500" />
              Intermediate Level
            </p>
          </>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 border-y border-theme py-4 md:py-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="flex flex-col items-center text-center space-y-1 p-1">
              <Icon className={cn("w-5 h-5 md:w-6 md:h-6 mb-1", stat.color)} />
              <span className="text-xl md:text-2xl font-bold text-main">{stat.value}</span>
              <span className="text-[10px] md:text-xs text-muted font-medium uppercase tracking-wider break-words w-full leading-tight">{stat.label}</span>
            </div>
          );
        })}
      </div>

      {/* Content Tabs */}
      <div className="w-full">
        <div className="flex justify-start md:justify-center border-b border-theme mb-6 overflow-x-auto no-scrollbar w-full">
          <button 
            onClick={() => setActiveTab('lessons')}
            className={cn(
              "px-4 md:px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
              activeTab === 'lessons' ? "border-primary text-primary" : "border-transparent text-muted hover:text-main"
            )}
          >
            {t('completedLessons')}
          </button>
          <button 
            onClick={() => setActiveTab('known')}
            className={cn(
              "px-4 md:px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
              activeTab === 'known' ? "border-primary text-primary" : "border-transparent text-muted hover:text-main"
            )}
          >
            {t('knownWords')}
          </button>
          <button 
            onClick={() => setActiveTab('unknown')}
            className={cn(
              "px-4 md:px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap",
              activeTab === 'unknown' ? "border-primary text-primary" : "border-transparent text-muted hover:text-main"
            )}
          >
            {t('unknownWords')}
          </button>
        </div>

        {/* Grid Content */}
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {activeTab === 'lessons' && Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-elevated rounded-lg md:rounded-xl overflow-hidden relative group cursor-pointer">
              <img 
                src={`https://picsum.photos/seed/lesson${i}/300/300`} 
                alt="Lesson" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-bold text-sm md:text-base">Grammar L{i+1}</span>
              </div>
            </div>
          ))}

          {activeTab === 'known' && Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-surface border border-theme rounded-lg md:rounded-xl flex items-center justify-center p-2 text-center hover:border-green-500/50 transition-colors cursor-pointer">
              <span className="font-bold text-main text-sm md:text-lg">Word {i+1}</span>
            </div>
          ))}

          {activeTab === 'unknown' && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-surface border border-theme rounded-lg md:rounded-xl flex items-center justify-center p-2 text-center hover:border-red-500/50 transition-colors cursor-pointer">
              <span className="font-bold text-main text-sm md:text-lg">Hard {i+1}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
