import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus } from 'lucide-react';
import type { Product } from '../../types';
import { Badge } from '../ui/Badge';
import { useShop } from '../../context/ShopContext';

export interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isInWishlist, toggleWishlist, addToCart } = useShop();
  const [isHovered, setIsHovered] = useState(false);
  const isSaved = isInWishlist(product.id);

  const displayImage = product.images[0] || '/images/15970.jpg';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 'M', product.baseColour || 'Black', 1);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div
      className="group relative flex flex-col bg-white rounded-2xl overflow-hidden transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Container (4:5 Aspect Ratio) */}
      <Link
        to={`/products/${product.slug}`}
        className="relative block w-full aspect-[4/5] bg-[#f4f4f4] overflow-hidden rounded-2xl"
      >
        <img
          src={displayImage}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.badge && (
            <Badge variant={product.badge === 'LOW STOCK' ? 'low-stock' : 'black'}>
              {product.badge}
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all z-10 ${
            isSaved
              ? 'bg-black text-white'
              : 'bg-white/90 text-black hover:bg-black hover:text-white backdrop-blur-sm'
          }`}
          aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : ''}`} />
        </button>

        {/* Quick Add Overlay */}
        <div
          className={`absolute inset-x-3 bottom-3 transition-all duration-200 ${
            isHovered
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-2 pointer-events-none md:flex hidden'
          }`}
        >
          <button
            onClick={handleQuickAdd}
            className="w-full py-2.5 px-4 bg-black text-white text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 shadow-md hover:bg-[#1a1a1a] active:scale-[0.98] transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>QUICK ADD</span>
          </button>
        </div>
      </Link>

      {/* Product Details */}
      <div className="pt-3 pb-1 flex flex-col gap-1">
        {/* Category & Color */}
        <div className="flex items-center justify-between text-xs text-[#8a8a8a]">
          <span className="uppercase tracking-wider font-medium">
            {product.articleType || product.masterCategory}
          </span>
          {product.baseColour && (
            <span className="capitalize">{product.baseColour}</span>
          )}
        </div>

        {/* Title */}
        <Link
          to={`/products/${product.slug}`}
          className="text-sm font-medium text-black hover:underline line-clamp-1"
        >
          {product.name}
        </Link>

        {/* Price & Compare-at */}
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-sm font-semibold text-black">
            ₹{product.basePrice.toLocaleString('en-IN')}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
            <>
              <span className="text-xs text-[#8a8a8a] line-through font-normal">
                ₹{product.compareAtPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] font-bold text-[#b42318]">
                {Math.round(
                  ((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100
                )}
                % OFF
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
