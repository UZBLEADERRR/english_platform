import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import api from '../api';
import { ChevronLeft, ChevronRight, BookOpen, GraduationCap, Popcorn, Wrench } from 'lucide-react';

const defaultCarousel = [
  { id: '1', image_url: 'https://my-icon-2004.b-cdn.net/tuqum.jpg', title: '', subtitle: '' }
];

const fallbackCategories = [
  { id: 'grammar', custom_name: 'Grammar', image_url: 'https://my-icon-2004.b-cdn.net/grammar_tx.jpg' },
  { id: 'vocabulary', custom_name: 'Vocabulary', image_url: 'https://my-icon-2004.b-cdn.net/vocabulary_tx.jpg' },
  { id: 'reading', custom_name: 'Reading', image_url: 'https://my-icon-2004.b-cdn.net/reading_tx.jpg' },
  { id: 'listening', custom_name: 'Listening', image_url: 'https://my-icon-2004.b-cdn.net/listening_tx.jpg' },
  { id: 'writing', custom_name: 'Writing', image_url: 'https://my-icon-2004.b-cdn.net/writing_tx.jpg' },
  { id: 'speaking', custom_name: 'Speaking', image_url: 'https://my-icon-2004.b-cdn.net/speaking_tx.jpg' },
  { id: 'movies', custom_name: 'Movies', image_url: 'https://my-icon-2004.b-cdn.net/movies_tx.jpg' },
  { id: 'comics', custom_name: 'Comics', image_url: 'https://my-icon-2004.b-cdn.net/comics_tx.jpg' },
  { id: 'songs', custom_name: 'Songs', image_url: 'https://my-icon-2004.b-cdn.net/songs_tx.jpg' },
  { id: 'library', custom_name: 'Library', image_url: 'https://my-icon-2004.b-cdn.net/library_tx.jpg' },
  { id: 'apps', custom_name: 'Ilovalar', image_url: 'https://my-icon-2004.b-cdn.net/apps_tx.jpg' },
  { id: 'reels', custom_name: 'Reels', image_url: 'https://my-icon-2004.b-cdn.net/reels_tx.jpg' },
  { id: 'ai-chat', custom_name: 'Virtual Teacher', image_url: 'https://my-icon-2004.b-cdn.net/virtual_tx.jpg' },
  { id: 'grammar_checker', custom_name: 'Grammar Checker', image_url: 'https://my-icon-2004.b-cdn.net/grammarChecker_tx.jpg' },
  { id: 'tips', custom_name: 'Tips', image_url: 'https://my-icon-2004.b-cdn.net/tips_tx.jpg' },
];

export default function Home() {
  const t = useTranslation();
  const navigate = useNavigate();
  const [carouselImages, setCarouselImages] = useState<any[]>(defaultCarousel);
  const [categories, setCategories] = useState<any[]>(fallbackCategories);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    api.getCarousel().then(data => { if(data && data.length) setCarouselImages(data); }).catch(() => {});
    api.getCategories().then(data => {
      if(data && data.length > 0) {
        const merged = fallbackCategories.map(fb => {
          const found = data.find((d: any) => d.id === fb.id);
          return found || fb;
        });
        setCategories(merged);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide(p => (p + 1) % carouselImages.length), 4000);
    return () => clearInterval(timer);
  }, [carouselImages.length]);

  const handleCategoryClick = (id: string) => {
    const specialRoutes: Record<string, string> = {
      movies: '/movies', comics: '/comics', grammar_checker: '/grammar-checker', tips: '/tips', 
      vocabulary: '/category/vocabulary', songs: '/songs', library: '/library', apps: '/apps', 
      reels: '/reels', 'ai-chat': '/ai-chat'
    };
    navigate(specialRoutes[id] || `/category/${id}`);
  };

  const getCat = (id: string) => categories.find(c => c.id === id) || fallbackCategories.find(c => c.id === id);

  const renderCard = (id: string) => {
    const cat = getCat(id);
    if (!cat) return null;
    return (
      <button key={id} onClick={() => handleCategoryClick(id)} className="group flex flex-col items-center gap-2 w-full text-center outline-none">
        <div className={`relative aspect-square w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
          {cat.image_url ? (
            <img src={cat.image_url} alt={cat.custom_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/80 to-purple-600 flex items-center justify-center p-2 text-white/50 text-xs font-medium">Rasm yo'q (Admin)</div>
          )}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
        </div>
        <span className="font-bold text-[13px] md:text-sm text-main group-hover:text-primary transition-colors line-clamp-1">{cat.custom_name || id}</span>
      </button>
    );
  };

  const SectionHeader = ({ title, icon: Icon, delayMs = 0 }: { title: string, icon: any, delayMs?: number }) => (
    <div className="flex items-center gap-3 px-1 mt-8 mb-4">
      <div className="p-2 rounded-xl bg-primary/10 text-primary">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-xl font-extrabold text-main">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-2 page-enter pb-8">
      {/* Carousel */}
      <div className="relative w-full h-44 md:h-64 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg bg-surface">
        {carouselImages.map((img, i) => (
          <div key={img.id} className={`absolute inset-0 transition-opacity duration-700 ${i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <img src={img.image_url} alt={img.title || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            {img.title && (
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-white text-xl md:text-2xl font-bold drop-shadow-lg">{img.title}</h2>
                {img.subtitle && <p className="text-white/80 text-sm mt-1">{img.subtitle}</p>}
              </div>
            )}
          </div>
        ))}
        {carouselImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {carouselImages.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-6' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionHeader title="Basic" icon={BookOpen} />
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {renderCard('grammar')}
          {renderCard('vocabulary')}
        </div>

        <SectionHeader title="IELTS" icon={GraduationCap} />
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {renderCard('reading')}
          {renderCard('listening')}
          {renderCard('writing')}
          {renderCard('speaking')}
        </div>

        <SectionHeader title="Entertainment" icon={Popcorn} />
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {renderCard('movies')}
          {renderCard('comics')}
          {renderCard('songs')}
        </div>

        <SectionHeader title="Tools & Extras" icon={Wrench} />
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {renderCard('library')}
          {renderCard('apps')}
          {renderCard('reels')}
          {renderCard('ai-chat')}
          {renderCard('grammar_checker')}
          {renderCard('tips')}
        </div>
      </div>
    </div>
  );
}
