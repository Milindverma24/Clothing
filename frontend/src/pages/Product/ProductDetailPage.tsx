import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Star, Truck, RefreshCw, ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProductGrid } from '../../components/product/ProductGrid';

const SIZES: ('S' | 'M' | 'L' | 'XL' | 'XXL')[] = ['S', 'M', 'L', 'XL', 'XXL'];

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, addToCart, isInWishlist, toggleWishlist, showToast } = useShop();
  const { isAuthenticated, openAuthModal } = useAuth();

  const product = products.find((p) => p.slug === slug) || products[0];
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('M');
  const [selectedColor, setSelectedColor] = useState<string>(product?.baseColour || 'Black');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (product) {
      setSelectedColor(product.baseColour || 'Black');
    }
  }, [slug, product]);

  if (!product) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <h2 className="text-xl font-bold text-black mb-3">Product Not Found</h2>
        <p className="text-xs text-[#5e5e5e] mb-6">
          The requested clothing piece could not be located in our catalog.
        </p>
        <Button variant="primary" onClick={() => navigate(-1)} className="inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Button>
      </div>
    );
  }

  const isSaved = isInWishlist(product.id);
  const displayImages = product.images.length > 0 ? product.images : ['/images/15970.jpg'];

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      showToast('Please sign in to add this item to your cart');
      openAuthModal('login', () => {
        addToCart(product, selectedSize, selectedColor, 1);
      });
      return;
    }
    addToCart(product, selectedSize, selectedColor, 1);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      showToast('Please sign in to continue with instant checkout');
      openAuthModal('login', () => {
        addToCart(product, selectedSize, selectedColor, 1);
        navigate('/checkout');
      });
      return;
    }
    addToCart(product, selectedSize, selectedColor, 1);
    navigate('/checkout');
  };

  const relatedProducts = products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.masterCategory === product.masterCategory || p.gender === product.gender)
    )
    .slice(0, 4);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back Button & Breadcrumbs Row */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-semibold text-black transition-all group"
          aria-label="Back to previous page"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-2 text-xs text-[#8a8a8a] font-medium">
          <Link to="/" className="hover:text-black">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/shop/${product.gender.toLowerCase()}`} className="hover:text-black">
            {product.gender}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-black font-semibold line-clamp-1 max-w-xs">{product.name}</span>
        </nav>
      </div>

      {/* Main PDP Grid (Section 23 of design.md) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pb-16 border-b border-[#e5e5e5]">
        {/* Gallery Column (7 cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails (vertical on desktop) */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-16 h-20 md:w-20 md:h-24 rounded-xl overflow-hidden bg-[#f4f4f4] border-2 transition-all flex-shrink-0 ${
                  activeImageIndex === idx ? 'border-black' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover object-center" />
              </button>
            ))}
          </div>

          {/* Hero Main Image (4:5 Aspect Ratio) */}
          <div className="flex-1 relative aspect-[4/5] bg-[#f4f4f4] rounded-2xl overflow-hidden">
            <img
              src={displayImages[activeImageIndex] || displayImages[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {product.badge && (
              <div className="absolute top-4 left-4">
                <Badge variant={product.badge === 'LOW STOCK' ? 'low-stock' : 'black'}>
                  {product.badge}
                </Badge>
              </div>
            )}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                isSaved ? 'bg-black text-white' : 'bg-white/90 text-black hover:bg-black hover:text-white'
              }`}
              aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Information Column (5 cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-start">
          {/* Category & Rating */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a]">
              {product.gender} • {product.articleType || product.masterCategory}
            </span>
            <div className="flex items-center gap-1 text-xs font-semibold text-black">
              <Star className="w-3.5 h-3.5 fill-black text-black" />
              <span>{product.rating || '4.8'}</span>
              <span className="text-[#8a8a8a] font-normal">({product.reviewCount || 42})</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-black uppercase tracking-tight mb-3">
            {product.name}
          </h1>

          {/* Pricing */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#f4f4f4]">
            <span className="text-2xl font-extrabold text-black">
              ₹{product.basePrice.toLocaleString('en-IN')}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
              <>
                <span className="text-base text-[#8a8a8a] line-through font-normal">
                  ₹{product.compareAtPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-[#fdecec] text-[#b42318] rounded-full">
                  {Math.round(
                    ((product.compareAtPrice - product.basePrice) / product.compareAtPrice) * 100
                  )}
                  % OFF
                </span>
              </>
            )}
            <span className="text-xs text-[#8a8a8a] ml-auto">Inclusive of all taxes</span>
          </div>

          {/* Color Selector (Section 26 of design.md) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-black">
                Color: <span className="font-normal text-[#5e5e5e] capitalize">{selectedColor}</span>
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              {[product.baseColour || 'Black', 'White', 'Navy Blue', 'Grey'].slice(0, 4).map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full border border-[#e5e5e5] transition-all relative ${
                    selectedColor === c ? 'ring-2 ring-black ring-offset-2' : ''
                  }`}
                  style={{
                    backgroundColor:
                      c.toLowerCase() === 'black'
                        ? '#000000'
                        : c.toLowerCase() === 'white'
                        ? '#ffffff'
                        : c.toLowerCase() === 'navy blue'
                        ? '#1b2a47'
                        : '#8a8a8a',
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Size Selector (Section 25 of design.md) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-black">
                Select Size
              </span>
              <button className="text-xs text-[#5e5e5e] hover:text-black underline underline-offset-4 font-medium">
                Size Guide
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2.5">
              {SIZES.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`py-3 rounded-full text-xs font-bold tracking-wider transition-all duration-150 cursor-pointer ${
                    selectedSize === sz
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-white text-black border border-black hover:bg-[#f4f4f4]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Actions: Add to Bag & Buy Now (Section 90 of design.md) */}
          <div className="flex flex-col gap-3 mb-8">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleAddToCart}
            >
              Add to Bag
            </Button>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
          </div>

          {/* Guarantees & Features */}
          <div className="space-y-3.5 py-6 border-t border-b border-[#f4f4f4] text-xs text-[#5e5e5e]">
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-black flex-shrink-0" />
              <span>Free standard delivery in 3-5 business days</span>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="w-4 h-4 text-black flex-shrink-0" />
              <span>14-day exchange and return policy</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-black flex-shrink-0" />
              <span>Authentic piece tailored with heavyweight organic fabric</span>
            </div>
          </div>

          {/* Description */}
          <div className="pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-2">
              Product Overview
            </h3>
            <p className="text-sm text-[#5e5e5e] leading-relaxed mb-4">
              {product.description}
            </p>
            <ul className="list-disc list-inside text-xs text-[#5e5e5e] space-y-1.5">
              <li>Category: {product.masterCategory} / {product.subCategory}</li>
              <li>Season: {product.season || 'All Year Round'} ({product.releaseYear || 2026})</li>
              <li>Care: Machine wash cold inside out, tumble dry low</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Add To Cart Bar (Section 69 of design.md) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e5e5e5] px-4 py-3 flex items-center justify-between shadow-lg">
        <div>
          <span className="text-xs text-[#8a8a8a] block">Total</span>
          <span className="text-base font-extrabold text-black">
            ₹{product.basePrice.toLocaleString('en-IN')}
          </span>
        </div>
        <Button variant="primary" size="md" onClick={handleAddToCart} className="min-w-[150px]">
          Add to Bag
        </Button>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="pt-16 sm:pt-20">
          <h2 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-black mb-8">
            Complete The Look
          </h2>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
};
