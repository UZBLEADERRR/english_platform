import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { Volume2, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

export default function VocabularyView() {
  const { topicId } = useParams<{ topicId: string }>();
  const [words, setWords] = useState<any[]>([]);
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    api.get(`/api/vocabulary/words/${topicId}`).then(data => {
      setWords(data || []);
      setLoading(false);
    }).catch(() => {
      setWords([]);
      setLoading(false);
    });
  }, [topicId]);

  useEffect(() => {
    // Initial fetch of voices resolves empty voice list in Safari/WebView
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const speak = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const engVoice = voices.find(v => v.lang.includes('en-US') && (v.name.includes('Samantha') || v.name.includes('Google'))) 
            || voices.find(v => v.lang.includes('en-US'))
            || voices.find(v => v.lang.includes('en'));
          if (engVoice) utterance.voice = engVoice;
        }
        
        // Timeout helps mobile browsers execute it seamlessly
        setTimeout(() => window.speechSynthesis.speak(utterance), 50);
      } else {
        alert("Ovozli funksiya qurilmangizda qo'llab-quvvatlanmaydi.");
      }
    } catch (e: any) {
      alert("Ovozda xatolik: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-8">
      {/* Banner */}
      <div className="relative w-full h-48 md:h-64 rounded-b-[2rem] overflow-hidden mb-6 shadow-xl">
        <img src="https://images.unsplash.com/photo-1546410531-dd4cbcecbbe1?w=800&h=400&fit=crop" alt="Vocabulary" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <span className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-primary/30">Vocabulary</span>
          <h1 className="text-3xl font-extrabold text-main mt-2">Yangi So'zlar</h1>
        </div>
      </div>

      <div className="space-y-[1px] md:space-y-3 max-w-2xl mx-auto w-full">
      {words.length === 0 ? (
        <div className="text-center py-12 bg-surface md:rounded-3xl md:border border-theme mx-0 md:mx-0">
          <BookOpen className="w-12 h-12 mx-auto text-muted mb-3" />
          <p className="text-muted">Hozircha so'zlar yo'q</p>
        </div>
      ) : (
        words.map(w => (
          <div 
            key={w.id} 
            className="bg-surface border-b md:border border-theme md:rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg w-full"
          >
            {/* Main word row */}
            <div 
              className="flex items-center gap-4 p-5 cursor-pointer"
              onClick={() => setExpandedWord(expandedWord === w.id ? null : w.id)}
            >
              {/* TTS Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); speak(w.english); }}
                className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 border border-primary/30 flex items-center justify-center shrink-0 hover:from-primary/30 hover:to-blue-500/30 transition-all active:scale-95"
              >
                <Volume2 className="w-5 h-5 text-primary" />
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-main text-xl tracking-tight">{w.english}</p>
                <p className="text-primary text-sm font-medium mt-0.5">{w.uzbek}</p>
              </div>

              <div className="text-muted p-2 rounded-full hover:bg-elevated transition-colors">
                {expandedWord === w.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
              </div>
            </div>

            {/* Expanded details */}
            {expandedWord === w.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-theme pt-3 animate-in slide-in-from-top-2 duration-200">
                {/* Example */}
                {w.example && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg">📝</span>
                    <div>
                      <p className="text-xs text-muted font-medium uppercase tracking-wider mb-0.5">Misol</p>
                      <p className="text-main text-sm italic">"{w.example}"</p>
                      <button 
                        onClick={() => speak(w.example)} 
                        className="mt-1 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" /> Tinglash
                      </button>
                    </div>
                  </div>
                )}

                {/* Synonyms */}
                {w.synonyms?.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg">✅</span>
                    <div>
                      <p className="text-xs text-muted font-medium uppercase tracking-wider mb-1">Sinonimlari</p>
                      <div className="flex flex-wrap gap-1.5">
                        {w.synonyms.map((s: string, i: number) => (
                          <button key={i} onClick={() => speak(s)} 
                            className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-full hover:bg-green-500/20 transition-colors flex items-center gap-1">
                            {s} <Volume2 className="w-2.5 h-2.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Antonyms */}
                {w.antonyms?.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🔄</span>
                    <div>
                      <p className="text-xs text-muted font-medium uppercase tracking-wider mb-1">Antonimlari</p>
                      <div className="flex flex-wrap gap-1.5">
                        {w.antonyms.map((a: string, i: number) => (
                          <button key={i} onClick={() => speak(a)} 
                            className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs rounded-full hover:bg-orange-500/20 transition-colors flex items-center gap-1">
                            {a} <Volume2 className="w-2.5 h-2.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}
      </div>
    </div>
  );
}
