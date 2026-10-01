import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../../components/ui/Button';

export const WishlistPage: React.FC = () => {
  const { wishlist, products, toggleWishlist, addToCart } = useShop();

  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-semibold text-black transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      <div className="pb-8 mb-8 border-b border-[#e5e5e5]">
        <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a] block mb-1">
          SAVED PIECES
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black">
          My Wishlist
        </h1>
        <p className="text-xs text-[#5e5e5e] mt-1 font-medium">
          {savedProducts.length} {savedProducts.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {savedProducts.length === 0 ? (
        <div className="py-24 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4 text-[#8a8a8a]">
            <Heart className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-black mb-2">
            Your Wishlist Is Empty
          </h2>
          <p className="text-sm text-[#5e5e5e] mb-8 leading-relaxed">
            Save pieces you want to come back to. Explore our new season releases and discover everyday movement pieces.
          </p>
          <Link to="/shop">
            <Button variant="primary" size="md">
              Explore Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {savedProducts.map((product) => (
            <div
              key={product.id}
              className="flex flex-col bg-white rounded-2xl overflow-hidden border border-[#f4f4f4] group"
            >
              <div className="relative aspect-[4/5] bg-[#f4f4f4] overflow-hidden rounded-2xl">
                <Link to={`/products/${product.slug}`}>
                  <img
                    src={product.images[0] || '/images/15970.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-black hover:bg-black hover:text-white flex items-center justify-center transition-colors shadow-sm"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 flex flex-col justify-between flex-1">
                <div>
                  <span className="text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-wider block mb-0.5">
                    {product.articleType || product.masterCategory}
                  </span>
                  <Link
                    to={`/products/${product.slug}`}
                    className="text-sm font-semibold text-black hover:underline line-clamp-1 mb-1.5"
                  >
                    {product.name}
                  </Link>
                  <span className="text-sm font-bold text-black block mb-3">
                    ₹{product.basePrice.toLocaleString('en-IN')}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  onClick={() => addToCart(product, 'M', product.baseColour || 'Black', 1)}
                  className="flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Move to Bag</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
