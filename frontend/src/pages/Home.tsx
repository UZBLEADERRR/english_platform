import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const defaultCarousel = [
  { id: '1', image_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=400&fit=crop', title: 'Master English Today', subtitle: 'Start your journey' },
  { id: '2', image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop', title: 'Learn with Fun', subtitle: 'Interactive lessons' },
];

const extraIds = ['songs', 'library', 'apps', 'reels', 'ai-chat'];
const fallbackCategories = [
  { id: 'grammar', custom_name: 'Grammar', image_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=300&fit=crop' },
  { id: 'vocabulary', custom_name: 'Vocabulary', image_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=300&h=300&fit=crop' },
  { id: 'reading', custom_name: 'Reading', image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=300&fit=crop' },
  { id: 'listening', custom_name: 'Listening', image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop' },
  { id: 'writing', custom_name: 'Writing', image_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=300&h=300&fit=crop' },
  { id: 'speaking', custom_name: 'Speaking', image_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&h=300&fit=crop' },
  { id: 'movies', custom_name: 'Movies', image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=300&fit=crop' },
  { id: 'comics', custom_name: 'Comics', image_url: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300&h=300&fit=crop' },
  { id: 'songs', custom_name: 'Songs', image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop' },
  { id: 'library', custom_name: 'Library', image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=300&fit=crop' },
  { id: 'apps', custom_name: 'Ilovalar', image_url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=300&fit=crop' },
  { id: 'reels', custom_name: 'Reels', image_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=300&fit=crop' },
  { id: 'ai-chat', custom_name: 'Virtual Teacher', image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=300&fit=crop' },
  { id: 'grammar_checker', custom_name: 'Grammar Checker', image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=300&fit=crop' },
  { id: 'tips', custom_name: 'Tips', image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=300&h=300&fit=crop' },
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
        // Merge fetched data with fallbacks for missing items
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

  const renderCard = (id: string, customAspect = 'aspect-square') => {
    const cat = getCat(id);
    if (!cat) return null;
    return (
      <button key={id} onClick={() => handleCategoryClick(id)} className="group flex flex-col items-center gap-2 w-full text-center">
        <div className={`relative ${customAspect} w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
          {cat.image_url ? (
            <img src={cat.image_url} alt={cat.custom_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/80 to-purple-600" />
          )}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
        </div>
        <span className="font-bold text-sm md:text-base text-main group-hover:text-primary transition-colors line-clamp-1">{cat.custom_name || id}</span>
      </button>
    );
  };

  return (
    <div className="space-y-6 page-enter pb-6">
      {/* Carousel */}
      <div className="relative w-full h-44 md:h-64 rounded-2xl overflow-hidden shadow-lg bg-surface">
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

      {/* Main Categories */}
      <div className="space-y-6">
        
        {/* Row 1: Grammar, Vocabulary (Large) */}
        <div className="grid grid-cols-2 gap-4">
          {renderCard('grammar', 'aspect-[4/3]')}
          {renderCard('vocabulary', 'aspect-[4/3]')}
        </div>

        {/* Row 2: Reading, Listening, Writing, Speaking */}
        <div className="grid grid-cols-2 gap-4">
          {renderCard('reading', 'aspect-[16/10]')}
          {renderCard('listening', 'aspect-[16/10]')}
          {renderCard('writing', 'aspect-[16/10]')}
          {renderCard('speaking', 'aspect-[16/10]')}
        </div>

        {/* Entertainment Section */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-main border-l-4 border-primary pl-3">Entertainment</h3>
          <div className="grid grid-cols-3 gap-3">
            {renderCard('movies')}
            {renderCard('comics')}
            {renderCard('songs')}
          </div>
        </div>

        {/* Tools Section */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-main border-l-4 border-primary pl-3">Tools & Extras</h3>
          <div className="grid grid-cols-3 gap-3">
            {renderCard('library')}
            {renderCard('apps')}
            {renderCard('reels')}
            {renderCard('ai-chat')}
            {renderCard('grammar_checker')}
            {renderCard('tips')}
          </div>
        </div>
      </div>
    </div>
  );
}
