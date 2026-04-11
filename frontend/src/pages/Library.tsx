import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { BookOpen, X, Eye } from 'lucide-react';

export default function Library() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<any[]>([]);
  const [viewingBook, setViewingBook] = useState<any>(null);

  useEffect(() => {
    api.get('/api/library').then(setBooks).catch(() => {
      setBooks([
        { id: '1', title: 'English Grammar in Use', author: 'Raymond Murphy', cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop', pdf_url: '' },
        { id: '2', title: 'Essential Vocabulary', author: 'Various Authors', cover_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop', pdf_url: '' },
      ]);
    });
  }, []);

  return (
    <div className="space-y-4 page-enter max-w-2xl mx-auto">

      <div className="grid grid-cols-2 gap-4">
        {books.map(book => (
          <div key={book.id} className="group relative bg-surface rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-theme hover:border-primary/30 hover:-translate-y-1">
            {/* Cover Image */}
            <div className="aspect-[3/4] relative overflow-hidden">
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Title overlay on image */}
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-bold text-white text-sm line-clamp-2 drop-shadow-lg">{book.title}</p>
                <p className="text-white/70 text-xs mt-0.5">{book.author}</p>
              </div>
            </div>
            
            {/* Action button */}
            {book.pdf_url && (
              <div className="p-3">
                <button 
                  onClick={() => setViewingBook(book)} 
                  className="w-full py-2.5 bg-gradient-to-r from-primary/20 to-blue-500/20 border border-primary/30 text-primary text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:from-primary/30 hover:to-blue-500/30 transition-all"
                >
                  <Eye className="w-4 h-4" /> Ochish
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
      {viewingBook && (
        <div className="fixed inset-0 z-[200] bg-bg flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <div className="h-14 bg-surface/95 backdrop-blur-xl border-b border-theme flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              <h2 className="font-bold text-main text-sm truncate">{viewingBook.title}</h2>
            </div>
            <button onClick={() => setViewingBook(null)} className="p-2 text-muted hover:text-main transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-white">
            <iframe 
              src={viewingBook.pdf_url} 
              className="w-full h-full border-none"
              title={viewingBook.title}
            />
          </div>
        </div>
      )}
    </div>
  );
}
