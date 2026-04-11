import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { Search, ChevronLeft, ChevronRight, Lock, ArrowLeft } from 'lucide-react';
import { cn } from '../utils';

export default function Movies() {
  const t = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [carousel, setCarousel] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  useEffect(() => {
    api.getMovieCarousel().then(setCarousel).catch(() => {});
    api.getMovieCategories().then(setCategories).catch(() => {});
    api.getMovies().then(setMovies).catch(() => {
      setMovies([
        { id: '1', title: 'Frozen', poster_url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=450&fit=crop', is_locked: false, is_18plus: false },
        { id: '2', title: 'Spider-Man', poster_url: 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=300&h=450&fit=crop', is_locked: true, is_18plus: false },
      ]);
    });
  }, []);

  useEffect(() => {
    if (carousel.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide(p => (p + 1) % carousel.length), 4000);
    return () => clearInterval(timer);
  }, [carousel.length]);

  const filteredMovies = movies.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCat && m.category_id !== selectedCat) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('search')}
          className="w-full pl-10 pr-4 py-3 bg-elevated border border-theme rounded-xl text-main placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {/* Carousel */}
      {carousel.length > 0 && (
        <div className="relative h-40 rounded-2xl overflow-hidden">
          {carousel.map((img, i) => (
            <div key={img.id} className={`absolute inset-0 transition-opacity duration-700 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}>
              <img src={img.image_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>
      )}

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button onClick={() => setSelectedCat(null)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all", !selectedCat ? "bg-primary text-white" : "bg-elevated text-muted")}>
          {t('all')}
        </button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setSelectedCat(cat.id)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all", selectedCat === cat.id ? "bg-primary text-white" : "bg-elevated text-muted")}>
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filteredMovies.map(movie => {
          const isAgeRestricted = movie.is_18plus && user?.age && user.age < 18;
          return (
            <button key={movie.id} onClick={() => navigate(`/movie/${movie.id}`)} className="relative rounded-xl overflow-hidden group aspect-[2/3]">
              <img src={movie.poster_url} alt={movie.title} className={cn("w-full h-full object-cover group-hover:scale-105 transition-transform duration-500", isAgeRestricted && "blur-xl grayscale")} referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              {isAgeRestricted ? (
                <div className="absolute inset-0 flex flex-col justify-center items-center p-2 text-center text-red-500">
                  <Lock className="w-6 h-6 drop-shadow-md" />
                  <span className="text-[10px] font-bold mt-1 text-white uppercase drop-shadow-md leading-tight">YOSHDAN CHEKLOV</span>
                </div>
              ) : (
                <span className="absolute bottom-2 left-2 right-2 text-white text-xs font-bold line-clamp-2">{movie.title}</span>
              )}
              {movie.is_locked && !isAgeRestricted && (
                <div className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full"><Lock className="w-3 h-3 text-yellow-400" /></div>
              )}
              {movie.is_18plus && !isAgeRestricted && (
                <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500 rounded text-[10px] font-bold text-white">18+</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
