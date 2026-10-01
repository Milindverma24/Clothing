import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { X, SlidersHorizontal, Check, ArrowLeft } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { ProductGrid } from '../../components/product/ProductGrid';
import { Button } from '../../components/ui/Button';

export const ShopPage: React.FC = () => {
  const { gender: routeGender } = useParams<{ gender?: string }>();
  const { products } = useShop();

  // Normalize initial gender from URL route if present (/shop/men, /shop/women, /shop/sale)
  const isSaleOnly = routeGender === 'sale';
  const initialGender =
    routeGender === 'men'
      ? 'Men'
      : routeGender === 'women'
      ? 'Women'
      : '';

  const [selectedGender, setSelectedGender] = useState<string>(initialGender);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Synchronize state immediately whenever URL route parameter changes (/shop/men, /shop/women, /shop)
  useEffect(() => {
    const targetGender =
      routeGender === 'men'
        ? 'Men'
        : routeGender === 'women'
        ? 'Women'
        : '';
    setSelectedGender(targetGender);
    setSelectedCategory('');
    setSelectedType('');
    setSelectedColor('');
    setSortBy('recommended');
  }, [routeGender]);

  // Extract filter options dynamically from catalog
  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.masterCategory?.trim()).filter(Boolean) as string[])),
    [products]
  );
  const articleTypes = useMemo(
    () => Array.from(new Set(products.map((p) => p.articleType?.trim()).filter(Boolean) as string[])),
    [products]
  );
  const colors = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    products.forEach((p) => {
      const c = p.baseColour?.trim();
      if (c && !seen.has(c.toLowerCase())) {
        seen.add(c.toLowerCase());
        list.push(c);
      }
    });
    return list.slice(0, 12);
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (isSaleOnly && (!p.badge || p.badge !== 'SALE')) {
        return false;
      }
      if (selectedGender && p.gender !== selectedGender && p.gender !== 'Unisex') {
        return false;
      }
      if (selectedCategory && p.masterCategory !== selectedCategory) {
        return false;
      }
      if (selectedType && p.articleType !== selectedType) {
        return false;
      }
      if (selectedColor && p.baseColour !== selectedColor) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.basePrice - b.basePrice;
      if (sortBy === 'price_desc') return b.basePrice - a.basePrice;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'newest') return (b.releaseYear || 0) - (a.releaseYear || 0);
      return 0; // recommended
    });
  }, [products, isSaleOnly, selectedGender, selectedCategory, selectedType, selectedColor, sortBy]);

  const clearFilters = () => {
    setSelectedGender(initialGender);
    setSelectedCategory('');
    setSelectedType('');
    setSelectedColor('');
    setSortBy('recommended');
  };

  const hasActiveFilters =
    (selectedGender && selectedGender !== initialGender) ||
    selectedCategory ||
    selectedType ||
    selectedColor;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back to Home / All Products */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-semibold text-black transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Title & Filter Bar Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 mb-8 border-b border-[#e5e5e5] gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-[#8a8a8a] block mb-1">
            CATALOG DISCOVERY
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-black">
            {isSaleOnly
              ? 'Sale & Offers'
              : routeGender
              ? `${routeGender.toUpperCase()}'S PIECES`
              : 'All Products'}
          </h1>
          <p className="text-xs text-[#5e5e5e] mt-1 font-medium">
            Showing <strong className="text-black">{filteredProducts.length}</strong> items
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-3">
          {/* Mobile Filter Trigger */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-5 py-2.5 bg-[#f4f4f4] hover:bg-[#e5e5e5] rounded-full text-xs font-semibold text-black transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters {hasActiveFilters && '•'}</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-[#f4f4f4] px-4 py-2 rounded-full">
            <span className="text-xs text-[#8a8a8a] font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-semibold text-black focus:outline-none cursor-pointer"
            >
              <option value="recommended">Recommended</option>
              <option value="newest">Newest Releases</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-[#8a8a8a] hover:text-black font-semibold underline underline-offset-4"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-8 pr-6 border-r border-[#f4f4f4]">
          {/* Gender */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
              Gender
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/shop"
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  !routeGender && (!selectedGender || selectedGender === '')
                    ? 'bg-black text-white'
                    : 'bg-[#f4f4f4] text-black hover:bg-[#e5e5e5]'
                }`}
              >
                All
              </Link>
              <Link
                to="/shop/men"
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  routeGender === 'men' || selectedGender === 'Men'
                    ? 'bg-black text-white'
                    : 'bg-[#f4f4f4] text-black hover:bg-[#e5e5e5]'
                }`}
              >
                Men
              </Link>
              <Link
                to="/shop/women"
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  routeGender === 'women' || selectedGender === 'Women'
                    ? 'bg-black text-white'
                    : 'bg-[#f4f4f4] text-black hover:bg-[#e5e5e5]'
                }`}
              >
                Women
              </Link>
            </div>
          </div>

          {/* Master Category */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
              Category
            </h3>
            <div className="flex flex-col gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                  className={`text-left text-xs py-1.5 px-3 rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === cat
                      ? 'bg-black text-white font-semibold'
                      : 'text-[#5e5e5e] hover:bg-[#f4f4f4] hover:text-black'
                  }`}
                >
                  <span>{cat}</span>
                  {selectedCategory === cat && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Product Type / Article Type */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
              Product Type
            </h3>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              {articleTypes.slice(0, 15).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(selectedType === type ? '' : type)}
                  className={`text-left text-xs py-1 px-3 rounded-lg transition-colors flex items-center justify-between ${
                    selectedType === type
                      ? 'bg-black text-white font-semibold'
                      : 'text-[#5e5e5e] hover:bg-[#f4f4f4] hover:text-black'
                  }`}
                >
                  <span>{type}</span>
                  {selectedType === type && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-black mb-3">
              Color Palette
            </h3>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(selectedColor === c ? '' : c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    selectedColor === c
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-[#e5e5e5] hover:border-black'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          <ProductGrid
            products={filteredProducts}
            emptyMessage="No products match your current filter selections. Try clearing filters."
          />
        </main>
      </div>

      {/* Mobile Filter Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="w-full max-w-sm bg-white h-full p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5] mb-6">
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-black hover:opacity-70 transition-opacity"
                  aria-label="Back to products"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <span className="font-bold text-sm uppercase text-black">Filters</span>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white transition-colors"
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Filter Options */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase text-black mb-2">Gender</h4>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/shop"
                      onClick={() => setMobileFilterOpen(false)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        !routeGender && (!selectedGender || selectedGender === '')
                          ? 'bg-black text-white'
                          : 'bg-[#f4f4f4] text-black'
                      }`}
                    >
                      All
                    </Link>
                    <Link
                      to="/shop/men"
                      onClick={() => setMobileFilterOpen(false)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        routeGender === 'men' || selectedGender === 'Men'
                          ? 'bg-black text-white'
                          : 'bg-[#f4f4f4] text-black'
                      }`}
                    >
                      Men
                    </Link>
                    <Link
                      to="/shop/women"
                      onClick={() => setMobileFilterOpen(false)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                        routeGender === 'women' || selectedGender === 'Women'
                          ? 'bg-black text-white'
                          : 'bg-[#f4f4f4] text-black'
                      }`}
                    >
                      Women
                    </Link>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-black mb-2">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          selectedCategory === cat
                            ? 'bg-black text-white'
                            : 'bg-[#f4f4f4] text-black'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase text-black mb-2">Color</h4>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(selectedColor === c ? '' : c)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          selectedColor === c
                            ? 'bg-black text-white'
                            : 'bg-[#f4f4f4] text-black'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#e5e5e5] flex gap-3">
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => {
                  clearFilters();
                  setMobileFilterOpen(false);
                }}
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => setMobileFilterOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
