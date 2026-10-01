import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, Shield } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { getSearchSuggestionsApi } from '../../services/searchApi';

export const Navbar: React.FC = () => {
  const { cart, wishlist, setIsCartOpen } = useShop();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const navigate = useNavigate();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!searchOpen || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const list = await getSearchSuggestionsApi(searchQuery);
        setSuggestions(list.slice(0, 5));
      } catch (err) {
        // ignore
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleSelectSuggestion = (s: string) => {
    navigate(`/search?q=${encodeURIComponent(s)}`);
    setSearchOpen(false);
    setMobileMenuOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-[#e5e5e5] h-[72px] flex items-center">
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Mobile Menu Trigger + Brand Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#f4f4f4] transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-black" />
            </button>

            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/shirt.png" alt="Company Logo" className="w-7 h-7 object-contain transition-transform group-hover:scale-105" />
              <span className="font-extrabold text-xl tracking-tight text-black uppercase">
                CLOTHING
              </span>
            </Link>
          </div>

          {/* Center: Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              to="/shop/men"
              className="text-sm font-medium text-black hover:text-[#5e5e5e] transition-colors"
            >
              Men
            </Link>
            <Link
              to="/shop/women"
              className="text-sm font-medium text-black hover:text-[#5e5e5e] transition-colors"
            >
              Women
            </Link>
            <Link
              to="/collections/new-arrivals"
              className="text-sm font-medium text-black hover:text-[#5e5e5e] transition-colors"
            >
              New Arrivals
            </Link>
            <Link
              to="/collections"
              className="text-sm font-medium text-black hover:text-[#5e5e5e] transition-colors"
            >
              Collections
            </Link>
            <Link
              to="/shop/sale"
              className="text-sm font-medium text-black hover:text-[#5e5e5e] transition-colors"
            >
              Sale
            </Link>
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#f4f4f4] text-black transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#f4f4f4] text-black transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#f4f4f4] text-black transition-colors"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Account */}
            <Link
              to="/account"
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#f4f4f4] text-black transition-colors"
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Admin Dashboard Entry */}
            <Link
              to="/admin"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#f4f4f4] hover:bg-black hover:text-white text-black rounded-full transition-all"
              title="Admin Management"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          </div>
        </div>

        {/* Search Overlay Bar */}
        {searchOpen && (
          <div className="absolute top-[72px] left-0 w-full bg-white border-b border-[#e5e5e5] px-4 py-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-[#8a8a8a]" />
                <input
                  type="text"
                  placeholder="Search products, categories, styles (e.g. Shirts, Jeans, Navy)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-12 pr-24 py-3 bg-[#f4f4f4] rounded-full text-sm text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-1 focus:ring-black"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-1.5 bg-black text-white text-xs font-medium rounded-full hover:bg-[#1a1a1a]"
                >
                  Search
                </button>
              </form>

              {/* Autocomplete Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-2 bg-white rounded-2xl shadow-xl border border-[#e5e5e5] p-2 animate-in fade-in duration-100">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a8a] px-3 py-1 block">
                    Catalog Suggestions
                  </span>
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-black hover:bg-[#f4f4f4] rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <Search className="w-3.5 h-3.5 text-[#8a8a8a]" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Fullscreen Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#e5e5e5]">
              <div className="flex items-center gap-2.5">
                <img src="/shirt.png" alt="Company Logo" className="w-7 h-7 object-contain" />
                <span className="font-extrabold text-xl tracking-tight text-black uppercase">
                  CLOTHING
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-[#f4f4f4]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#8a8a8a]" />
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-[#f4f4f4] rounded-full text-sm text-black focus:outline-none"
                />
              </div>
            </form>

            <nav className="flex flex-col gap-4 text-2xl font-bold tracking-tight">
              <Link
                to="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-[#5e5e5e]"
              >
                All Products
              </Link>
              <Link
                to="/shop/men"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-[#5e5e5e]"
              >
                Men
              </Link>
              <Link
                to="/shop/women"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-[#5e5e5e]"
              >
                Women
              </Link>
              <Link
                to="/collections"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-[#5e5e5e]"
              >
                Collections
              </Link>
              <Link
                to="/shop/sale"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-[#5e5e5e]"
              >
                Sale & Offers
              </Link>
            </nav>
          </div>

          <div className="pt-6 border-t border-[#e5e5e5] flex flex-col gap-3">
            <Link
              to="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-[#5e5e5e]"
            >
              Customer Account & Orders
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 text-sm font-medium text-black flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Management Dashboard</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
