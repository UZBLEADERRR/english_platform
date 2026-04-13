import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { parseWord } from '../utils';
import { Heart, X, Undo2 } from 'lucide-react';

export default function Reels() {
  const t = useTranslation();
  const { user } = useAppStore();
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReelCategories().then(cats => {
      setCategories(cats);
      if (cats.length > 0) { setSelectedCat(cats[0].id); }
      else { setLoading(false); }
    }).catch(() => {
      setLoading(false);
      setWords(Array.from({ length: 6 }, (_, i) => ({
        id: `w${i}`, image_url: `https://picsum.photos/seed/word${i}/800/1200`, word: `Word ${i + 1}`
      })));
    });
  }, []);

  useEffect(() => {
    if (!selectedCat) return;
    setLoading(true);
    api.getReelWords(selectedCat).then(w => { 
      setWords(w || []); 
      setCurrentIndex(0);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, [selectedCat]);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      if (selectedCat) {
        tg.BackButton.show();
        const handleBack = () => setSelectedCat('');
        tg.onEvent('backButtonClicked', handleBack);
        return () => {
          tg.offEvent('backButtonClicked', handleBack);
          tg.BackButton.hide();
        };
      } else {
        tg.BackButton.hide();
      }
    }
  }, [selectedCat]);

  const handleAction = async (isKnown: boolean) => {
    const current = words[currentIndex];
    if (!current) return;
    setHistory(p => [...p, { word: current, index: currentIndex }]);
    
    if (user) {
      api.markWord(user.id, current.id, isKnown).catch(() => {});
    }

    if (!isKnown) {
      setWords(p => [...p, current]);
    }
    setCurrentIndex(p => p + 1);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setHistory(p => p.slice(0, -1));
    setCurrentIndex(p => p - 1);
  };

  return (
    <div className="absolute inset-0 pt-[60px] bg-black flex flex-col overflow-hidden">
      {/* Category selector — show only if no category selected */}
      {!selectedCat && categories.length > 0 && (
        <div className="p-4 space-y-4 overflow-y-auto">
          <h1 className="text-2xl font-bold text-white mb-4">Kategoriyalar</h1>
          <div className="grid grid-cols-1 gap-3">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-theme hover:border-primary/50 transition-all text-left group">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-elevated">
                  <img src={cat.icon_url} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1">
                  <h3 className="text-main font-bold">{cat.name}</h3>
                  <p className="text-xs text-muted">{cat.description || 'So\'zlarni yodlash'}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedCat && (
        <>
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white">
              <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-sm text-white/60">Yuklanmoqda...</p>
            </div>
          ) : words.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-white p-4">
              <span className="text-5xl mb-4">📭</span>
              <h2 className="text-xl font-bold mb-2">So'zlar topilmadi</h2>
              <button onClick={() => setSelectedCat('')} className="mt-4 text-primary font-medium">Orqaga qaytish</button>
            </div>
          ) : currentIndex >= words.length ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-white p-4">
              <span className="text-5xl mb-4">🎉</span>
              <h2 className="text-2xl font-bold mb-4">Barcha so'zlar tugadi!</h2>
              <div className="flex gap-3">
                <button onClick={() => { setCurrentIndex(0); setHistory([]); }}
                  className="px-6 py-3 bg-primary text-white rounded-full font-medium">Qaytadan</button>
                <button onClick={() => setSelectedCat('')}
                  className="px-6 py-3 bg-surface border border-theme text-white rounded-full font-medium">Boshqa bo'lim</button>
              </div>
            </div>
          ) : (
            <div className="flex-1 relative flex flex-col overflow-hidden z-10 w-full h-full bg-black">
              {/* Current card */}
              <div className="flex-1 flex flex-col bg-black animate-in slide-in-from-right duration-300" key={currentIndex}>
                {(() => {
                  const { mainWord, translation, example, example_translation } = parseWord(words[currentIndex]?.word);
                  return (
                    <>
                      {/* Top Section - Word & Translation */}
                      <div className="p-6 text-center space-y-2 bg-gradient-to-b from-black to-transparent">
                        <h2 className="text-4xl font-black text-white tracking-tight drop-shadow-md">{mainWord}</h2>
                        {translation && <p className="text-xl font-bold text-green-400 uppercase tracking-wider">{translation}</p>}
                      </div>

                      {/* Middle Section - Square Media */}
                      <div className="relative w-full aspect-square bg-elevated overflow-hidden border-y border-white/5">
                        {words[currentIndex]?.image_url?.match(/\.(mp4|webm|m3u8)/i) ? (
                          <video src={words[currentIndex]?.image_url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                        ) : (
                          <img 
                            src={words[currentIndex]?.image_url} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                            crossOrigin="anonymous"
                            onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80')} 
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      </div>

                      {/* Bottom Section - Example */}
                      <div className="flex-1 p-6 flex flex-col justify-center bg-gradient-to-t from-black to-transparent">
                        <div className="max-w-md mx-auto w-full space-y-4">
                          {example && (
                            <div className="bg-white/5 backdrop-blur-md p-5 rounded-3xl border border-white/10 shadow-2xl">
                              <p className="text-lg font-medium text-white italic leading-relaxed text-center">"{example}"</p>
                              {example_translation && (
                                <p className="text-sm text-green-300/80 mt-3 font-semibold text-center border-t border-white/5 pt-3">
                                  {example_translation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Floating Actions */}
                <div className="absolute right-4 bottom-8 flex flex-col gap-5 items-center z-20">
                  <button onClick={() => handleAction(true)} className="group flex flex-col items-center gap-1">
                    <div className="p-4 rounded-full bg-green-500/20 backdrop-blur-xl border border-green-500/30 text-green-400 group-hover:bg-green-500 group-hover:text-white transition-all shadow-lg active:scale-90">
                      <Heart className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter">{t('iknow')}</span>
                  </button>
                  <button onClick={() => handleAction(false)} className="group flex flex-col items-center gap-1">
                    <div className="p-4 rounded-full bg-red-500/20 backdrop-blur-xl border border-red-500/30 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all shadow-lg active:scale-90">
                      <X className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-black text-white/50 uppercase tracking-tighter">{t('idontknow')}</span>
                  </button>
                  <button onClick={handleUndo} disabled={history.length === 0} className="group flex flex-col items-center gap-1 disabled:opacity-20">
                    <div className="p-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white group-hover:bg-white group-hover:text-black transition-all shadow-lg active:scale-90">
                      <Undo2 className="w-7 h-7" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
