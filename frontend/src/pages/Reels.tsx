import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { Heart, X, Undo2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Reels() {
  const t = useTranslation();
  const { user } = useAppStore();
  const [words, setWords] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('');

  useEffect(() => {
    api.getReelCategories().then(cats => {
      setCategories(cats);
      if (cats.length > 0) { setSelectedCat(cats[0].id); }
    }).catch(() => {
      const mockWords = Array.from({ length: 6 }, (_, i) => ({
        id: `w${i}`, image_url: `https://picsum.photos/seed/word${i}/800/1200`, word: `Word ${i + 1}`
      }));
      setWords(mockWords);
    });
  }, []);

  useEffect(() => {
    if (!selectedCat) return;
    api.getReelWords(selectedCat).then(w => { setWords(w); setCurrentIndex(0); }).catch(() => {});
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
    const last = history[history.length - 1];
    setHistory(p => p.slice(0, -1));
    setCurrentIndex(p => p - 1);
  };

  if (currentIndex >= words.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-center bg-black text-white p-4">
        <span className="text-5xl mb-4">🎉</span>
        <h2 className="text-2xl font-bold mb-4">Barcha so'zlar tugadi!</h2>
        <button onClick={() => { setCurrentIndex(0); setWords([]); setSelectedCat(categories[0]?.id || ''); }}
          className="px-6 py-3 bg-primary text-white rounded-full font-medium">Qaytadan</button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  if (!currentWord) return null;

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
      {/* Category selector */}
      {categories.length > 1 && (
        <div className="absolute top-4 left-4 right-16 z-20 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCat === cat.id ? 'bg-white text-black' : 'bg-white/20 text-white border border-white/20'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <div className="relative w-full max-w-md h-full bg-black flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={currentIndex}
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }} className="absolute inset-0 w-full h-full">
            <img src={currentWord.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
            {currentWord.word && (
              <div className="absolute bottom-0 left-0 right-16 p-4 pb-20">
                <h2 className="text-3xl font-extrabold text-white drop-shadow-lg">{currentWord.word}</h2>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

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
    </div>
  );
}
