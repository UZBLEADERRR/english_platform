import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store';
import api from '../api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const defaultCategories = [
  { id: 'grammar', custom_name: 'Grammar', image_url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&h=300&fit=crop' },
  { id: 'reading', custom_name: 'Reading', image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=300&h=300&fit=crop' },
  { id: 'writing', custom_name: 'Writing', image_url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=300&h=300&fit=crop' },
  { id: 'listening', custom_name: 'Listening', image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop' },
  { id: 'speaking', custom_name: 'Speaking', image_url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&h=300&fit=crop' },
  { id: 'vocabulary', custom_name: 'Vocabulary', image_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=300&h=300&fit=crop' },
  { id: 'movies', custom_name: 'Movies', image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=300&fit=crop' },
  { id: 'comics', custom_name: 'Comics', image_url: 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300&h=300&fit=crop' },
  { id: 'grammar_checker', custom_name: 'Grammar Checker', image_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300&h=300&fit=crop' },
  { id: 'tips', custom_name: 'Tips', image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=300&h=300&fit=crop' },
];

export default function Home() {
  const t = useTranslation();
  const navigate = useNavigate();
  const [carouselImages, setCarouselImages] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>(defaultCategories);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    api.getCarousel().then(setCarouselImages).catch(() => {
      setCarouselImages([
        { id: '1', image_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=400&fit=crop', title: 'Master English Today', subtitle: 'Start your journey' },
        { id: '2', image_url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop', title: 'Learn with Fun', subtitle: 'Interactive lessons' },
      ]);
    });
    api.getCategories().then(data => {
      if(data && data.length > 0) setCategories(data);
    }).catch(() => {});
  }, []);

  // Auto-slide
  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide(p => (p + 1) % carouselImages.length), 4000);
    return () => clearInterval(timer);
  }, [carouselImages.length]);

  const handleCategoryClick = (cat: any) => {
    const specialRoutes: Record<string, string> = {
      movies: '/movies', comics: '/comics', grammar_checker: '/grammar-checker', tips: '/tips', vocabulary: '/category/vocabulary',
    };
    navigate(specialRoutes[cat.id] || `/category/${cat.id}`);
  };

  // Extra cards that appear on home
  const extraCards = [
    { id: 'songs', name: '🎵 Songs', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop', route: '/songs' },
    { id: 'library', name: '📚 Library', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=300&fit=crop', route: '/library' },
    { id: 'apps', name: '📱 Ilovalar', image: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=300&h=300&fit=crop', route: '/apps' },
    { id: 'reels', name: '🎬 Reels', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&h=300&fit=crop', route: '/reels' },
    { id: 'ai-chat', name: '🤖 Virtual Teacher', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=300&fit=crop', route: '/ai-chat' },
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Carousel */}
      {carouselImages.length > 0 && (
        <div className="relative w-full h-44 md:h-64 rounded-2xl overflow-hidden shadow-lg">
          {carouselImages.map((img, i) => (
            <div key={img.id} className={`absolute inset-0 transition-all duration-700 ${i === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
              <img src={img.image_url} alt={img.title || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {img.title && (
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-white text-xl md:text-2xl font-bold drop-shadow-lg">{img.title}</h2>
                  {img.subtitle && <p className="text-white/80 text-sm mt-1">{img.subtitle}</p>}
                </div>
              )}
            </div>
          ))}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {carouselImages.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-6' : 'bg-white/40'}`} />
            ))}
          </div>
          {carouselImages.length > 1 && (
            <>
              <button onClick={() => setCurrentSlide(p => (p - 1 + carouselImages.length) % carouselImages.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 backdrop-blur rounded-full text-white/80 hover:bg-black/50 z-10">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentSlide(p => (p + 1) % carouselImages.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 backdrop-blur rounded-full text-white/80 hover:bg-black/50 z-10">
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Category Cards */}
      <div>
        <h3 className="text-lg font-bold mb-3 text-main">{t('categories')}</h3>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className="relative aspect-square rounded-2xl overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.custom_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/80 to-purple-600" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <span className="absolute bottom-3 left-3 text-white font-bold text-sm md:text-base drop-shadow-lg">
                {cat.custom_name || cat.id}
              </span>
            </button>
          ))}
          {/* Extra custom cards */}
          {extraCards.map(card => (
            <button
              key={card.id}
              onClick={() => navigate(card.route)}
              className="relative aspect-square rounded-2xl overflow-hidden group shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <img src={card.image} alt={card.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <span className="absolute bottom-3 left-3 text-white font-bold text-sm md:text-base drop-shadow-lg">{card.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
