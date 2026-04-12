import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { Edit2, Moon, Sun, Globe, Crown, CheckCircle, XCircle, ArrowLeft, Heart, X } from 'lucide-react';
import { cn, parseWord } from '../utils';

const WordDetailOverlay = ({ item, onClose, onToggle }: { item: any, onClose: () => void, onToggle: (id: string, current: boolean) => void }) => {
  const wordData = item.reel_words;
  const { mainWord, translation, example, example_translation } = parseWord(wordData.word);
  
  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-in fade-in duration-300">
      <div className="absolute top-4 left-4 z-50">
        <button onClick={onClose} className="p-3 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col h-full">
        {/* Top Text Section */}
        <div className="pt-20 px-6 pb-6 bg-gradient-to-b from-black via-black/90 to-black/80 border-b border-white/10">
          <div className="max-w-sm mx-auto flex flex-col items-center text-center">
            <h2 className="text-3xl font-extrabold text-white mb-1 tracking-tight">{mainWord}</h2>
            {translation && <p className="text-xl font-medium text-green-400 mb-4">{translation}</p>}
            {example && (
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-full">
                <p className="text-[14px] font-medium text-white/90 italic leading-relaxed">"{example}"</p>
                {example_translation && <p className="text-[13px] text-green-300/80 mt-2 font-medium">{example_translation}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Image Section */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          {wordData.image_url?.match(/\.(mp4|webm|m3u8)/i) ? (
            <video src={wordData.image_url} className="w-full h-full object-contain" autoPlay loop muted playsInline />
          ) : (
            <img src={wordData.image_url} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" crossOrigin="anonymous" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-8 z-50">
        <button 
          onClick={() => onToggle(wordData.id, item.is_known)}
          className={cn(
            "flex flex-col items-center gap-2 group p-4 rounded-3xl transition-all duration-300 active:scale-95",
            item.is_known ? "bg-red-500/10 border border-red-500/20" : "bg-green-500/10 border border-green-500/20"
          )}
        >
          <div className={cn("w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform", item.is_known ? "bg-red-500 text-white" : "bg-green-500 text-white")}>
            {item.is_known ? <X className="w-8 h-8" /> : <Heart className="w-8 h-8" />}
          </div>
          <span className="text-white text-[10px] font-bold uppercase tracking-widest drop-shadow-md">
            {item.is_known ? "Tanish emas" : "Yodlangan"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default function Profile() {
  const t = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser, theme, toggleTheme, language, setLanguage } = useAppStore();
  const [activeTab, setActiveTab] = useState<'known' | 'unknown'>('known');
  const [knownWords, setKnownWords] = useState<any[]>([]);
  const [unknownWords, setUnknownWords] = useState<any[]>([]);
  const [selectedWord, setSelectedWord] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    api.getUserWords(user.id).then(({ known, unknown }) => {
      setKnownWords(known); setUnknownWords(unknown);
    }).catch(() => {});
  }, [user]);

  const handleToggleWordStatus = async (wordId: string, currentIsKnown: boolean) => {
    if (!user) return;
    try {
      const newStatus = !currentIsKnown;
      await api.markWord(user.id, wordId, newStatus);
      
      // Update local lists
      if (currentIsKnown) {
        const item = knownWords.find(w => w.reel_words.id === wordId);
        if (item) {
          setKnownWords(p => p.filter(w => w.reel_words.id !== wordId));
          setUnknownWords(p => [...p, { ...item, is_known: false }]);
          if (selectedWord) setSelectedWord({ ...item, is_known: false });
        }
      } else {
        const item = unknownWords.find(w => w.reel_words.id === wordId);
        if (item) {
          setUnknownWords(p => p.filter(w => w.reel_words.id !== wordId));
          setKnownWords(p => [...p, { ...item, is_known: true }]);
          if (selectedWord) setSelectedWord({ ...item, is_known: true });
        }
      }
    } catch (e) {
      console.error('Toggle error', e);
    }
  };

  const subColors: Record<string, string> = {
    free: 'text-muted', premium: 'text-yellow-500', ultra: 'text-purple-500',
  };
  const subLabels: Record<string, string> = {
    free: 'Free', premium: '⭐ Premium', ultra: '💎 Ultra',
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-500 p-4 pb-20">
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
        <button onClick={() => navigate('/pricing')} className="w-full py-4 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white font-extrabold rounded-2xl hover:shadow-xl transition-all text-sm shadow-lg shadow-orange-500/20 active:scale-[0.98]">
          ✨ PREMIUMGA O'TING
        </button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-theme rounded-2xl p-4 text-center">
          <CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-500" />
          <span className="text-2xl font-bold text-main">{knownWords.length}</span>
          <p className="text-xs text-muted mt-1">{t('knownWords')}</p>
        </div>
        <div className="bg-surface border border-theme rounded-2xl p-4 text-center">
          <XCircle className="w-6 h-6 mx-auto mb-1 text-red-500" />
          <span className="text-2xl font-bold text-main">{unknownWords.length}</span>
          <p className="text-xs text-muted mt-1">{t('unknownWords')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-theme flex">
        <button onClick={() => setActiveTab('known')} className={cn("px-6 py-3 text-sm font-bold border-b-2 transition-all", activeTab === 'known' ? "border-primary text-primary" : "border-transparent text-muted")}>
          {t('knownWords')}
        </button>
        <button onClick={() => setActiveTab('unknown')} className={cn("px-6 py-3 text-sm font-bold border-b-2 transition-all", activeTab === 'unknown' ? "border-primary text-primary" : "border-transparent text-muted")}>
          {t('unknownWords')}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(activeTab === 'known' ? knownWords : unknownWords).map((item: any) => {
          const { mainWord } = parseWord(item.reel_words?.word);
          return (
            <button 
              key={item.id} 
              onClick={() => setSelectedWord(item)}
              className={cn("relative aspect-square rounded-2xl overflow-hidden border bg-surface group active:scale-95 transition-all", activeTab === 'known' ? "border-green-500/10" : "border-red-500/10")}
            >
              {item.reel_words?.image_url ? (
                <>
                  <img src={item.reel_words.image_url} alt="" className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-center">
                    <span className="text-[10px] font-bold text-white drop-shadow-md truncate block uppercase tracking-tight">{mainWord}</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-main p-2 text-center uppercase">
                  {mainWord}
                </div>
              )}
            </button>
          );
        })}
        {(activeTab === 'known' ? knownWords : unknownWords).length === 0 && (
          <div className="col-span-3 text-center py-12 bg-surface/50 rounded-3xl border border-dashed border-theme text-muted text-sm italic">
            Hali so'zlar belgilanmadi
          </div>
        )}
      </div>

      <div className="pt-6">
        <button 
          onClick={() => {
            localStorage.clear();
            window.location.href = '/';
          }}
          className="w-full py-4 bg-red-500/5 text-red-500 font-bold rounded-2xl hover:bg-red-500/10 transition-all text-sm border border-red-500/10 active:scale-95"
        >
          Tizimdan chiqish
        </button>
      </div>

      {/* Full-screen Word Detail Viewer */}
      {selectedWord && (
        <WordDetailOverlay 
          item={selectedWord} 
          onClose={() => setSelectedWord(null)} 
          onToggle={handleToggleWordStatus}
        />
      )}
    </div>
  );
}

