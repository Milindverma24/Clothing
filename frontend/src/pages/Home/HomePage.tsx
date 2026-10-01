import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { ProductGrid } from '../../components/product/ProductGrid';
import { Button } from '../../components/ui/Button';
import { COLLECTIONS } from '../../data/collections';

export const HomePage: React.FC = () => {
  const { products } = useShop();

  const newArrivals = products.slice(0, 8);
  const bestSellers = products.filter((p) => p.badge === 'BESTSELLER' || p.badge === 'SALE').slice(0, 8);

  return (
    <div className="flex flex-col gap-0 w-full">
      {/* 1. HERO SECTION (Section 16-17 of design.md) */}
      <section className="relative w-full min-h-[85vh] bg-[#f8f8f8] flex items-center justify-center overflow-hidden border-b border-[#e5e5e5]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-campaign.jpg"
            alt="Hero Campaign"
            className="w-full h-full object-cover object-center opacity-90 filter contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
          <span className="text-xs uppercase tracking-[0.25em] font-bold text-black mb-4 bg-white/80 px-4 py-1.5 rounded-full border border-black/10 backdrop-blur-sm">
            NEW SEASON 2026
          </span>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-black tracking-tight max-w-[850px] leading-[1.08] mb-6 uppercase">
            Built For Movement.
          </h1>

          <p className="text-base sm:text-lg text-[#5e5e5e] max-w-xl font-normal mb-8 leading-relaxed">
            Restrained monochrome aesthetics engineered with heavyweight organic fabrics.
            Precision silhouettes designed to hold shape everywhere.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/shop/men">
              <Button variant="primary" size="lg" className="min-w-[170px]">
                Shop Men
              </Button>
            </Link>
            <Link to="/shop/women">
              <Button variant="secondary" size="lg" className="min-w-[170px]">
                Shop Women
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITIONS */}
      <section className="border-b border-[#e5e5e5] py-8 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <Truck className="w-5 h-5 text-black" />
            <span className="text-xs font-bold uppercase tracking-wider text-black">
              Complimentary Delivery
            </span>
            <span className="text-xs text-[#8a8a8a]">On all orders over ₹1,499</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 text-black" />
            <span className="text-xs font-bold uppercase tracking-wider text-black">
              14-Day Seamless Returns
            </span>
            <span className="text-xs text-[#8a8a8a]">Hassle-free doorstep pickup</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-black" />
            <span className="text-xs font-bold uppercase tracking-wider text-black">
              100% Certified Fabrics
            </span>
            <span className="text-xs text-[#8a8a8a]">Sourced & tailored with care</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="w-5 h-5 text-black" />
            <span className="text-xs font-bold uppercase tracking-wider text-black">
              Monochrome Discipline
            </span>
            <span className="text-xs text-[#8a8a8a]">Designed to outlast trends</span>
          </div>
        </div>
      </section>

      {/* 3. NEW ARRIVALS (Section 18-19 of design.md) */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8a8a8a] block mb-2">
                JUST DROPPED
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black uppercase">
                New Arrivals
              </h2>
            </div>
            <Link
              to="/collections/new-arrivals"
              className="inline-flex items-center gap-2 text-sm font-semibold text-black hover:text-[#5e5e5e] transition-colors"
            >
              <span>Explore All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <ProductGrid products={newArrivals} />
        </div>
      </section>

      {/* 4. DARK PROMOTIONAL SECTION (Section 32-33 of design.md) */}
      <section className="w-full bg-black text-white py-20 sm:py-28 overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col items-start max-w-xl">
            <span className="text-xs font-bold tracking-[0.2em] text-[#afafaf] uppercase mb-4">
              EDITORIAL SPOTLIGHT
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-6 uppercase leading-tight">
              The Essential Collection. Built Better.
            </h2>
            <p className="text-base text-[#afafaf] font-normal leading-relaxed mb-8">
              Constructed from dense, high-GSM combed cotton. Zero unnecessary labels,
              zero synthetic blends. Just raw comfort and structured architectural form.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/collections/essentials">
                <Button variant="secondary" size="lg">
                  Explore Collection
                </Button>
              </Link>
              <Link to="/shop">
                <Button
                  variant="subtle"
                  size="lg"
                  className="bg-[#171717] text-white hover:bg-[#2a2a2a]"
                >
                  View Catalog
                </Button>
              </Link>
            </div>
          </div>

          {/* Visual Hero Showcase */}
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#171717]">
              <img
                src="/images/collection-new-arrivals.jpg"
                alt="Editorial Piece 1"
                className="w-full h-full object-cover filter contrast-105"
              />
            </div>
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#171717] mt-8">
              <img
                src="/images/collection-streetwear.jpg"
                alt="Editorial Piece 2"
                className="w-full h-full object-cover filter contrast-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURED COLLECTIONS GRID */}
      <section className="py-20 bg-white">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8a8a8a] block mb-2">
              CURATED CAPSULES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black uppercase mb-3">
              Explore Collections
            </h2>
            <p className="text-sm text-[#5e5e5e]">
              Cohesive capsules engineered for every daily setting and season.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLLECTIONS.map((col) => (
              <Link
                key={col.id}
                to={`/collections/${col.slug}`}
                className="group relative block aspect-[4/5] rounded-2xl overflow-hidden bg-[#f4f4f4]"
              >
                <img
                  src={col.image}
                  alt={col.name}
                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
                  <span className="text-xs uppercase tracking-widest text-white/70 mb-1">
                    Collection
                  </span>
                  <h3 className="text-xl font-bold uppercase tracking-tight mb-2">
                    {col.name}
                  </h3>
                  <p className="text-xs text-white/80 line-clamp-2 mb-4 font-normal">
                    {col.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white group-hover:translate-x-1 transition-transform">
                    <span>Shop Capsule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. BEST SELLERS */}
      <section className="py-16 sm:py-24 bg-[#fcfcfc] border-t border-[#e5e5e5]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8a8a8a] block mb-2">
                CUSTOMER FAVORITES
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black uppercase">
                Best Sellers
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-black hover:text-[#5e5e5e] transition-colors"
            >
              <span>View All Pieces</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <ProductGrid products={bestSellers} />
        </div>
      </section>

      {/* 7. NEWSLETTER SECTION */}
      <section className="py-20 bg-white border-t border-[#e5e5e5] text-center">
        <div className="max-w-xl mx-auto px-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#8a8a8a] block mb-2">
            STAY CONNECTED
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black uppercase mb-4">
            First Look at Drops
          </h2>
          <p className="text-sm text-[#5e5e5e] mb-8 leading-relaxed">
            Subscribe for private seasonal drop releases, member discounts, and editorial lookbooks.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('Thank you for subscribing to CLOTHING drops!');
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="Enter your email address"
              className="flex-1 px-5 py-3.5 bg-[#f4f4f4] rounded-full text-sm text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-1 focus:ring-black"
            />
            <Button variant="primary" size="md" type="submit">
              Subscribe
            </Button>
          </form>
          <p className="text-[11px] text-[#8a8a8a] mt-3">
            By signing up, you agree to receive communications. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
};
