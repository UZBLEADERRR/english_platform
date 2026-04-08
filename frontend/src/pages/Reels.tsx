import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
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

  const parseWord = (wordStr: string) => {
    const parts = (wordStr || '').split('||');
    return { mainWord: parts[0] || '', translation: parts[1] || '', example: parts[2] || '' };
  };

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
      {/* Category selector — show even for 1 category */}
      {categories.length > 0 && (
        <div className="absolute top-4 left-4 right-16 z-20 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCat === cat.id ? 'bg-white text-black' : 'bg-white/20 text-white border border-white/20'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-white/60">Yuklanmoqda...</p>
        </div>
      ) : words.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center text-white p-4">
          <span className="text-5xl mb-4">📭</span>
          <h2 className="text-xl font-bold mb-2">So'zlar topilmadi</h2>
          <p className="text-white/60 text-sm">Admin so'z qo'shishi kerak</p>
        </div>
      ) : currentIndex >= words.length ? (
        <div className="flex flex-col items-center justify-center text-center text-white p-4">
          <span className="text-5xl mb-4">🎉</span>
          <h2 className="text-2xl font-bold mb-4">Barcha so'zlar tugadi!</h2>
          <button onClick={() => { setCurrentIndex(0); setHistory([]); }}
            className="px-6 py-3 bg-primary text-white rounded-full font-medium">Qaytadan</button>
        </div>
      ) : (
        <div className="relative w-full max-w-md h-full flex flex-col overflow-hidden z-10">
          {/* Current card */}
          <div className="absolute inset-0 w-full h-full page-enter" key={currentIndex}>
            {words[currentIndex]?.image_url?.match(/\.(mp4|webm|m3u8)/i) ? (
              <video 
                src={words[currentIndex]?.image_url} 
                className="absolute inset-0 w-full h-full object-cover" 
                autoPlay={true}
                loop={true}
                muted={false}
                playsInline={true}
              />
            ) : (
              <img 
                src={words[currentIndex]?.image_url} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
                crossOrigin="anonymous"
                onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80')} 
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
            
            {(() => {
              const { mainWord, translation, example } = parseWord(words[currentIndex]?.word);
              return (
                <div className="absolute top-20 left-4 right-4 flex flex-col items-center text-center">
                  <div className="px-6 py-4 bg-black/30 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl w-full">
                    <h2 className="text-4xl font-extrabold text-white drop-shadow-lg mb-2">{mainWord}</h2>
                    {translation && <p className="text-xl font-medium text-green-400 mb-3">{translation}</p>}
                    {example && <p className="text-[15px] font-medium text-white/90 italic leading-relaxed">"{example}"</p>}
                  </div>
                </div>
              );
            })()}
            
            {selectedCat && categories.find(c => c.id === selectedCat) && (
              <div className="absolute bottom-6 left-0 w-full text-center pointer-events-none">
                <span className="text-xs font-semibold px-3 py-1 bg-black/50 text-white/70 rounded-full select-none">
                  {categories.find(c => c.id === selectedCat)?.name}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="absolute right-3 bottom-20 flex flex-col gap-5 items-center z-10">
            <button onClick={() => handleAction(true)} className="flex flex-col items-center gap-1 group">
              <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white group-hover:bg-green-500/50 transition-colors">
                <Heart className="w-6 h-6" />
              </div>
              <span className="text-white text-[10px] font-medium">{t('iknow')}</span>
            </button>
            <button onClick={() => handleAction(false)} className="flex flex-col items-center gap-1 group">
              <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white group-hover:bg-red-500/50 transition-colors">
                <X className="w-6 h-6" />
              </div>
              <span className="text-white text-[10px] font-medium">{t('idontknow')}</span>
            </button>
            <button onClick={handleUndo} disabled={history.length === 0} className="flex flex-col items-center gap-1 group disabled:opacity-30">
              <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white group-hover:bg-blue-500/50 transition-colors">
                <Undo2 className="w-6 h-6" />
              </div>
              <span className="text-white text-[10px] font-medium">{t('undo')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
