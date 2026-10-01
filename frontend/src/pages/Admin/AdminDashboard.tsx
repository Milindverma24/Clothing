import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Users,
  Tag,
  BarChart3,
  Shield,
  Layers,
  ArrowUpRight,
  Plus,
  Search,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  ArrowLeft,
  BookOpen,
  UploadCloud,
  RefreshCw,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../../components/ui/Button';
import { COUPONS } from '../../data/collections';
import type { Product, ProductVariant, Gender } from '../../types';
import {
  getKnowledgeDocumentsApi,
  uploadKnowledgeDocumentApi,
  reindexKnowledgeDocumentApi,
  deleteKnowledgeDocumentApi,
  type KnowledgeDocumentSummary,
} from '../../services/ragChatApi';

export const AdminDashboard: React.FC = () => {
  const { products, orders } = useShop();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'products' | 'categories' | 'inventory' | 'orders' | 'coupons' | 'analytics' | 'audit' | 'knowledge'
  >(() => {
    if (location.pathname.includes('knowledge')) return 'knowledge';
    if (location.pathname.includes('inventory')) return 'inventory';
    if (location.pathname.includes('orders')) return 'orders';
    if (location.pathname.includes('coupons')) return 'coupons';
    if (location.pathname.includes('analytics')) return 'analytics';
    if (location.pathname.includes('audit')) return 'audit';
    return 'products';
  });

  useEffect(() => {
    if (location.pathname.includes('knowledge')) {
      setActiveTab('knowledge');
    }
  }, [location.pathname]);

  // Knowledge Base State
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDocumentSummary[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [reindexingId, setReindexingId] = useState<number | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<KnowledgeDocumentSummary | null>(null);

  const fetchKnowledgeDocs = async () => {
    setIsLoadingDocs(true);
    try {
      const data = await getKnowledgeDocumentsApi();
      setKnowledgeDocs(data);
    } catch (e) {
      console.error('Failed to load knowledge documents', e);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeDocs();
  }, []);

  const handleUploadDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPdfFile) return;

    if (!selectedPdfFile.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF documents are supported for knowledge base ingestion.');
      return;
    }

    if (selectedPdfFile.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds the 15MB limit.');
      return;
    }

    setIsUploadingDoc(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      await uploadKnowledgeDocumentApi(selectedPdfFile);
      setUploadSuccess(`"${selectedPdfFile.name}" uploaded successfully. Parsing into semantic vector chunks...`);
      setSelectedPdfFile(null);
      await fetchKnowledgeDocs();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleReindex = async (docId: number) => {
    setReindexingId(docId);
    try {
      await reindexKnowledgeDocumentApi(docId);
      await fetchKnowledgeDocs();
    } catch (err) {
      console.error('Re-index failed', err);
    } finally {
      setReindexingId(null);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!documentToDelete) return;
    try {
      await deleteKnowledgeDocumentApi(documentToDelete.id);
      setDocumentToDelete(null);
      await fetchKnowledgeDocs();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // Filter & Search States
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc' | 'category'>('id');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);

  // View switch inside products tab
  const [productViewMode, setProductViewMode] = useState<'table' | 'categories'>('table');

  // Modals
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // New Product Form State
  const [newProduct, setNewProduct] = useState<{
    name: string;
    gender: Gender;
    masterCategory: string;
    subCategory: string;
    articleType: string;
    baseColour: string;
    basePrice: number;
    stock: number;
  }>({
    name: '',
    gender: 'Men',
    masterCategory: 'Apparel',
    subCategory: 'Topwear',
    articleType: 'Tshirts',
    baseColour: 'Black',
    basePrice: 1299,
    stock: 50,
  });

  // Local Product State
  const [productData, setProductData] = useState<Product[]>(products);
  const couponData = COUPONS;

  // Toggle status (Active / Archived)
  const toggleProductStatus = (id: string | number) => {
    setProductData((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE' }
          : p
      )
    );
  };

  // Stock update
  const updateStock = (productId: string | number, amount: number) => {
    setProductData((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const updatedVariants = p.variants.map((v) => ({
            ...v,
            stock: Math.max(0, v.stock + amount),
          }));
          return { ...p, variants: updatedVariants };
        }
        return p;
      })
    );
  };

  // Categories Breakdown Summary
  const categoriesSummary = useMemo(() => {
    const summary: Record<
      string,
      {
        count: number;
        activeCount: number;
        subCategories: Record<string, number>;
        articleTypes: Record<string, number>;
        avgPrice: number;
        totalValue: number;
      }
    > = {};

    productData.forEach((p) => {
      const mc = p.masterCategory?.trim() || 'Other';
      const sc = p.subCategory?.trim() || 'General';
      const at = p.articleType?.trim() || 'Standard';

      if (!summary[mc]) {
        summary[mc] = {
          count: 0,
          activeCount: 0,
          subCategories: {},
          articleTypes: {},
          avgPrice: 0,
          totalValue: 0,
        };
      }

      summary[mc].count += 1;
      if (p.status === 'ACTIVE') summary[mc].activeCount += 1;
      summary[mc].subCategories[sc] = (summary[mc].subCategories[sc] || 0) + 1;
      summary[mc].articleTypes[at] = (summary[mc].articleTypes[at] || 0) + 1;
      summary[mc].totalValue += p.basePrice;
    });

    Object.keys(summary).forEach((mc) => {
      summary[mc].avgPrice = Math.round(summary[mc].totalValue / summary[mc].count);
    });

    return summary;
  }, [productData]);

  // Available Subcategories for current selected master category
  const availableSubCategories = useMemo(() => {
    if (selectedCategory === 'ALL') {
      const allSc = new Set<string>();
      productData.forEach((p) => {
        if (p.subCategory) allSc.add(p.subCategory.trim());
      });
      return Array.from(allSc).sort();
    }
    const catData = categoriesSummary[selectedCategory];
    return catData ? Object.keys(catData.subCategories).sort() : [];
  }, [selectedCategory, categoriesSummary, productData]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return productData
      .filter((p) => {
        if (selectedCategory !== 'ALL' && p.masterCategory !== selectedCategory) {
          return false;
        }
        if (selectedSubCategory !== 'ALL' && p.subCategory !== selectedSubCategory) {
          return false;
        }
        if (selectedGender !== 'ALL' && p.gender !== selectedGender) {
          return false;
        }
        if (selectedStatus !== 'ALL' && p.status !== selectedStatus) {
          return false;
        }
        if (searchFilter.trim()) {
          const q = searchFilter.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchCat = p.masterCategory.toLowerCase().includes(q);
          const matchSub = (p.subCategory || '').toLowerCase().includes(q);
          const matchType = p.articleType.toLowerCase().includes(q);
          const matchId = String(p.externalProductId || p.id).includes(q);
          const matchColor = (p.baseColour || '').toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchSub && !matchType && !matchId && !matchColor) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'price-asc') return a.basePrice - b.basePrice;
        if (sortBy === 'price-desc') return b.basePrice - a.basePrice;
        if (sortBy === 'stock-asc') {
          const sA = a.variants.reduce((sum, v) => sum + v.stock, 0);
          const sB = b.variants.reduce((sum, v) => sum + v.stock, 0);
          return sA - sB;
        }
        if (sortBy === 'stock-desc') {
          const sA = a.variants.reduce((sum, v) => sum + v.stock, 0);
          const sB = b.variants.reduce((sum, v) => sum + v.stock, 0);
          return sB - sA;
        }
        if (sortBy === 'category') {
          return (a.masterCategory + a.subCategory).localeCompare(b.masterCategory + b.subCategory);
        }
        return Number(a.id) - Number(b.id);
      });
  }, [
    productData,
    selectedCategory,
    selectedSubCategory,
    selectedGender,
    selectedStatus,
    searchFilter,
    sortBy,
  ]);

  // Paginated Products
  const totalItems = filteredProducts.length;
  const isAllPages = pageSize === 'all';
  const effectivePageSize = isAllPages ? totalItems : (pageSize as number);
  const totalPages = isAllPages || totalItems === 0 ? 1 : Math.ceil(totalItems / effectivePageSize);
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = isAllPages ? 0 : (validCurrentPage - 1) * effectivePageSize;
  const endIndex = isAllPages ? totalItems : Math.min(startIndex + effectivePageSize, totalItems);

  const paginatedProducts = useMemo(() => {
    if (isAllPages) return filteredProducts;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, isAllPages, startIndex, endIndex]);

  // Handle Add Product Submit
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;

    const newId = Date.now();
    const productSlug = newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${newId}`;
    const sizes = ['S', 'M', 'L', 'XL'] as const;
    const variants: ProductVariant[] = sizes.map((sz) => ({
      id: `${newId}-${sz}`,
      productId: newId,
      sku: `SKU-${newId}-${sz}`,
      size: sz,
      color: newProduct.baseColour,
      price: newProduct.basePrice,
      stock: Math.round(newProduct.stock / 4),
      status: 'ACTIVE',
    }));

    const createdProduct: Product = {
      id: newId,
      externalProductId: newId,
      name: newProduct.name.trim(),
      slug: productSlug,
      description: `Premium ${newProduct.articleType} crafted for modern style and comfort.`,
      gender: newProduct.gender,
      masterCategory: newProduct.masterCategory,
      subCategory: newProduct.subCategory,
      articleType: newProduct.articleType,
      baseColour: newProduct.baseColour,
      basePrice: newProduct.basePrice,
      compareAtPrice: Math.round(newProduct.basePrice * 1.25),
      images: ['/images/15970.jpg'],
      variants,
      badge: 'NEW',
      rating: 5.0,
      reviewCount: 1,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProductData([createdProduct, ...productData]);
    setIsAddProductModalOpen(false);
    setNewProduct({
      name: '',
      gender: 'Men',
      masterCategory: 'Apparel',
      subCategory: 'Topwear',
      articleType: 'Tshirts',
      baseColour: 'Black',
      basePrice: 1299,
      stock: 50,
    });
  };

  // Quick category badge color helper
  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Apparel':
        return 'bg-black text-white';
      case 'Footwear':
        return 'bg-[#2a2a2a] text-white';
      case 'Accessories':
        return 'bg-[#404040] text-white';
      case 'Personal Care':
        return 'bg-[#555555] text-white';
      default:
        return 'bg-[#f4f4f4] text-black';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-[#e5e5e5] p-6 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#f4f4f4]">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-black" />
              <span className="font-extrabold text-sm uppercase tracking-tight text-black">
                Admin Portal
              </span>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-[11px] font-bold text-black transition-all group"
              title="Return to Customer Storefront"
              aria-label="Back to Storefront"
            >
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              <span>Store</span>
            </Link>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'products', label: 'Products', icon: Package, count: productData.length },
              { id: 'categories', label: 'Categories', icon: FolderTree, count: Object.keys(categoriesSummary).length },
              { id: 'inventory', label: 'Inventory', icon: Layers },
              { id: 'orders', label: 'Orders', icon: ShoppingCart, count: orders.length },
              { id: 'coupons', label: 'Coupons & Offers', icon: Tag },
              { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, count: knowledgeDocs.length },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'audit', label: 'Audit Logs', icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    if (item.id === 'products') {
                      setProductViewMode('table');
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                    isActive
                      ? 'bg-black text-white'
                      : 'text-[#5e5e5e] hover:bg-[#f4f4f4] hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#f4f4f4] text-black'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-[#f4f4f4] space-y-4">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[#e5e5e5] bg-white text-black hover:bg-black hover:text-white text-xs font-bold uppercase tracking-wider transition-all group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Storefront</span>
          </Link>
          <div className="text-xs text-[#8a8a8a]">
            <span className="block font-semibold text-black mb-0.5">Admin: Super Admin</span>
            <span>Security Role: SUPER_ADMIN</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto">
        {/* ========================================================
            1. DASHBOARD OVERVIEW
           ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a] block">
                  SYSTEM OVERVIEW
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
                  Store Administration
                </h1>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveTab('products');
                  setIsAddProductModalOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </Button>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] shadow-sm">
                <span className="text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider block mb-2">
                  Total Revenue
                </span>
                <span className="text-2xl font-extrabold text-black block mb-2">
                  ₹4,82,450
                </span>
                <span className="text-xs text-[#167a45] font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% from last month
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] shadow-sm">
                <span className="text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider block mb-2">
                  Orders Completed
                </span>
                <span className="text-2xl font-extrabold text-black block mb-2">
                  {1248 + orders.length}
                </span>
                <span className="text-xs text-[#167a45] font-semibold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +8.6% this week
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] shadow-sm">
                <span className="text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider block mb-2">
                  Catalog Products
                </span>
                <span className="text-2xl font-extrabold text-black block mb-2">
                  {productData.length}
                </span>
                <span className="text-xs text-[#167a45] font-medium">
                  {Object.keys(categoriesSummary).length} Master Categories
                </span>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#e5e5e5] shadow-sm">
                <span className="text-xs font-semibold text-[#8a8a8a] uppercase tracking-wider block mb-2">
                  Active Categories
                </span>
                <span className="text-2xl font-extrabold text-black block mb-2">
                  {Object.keys(categoriesSummary).length}
                </span>
                <span className="text-xs text-[#8a8a8a]">
                  Apparel, Footwear, Accessories, Personal Care
                </span>
              </div>
            </div>

            {/* Category Distribution Highlights */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-black">
                  Catalog Category Breakdown
                </h3>
                <button
                  onClick={() => setActiveTab('categories')}
                  className="text-xs font-bold text-black hover:underline flex items-center gap-1"
                >
                  View All Categories <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(categoriesSummary).map(([catName, catData]) => (
                  <div
                    key={catName}
                    onClick={() => {
                      setSelectedCategory(catName);
                      setActiveTab('products');
                    }}
                    className="p-4 rounded-xl bg-[#f8f8f8] hover:bg-[#f0f0f0] transition-colors cursor-pointer border border-[#e5e5e5]"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs uppercase text-black">{catName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-black text-white rounded-full">
                        {catData.count}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8a8a8a] block">
                      {Object.keys(catData.subCategories).length} subcategories
                    </span>
                    <span className="text-xs font-semibold text-black mt-2 block">
                      Avg: ₹{catData.avgPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Store Orders */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-black mb-4">
                Recent Store Orders
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f4f4f4] text-[#5e5e5e] font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-4 rounded-l-lg">Order ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4f4f4]">
                    {orders.slice(0, 5).map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#fcfcfc]">
                        <td className="py-3 px-4 font-bold text-black">{ord.id}</td>
                        <td className="py-3 px-4">{ord.customerName}</td>
                        <td className="py-3 px-4">{ord.items.length} items</td>
                        <td className="py-3 px-4 font-bold">₹{ord.total.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 bg-[#e8f5ee] text-[#167a45] rounded-full text-[10px] font-bold">
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-[#8a8a8a]">
                          No orders placed yet. Products added through checkout will appear here.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            2. PRODUCTS SECTION (SHOWS ALL PRODUCTS + CATEGORIES)
           ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Header & Main Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a] block">
                  CATALOG & INVENTORY CONTROL
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
                    Products
                  </h1>
                  <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
                    {totalItems} of {productData.length} items
                  </span>
                </div>
              </div>

              {/* View Switch & Add Product */}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-[#f0f0f0] p-1 rounded-full border border-[#e5e5e5]">
                  <button
                    onClick={() => setProductViewMode('table')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
                      productViewMode === 'table'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-[#5e5e5e] hover:text-black'
                    }`}
                  >
                    All Products Table
                  </button>
                  <button
                    onClick={() => setProductViewMode('categories')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${
                      productViewMode === 'categories'
                        ? 'bg-white text-black shadow-sm'
                        : 'text-[#5e5e5e] hover:text-black'
                    }`}
                  >
                    Category View
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </Button>
              </div>
            </div>

            {/* MASTER CATEGORY FILTER CHIPS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {(selectedCategory !== 'ALL' || selectedSubCategory !== 'ALL') && (
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedSubCategory('ALL');
                    setCurrentPage(1);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase bg-black text-white hover:bg-[#2a2a2a] transition-all group flex-shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  <span>Back to All Categories</span>
                </button>
              )}
              <span className="text-xs font-bold uppercase text-[#8a8a8a] flex items-center gap-1 mr-1 flex-shrink-0">
                <FolderTree className="w-3.5 h-3.5" /> Category:
              </span>
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedSubCategory('ALL');
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-white border border-[#e5e5e5] text-black hover:border-black'
                }`}
              >
                All Products ({productData.length})
              </button>

              {Object.entries(categoriesSummary).map(([catName, catData]) => (
                <button
                  key={catName}
                  onClick={() => {
                    setSelectedCategory(catName);
                    setSelectedSubCategory('ALL');
                    setCurrentPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    selectedCategory === catName
                      ? 'bg-black text-white shadow-sm'
                      : 'bg-white border border-[#e5e5e5] text-black hover:border-black'
                  }`}
                >
                  <span>{catName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selectedCategory === catName ? 'bg-white/20 text-white' : 'bg-[#f0f0f0] text-[#5e5e5e]'
                    }`}
                  >
                    {catData.count}
                  </span>
                </button>
              ))}
            </div>

            {/* SECONDARY FILTERS & SEARCH ROW */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-4 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Search */}
                <div className="relative lg:col-span-2">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[#8a8a8a]" />
                  <input
                    type="text"
                    placeholder="Search by name, category, SKU, ID..."
                    value={searchFilter}
                    onChange={(e) => {
                      setSearchFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-xs text-black focus:outline-none focus:border-black transition-colors"
                  />
                  {searchFilter && (
                    <button
                      onClick={() => setSearchFilter('')}
                      className="absolute right-3 top-2.5 text-[#8a8a8a] hover:text-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Subcategory Filter */}
                <div>
                  <select
                    value={selectedSubCategory}
                    onChange={(e) => {
                      setSelectedSubCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-xs text-black focus:outline-none focus:border-black"
                  >
                    <option value="ALL">All Subcategories</option>
                    {availableSubCategories.map((sc) => (
                      <option key={sc} value={sc}>
                        {sc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gender Filter */}
                <div>
                  <select
                    value={selectedGender}
                    onChange={(e) => {
                      setSelectedGender(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-xs text-black focus:outline-none focus:border-black"
                  >
                    <option value="ALL">All Genders</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-xs text-black focus:outline-none focus:border-black"
                  >
                    <option value="id">Sort: Default (ID)</option>
                    <option value="name">Sort: Name (A-Z)</option>
                    <option value="category">Sort: Category</option>
                    <option value="price-asc">Sort: Price (Low → High)</option>
                    <option value="price-desc">Sort: Price (High → Low)</option>
                    <option value="stock-desc">Sort: Stock (Highest)</option>
                    <option value="stock-asc">Sort: Stock (Lowest)</option>
                  </select>
                </div>
              </div>

              {/* Status and Items Per Page bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#f4f4f4] text-xs">
                {/* Status Pills */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#8a8a8a]">Status:</span>
                  {['ALL', 'ACTIVE', 'ARCHIVED'].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setSelectedStatus(st);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
                        selectedStatus === st
                          ? 'bg-black text-white'
                          : 'bg-[#f4f4f4] text-[#5e5e5e] hover:bg-[#e5e5e5] hover:text-black'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Items Per Page Selector */}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#8a8a8a]">Display:</span>
                  {[25, 50, 100, 'all'].map((size) => (
                    <button
                      key={String(size)}
                      onClick={() => {
                        setPageSize(size as any);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
                        pageSize === size
                          ? 'bg-black text-white'
                          : 'bg-[#f4f4f4] text-[#5e5e5e] hover:bg-[#e5e5e5] hover:text-black'
                      }`}
                    >
                      {size === 'all' ? `Show All (${totalItems})` : `${size} / page`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* VIEW MODE 1: CATEGORY BREAKDOWN VIEW */}
            {productViewMode === 'categories' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(categoriesSummary).map(([catName, catData]) => (
                  <div
                    key={catName}
                    className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-[#f4f4f4]">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${getCategoryBadgeClass(
                              catName
                            )}`}
                          >
                            {catName[0]}
                          </span>
                          <div>
                            <h2 className="font-extrabold text-base uppercase tracking-tight text-black">
                              {catName}
                            </h2>
                            <span className="text-xs text-[#8a8a8a]">
                              {catData.activeCount} active • {catData.count} total products
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-bold px-3 py-1 bg-black text-white rounded-full">
                          {catData.count} items
                        </span>
                      </div>

                      {/* Subcategories list */}
                      <div className="py-4">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-[#8a8a8a] block mb-2">
                          Sub-Categories Breakdown
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(catData.subCategories).map(([subName, subCount]) => (
                            <button
                              key={subName}
                              onClick={() => {
                                setSelectedCategory(catName);
                                setSelectedSubCategory(subName);
                                setProductViewMode('table');
                                setCurrentPage(1);
                              }}
                              className="px-2.5 py-1 bg-[#f4f4f4] hover:bg-black hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                            >
                              <span>{subName}</span>
                              <span className="text-[10px] font-bold opacity-70">({subCount})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#f4f4f4] flex items-center justify-between">
                      <span className="text-xs text-[#5e5e5e]">
                        Average Price: <strong className="text-black">₹{catData.avgPrice.toLocaleString('en-IN')}</strong>
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(catName);
                          setSelectedSubCategory('ALL');
                          setProductViewMode('table');
                          setCurrentPage(1);
                        }}
                        className="text-xs"
                      >
                        Browse All {catName}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW MODE 2: FULL PRODUCTS TABLE */}
            {productViewMode === 'table' && (
              <div className="space-y-4">
                {(selectedCategory !== 'ALL' || selectedSubCategory !== 'ALL') && (
                  <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-[#e5e5e5] shadow-xs">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[#8a8a8a] uppercase font-bold tracking-wider">Filtered:</span>
                      <span className="font-extrabold text-black uppercase bg-[#f4f4f4] px-2.5 py-0.5 rounded-md">
                        {selectedCategory}
                        {selectedSubCategory !== 'ALL' && ` › ${selectedSubCategory}`}
                      </span>
                      <span className="text-[#8a8a8a]">({totalItems} matching items)</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedCategory('ALL');
                        setSelectedSubCategory('ALL');
                        setCurrentPage(1);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5e5e5e] hover:text-black group transition-colors px-2.5 py-1 rounded-full hover:bg-[#f4f4f4]"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                      <span>Back to All Products</span>
                    </button>
                  </div>
                )}
                <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#f4f4f4] text-[#5e5e5e] font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4 w-12 text-center">#</th>
                          <th className="py-3.5 px-4 min-w-[280px]">Product Item</th>
                          <th className="py-3.5 px-4 min-w-[200px]">Category & Subcategory</th>
                          <th className="py-3.5 px-4">Gender</th>
                          <th className="py-3.5 px-4">Base Price</th>
                          <th className="py-3.5 px-4">Stock</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e5e5]">
                        {paginatedProducts.map((p, index) => {
                          const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                          const rowNumber = startIndex + index + 1;

                          return (
                            <tr key={p.id} className="hover:bg-[#fcfcfc] transition-colors group">
                              <td className="py-3 px-4 text-center text-[#8a8a8a] font-mono text-[11px]">
                                {rowNumber}
                              </td>

                              {/* Product Item Info */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={p.images[0] || '/images/15970.jpg'}
                                    alt={p.name}
                                    className="w-12 h-14 object-cover rounded-lg bg-[#f4f4f4] border border-[#e5e5e5] flex-shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <button
                                      onClick={() => setSelectedProductForModal(p)}
                                      className="font-bold text-black text-xs hover:underline block truncate max-w-xs text-left"
                                    >
                                      {p.name}
                                    </button>
                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8a8a8a]">
                                      <span>ID: {p.externalProductId || p.id}</span>
                                      {p.baseColour && (
                                        <>
                                          <span>•</span>
                                          <span>{p.baseColour}</span>
                                        </>
                                      )}
                                      {p.badge && (
                                        <>
                                          <span>•</span>
                                          <span className="font-bold text-black uppercase">{p.badge}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Category & Subcategory Column */}
                              <td className="py-3 px-4">
                                <div className="flex flex-col gap-1 items-start">
                                  {/* Master Category Pill Badge */}
                                  <button
                                    onClick={() => {
                                      setSelectedCategory(p.masterCategory);
                                      setCurrentPage(1);
                                    }}
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-opacity hover:opacity-80 ${getCategoryBadgeClass(
                                      p.masterCategory
                                    )}`}
                                  >
                                    {p.masterCategory}
                                  </button>

                                  {/* Subcategory & Article Type */}
                                  <div className="flex items-center gap-1 text-[11px] text-[#5e5e5e]">
                                    <button
                                      onClick={() => {
                                        setSelectedCategory(p.masterCategory);
                                        setSelectedSubCategory(p.subCategory || 'ALL');
                                        setCurrentPage(1);
                                      }}
                                      className="hover:text-black hover:underline"
                                    >
                                      {p.subCategory || 'General'}
                                    </button>
                                    <span className="text-[#8a8a8a]">/</span>
                                    <span className="text-[#8a8a8a]">{p.articleType}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Gender */}
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 bg-[#f4f4f4] rounded-full text-[11px] font-medium text-black">
                                  {p.gender}
                                </span>
                              </td>

                              {/* Base Price */}
                              <td className="py-3 px-4 font-bold text-black text-xs">
                                ₹{p.basePrice.toLocaleString('en-IN')}
                              </td>

                              {/* Stock */}
                              <td className="py-3 px-4">
                                <div>
                                  <span
                                    className={`font-semibold text-xs block ${
                                      totalStock === 0
                                        ? 'text-[#b42318]'
                                        : totalStock < 20
                                        ? 'text-[#a15c00]'
                                        : 'text-black'
                                    }`}
                                  >
                                    {totalStock} units
                                  </span>
                                  <span className="text-[10px] text-[#8a8a8a]">
                                    {p.variants.length} variants
                                  </span>
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                                    p.status === 'ACTIVE'
                                      ? 'bg-[#e8f5ee] text-[#167a45]'
                                      : 'bg-[#f4f4f4] text-[#8a8a8a]'
                                  }`}
                                >
                                  {p.status || 'ACTIVE'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedProductForModal(p)}
                                  className="p-1.5 hover:bg-[#f4f4f4] rounded-full text-[#5e5e5e] hover:text-black transition-colors"
                                  title="View Details"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => toggleProductStatus(p.id)}
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                                    p.status === 'ACTIVE'
                                      ? 'bg-[#f4f4f4] hover:bg-black hover:text-white text-black'
                                      : 'bg-black text-white hover:bg-[#2a2a2a]'
                                  }`}
                                >
                                  {p.status === 'ACTIVE' ? 'Archive' : 'Activate'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {paginatedProducts.length === 0 && (
                          <tr>
                            <td colSpan={8} className="py-12 text-center">
                              <Package className="w-10 h-10 text-[#8a8a8a] mx-auto mb-2 opacity-50" />
                              <p className="font-bold text-black text-sm">No products found</p>
                              <p className="text-xs text-[#8a8a8a] mt-1">
                                Try adjusting your search query, category, or status filters.
                              </p>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setSelectedCategory('ALL');
                                  setSelectedSubCategory('ALL');
                                  setSelectedGender('ALL');
                                  setSelectedStatus('ALL');
                                  setSearchFilter('');
                                }}
                                className="mt-4"
                              >
                                Reset All Filters
                              </Button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* FULL PAGINATION CONTROLS */}
                  {totalItems > 0 && (
                    <div className="p-4 border-t border-[#e5e5e5] bg-[#fafafa] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                      {/* Range Indicator */}
                      <div className="text-[#5e5e5e]">
                        Showing <strong className="text-black">{startIndex + 1}</strong> to{' '}
                        <strong className="text-black">{endIndex}</strong> of{' '}
                        <strong className="text-black">{totalItems}</strong> products
                        {selectedCategory !== 'ALL' && ` in ${selectedCategory}`}
                      </div>

                      {/* Pagination Controls */}
                      {!isAllPages && totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={validCurrentPage === 1}
                            className="p-1.5 rounded-full border border-[#e5e5e5] bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all"
                            aria-label="Previous Page"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {/* Dynamic page numbers */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum = validCurrentPage;
                            if (validCurrentPage <= 3) {
                              pageNum = i + 1;
                            } else if (validCurrentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = validCurrentPage - 2 + i;
                            }
                            if (pageNum < 1 || pageNum > totalPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-7 h-7 rounded-full text-xs font-bold transition-all ${
                                  validCurrentPage === pageNum
                                    ? 'bg-black text-white'
                                    : 'bg-white border border-[#e5e5e5] text-black hover:border-black'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          {totalPages > 5 && validCurrentPage < totalPages - 2 && (
                            <span className="px-1 text-[#8a8a8a]">...</span>
                          )}

                          {totalPages > 5 && validCurrentPage < totalPages - 2 && (
                            <button
                              onClick={() => setCurrentPage(totalPages)}
                              className="w-7 h-7 rounded-full text-xs font-bold bg-white border border-[#e5e5e5] text-black hover:border-black"
                            >
                              {totalPages}
                            </button>
                          )}

                          <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={validCurrentPage === totalPages}
                            className="p-1.5 rounded-full border border-[#e5e5e5] bg-white text-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-all"
                            aria-label="Next Page"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Quick "Show All" toggle */}
                      <div>
                        {pageSize !== 'all' ? (
                          <button
                            onClick={() => {
                              setPageSize('all');
                              setCurrentPage(1);
                            }}
                            className="font-bold text-black hover:underline"
                          >
                            Show All {totalItems} Items on One Page
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setPageSize(50);
                              setCurrentPage(1);
                            }}
                            className="font-bold text-black hover:underline"
                          >
                            Switch to Paginated View (50 / page)
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            3. DEDICATED CATEGORIES TAB (FULL CATEGORY DIRECTORY)
           ======================================================== */}
        {activeTab === 'categories' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a] block">
                  HIERARCHY & CLASSIFICATION
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
                  Category Directory ({Object.keys(categoriesSummary).length} Master Categories)
                </h1>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setActiveTab('products');
                }}
              >
                Browse All Products
              </Button>
            </div>

            {/* Master Category Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(categoriesSummary).map(([catName, catData]) => (
                <div
                  key={catName}
                  className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-[#f4f4f4]">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-base ${getCategoryBadgeClass(
                            catName
                          )}`}
                        >
                          {catName[0]}
                        </span>
                        <div>
                          <h2 className="font-extrabold text-lg uppercase tracking-tight text-black">
                            {catName}
                          </h2>
                          <span className="text-xs text-[#8a8a8a]">
                            {catData.count} total items • {catData.activeCount} active in catalog
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 bg-black text-white rounded-full">
                        {catData.count} SKUs
                      </span>
                    </div>

                    {/* Subcategories pill tags */}
                    <div className="py-5">
                      <span className="text-xs uppercase font-bold tracking-wider text-[#8a8a8a] block mb-3">
                        Sub-Categories & Article Types ({Object.keys(catData.subCategories).length}):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(catData.subCategories).map(([subName, subCount]) => (
                          <button
                            key={subName}
                            onClick={() => {
                              setSelectedCategory(catName);
                              setSelectedSubCategory(subName);
                              setActiveTab('products');
                              setCurrentPage(1);
                            }}
                            className="px-3 py-1.5 bg-[#f4f4f4] hover:bg-black hover:text-white rounded-full text-xs font-medium transition-all flex items-center gap-2 group"
                          >
                            <span>{subName}</span>
                            <span className="px-1.5 py-0.2 bg-white group-hover:bg-white/20 text-black group-hover:text-white text-[10px] font-bold rounded-full">
                              {subCount}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#f4f4f4] flex items-center justify-between">
                    <span className="text-xs text-[#5e5e5e]">
                      Average Retail Price: <strong className="text-black">₹{catData.avgPrice.toLocaleString('en-IN')}</strong>
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(catName);
                        setSelectedSubCategory('ALL');
                        setActiveTab('products');
                        setCurrentPage(1);
                      }}
                    >
                      View All {catName} ({catData.count})
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Hierarchical Tree Table */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-black mb-4">
                Full Category Taxonomy
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f4f4f4] text-[#5e5e5e] font-semibold uppercase">
                    <tr>
                      <th className="py-3 px-4">Master Category</th>
                      <th className="py-3 px-4">Subcategory</th>
                      <th className="py-3 px-4">Total Products</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Quick Filter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f4f4f4]">
                    {Object.entries(categoriesSummary).flatMap(([masterCat, catData]) =>
                      Object.entries(catData.subCategories).map(([subCat, count], idx) => (
                        <tr key={`${masterCat}-${subCat}`} className="hover:bg-[#fcfcfc]">
                          <td className="py-2.5 px-4 font-bold text-black">
                            {idx === 0 ? masterCat : ''}
                          </td>
                          <td className="py-2.5 px-4 text-[#5e5e5e] font-medium">{subCat}</td>
                          <td className="py-2.5 px-4 font-bold text-black">{count} items</td>
                          <td className="py-2.5 px-4">
                            <span className="px-2 py-0.5 bg-[#e8f5ee] text-[#167a45] rounded-full text-[10px] font-bold">
                              ACTIVE
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedCategory(masterCat);
                                setSelectedSubCategory(subCat);
                                setActiveTab('products');
                                setCurrentPage(1);
                              }}
                              className="text-xs font-bold text-black hover:underline"
                            >
                              View Products →
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            4. INVENTORY MANAGEMENT (STOCK CONTROLS)
           ======================================================== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="pb-6 border-b border-[#e5e5e5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a] block">
                  STOCK CONTROL & REORDERING
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
                  Inventory Levels ({productData.length} Products)
                </h1>
              </div>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#8a8a8a]" />
                <input
                  type="text"
                  placeholder="Filter inventory..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#e5e5e5] rounded-full text-xs text-black focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f4f4f4] text-[#5e5e5e] font-semibold uppercase">
                  <tr>
                    <th className="py-3.5 px-4">Product Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Available Stock</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {productData
                    .filter((p) => p.name.toLowerCase().includes(searchFilter.toLowerCase()))
                    .slice(0, 100)
                    .map((p) => {
                      const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
                      return (
                        <tr key={p.id} className="hover:bg-[#fcfcfc]">
                          <td className="py-3 px-4 font-bold text-black">
                            <div className="flex items-center gap-2">
                              <img
                                src={p.images[0] || '/images/15970.jpg'}
                                alt=""
                                className="w-8 h-10 object-cover rounded bg-[#f4f4f4]"
                              />
                              <span>{p.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[#5e5e5e]">
                            {p.masterCategory} • {p.subCategory}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-black">
                            {totalStock} units
                          </td>
                          <td className="py-3 px-4">
                            {totalStock === 0 ? (
                              <span className="px-2 py-0.5 bg-[#fdecec] text-[#b42318] rounded-full text-[10px] font-bold">
                                Out of stock
                              </span>
                            ) : totalStock < 20 ? (
                              <span className="px-2 py-0.5 bg-[#fef3eb] text-[#a15c00] rounded-full text-[10px] font-bold">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#e8f5ee] text-[#167a45] rounded-full text-[10px] font-bold">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => updateStock(p.id, 10)}
                              className="px-2.5 py-1 bg-[#f4f4f4] hover:bg-black hover:text-white rounded-full font-semibold transition-all"
                            >
                              +10 Restock
                            </button>
                            <button
                              onClick={() => updateStock(p.id, -10)}
                              className="px-2.5 py-1 bg-[#f4f4f4] hover:bg-black hover:text-white rounded-full font-semibold transition-all"
                            >
                              -10 Sold
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            5. ORDERS MANAGEMENT
           ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-[#e5e5e5]">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a] block">
                  ORDER FULFILLMENT
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
                  Customer Orders ({orders.length})
                </h1>
              </div>
            </div>

            <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f4f4f4] text-[#5e5e5e] font-semibold uppercase">
                  <tr>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Address</th>
                    <th className="py-3.5 px-4">Items Count</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#fcfcfc]">
                      <td className="py-3.5 px-4 font-mono font-bold text-black">{ord.id}</td>
                      <td className="py-3.5 px-4 font-medium">{ord.customerName}</td>
                      <td className="py-3.5 px-4 text-[#5e5e5e]">
                        {ord.shippingAddress.city}, {ord.shippingAddress.state}
                      </td>
                      <td className="py-3.5 px-4">{ord.items.length} items</td>
                      <td className="py-3.5 px-4 font-bold text-black">
                        ₹{ord.total.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 bg-[#e8f5ee] text-[#167a45] rounded-full text-[10px] font-bold">
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#8a8a8a]">
                        No active orders recorded yet. Place an order on the storefront to test order tracking.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            6. COUPONS MANAGEMENT
           ======================================================== */}
        {activeTab === 'coupons' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-[#e5e5e5]">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a] block">
                  PROMOTIONS & DISCOUNTS
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
                  Coupon Management
                </h1>
              </div>
            </div>

            <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f4f4f4] text-[#5e5e5e] font-semibold uppercase">
                  <tr>
                    <th className="py-3.5 px-4">Coupon Code</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Discount Value</th>
                    <th className="py-3.5 px-4">Min. Cart Value</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e5e5]">
                  {couponData.map((c) => (
                    <tr key={c.code} className="hover:bg-[#fcfcfc]">
                      <td className="py-3 px-4 font-mono font-bold text-black">{c.code}</td>
                      <td className="py-3 px-4 capitalize">{c.type.toLowerCase().replace('_', ' ')}</td>
                      <td className="py-3 px-4 font-semibold text-black">
                        {c.type === 'PERCENTAGE' ? `${c.value}%` : c.type === 'FIXED_AMOUNT' ? `₹${c.value}` : 'Free'}
                      </td>
                      <td className="py-3 px-4">₹{c.minimumCartValue || 0}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 bg-[#e8f5ee] text-[#167a45] rounded-full text-[10px] font-bold">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            6.5 KNOWLEDGE BASE (RAG AI DOCUMENTS)
           ======================================================== */}
        {activeTab === 'knowledge' && (
          <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#8a8a8a] block">
                  RAG DOCUMENT INTELLIGENCE
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
                    Knowledge Base
                  </h1>
                  <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full">
                    {knowledgeDocs.length} Documents
                  </span>
                </div>
                <p className="text-xs text-[#5e5e5e] mt-1 font-medium">
                  Manage policy documents and manuals parsed into semantic vector chunks for the customer RAG chatbot.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchKnowledgeDocs}
                  disabled={isLoadingDocs}
                  className="flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>

            {/* Upload New Document Card */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-tight text-black flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-black" />
                  <span>Upload Knowledge Document (PDF)</span>
                </h3>
                <p className="text-xs text-[#5e5e5e] mt-0.5">
                  Uploaded files are automatically cleaned, chunked into passages, and indexed with dense semantic embeddings.
                </p>
              </div>

              {uploadError && (
                <div className="p-3 bg-[#fee4e2] text-[#d92d20] rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-[#e8f5ee] text-[#167a45] rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUploadDocumentSubmit} className="flex flex-col sm:flex-row items-center gap-3">
                <label className="flex-1 w-full flex items-center justify-between px-4 py-3 border border-dashed border-[#e5e5e5] hover:border-black rounded-xl cursor-pointer bg-[#fafafa] transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[#8a8a8a]" />
                    <div className="text-left text-xs">
                      <span className="font-bold text-black block">
                        {selectedPdfFile ? selectedPdfFile.name : 'Select a PDF document...'}
                      </span>
                      <span className="text-[10px] text-[#8a8a8a]">
                        {selectedPdfFile
                          ? `${(selectedPdfFile.size / 1024).toFixed(1)} KB`
                          : 'PDF only, maximum 15MB'}
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedPdfFile(e.target.files[0]);
                        setUploadError(null);
                        setUploadSuccess(null);
                      }
                    }}
                  />
                  <span className="px-3 py-1 bg-white border border-[#e5e5e5] rounded-full text-[11px] font-bold text-black shadow-xs">
                    Browse
                  </span>
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!selectedPdfFile || isUploadingDoc}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {isUploadingDoc ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Ingest Document</span>
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Document Table */}
            <div className="bg-white border border-[#e5e5e5] rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f4f4f4] text-[#5e5e5e] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 min-w-[240px]">Document Name</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-center">Vector Chunks</th>
                      <th className="py-3.5 px-4">File Size</th>
                      <th className="py-3.5 px-4">Uploaded Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e5e5e5]">
                    {knowledgeDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-[#fcfcfc] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#f4f4f4] flex items-center justify-center text-black flex-shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-extrabold text-black block">{doc.originalFileName}</span>
                              <span className="text-[10px] text-[#8a8a8a]">ID: #{doc.id} • {doc.uploadedBy}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {doc.status === 'INDEXED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#e8f5ee] text-[#167a45] rounded-full text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>INDEXED</span>
                            </span>
                          )}
                          {doc.status === 'PROCESSING' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#fef6ee] text-[#b54708] rounded-full text-[10px] font-bold">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>PROCESSING</span>
                            </span>
                          )}
                          {doc.status === 'FAILED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#fee4e2] text-[#d92d20] rounded-full text-[10px] font-bold" title={doc.errorMessage || 'Error'}>
                              <AlertCircle className="w-3 h-3" />
                              <span>FAILED</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 bg-[#f4f4f4] text-black rounded-full text-xs font-bold">
                            {doc.chunkCount} chunks
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#5e5e5e]">
                          {(doc.fileSize / 1024).toFixed(1)} KB
                        </td>
                        <td className="py-3.5 px-4 text-[#5e5e5e]">
                          {new Date(doc.createdAt).toLocaleDateString([], {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleReindex(doc.id)}
                              disabled={reindexingId === doc.id}
                              className="p-1.5 rounded-full hover:bg-[#f4f4f4] text-[#5e5e5e] hover:text-black transition-colors"
                              title="Re-index Document"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${reindexingId === doc.id ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                              onClick={() => setDocumentToDelete(doc)}
                              className="p-1.5 rounded-full hover:bg-[#fee4e2] text-[#8a8a8a] hover:text-[#d92d20] transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {knowledgeDocs.length === 0 && !isLoadingDocs && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#8a8a8a]">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p className="font-bold text-black text-sm">No knowledge documents uploaded yet</p>
                          <p className="text-xs text-[#8a8a8a] mt-1">Upload PDF store policies above to power the RAG AI chatbot.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delete Confirmation Modal */}
            {documentToDelete && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#e5e5e5]">
                  <div className="flex items-center gap-3 text-[#d92d20]">
                    <div className="w-10 h-10 rounded-full bg-[#fee4e2] flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-black">Confirm Deletion</h3>
                      <p className="text-xs text-[#5e5e5e]">This action cannot be undone.</p>
                    </div>
                  </div>

                  <p className="text-xs text-[#5e5e5e] leading-relaxed">
                    Are you sure you want to delete <strong className="text-black">{documentToDelete.originalFileName}</strong>? All associated {documentToDelete.chunkCount} vector passages will be permanently purged from the AI knowledge base.
                  </p>

                  <div className="flex justify-end gap-2 pt-2 border-t border-[#e5e5e5]">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setDocumentToDelete(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleDeleteConfirmed}
                      className="bg-[#d92d20] hover:bg-[#b42318] text-white border-transparent"
                    >
                      Delete Document
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            7. ANALYTICS & AUDIT LOGS
           ======================================================== */}
        {(activeTab === 'analytics' || activeTab === 'audit') && (
          <div className="bg-white border border-[#e5e5e5] rounded-2xl p-8 text-center">
            <Shield className="w-10 h-10 text-black mx-auto mb-3" />
            <h2 className="text-xl font-bold uppercase tracking-tight text-black mb-1">
              {activeTab === 'analytics' ? 'Executive Analytics' : 'Audit Logs'}
            </h2>
            <p className="text-xs text-[#5e5e5e] max-w-sm mx-auto">
              {activeTab === 'analytics'
                ? 'Telemetry tracks conversion rate at 3.2% with average order value of ₹2,140 across all 4 product categories.'
                : 'Sensitive administrator actions and catalog inventory modifications are logged with immutable audit timestamps.'}
            </p>
          </div>
        )}
      </main>

      {/* ========================================================
          MODAL: PRODUCT QUICK VIEW & EDIT
         ======================================================== */}
      {selectedProductForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-[#e5e5e5]">
            <div className="flex items-center justify-between pb-4 border-b border-[#e5e5e5]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#8a8a8a] block">
                  PRODUCT DETAILS
                </span>
                <h3 className="font-extrabold text-lg text-black">{selectedProductForModal.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedProductForModal(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-semibold text-black transition-all group"
                  aria-label="Back to Product List"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setSelectedProductForModal(null)}
                  className="w-8 h-8 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Product Image */}
              <div className="aspect-[4/5] rounded-xl overflow-hidden bg-[#f4f4f4] border border-[#e5e5e5]">
                <img
                  src={selectedProductForModal.images[0] || '/images/15970.jpg'}
                  alt={selectedProductForModal.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#8a8a8a] block font-semibold">Master Category</span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${getCategoryBadgeClass(
                      selectedProductForModal.masterCategory
                    )}`}
                  >
                    {selectedProductForModal.masterCategory}
                  </span>
                </div>

                <div>
                  <span className="text-[#8a8a8a] block font-semibold">Subcategory & Type</span>
                  <span className="font-bold text-black">
                    {selectedProductForModal.subCategory} • {selectedProductForModal.articleType}
                  </span>
                </div>

                <div>
                  <span className="text-[#8a8a8a] block font-semibold">Gender & Base Color</span>
                  <span className="font-bold text-black">
                    {selectedProductForModal.gender} • {selectedProductForModal.baseColour || 'Standard'}
                  </span>
                </div>

                <div>
                  <span className="text-[#8a8a8a] block font-semibold">Retail Price</span>
                  <span className="font-extrabold text-base text-black">
                    ₹{selectedProductForModal.basePrice.toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <span className="text-[#8a8a8a] block font-semibold">Status</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedProductForModal.status === 'ACTIVE'
                        ? 'bg-[#e8f5ee] text-[#167a45]'
                        : 'bg-[#f4f4f4] text-[#8a8a8a]'
                    }`}
                  >
                    {selectedProductForModal.status || 'ACTIVE'}
                  </span>
                </div>

                {/* Variants stock */}
                <div className="pt-2 border-t border-[#f4f4f4]">
                  <span className="text-[#8a8a8a] block font-semibold mb-1">
                    Variant Stock Breakdown:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProductForModal.variants.map((v) => (
                      <div key={v.id} className="p-2 bg-[#f8f8f8] rounded-lg border border-[#e5e5e5]">
                        <span className="font-bold block">Size: {v.size}</span>
                        <span className="text-[#5e5e5e]">{v.stock} units available</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#e5e5e5] flex justify-between items-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  toggleProductStatus(selectedProductForModal.id);
                  setSelectedProductForModal({
                    ...selectedProductForModal,
                    status: selectedProductForModal.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE',
                  });
                }}
              >
                {selectedProductForModal.status === 'ACTIVE' ? 'Archive Product' : 'Activate Product'}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedProductForModal(null)}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Catalog</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedProductForModal(null)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD NEW PRODUCT
         ======================================================== */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#e5e5e5]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e5e5]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#8a8a8a] block">
                  NEW INVENTORY
                </span>
                <h3 className="font-extrabold text-base text-black">Create Catalog Product</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white text-xs font-semibold text-black transition-all group"
                  aria-label="Back to Product Catalog"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#f4f4f4] hover:bg-black hover:text-white flex items-center justify-center transition-colors"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-black mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heavyweight Boxy Cotton Oversized Tee"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Master Category</label>
                  <select
                    value={newProduct.masterCategory}
                    onChange={(e) => setNewProduct({ ...newProduct, masterCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-black"
                  >
                    <option value="Apparel">Apparel</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Personal Care">Personal Care</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">Subcategory</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Topwear"
                    value={newProduct.subCategory}
                    onChange={(e) => setNewProduct({ ...newProduct, subCategory: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Article Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tshirts"
                    value={newProduct.articleType}
                    onChange={(e) => setNewProduct({ ...newProduct, articleType: e.target.value })}
                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">Gender</label>
                  <select
                    value={newProduct.gender}
                    onChange={(e) => setNewProduct({ ...newProduct, gender: e.target.value as Gender })}
                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-black"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-black mb-1">Base Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProduct.basePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, basePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block font-bold text-black mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#e5e5e5] flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
