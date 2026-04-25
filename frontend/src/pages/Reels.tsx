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
    const handleBack = () => setSelectedCat('');
    const handlePopState = () => {
      if (selectedCat) {
        handleBack();
      }
    };

    if (tg) {
      if (selectedCat) {
        tg.BackButton.show();
        tg.onEvent('backButtonClicked', handleBack);
        // Trap the back button
        window.history.pushState({ section: 'reels_words' }, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
          tg.offEvent('backButtonClicked', handleBack);
          tg.BackButton.hide();
          window.removeEventListener('popstate', handlePopState);
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
          <h1 className="text-2xl font-black text-white mb-4 tracking-tight">Kategoriyalar</h1>
          <div className="grid grid-cols-1 gap-3">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                className="flex items-center gap-4 p-5 rounded-[2rem] bg-surface border border-theme hover:border-primary/50 transition-all text-left group active:scale-[0.98]">
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-elevated shadow-lg">
                  <img src={cat.icon_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                </div>
                <div className="flex-1">
                  <h3 className="text-main font-bold text-lg">{cat.name}</h3>
                  <p className="text-xs text-muted font-medium opacity-70">{cat.description || 'So\'zlarni yodlash'}</p>
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
              <h2 className="text-3xl font-black mb-6 tracking-tight">Barcha so'zlar tugadi!</h2>
              <div className="flex flex-col w-full gap-3 max-w-xs">
                <button onClick={() => { setCurrentIndex(0); setHistory([]); }}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">Qaytadan boshlash</button>
                <button onClick={() => setSelectedCat('')}
                  className="w-full py-4 bg-surface border border-theme text-white rounded-2xl font-bold active:scale-95 transition-all">Boshqa bo'limga o'tish</button>
              </div>
            </div>
          ) : (
            <div className="flex-1 relative flex flex-col overflow-hidden z-10 w-full h-full bg-black">
              {/* Current card */}
              <div className="flex-1 flex flex-col bg-black animate-in slide-in-from-right duration-500" key={currentIndex}>
                {(() => {
                  const { mainWord, translation, example, example_translation } = parseWord(words[currentIndex]?.word);
                  return (
                    <>
                      {/* Top Section - Word & Translation */}
                      <div className="p-6 text-center space-y-2 bg-gradient-to-b from-black via-black/80 to-transparent">
                        <h2 className="text-4xl sm:text-5xl font-black text-red-500 tracking-tighter drop-shadow-xl">{mainWord}</h2>
                        {translation && (
                          <p className="text-xl sm:text-2xl font-black text-green-500 uppercase tracking-widest drop-shadow-md">
                            {translation}
                          </p>
                        )}
                      </div>

                      {/* Middle Section - Square Media */}
                      <div className="relative w-[85%] mx-auto aspect-square bg-elevated overflow-hidden rounded-3xl border border-white/10 shadow-2xl mt-2 mb-4 shrink-0">
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
                      <div className="flex-1 px-4 pb-6 flex flex-col justify-center bg-gradient-to-t from-black via-black/40 to-transparent overflow-y-auto">
                        <div className="max-w-[80%] mr-auto ml-4 w-full space-y-3">
                          {example && (
                            <div className="bg-white/5 backdrop-blur-xl p-4 rounded-3xl border border-white/10 shadow-2xl">
                              <p className="text-[16px] sm:text-[17px] font-semibold text-white italic leading-snug">"{example}"</p>
                              {example_translation && (
                                <p className="text-[14px] sm:text-[15px] text-white/90 font-medium border-t border-white/10 mt-3 pt-3">
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
                <div className="absolute right-3 bottom-8 flex flex-col gap-4 items-center z-20">
                  <button onClick={() => handleAction(true)} className="group flex flex-col items-center gap-1 transition-all">
                    <div className="p-3.5 rounded-full bg-green-500/20 backdrop-blur-2xl border border-green-500/40 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] active:scale-90 transition-transform">
                      <Heart className="w-6 h-6 fill-current" />
                    </div>
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">{t('iknow')}</span>
                  </button>
                  <button onClick={() => handleAction(false)} className="group flex flex-col items-center gap-1 transition-all">
                    <div className="p-3.5 rounded-full bg-red-500/20 backdrop-blur-2xl border border-red-500/40 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] active:scale-90 transition-transform">
                      <X className="w-6 h-6 stroke-[3]" />
                    </div>
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider">{t('idontknow')}</span>
                  </button>
                  <button onClick={handleUndo} disabled={history.length === 0} className="group flex flex-col items-center gap-1 disabled:opacity-20 transition-all pt-1">
                    <div className="p-3 rounded-full bg-white/10 backdrop-blur-2xl border border-white/10 text-white active:scale-90 transition-transform shadow-lg">
                      <Undo2 className="w-5 h-5" />
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
