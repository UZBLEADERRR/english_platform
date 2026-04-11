import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import api from '../api';
import { BookOpen, X, Eye, ExternalLink } from 'lucide-react';

export default function Library() {
  const navigate = useNavigate();
  const { setIsNavbarHidden } = useAppStore();
  const [books, setBooks] = useState<any[]>([]);
  const [viewingBook, setViewingBook] = useState<any>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setIsNavbarHidden(true);
    return () => setIsNavbarHidden(false);
  }, [setIsNavbarHidden]);

  useEffect(() => {
    api.get('/api/library').then(setBooks).catch(() => {
      setBooks([
        { id: '1', title: 'English Grammar in Use', author: 'Raymond Murphy', cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop', pdf_url: '' },
        { id: '2', title: 'Essential Vocabulary', author: 'Various Authors', cover_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop', pdf_url: '' },
      ]);
    });
  }, []);

  useEffect(() => {
    if (viewingBook) setIframeLoaded(false);
  }, [viewingBook]);

  const openExternal = (url: string) => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.openLink) {
      tg.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="page-enter max-w-2xl mx-auto -mx-4 md:mx-auto pb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-0 border-y border-theme bg-surface overflow-hidden md:rounded-3xl md:border md:gap-4 md:bg-transparent md:p-4">
        {books.map(book => (
          <div key={book.id} className="group relative bg-surface md:rounded-2xl overflow-hidden border-r border-b border-theme md:border md:shadow-md hover:shadow-2xl transition-all duration-300 md:hover:-translate-y-1 pb-3">
             <div className="aspect-[3/4] relative overflow-hidden bg-elevated w-full">
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 ring-1 ring-inset ring-black/10 pointer-events-none" />
            </div>
            
            <div className="px-3 pt-3 flex flex-col items-center justify-center text-center">
              <p className="font-extrabold text-main text-sm line-clamp-1">{book.title}</p>
              <p className="text-muted text-[11px] font-medium mt-0.5">{book.author}</p>
            </div>
            
            {book.pdf_url && (
              <div className="mt-3 px-3">
                <button 
                  onClick={() => setViewingBook(book)} 
                  className="w-full py-2 bg-primary/10 text-primary text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-all active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" /> O'qish
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {books.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted mb-3" />
          <p className="text-muted">Hozircha materiallar yo'q</p>
        </div>
      )}

      {/* In-app PDF/URL viewer */}
      {viewingBook && createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto bg-bg">
          <div className="h-16 bg-surface/95 backdrop-blur-xl border-b border-theme flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-main text-sm truncate">{viewingBook.title}</h2>
                <p className="text-[10px] text-muted truncate">{viewingBook.author}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => openExternal(viewingBook.pdf_url)} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Brauzer
              </button>
              <button onClick={() => setViewingBook(null)} className="p-2 text-muted hover:text-main transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden bg-bg relative">
            {!iframeLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-bg">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-main font-bold">Yuklanmoqda...</p>
                <p className="text-muted text-xs mt-2 max-w-[240px]">Agar PDF ochilmasa, yuqoridagi 'Brauzer' tugmasini bosing.</p>
              </div>
            )}
            
            <iframe 
              src={viewingBook.pdf_url} 
              className={`w-full h-full border-none relative z-10 transition-opacity duration-300 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
              title={viewingBook.title}
              onLoad={() => setIframeLoaded(true)}
            />

            {/* Hidden fallback content that becomes visible if iframe is transparent/blocks */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center -z-10">
               <div className="w-20 h-20 bg-elevated rounded-3xl flex items-center justify-center mb-6 shadow-xl">
                 <BookOpen className="w-10 h-10 text-muted" />
               </div>
               <h3 className="text-xl font-bold text-main mb-2">PDF ochilmadi?</h3>
               <p className="text-muted text-sm mb-8 max-w-[280px]">Ba'zi telefonlarda PDF ilova ichida ko'rinmasligi mumkin. Iltimos, tashqi brauzerda oching.</p>
               <button 
                 onClick={() => openExternal(viewingBook.pdf_url)}
                 className="w-full max-w-[240px] py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <ExternalLink className="w-5 h-5" /> Brauzerda ochish
               </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
