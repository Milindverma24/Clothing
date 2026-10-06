import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X, Shield } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';
import { getSearchSuggestionsApi } from '../../services/searchApi';

export const Navbar: React.FC = () => {
  const { cart, wishlist, setIsCartOpen, showToast } = useShop();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isAdminUser = Boolean(
    isAuthenticated &&
    user &&
    (user.role === 'ADMIN' ||
     user.role === 'SUPER_ADMIN' ||
     user.role === 'PRODUCT_MANAGER' ||
     user.role === 'ORDER_MANAGER' ||
     user.role === 'MARKETING_MANAGER' ||
     user.role === 'SUPPORT_AGENT')
  );

  const handleSignOut = () => {
    setAccountDropdownOpen(false);
    logout();
    showToast('Signed out of account');
    navigate('/');
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(e.target as Node)
      ) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [searchOpen]);

  // Close search on route changes
  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  // Escape key to close, Cmd+K / Ctrl+K to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  // Click outside search container to close
  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

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

            <Link to="/" className="flex items-center gap-2.5 group" aria-label="Nova Home">
              <img src="/shirt.png" alt="Nova Logo" className="w-7 h-7 object-contain transition-transform group-hover:scale-105" />
              <img
                src="/nova-calligraphy.png"
                srcSet="/nova-calligraphy.png 1x, /nova-calligraphy@2x.png 2x"
                alt="Nova"
                className="h-7 w-auto object-contain transition-opacity group-hover:opacity-85"
              />
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
            {/* Search Toggle Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
                searchOpen
                  ? 'bg-black text-white shadow-xs scale-95'
                  : 'hover:bg-[#f4f4f4] text-black hover:scale-105'
              }`}
              aria-label={searchOpen ? 'Close search' : 'Search products (Press ⌘K or Esc)'}
              aria-expanded={searchOpen}
              title={searchOpen ? 'Close search (Esc)' : 'Search products (⌘K)'}
            >
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
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

            {/* User Account / Profile Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative" ref={accountDropdownRef}>
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-[#f4f4f4] transition-all text-black"
                  aria-label="Account Menu"
                  aria-expanded={accountDropdownOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user.firstName.charAt(0)}</span>
                    )}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-bold text-black max-w-[90px] truncate">
                    {user.firstName}
                  </span>
                </button>

                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#e5e5e5] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-[#f4f4f4]">
                      <p className="text-xs font-bold text-black uppercase truncate">
                        {user.firstName} {user.lastName || ''}
                      </p>
                      <p className="text-[11px] text-[#5e5e5e] truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#f4f4f4] text-black uppercase tracking-wider">
                        {user.role} Member
                      </span>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/account"
                        onClick={() => setAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-black hover:bg-[#f4f4f4] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-[#5e5e5e]" />
                        <span>My Account</span>
                      </Link>
                      <Link
                        to="/account?tab=orders"
                        onClick={() => setAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-black hover:bg-[#f4f4f4] transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-[#5e5e5e]" />
                        <span>Orders & Tracking</span>
                      </Link>
                      <Link
                        to="/account?tab=wishlist"
                        onClick={() => setAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-black hover:bg-[#f4f4f4] transition-colors"
                      >
                        <Heart className="w-3.5 h-3.5 text-[#5e5e5e]" />
                        <span>Saved Wishlist</span>
                      </Link>
                      <Link
                        to="/account?tab=addresses"
                        onClick={() => setAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-black hover:bg-[#f4f4f4] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-[#5e5e5e]" />
                        <span>Addresses</span>
                      </Link>
                      <Link
                        to="/account?tab=security"
                        onClick={() => setAccountDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-black hover:bg-[#f4f4f4] transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#5e5e5e]" />
                        <span>Security & Login</span>
                      </Link>

                      {isAdminUser && (
                        <Link
                          to="/admin"
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-black bg-[#f4f4f4] hover:bg-black hover:text-white transition-colors mt-1"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Admin Management</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-[#f4f4f4]">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-[#b91c1c] hover:bg-[#fff2f2] transition-colors flex items-center gap-2.5"
                      >
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openAuthModal('login')}
                  className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-[#f4f4f4] text-black transition-colors"
                  aria-label="Sign In"
                  title="Sign In"
                >
                  <User className="w-5 h-5" />
                </button>
                <button
                  onClick={() => openAuthModal('login')}
                  className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-[#222222] transition-all"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Admin Dashboard Entry - ONLY VISIBLE WHEN ADMIN LOGS IN */}
            {isAdminUser && (
              <Link
                to="/admin"
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-black hover:bg-[#222222] text-white rounded-full transition-all"
                title="Admin Management"
              >
                <Shield className="w-3.5 h-3.5 text-white" />
                <span>Admin</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Modern Search Overlay & Screen Backdrop */}
      {searchOpen && (
        <div className="fixed inset-0 top-[72px] z-50 overflow-hidden">
          {/* Backdrop covering the entire rest of screen - clicking anywhere closes search */}
          <div
            className="fixed inset-0 top-[72px] bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search overlay"
          />

          {/* Search Box Container */}
          <div
            ref={searchContainerRef}
            className="relative w-full bg-white border-b border-[#e5e5e5] px-4 py-5 shadow-2xl z-10 animate-in fade-in slide-in-from-top-3 duration-200"
          >
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-[#8a8a8a] pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products, categories, styles (e.g. Shirts, Jeans, Navy)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-36 py-3.5 bg-[#f4f4f4] rounded-full text-sm text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-black transition-all"
                />

                <div className="absolute right-2.5 flex items-center gap-1.5">
                  {/* Clear text button */}
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#e5e5e5] text-[#5e5e5e] transition-colors"
                      title="Clear search text"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Search submit button */}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-[#222222] transition-colors active:scale-95"
                  >
                    Search
                  </button>

                  {/* Quick Close Button with ESC badge */}
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#5e5e5e] hover:text-black hover:bg-[#f4f4f4] rounded-full transition-colors ml-0.5"
                    title="Close search (Esc)"
                    aria-label="Close search"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline-block text-[10px] font-mono text-[#8a8a8a] border border-[#d4d4d4] rounded px-1">ESC</span>
                  </button>
                </div>
              </form>

              {/* Trending Quick Suggestions when empty */}
              {!searchQuery.trim() && (
                <div className="mt-3.5 pt-3 border-t border-[#f4f4f4] flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-[#8a8a8a] uppercase tracking-wider mr-1">
                    Trending:
                  </span>
                  {['T-Shirts', 'Shirts', 'Formal Shoes', 'Casual', 'Black', 'Navy Blue', 'Accessories'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSelectSuggestion(tag)}
                      className="px-3 py-1 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-medium text-black transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}

              {/* Autocomplete Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-3 bg-white rounded-2xl shadow-xl border border-[#e5e5e5] p-2 animate-in fade-in duration-100">
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
        </div>
      )}

      {/* Fullscreen Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between p-6 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#e5e5e5]">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5" aria-label="Nova Home">
                <img src="/shirt.png" alt="Nova Logo" className="w-7 h-7 object-contain" />
                <img
                  src="/nova-calligraphy.png"
                  srcSet="/nova-calligraphy.png 1x, /nova-calligraphy@2x.png 2x"
                  alt="Nova"
                  className="h-7 w-auto object-contain"
                />
              </Link>
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
            {isAuthenticated && user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-[#f8f8f8] rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user.firstName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-black truncate">{user.firstName} {user.lastName || ''}</p>
                    <p className="text-[11px] text-[#5e5e5e] truncate">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 bg-[#f4f4f4] rounded-xl font-semibold text-center hover:bg-black hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/account?tab=orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 bg-[#f4f4f4] rounded-xl font-semibold text-center hover:bg-black hover:text-white transition-colors"
                  >
                    Orders
                  </Link>
                  <Link
                    to="/account?tab=wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 bg-[#f4f4f4] rounded-xl font-semibold text-center hover:bg-black hover:text-white transition-colors"
                  >
                    Wishlist
                  </Link>
                  <Link
                    to="/account?tab=addresses"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 bg-[#f4f4f4] rounded-xl font-semibold text-center hover:bg-black hover:text-white transition-colors"
                  >
                    Addresses
                  </Link>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  className="w-full py-2.5 bg-[#fff2f2] text-[#b91c1c] text-xs font-bold uppercase rounded-full"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="py-3 bg-black text-white text-xs font-bold uppercase rounded-full text-center hover:bg-[#222222]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('register');
                  }}
                  className="py-3 bg-[#f4f4f4] text-black text-xs font-bold uppercase rounded-full text-center hover:bg-[#e5e5e5]"
                >
                  Register
                </button>
              </div>
            )}

            {isAdminUser && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-xs font-bold uppercase text-black hover:underline flex items-center gap-2 pt-3 border-t border-[#f4f4f4]"
              >
                <Shield className="w-4 h-4 text-black" />
                <span>Admin Management Dashboard</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
};
