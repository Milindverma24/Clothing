import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ArrowLeft, SlidersHorizontal, Sparkles, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ProductGrid } from '../../components/product/ProductGrid';
import { Button } from '../../components/ui/Button';
import { searchProductsApi, getSearchSuggestionsApi, type SearchProductItem, type SearchResponseData } from '../../services/searchApi';
import type { Product } from '../../types';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryParam = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(queryParam);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filters & Sorting state
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedColor, setSelectedColor] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [page, setPage] = useState<number>(0);

  // API Data & Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchData, setSearchData] = useState<SearchResponseData | null>(null);

  // Sync searchInput when URL q param changes
  useEffect(() => {
    setSearchInput(queryParam);
    setPage(0);
  }, [queryParam]);

  // Debounced search suggestions
  useEffect(() => {
    if (searchInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const list = await getSearchSuggestionsApi(searchInput);
        setSuggestions(list.slice(0, 6));
      } catch (err) {
        console.error('Failed to fetch suggestions', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search results from Spring Boot database API
  useEffect(() => {
    let isCancelled = false;

    async function executeSearch() {
      setIsLoading(true);
      try {
        const data = await searchProductsApi({
          q: queryParam,
          gender: selectedGender,
          masterCategory: selectedCategory,
          baseColour: selectedColor,
          page,
          size: 20,
          sort: sortBy,
        });

        if (!isCancelled) {
          setSearchData(data);
        }
      } catch (err) {
        console.error('Search API request failed', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    executeSearch();

    return () => {
      isCancelled = true;
    };
  }, [queryParam, selectedGender, selectedCategory, selectedColor, sortBy, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchInput(suggestion);
    setShowSuggestions(false);
    setSearchParams({ q: suggestion });
  };

  // Convert API Search items to Product model for ProductGrid
  const products: Product[] = (searchData?.content || []).map((item: SearchProductItem) => ({
    id: item.id,
    externalProductId: item.externalProductId,
    name: item.name,
    slug: item.slug,
    description: item.description || '',
    gender: (item.gender as any) || 'Men',
    masterCategory: item.masterCategory,
    subCategory: item.subCategory || '',
    articleType: item.articleType,
    baseColour: item.baseColour,
    season: item.season,
    releaseYear: item.releaseYear,
    usage: item.usageCategory,
    basePrice: item.basePrice,
    compareAtPrice: item.compareAtPrice,
    images: item.images && item.images.length > 0 ? item.images : [item.imageUrl || '/images/15970.jpg'],
    variants: (item.availableSizes || ['S', 'M', 'L', 'XL']).map((sz, idx) => ({
      id: `${item.id}-${idx}`,
      productId: item.id,
      sku: `${item.externalProductId || item.id}-${sz}`,
      size: sz as any,
      color: item.baseColour,
      price: item.basePrice,
      stock: 20,
      status: 'ACTIVE' as const,
    })),
    status: (item.status as any) || 'ACTIVE',
    badge: (item.badge as any) || undefined,
    rating: 4.7,
    reviewCount: 42,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  const totalElements = searchData?.totalElements || 0;
  const totalPages = searchData?.totalPages || 0;
  const isFallback = searchData?.fallback || false;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-semibold text-black transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Header & Intelligent Search Bar */}
      <div className="pb-8 mb-8 border-b border-[#e5e5e5]">
        <div className="max-w-3xl">
          <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a] block mb-1">
            INTELLIGENT CATALOG SEARCH
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black mb-4">
            {queryParam ? `Search: "${queryParam}"` : 'Intelligent Product Search'}
          </h1>

          {/* Search Input with Autocomplete */}
          <div ref={searchContainerRef} className="relative mt-2">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-[#8a8a8a] pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Try 'blak shirt', 'blk tshrt', 'mens casual', 'formal shoes'..."
                className="w-full pl-12 pr-28 py-3.5 bg-[#f4f4f4] rounded-full text-sm font-medium text-black placeholder:text-[#8a8a8a] focus:outline-none focus:ring-2 focus:ring-black border border-transparent transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearchParams({});
                  }}
                  className="absolute right-20 text-[#8a8a8a] hover:text-black p-1"
                  aria-label="Clear input"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-black hover:bg-[#2a2a2a] text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all"
              >
                Search
              </button>
            </form>

            {/* Suggestions Popup */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-[#e5e5e5] p-2 z-30 animate-fade-in">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a8a] px-3 py-1.5 block">
                  Search Suggestions
                </span>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-black hover:bg-[#f4f4f4] rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-[#8a8a8a]" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Typo Tolerance or Fallback Alert Banner */}
        {isFallback && queryParam && (
          <div className="mt-4 p-4 rounded-xl bg-[#fafafa] border border-[#e5e5e5] flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-black flex-shrink-0" />
            <div className="text-xs text-[#5e5e5e]">
              <strong className="text-black block mb-0.5">No exact match for "{queryParam}"</strong>
              We used typo-tolerant fuzzy matching and AI catalog ranking to show recommended pieces below.
            </div>
          </div>
        )}
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#f4f4f4]">
        {/* Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 sm:pb-0">
          <span className="text-xs font-bold uppercase text-[#8a8a8a] flex items-center gap-1 mr-1 flex-shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Gender */}
          {['ALL', 'Men', 'Women'].map((g) => (
            <button
              key={g}
              onClick={() => {
                setSelectedGender(g);
                setPage(0);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedGender === g
                  ? 'bg-black text-white'
                  : 'bg-[#f4f4f4] text-black hover:bg-[#e5e5e5]'
              }`}
            >
              {g === 'ALL' ? 'All Genders' : g}
            </button>
          ))}

          {/* Master Category */}
          {['Apparel', 'Footwear', 'Accessories'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(selectedCategory === cat ? 'ALL' : cat);
                setPage(0);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-black text-white'
                  : 'bg-[#f4f4f4] text-black hover:bg-[#e5e5e5]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort & Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
          <span className="text-[#5e5e5e]">
            Showing <strong className="text-black">{products.length}</strong> of{' '}
            <strong className="text-black">{totalElements}</strong> pieces
          </span>

          <div className="flex items-center gap-2 bg-[#f4f4f4] px-3.5 py-1.5 rounded-full">
            <span className="text-[#8a8a8a] font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(0);
              }}
              className="bg-transparent font-bold text-black focus:outline-none cursor-pointer text-xs"
            >
              <option value="recommended">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest Releases</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-black mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider text-[#8a8a8a]">
            Searching database catalog...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4 text-[#8a8a8a]">
            <Search className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-black mb-2">
            No Catalog Matches Found
          </h2>
          <p className="text-xs text-[#5e5e5e] mb-6 leading-relaxed">
            We searched across product titles, article types, categories, and colors. Try adjusting your query or resetting filters.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchInput('');
              setSearchParams({});
              setSelectedGender('ALL');
              setSelectedCategory('ALL');
              setSelectedColor('ALL');
            }}
          >
            Reset All Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          <ProductGrid products={products} />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 border-t border-[#e5e5e5]">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-full border border-[#e5e5e5] bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-[#5e5e5e] px-4">
                Page {page + 1} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-full border border-[#e5e5e5] bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
