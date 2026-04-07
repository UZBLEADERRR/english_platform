import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import api from '../api';
import { ArrowLeft, Play, Lock } from 'lucide-react';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [movie, setMovie] = useState<any>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getMovie(id).then(setMovie).catch(() => {
      setMovie({ id, title: 'Sample Movie', description: 'A great movie for learning English', poster_url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&h=1200&fit=crop', is_locked: true, is_18plus: false });
    });
  }, [id]);

  if (!movie) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const canWatch = !movie.is_locked || user?.subscription === 'premium' || user?.subscription === 'ultra';

  return (
    <div className="min-h-screen animate-in fade-in duration-500">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 p-2 mb-4 rounded-full hover:bg-elevated text-main">
        <ArrowLeft className="w-5 h-5" /><span className="font-medium">Orqaga</span>
      </button>

      <div className="max-w-2xl mx-auto space-y-4">
        {showPlayer && canWatch ? (
          <div className="aspect-video rounded-2xl overflow-hidden bg-black shadow-xl">
            <iframe src={movie.video_url} className="w-full h-full border-none" allowFullScreen allow="autoplay; fullscreen" />
          </div>
        ) : (
          <div className="relative aspect-[2/3] max-h-[400px] rounded-2xl overflow-hidden shadow-xl mx-auto">
            <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            {movie.is_18plus && <span className="absolute top-4 left-4 px-3 py-1 bg-red-500 rounded-lg text-sm font-bold text-white">18+</span>}
          </div>
        )}

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-main">{movie.title}</h1>
          <p className="text-muted leading-relaxed">{movie.description}</p>

          {canWatch ? (
            <button onClick={() => setShowPlayer(true)} className="w-full py-3.5 bg-gradient-to-r from-primary to-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-all">
              <Play className="w-5 h-5" /> Ko'rish
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
                <Lock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="font-bold text-main">Premium kontent</p>
                <p className="text-sm text-muted mt-1">Bu kinoni ko'rish uchun Premium yoki Ultra sotib oling</p>
              </div>
              <button onClick={() => navigate('/pricing')} className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                Premium sotib olish ✨
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
