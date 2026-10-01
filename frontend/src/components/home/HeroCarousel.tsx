import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  imageUrl: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'built-for-movement',
    badge: 'NEW SEASON 2026',
    title: 'BUILT FOR MOVEMENT.',
    subtitle: 'Restrained monochrome aesthetics engineered with heavyweight organic fabrics. Precision silhouettes designed to hold shape everywhere.',
    primaryCtaText: 'Shop Men',
    primaryCtaLink: '/shop/men',
    secondaryCtaText: 'Shop Women',
    secondaryCtaLink: '/shop/women',
    imageUrl: '/images/hero-campaign.jpg',
  },
  {
    id: 'refined-tailoring',
    badge: 'STUDIO COLLECTION',
    title: 'REFINED TAILORING.',
    subtitle: 'Architectural double-breasted long coats and fluid monochrome trousers. Redefining modern formal silhouettes with understated luxury.',
    primaryCtaText: 'Explore Collection',
    primaryCtaLink: '/collections',
    secondaryCtaText: 'Shop All Pieces',
    secondaryCtaLink: '/shop',
    imageUrl: '/images/hero-campaign-tailoring.jpg',
  },
  {
    id: 'essentials-edit',
    badge: 'EVERYDAY LUXURY',
    title: 'THE ESSENTIALS EDIT.',
    subtitle: 'Heavyweight French terry hoodies, structured boxy crewnecks, and relaxed sweatpants crafted for timeless everyday movement.',
    primaryCtaText: 'Shop Essentials',
    primaryCtaLink: '/collections/essentials',
    secondaryCtaText: 'New Arrivals',
    secondaryCtaLink: '/shop/sale',
    imageUrl: '/images/hero-campaign-essentials.jpg',
  },
  {
    id: 'technical-movement',
    badge: 'DROP 03 // 2026',
    title: 'TECHNICAL MOVEMENT.',
    subtitle: 'Waterproof technical parkas, sculpted high-collars, and weather-resistant silhouettes engineered for relentless urban exploration.',
    primaryCtaText: 'Discover Drop 03',
    primaryCtaLink: '/collections/streetwear',
    secondaryCtaText: 'Shop Sale',
    secondaryCtaLink: '/shop/sale',
    imageUrl: '/images/hero-campaign-outerwear.jpg',
  },
];

const AUTOPLAY_INTERVAL = 5000; // 5 seconds per slide automatic transition

export const HeroCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Automated hands-free slide transition
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      className="relative w-full h-[calc(100vh-72px)] min-h-[620px] bg-[#f8f8f8] flex items-center justify-center overflow-hidden border-b border-[#e5e5e5] select-none"
      aria-label="Editorial Campaign Carousel"
    >
      {/* Background Slides with cinematic crossfade */}
      {HERO_SLIDES.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
            aria-hidden={!isActive}
          >
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className={`w-full h-full object-cover object-center filter contrast-105 transition-transform duration-7000 ease-out ${
                isActive ? 'scale-100' : 'scale-105'
              }`}
            />
            {/* Elegant multi-stop gradient for crisp text legibility while keeping models crystal clear */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-black/5"></div>
          </div>
        );
      })}

      {/* Foreground Editorial Content */}
      <div className="relative z-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center flex flex-col items-center">
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentIndex;
          if (!isActive) return null;

          return (
            <div
              key={slide.id}
              className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-700"
            >
              {/* Badge */}
              <span className="text-xs uppercase tracking-[0.25em] font-bold text-black mb-4 bg-white/90 px-4 py-1.5 rounded-full border border-black/10 backdrop-blur-md shadow-xs">
                {slide.badge}
              </span>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-black tracking-tight max-w-[880px] leading-[1.08] mb-6 uppercase">
                {slide.title}
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-[#333333] max-w-xl font-normal mb-8 leading-relaxed">
                {slide.subtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to={slide.primaryCtaLink}>
                  <Button variant="primary" size="lg" className="min-w-[170px] shadow-sm hover:shadow-md transition-shadow">
                    {slide.primaryCtaText}
                  </Button>
                </Link>
                <Link to={slide.secondaryCtaLink}>
                  <Button variant="secondary" size="lg" className="min-w-[170px] bg-white/90 backdrop-blur-sm border-black/20 hover:bg-white hover:border-black transition-all">
                    {slide.secondaryCtaText}
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle Minimalist Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#5e5e5e]">
          Scroll
        </span>
        <div className="w-4 h-7 border border-black/30 rounded-full flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-black rounded-full animate-bounce"></div>
        </div>
      </div>
    </section>
  );
};
