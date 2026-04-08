import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { Edit2, Moon, Sun, Globe, Crown, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../utils';

export default function Profile() {
  const t = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser, theme, toggleTheme, language, setLanguage } = useAppStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.first_name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar_url || '');
  const [activeTab, setActiveTab] = useState<'known' | 'unknown'>('known');
  const [knownWords, setKnownWords] = useState<any[]>([]);
  const [unknownWords, setUnknownWords] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    api.getUserWords(user.id).then(({ known, unknown }) => {
      setKnownWords(known); setUnknownWords(unknown);
    }).catch(() => {});
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      await api.updateProfile({ first_name: editName, avatar_url: editAvatar });
      updateUser({ first_name: editName, avatar_url: editAvatar });
      setIsEditing(false);
    } catch {}
  };

  const subColors: Record<string, string> = {
    free: 'text-muted', premium: 'text-yellow-500', ultra: 'text-purple-500',
  };
  const subLabels: Record<string, string> = {
    free: 'Free', premium: '⭐ Premium', ultra: '💎 Ultra',
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Settings Row */}
      <div className="flex justify-end gap-2">
        <button onClick={() => setLanguage(language === 'en' ? 'uz' : 'en')} className="p-2 rounded-full bg-surface border border-theme hover:bg-elevated flex items-center gap-1 text-sm">
          <Globe className="w-4 h-4" /><span className="uppercase text-xs">{language}</span>
        </button>
        <button onClick={toggleTheme} className="p-2 rounded-full bg-surface border border-theme hover:bg-elevated">
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface shadow-xl mx-auto">
            <img src={user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.telegram_id} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-main">{user?.first_name || user?.username || 'User'}</h1>
        <p className={cn("font-medium flex items-center justify-center gap-1 mt-1", subColors[user?.subscription || 'free'])}>
          <Crown className="w-4 h-4" /> {subLabels[user?.subscription || 'free']}
        </p>
      </div>

      {/* Upgrade button for free users */}
      {user?.subscription === 'free' && (
        <button onClick={() => navigate('/pricing')} className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all text-sm">
          ✨ Premium yoki Ultra sotib oling
        </button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-theme rounded-xl p-4 text-center">
          <CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-500" />
          <span className="text-2xl font-bold text-main">{knownWords.length}</span>
          <p className="text-xs text-muted mt-1">{t('knownWords')}</p>
        </div>
        <div className="bg-surface border border-theme rounded-xl p-4 text-center">
          <XCircle className="w-6 h-6 mx-auto mb-1 text-red-500" />
          <span className="text-2xl font-bold text-main">{unknownWords.length}</span>
          <p className="text-xs text-muted mt-1">{t('unknownWords')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-theme flex">
        <button onClick={() => setActiveTab('known')} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors", activeTab === 'known' ? "border-primary text-primary" : "border-transparent text-muted")}>
          {t('knownWords')}
        </button>
        <button onClick={() => setActiveTab('unknown')} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition-colors", activeTab === 'unknown' ? "border-primary text-primary" : "border-transparent text-muted")}>
          {t('unknownWords')}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(activeTab === 'known' ? knownWords : unknownWords).map((item: any) => (
          <div key={item.id} className={cn("aspect-square rounded-xl overflow-hidden border", activeTab === 'known' ? "border-green-500/30" : "border-red-500/30")}>
            {item.reel_words?.image_url ? (
              <img src={item.reel_words.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-elevated flex items-center justify-center text-sm font-bold text-main p-2 text-center">
                {item.reel_words?.word || 'Word'}
              </div>
            )}
          </div>
        ))}
        {(activeTab === 'known' ? knownWords : unknownWords).length === 0 && (
          <div className="col-span-3 text-center py-8 text-muted text-sm">Hali so'zlar yo'q</div>
        )}
      </div>
    </div>
  );
}
