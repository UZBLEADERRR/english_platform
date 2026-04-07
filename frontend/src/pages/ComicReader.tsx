import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft } from 'lucide-react';

export default function ComicReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comic, setComic] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    api.getComic(id).then(setComic).catch(() => {
      setComic({
        id, title: 'Sample Comic', cover_url: 'https://picsum.photos/seed/comiccover/600/800',
        description: 'A fun comic to learn English',
        pages: Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, image_url: `https://picsum.photos/seed/page${i}/600/900`, page_number: i + 1 })),
      });
    });
  }, [id]);

  if (!comic) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const [showReader, setShowReader] = useState(false);

  return (
    <div className="animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 p-2 mb-4 rounded-full hover:bg-elevated text-main">
        <ArrowLeft className="w-5 h-5" /><span className="font-medium">Orqaga</span>
      </button>

      {!showReader ? (
        <div className="max-w-md mx-auto space-y-4">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-xl">
            <img src={comic.cover_url} alt={comic.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-xl font-bold text-main">{comic.title}</h1>
          <p className="text-muted">{comic.description}</p>
          <button onClick={() => setShowReader(true)} className="w-full py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
            📖 O'qishni boshlash
          </button>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          <div className="space-y-0">
            {comic.pages?.map((page: any) => (
              <img key={page.id} src={page.image_url} alt={`Page ${page.page_number}`}
                className="w-full block" style={{ marginTop: '-1px' }} referrerPolicy="no-referrer" />
            ))}
          </div>
          <div className="text-center py-8">
            <p className="text-muted font-medium">— Tugadi —</p>
          </div>
        </div>
      )}
    </div>
  );
}
