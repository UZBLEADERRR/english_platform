import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { Volume2, Heart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const initialWords = [
  { id: 1, word: 'Ubiquitous', meaning: 'Present, appearing, or found everywhere.', example: 'His ubiquitous influence was felt by all the family.', image: 'https://picsum.photos/seed/ubiquitous/800/1200' },
  { id: 2, word: 'Ephemeral', meaning: 'Lasting for a very short time.', example: 'Fashions are ephemeral.', image: 'https://picsum.photos/seed/ephemeral/800/1200' },
  { id: 3, word: 'Sycophant', meaning: 'A person who acts obsequiously toward someone important in order to gain advantage.', example: 'A sycophant to the queen.', image: 'https://picsum.photos/seed/sycophant/800/1200' },
  { id: 4, word: 'Cacophony', meaning: 'A harsh, discordant mixture of sounds.', example: 'A cacophony of deafening alarm bells.', image: 'https://picsum.photos/seed/cacophony/800/1200' },
];

export default function Reels() {
  const t = useTranslation();
  const [words, setWords] = useState(initialWords);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const handleNext = (knowIt: boolean) => {
    setDirection(1); // Always slide up for next reel
    
    setTimeout(() => {
      if (!knowIt) {
        // Add to the end of the list to review later
        setWords(prev => [...prev, prev[currentIndex]]);
      }
      setCurrentIndex(prev => prev + 1);
    }, 200);
  };

  if (currentIndex >= words.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-center bg-black text-white p-4">
        <h2 className="text-2xl font-bold mb-4">You've completed all words for now!</h2>
        <button 
          onClick={() => {
            setWords(initialWords);
            setCurrentIndex(0);
          }}
          className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-colors"
        >
          Restart
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
      <div className="relative w-full max-w-md h-full bg-black flex flex-col overflow-hidden">
        
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image */}
            <img 
              src={currentWord.image} 
              alt={currentWord.word}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />

            {/* Content Area */}
            <div className="absolute bottom-0 left-0 right-16 p-4 pb-8 flex flex-col justify-end z-10">
              <div className="flex items-center gap-2 mb-4">
                <button className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-white/30 transition-colors">
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <h2 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">{currentWord.word}</h2>
              
              <div className="bg-black/40 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <p className="text-white/90 text-sm md:text-base font-medium mb-2 leading-snug">
                  {currentWord.meaning}
                </p>
                <p className="text-white/70 text-xs md:text-sm italic border-l-2 border-primary pl-2">
                  "{currentWord.example}"
                </p>
              </div>
            </div>

            {/* Right Side Actions (Instagram Style) */}
            <div className="absolute right-2 bottom-8 flex flex-col gap-6 items-center z-10">
              <button 
                onClick={() => handleNext(true)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-green-500/50 transition-colors">
                  <Heart className="w-6 h-6" />
                </div>
                <span className="text-white text-xs font-medium drop-shadow-md">{t('iknow')}</span>
              </button>

              <button 
                onClick={() => handleNext(false)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-red-500/50 transition-colors">
                  <X className="w-6 h-6" />
                </div>
                <span className="text-white text-xs font-medium drop-shadow-md">{t('idontknow')}</span>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
