import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, BookOpen, Download, ExternalLink } from 'lucide-react';

export default function Library() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/library').then(setBooks).catch(() => {
      setBooks([
        { id: '1', title: 'English Grammar in Use', author: 'Raymond Murphy', cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=400&fit=crop', pdf_url: '' },
        { id: '2', title: 'Essential Vocabulary', author: 'Various Authors', cover_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=400&fit=crop', pdf_url: '' },
      ]);
    });
  }, []);

  const openPdf = (url: string) => {
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 page-enter max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-elevated"><ArrowLeft className="w-5 h-5 text-main" /></button>
        <h1 className="text-xl font-bold text-main">📚 Library</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {books.map(book => (
          <div key={book.id} className="bg-surface border border-theme rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
            <div className="aspect-[3/4] relative overflow-hidden">
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
            <div className="p-3 space-y-2">
              <p className="font-bold text-main text-sm line-clamp-2">{book.title}</p>
              <p className="text-xs text-muted">{book.author}</p>
              {book.pdf_url && (
                <button onClick={() => openPdf(book.pdf_url)} className="w-full py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl flex items-center justify-center gap-1 hover:bg-primary/20 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Ochish
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {books.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted mb-3" />
          <p className="text-muted">Hozircha materiallar yo'q</p>
        </div>
      )}
    </div>
  );
}
