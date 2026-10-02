import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RefreshCw,
  CheckCircle2,
  ArrowUpRight,
  Layers,
  Compass,
  Check,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { ProductGrid } from '../../components/product/ProductGrid';
import { Button } from '../../components/ui/Button';
import { COLLECTIONS } from '../../data/collections';
import { HeroCarousel } from '../../components/home/HeroCarousel';

type CategoryFilter = 'ALL' | 'TOPS' | 'BOTTOMS' | 'FOOTWEAR' | 'ACCESSORIES';

export const HomePage: React.FC = () => {
  const { products } = useShop();
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('ALL');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Filtered new arrivals for the interactive catalog section
  const filteredNewArrivals = useMemo(() => {
    let list = products;
    if (activeFilter === 'TOPS') {
      list = products.filter(
        (p) =>
          p.subCategory?.toLowerCase().includes('top') ||
          p.articleType?.toLowerCase().includes('t-shirt') ||
          p.articleType?.toLowerCase().includes('shirt') ||
          p.articleType?.toLowerCase().includes('hoodie') ||
          p.articleType?.toLowerCase().includes('jacket')
      );
    } else if (activeFilter === 'BOTTOMS') {
      list = products.filter(
        (p) =>
          p.subCategory?.toLowerCase().includes('bottom') ||
          p.articleType?.toLowerCase().includes('trousers') ||
          p.articleType?.toLowerCase().includes('pants') ||
          p.articleType?.toLowerCase().includes('jeans') ||
          p.articleType?.toLowerCase().includes('shorts')
      );
    } else if (activeFilter === 'FOOTWEAR') {
      list = products.filter((p) => p.masterCategory === 'Footwear');
    } else if (activeFilter === 'ACCESSORIES') {
      list = products.filter((p) => p.masterCategory === 'Accessories');
    }
    return list.slice(0, 8);
  }, [products, activeFilter]);

  const bestSellers = useMemo(() => {
    return products
      .filter((p) => p.badge === 'BESTSELLER' || p.badge === 'SALE' || (p.rating && p.rating >= 4.5))
      .slice(0, 8);
  }, [products]);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitted(true);
  };

  return (
    <div className="flex flex-col gap-0 w-full bg-white text-black selection:bg-black selection:text-white">
      {/* 1. EDITORIAL FULLSCREEN HERO SLIDESHOW */}
      <HeroCarousel />

      {/* 2. ELEVATED LUXURY VALUE PILLARS */}
      <section className="border-b border-[#e5e5e5] py-7 bg-[#fafafa]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            <div className="flex items-start gap-3.5 group">
              <div className="w-10 h-10 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black group-hover:text-white transition-colors duration-200">
                <Truck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  Complimentary Transit
                </span>
                <span className="text-xs text-[#707070] mt-0.5">
                  Domestic orders over ₹1,499
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5 group">
              <div className="w-10 h-10 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black group-hover:text-white transition-colors duration-200">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  14-Day Seamless Returns
                </span>
                <span className="text-xs text-[#707070] mt-0.5">
                  Doorstep pickup & quick refund
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5 group">
              <div className="w-10 h-10 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black group-hover:text-white transition-colors duration-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  500+ GSM Textiles
                </span>
                <span className="text-xs text-[#707070] mt-0.5">
                  Custom-milled long-staple cotton
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3.5 group">
              <div className="w-10 h-10 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center shrink-0 shadow-xs group-hover:bg-black group-hover:text-white transition-colors duration-200">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  Monochrome Studio
                </span>
                <span className="text-xs text-[#707070] mt-0.5">
                  Timeless architectural form
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VISUAL CATEGORY PORTALS (High Fashion Editorial Gateway) */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#8a8a8a] block mb-2">
                CURATED DISCIPLINES
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-black uppercase">
                Explore The Studios
              </h2>
            </div>
            <p className="text-sm text-[#707070] max-w-md font-normal sm:text-right">
              Precision tailored garments, fluid drape, and minimal leather goods sculpted for modern movement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* PORTAL 1: MEN'S STUDIO */}
            <Link
              to="/shop/men"
              className="group relative block aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden bg-[#171717] shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <img
                src="/images/category-men.jpg"
                alt="Men's Studio Collection"
                className="w-full h-full object-cover object-center filter contrast-[1.03] transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 transition-opacity duration-300 group-hover:via-black/20" />
              
              <div className="absolute top-6 left-6 z-10">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full bg-white/95 text-black backdrop-blur-md shadow-xs">
                  Men&apos;s Studio // 2026
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 z-10 flex flex-col justify-end text-white">
                <span className="text-xs uppercase tracking-widest text-white/70 mb-1 font-medium">
                  Tailoring & Outerwear
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mb-2 text-white">
                  Men&apos;s Collection
                </h3>
                <p className="text-xs text-white/80 line-clamp-2 mb-5 font-normal leading-relaxed">
                  Double-breasted overcoats, heavy French terry staples, and architectural pleated trousers.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-white px-5 py-3 rounded-full w-fit group-hover:bg-[#f0f0f0] transition-colors shadow-sm">
                  <span>Explore Men</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* PORTAL 2: WOMEN'S MOVEMENT */}
            <Link
              to="/shop/women"
              className="group relative block aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden bg-[#171717] shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <img
                src="/images/category-women.jpg"
                alt="Women's Movement Collection"
                className="w-full h-full object-cover object-center filter contrast-[1.03] transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 transition-opacity duration-300 group-hover:via-black/20" />
              
              <div className="absolute top-6 left-6 z-10">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full bg-white/95 text-black backdrop-blur-md shadow-xs">
                  Women&apos;s Movement
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 z-10 flex flex-col justify-end text-white">
                <span className="text-xs uppercase tracking-widest text-white/70 mb-1 font-medium">
                  Fluid Drape & Silhouettes
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mb-2 text-white">
                  Women&apos;s Collection
                </h3>
                <p className="text-xs text-white/80 line-clamp-2 mb-5 font-normal leading-relaxed">
                  Sculpted gabardine trench coats, fluid high-rise trousers, and refined monochrome knitwear.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-white px-5 py-3 rounded-full w-fit group-hover:bg-[#f0f0f0] transition-colors shadow-sm">
                  <span>Explore Women</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            {/* PORTAL 3: OBJECTS & FOOTWEAR */}
            <Link
              to="/shop"
              className="group relative block aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden bg-[#171717] shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <img
                src="/images/category-accessories.jpg"
                alt="Objects & Footwear"
                className="w-full h-full object-cover object-center filter contrast-[1.03] transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 transition-opacity duration-300 group-hover:via-black/20" />
              
              <div className="absolute top-6 left-6 z-10">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full bg-white/95 text-black backdrop-blur-md shadow-xs">
                  Objects // Hardware
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 z-10 flex flex-col justify-end text-white">
                <span className="text-xs uppercase tracking-widest text-white/70 mb-1 font-medium">
                  Artisanal Leather & Accents
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mb-2 text-white">
                  Footwear & Goods
                </h3>
                <p className="text-xs text-white/80 line-clamp-2 mb-5 font-normal leading-relaxed">
                  Italian grain leather Chelsea boots, architectural weekenders, and minimal utility hardware.
                </p>
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-white px-5 py-3 rounded-full w-fit group-hover:bg-[#f0f0f0] transition-colors shadow-sm">
                  <span>Discover Objects</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. NEW ARRIVALS WITH INTERACTIVE CATEGORY TABS */}
      <section className="py-16 sm:py-24 bg-[#fcfcfc] border-t border-[#e5e5e5]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#8a8a8a]">
                  AUTUMN/WINTER 2026 // DROP 01
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-black uppercase">
                New Arrivals
              </h2>
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'ALL', label: 'All Releases' },
                  { id: 'TOPS', label: 'Tops & Knitwear' },
                  { id: 'BOTTOMS', label: 'Trousers' },
                  { id: 'FOOTWEAR', label: 'Footwear' },
                  { id: 'ACCESSORIES', label: 'Accessories' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-white text-[#5e5e5e] border border-[#e5e5e5] hover:text-black hover:border-black'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <ProductGrid products={filteredNewArrivals} />

          <div className="mt-12 text-center">
            <Link to="/shop">
              <Button variant="secondary" size="lg" className="border-black/20 hover:border-black">
                <span>View Full Catalog (300+ Pieces)</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. CINEMATIC EDITORIAL FEATURE: THE ARCHITECTURAL EDIT */}
      <section className="w-full bg-[#0c0c0c] text-white py-20 sm:py-28 overflow-hidden border-y border-[#262626]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Cinematic Campaign Hero Imagery */}
            <div className="lg:col-span-7 relative group">
              <div className="aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-[#171717] border border-white/10 shadow-2xl relative">
                <img
                  src="/images/editorial-architectural.jpg"
                  alt="The Architectural Overcoat Campaign"
                  className="w-full h-full object-cover filter contrast-[1.05] group-hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                
                {/* Garment Technical Hotspots */}
                <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center justify-between gap-3 text-xs bg-black/70 backdrop-blur-md p-3.5 rounded-xl border border-white/15">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span className="font-mono text-[11px] text-[#e0e0e0]">
                      SPEC: 650 GSM DOUBLE-FACED MELTON WOOL
                    </span>
                  </div>
                  <span className="text-[11px] text-white/70 font-mono">
                    MILAN ATELIER // NO. 04
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Editorial Narrative */}
            <div className="lg:col-span-5 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1e1e] border border-white/10 text-white/80 text-[11px] font-bold tracking-[0.2em] uppercase mb-5">
                <Compass className="w-3.5 h-3.5 text-white" />
                <span>EDITORIAL SPOTLIGHT // 2026</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 uppercase leading-[1.1]">
                The Architectural Proportions.
              </h2>

              <p className="text-base text-[#a3a3a3] font-normal leading-relaxed mb-6">
                Conceived at the intersection of brutalist architecture and ergonomic movement. Every coat and fleece is cut to hold confident structural drape without synthetic blends or restrictive padding.
              </p>

              {/* Garment hallmarks list */}
              <div className="flex flex-col gap-3 mb-8 w-full border-t border-b border-white/10 py-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span className="text-xs text-[#d4d4d4] font-medium">
                    Raw organic long-staple cotton milled without silicon softeners
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span className="text-xs text-[#d4d4d4] font-medium">
                    Zero exterior brand logos — pure silhouette and tactile presence
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                  <span className="text-xs text-[#d4d4d4] font-medium">
                    Japanese Excella matte black zips and blind reinforced seams
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-4">
                <Link to="/collections/streetwear">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white text-black hover:bg-[#e5e5e5] border-transparent font-bold tracking-wide"
                  >
                    <span>Shop The Capsule</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/collections/essentials">
                  <Button
                    variant="subtle"
                    size="lg"
                    className="bg-[#1c1c1c] text-white hover:bg-[#282828] border border-white/15"
                  >
                    Explore Lookbook
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CURATED CAPSULES GRID */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#8a8a8a] block mb-2">
              CURATED CAPSULES
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-black uppercase mb-3">
              Explore Collections
            </h2>
            <p className="text-sm text-[#707070]">
              Unified wardrobe systems crafted for deliberate layering and daily endurance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {COLLECTIONS.map((col) => (
              <Link
                key={col.id}
                to={`/collections/${col.slug}`}
                className="group relative block aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden bg-[#f4f4f4] shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <img
                  src={col.image}
                  alt={col.name}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 filter contrast-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-8 text-white">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-white/70 mb-1 font-semibold">
                    Permanent Series
                  </span>
                  <h3 className="text-2xl font-extrabold uppercase tracking-tight mb-2">
                    {col.name}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-2 mb-5 font-normal leading-relaxed">
                    {col.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-white px-4 py-2.5 rounded-full w-fit group-hover:bg-[#f0f0f0] transition-colors shadow-xs">
                    <span>Shop Capsule</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. STUDIO LOOKBOOK & EDITORIAL STYLING */}
      <section className="py-20 sm:py-28 bg-[#fafafa] border-t border-[#e5e5e5]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#8a8a8a] block mb-2">
                IN SITU // WORLDWIDE LOOKBOOK
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-black uppercase">
                Styling The Silhouettes
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black hover:text-[#5e5e5e] transition-colors"
            >
              <span>View Atelier Archive</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Look 1: Streetwear Berlin */}
            <div className="group relative aspect-square rounded-2xl overflow-hidden bg-black shadow-sm">
              <img
                src="/images/lookbook-street.jpg"
                alt="Berlin Street Styling"
                className="w-full h-full object-cover object-center filter contrast-[1.05] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">
                  LOOK 01 // BERLIN
                </span>
                <p className="text-xs font-bold uppercase mt-1">
                  Boxy Fleece + Pleated Wool Trousers
                </p>
                <Link
                  to="/shop"
                  className="mt-3 text-[11px] font-bold text-white/90 hover:text-white underline underline-offset-4 flex items-center gap-1"
                >
                  <span>Shop Look</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Look 2: Macro Fabric */}
            <div className="group relative aspect-square rounded-2xl overflow-hidden bg-black shadow-sm">
              <img
                src="/images/lookbook-fabric.jpg"
                alt="Fabric Detail"
                className="w-full h-full object-cover object-center filter contrast-[1.05] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">
                  LOOK 02 // ATELIER MACRO
                </span>
                <p className="text-xs font-bold uppercase mt-1">
                  500 GSM Waffle Cotton Weave
                </p>
                <Link
                  to="/collections/essentials"
                  className="mt-3 text-[11px] font-bold text-white/90 hover:text-white underline underline-offset-4 flex items-center gap-1"
                >
                  <span>Discover Textiles</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Look 3: Tailoring Milan */}
            <div className="group relative aspect-square rounded-2xl overflow-hidden bg-black shadow-sm">
              <img
                src="/images/category-men.jpg"
                alt="Milan Tailoring"
                className="w-full h-full object-cover object-center filter contrast-[1.05] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">
                  LOOK 03 // MILAN
                </span>
                <p className="text-xs font-bold uppercase mt-1">
                  Sculpted Overcoat + Chelsea Boot
                </p>
                <Link
                  to="/shop/men"
                  className="mt-3 text-[11px] font-bold text-white/90 hover:text-white underline underline-offset-4 flex items-center gap-1"
                >
                  <span>Shop Look</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Look 4: Movement Tokyo */}
            <div className="group relative aspect-square rounded-2xl overflow-hidden bg-black shadow-sm">
              <img
                src="/images/category-women.jpg"
                alt="Tokyo Movement"
                className="w-full h-full object-cover object-center filter contrast-[1.05] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white/70">
                  LOOK 04 // TOKYO
                </span>
                <p className="text-xs font-bold uppercase mt-1">
                  Fluid Trench + Wide-Leg Gabardine
                </p>
                <Link
                  to="/shop/women"
                  className="mt-3 text-[11px] font-bold text-white/90 hover:text-white underline underline-offset-4 flex items-center gap-1"
                >
                  <span>Shop Look</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. BEST SELLERS */}
      <section className="py-16 sm:py-24 bg-white border-t border-[#e5e5e5]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#8a8a8a] block mb-2">
                CUSTOMER FAVORITES
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-black uppercase">
                Best Sellers
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black hover:text-[#5e5e5e] transition-colors"
            >
              <span>View All Pieces</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <ProductGrid products={bestSellers} />
        </div>
      </section>

      {/* 9. VIP PRIVATE ACCESS & ATELIER NEWSLETTER */}
      <section className="py-20 sm:py-28 bg-[#111111] text-white border-t border-[#222222]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-6">
            <Layers className="w-5 h-5 text-white" />
          </div>

          <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#a3a3a3] block mb-3">
            PRIVATE ATELIER DISPATCH
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white uppercase mb-4 leading-tight">
            Gain Early Access to Drops
          </h2>
          <p className="text-sm sm:text-base text-[#9e9e9e] mb-8 max-w-xl mx-auto font-normal leading-relaxed">
            Join our private syndicate for 24-hour priority access to limited seasonal capsules, runway lookbooks, and private member pricing.
          </p>

          {/* Member perks badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10 text-xs text-[#cccccc]">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
              <Check className="w-3.5 h-3.5 text-white" />
              <span>15% Welcome Credit On First Order</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
              <Check className="w-3.5 h-3.5 text-white" />
              <span>24h Early Access to Limited Releases</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Complimentary Atelier Trunk Invites</span>
            </div>
          </div>

          {newsletterSubmitted ? (
            <div className="p-6 bg-white/10 border border-white/20 rounded-2xl max-w-md mx-auto animate-in fade-in duration-300">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center mx-auto mb-3">
                <Check className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold uppercase tracking-wide text-white mb-1">
                You Are On The Private List
              </h3>
              <p className="text-xs text-[#b0b0b0]">
                We have registered <span className="text-white font-medium">{newsletterEmail}</span>. Your 15% inaugural credit code has been dispatched.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 rounded-full text-sm text-white placeholder:text-[#888888] focus:outline-none focus:ring-1 focus:ring-white focus:bg-white/15 transition-all"
              />
              <Button
                variant="secondary"
                size="md"
                type="submit"
                className="bg-white !text-black hover:bg-[#e0e0e0] font-bold text-xs uppercase tracking-wider px-6 border-0 shadow-sm transition-all"
              >
                Join Syndicate
              </Button>
            </form>
          )}

          <p className="text-[11px] text-[#707070] mt-4">
            Restrained dispatches only. You can unsubscribe with one click at any time.
          </p>
        </div>
      </section>
    </div>
  );
};
