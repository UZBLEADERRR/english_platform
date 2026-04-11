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

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1;
      // Try to use a premium English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Samantha'))
        || voices.find(v => v.lang.startsWith('en-US'))
        || voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
      window.speechSynthesis.speak(utterance);
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
    <div className="space-y-3 animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto pb-8">
      {words.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted mb-3" />
          <p className="text-muted">Hozircha so'zlar yo'q</p>
        </div>
      ) : (
        words.map(w => (
          <div 
            key={w.id} 
            className="bg-surface border border-theme rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
          >
            {/* Main word row */}
            <div 
              className="flex items-center gap-3 p-4 cursor-pointer"
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
                <p className="font-bold text-main text-base">{w.english}</p>
                <p className="text-primary text-sm">{w.uzbek}</p>
              </div>

              <div className="text-muted">
                {expandedWord === w.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
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
  );
}
