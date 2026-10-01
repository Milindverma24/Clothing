import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { ProductGrid } from '../../components/product/ProductGrid';
import { COLLECTIONS } from '../../data/collections';

export const CollectionsPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const { products } = useShop();

  // If specific collection slug is requested
  const activeCollection = slug ? COLLECTIONS.find((c) => c.slug === slug) : null;

  const collectionProducts = slug
    ? products.slice(0, 16) // Sub-sample collection
    : [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {activeCollection ? (
        <div>
          {/* Back Button */}
          <div className="mb-6">
            <Link
              to="/collections"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-semibold text-black transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to All Collections</span>
            </Link>
          </div>

          {/* Active Collection Banner */}
          <div className="relative aspect-[16/6] min-h-[220px] rounded-2xl overflow-hidden bg-black text-white mb-12 flex items-center p-8 sm:p-14">
            <img
              src={activeCollection.image}
              alt={activeCollection.name}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-40 filter contrast-125"
            />
            <div className="relative z-10 max-w-xl">
              <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#afafaf] block mb-2">
                COLLECTION CAPSULE
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight mb-3">
                {activeCollection.name}
              </h1>
              <p className="text-sm sm:text-base text-[#e5e5e5] font-normal leading-relaxed">
                {activeCollection.description}
              </p>
            </div>
          </div>

          <ProductGrid products={collectionProducts} />
        </div>
      ) : (
        <div>
          {/* Back to Shop */}
          <div className="mb-6">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-semibold text-black transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Catalog</span>
            </Link>
          </div>

          <div className="mb-10 text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase font-bold tracking-[0.2em] text-[#8a8a8a] block mb-2">
              CURATED RELEASES
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black mb-3">
              All Collections
            </h1>
            <p className="text-sm text-[#5e5e5e]">
              Engineered wardrobe capsules built with minimal discipline and heavyweight materials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {COLLECTIONS.map((c) => (
              <Link
                key={c.id}
                to={`/collections/${c.slug}`}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-[#e5e5e5] hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-[4/5] bg-[#f4f4f4] overflow-hidden">
                  <img
                    src={c.image}
                    alt={c.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-tight text-black mb-1.5">
                      {c.name}
                    </h3>
                    <p className="text-xs text-[#5e5e5e] leading-relaxed mb-4">
                      {c.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-black group-hover:translate-x-1 transition-transform">
                    <span>Explore Capsule</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
