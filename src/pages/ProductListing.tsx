import { ChevronDown, ChevronRight, Filter, Grid3X3, LayoutGrid, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { categoriesApi, productsApi, subcategoriesApi } from '../utils/api';

export default function ProductListing() {
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [gridCols, setGridCols] = useState<3 | 4>(4);

  // Pagination state
  const ITEMS_PER_PAGE = 20;
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('🔄 Fetching products from backend...');
        const response = await productsApi.getAll();
        console.log('✅ Products fetched:', response);
        const mappedProducts = (response.data || []).map((p: any) => ({
          ...p,
          image: p.image_url,
          category: p.category_id || p.category,
          categoryName: p.category?.name || p.categoryName || '',
          subcategoryName: p.subcategory?.name || p.subcategoryName || '',
          price: typeof p.price_self_measure === 'string' ? parseFloat(p.price_self_measure) : p.price_self_measure,
          minPrice: p.minPrice,
          minPriceGross: p.minPriceGross,
          maxPrice: p.maxPrice,
          featured: p.is_featured,
          bestSeller: p.is_best_seller,
          newArrival: p.is_new_arrival
        }));
        setProducts(mappedProducts);
      } catch (error) {
        console.error('❌ Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        console.log('🔄 Fetching categories from backend...');
        const response = await categoriesApi.getAll();
        console.log('✅ Categories fetched:', response);
        setCategories(response.data || []);
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
      }
    };

    const fetchSubcategories = async () => {
      try {
        const response = await subcategoriesApi.getAll();
        setSubcategories(response.data || []);
      } catch (error) {
        console.error('❌ Error fetching subcategories:', error);
      }
    };

    fetchProducts();
    fetchCategories();
    fetchSubcategories();
  }, []);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  // Get subcategories for a category
  const getSubcategoriesForCategory = (categoryId: string) => {
    return subcategories.filter(sub => String(sub.category_id) === String(categoryId));
  };

  // Filter products based on search, category, and subcategory
  const filteredProducts = products.filter(product => {
    const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory ||
      String(product.category_id) === String(selectedCategory) ||
      String(product.category?.id) === String(selectedCategory);

    const matchesSubcategory = !selectedSubcategory ||
      String(product.subcategory_id) === String(selectedSubcategory);

    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case 'price-low':
        return (a.minPrice || 0) - (b.minPrice || 0);
      case 'price-high':
        return (b.minPrice || 0) - (a.minPrice || 0);
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      default:
        return 0;
    }
  });

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSearchQuery('');
    setDisplayCount(ITEMS_PER_PAGE);
  };

  // Reset displayCount when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [selectedCategory, selectedSubcategory, searchQuery, sortBy]);

  // Products to display (paginated)
  const displayedProducts = sortedProducts.slice(0, displayCount);
  const hasMore = displayCount < sortedProducts.length;

  // Load more handler
  const handleLoadMore = () => {
    setLoadingMore(true);
    // Simulate slight delay for UX
    setTimeout(() => {
      setDisplayCount(prev => prev + ITEMS_PER_PAGE);
      setLoadingMore(false);
    }, 300);
  };

  // Sidebar Filter Component
  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`${isMobile ? '' : 'sticky top-28'}`}>
      {/* Categories */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#EB216A]" />
            Kategori Produk
          </h3>
        </div>
        <div className="p-2">
          {/* All Products Button */}
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
              if (isMobile) setShowMobileFilters(false);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${!selectedCategory
              ? 'bg-[#EB216A]/10 text-[#EB216A] font-medium'
              : 'text-gray-700 hover:bg-gray-50'
              }`}
          >
            Semua Produk
          </button>

          {/* Category List */}
          {categories.map((category) => {
            const catSubs = getSubcategoriesForCategory(category.id);
            const isExpanded = expandedCategories.includes(String(category.id));
            const isSelected = String(selectedCategory) === String(category.id);

            return (
              <div key={category.id} className="border-b border-gray-50 last:border-0">
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      setSelectedCategory(String(category.id));
                      setSelectedSubcategory(null);
                      if (isMobile && catSubs.length === 0) setShowMobileFilters(false);
                    }}
                    className={`flex-1 text-left px-3 py-2.5 text-sm transition-all ${isSelected && !selectedSubcategory
                      ? 'text-[#EB216A] font-medium bg-[#EB216A]/5'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {category.name}
                  </button>
                  {catSubs.length > 0 && (
                    <button
                      onClick={() => toggleCategory(String(category.id))}
                      className="p-2 text-gray-400 hover:text-[#EB216A]"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Subcategories */}
                {isExpanded && catSubs.length > 0 && (
                  <div className="pl-4 pb-2 space-y-1">
                    {catSubs.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setSelectedCategory(String(category.id));
                          setSelectedSubcategory(String(sub.id));
                          if (isMobile) setShowMobileFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${String(selectedSubcategory) === String(sub.id)
                          ? 'bg-[#EB216A]/10 text-[#EB216A] font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                          }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Filters */}
      {(selectedCategory || selectedSubcategory || searchQuery) && (
        <div className="mt-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Filter Aktif</span>
            <button
              onClick={clearFilters}
              className="text-xs text-[#EB216A] hover:underline"
            >
              Hapus Semua
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#EB216A]/10 text-[#EB216A] rounded-full text-xs">
                {categories.find(c => String(c.id) === String(selectedCategory))?.name}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory(null)} />
              </span>
            )}
            {selectedSubcategory && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#EB216A]/10 text-[#EB216A] rounded-full text-xs">
                {subcategories.find(s => String(s.id) === String(selectedSubcategory))?.name}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedSubcategory(null)} />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Katalog Produk</h1>
          <p className="text-gray-600">
            Temukan gorden dan blind berkualitas premium untuk rumah Anda
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-[96px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            {/* Mobile Filter Button */}
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden border-gray-200"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filter
            </Button>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari produk gorden, blind, atau wallpaper..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-base border-gray-200 focus:border-[#EB216A] focus:ring-[#EB216A] rounded-xl"
              />
            </div>

            {/* Sort & Grid Toggle */}
            <div className="hidden sm:flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] border-gray-200">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Terpopuler</SelectItem>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="price-low">Termurah</SelectItem>
                  <SelectItem value="price-high">Termahal</SelectItem>
                  <SelectItem value="name">Nama A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* Grid Toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setGridCols(4)}
                  className={`p-2 ${gridCols === 4 ? 'bg-[#EB216A] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setGridCols(3)}
                  className={`p-2 ${gridCols === 3 ? 'bg-[#EB216A] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <FilterSidebar />
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Results Info */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Menampilkan <span className="font-semibold text-gray-900">{displayedProducts.length}</span> dari <span className="font-semibold text-gray-900">{sortedProducts.length}</span> produk
                {selectedCategory && (
                  <span> dalam <span className="font-semibold text-[#EB216A]">{categories.find(c => String(c.id) === String(selectedCategory))?.name}</span></span>
                )}
              </p>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 animate-pulse">
                    <div className="aspect-square bg-gray-200 rounded-t-xl" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <>
                <div className={`grid grid-cols-2 ${gridCols === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-2 lg:gap-4`}>
                  {displayedProducts.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="mt-8 text-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      variant="outline"
                      className="border-[#EB216A] text-[#EB216A] hover:!bg-[#EB216A] hover:!text-white px-8 py-3"
                    >
                      {loadingMore ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Memuat...
                        </>
                      ) : (
                        `Muat Lebih Banyak (${sortedProducts.length - displayCount} lainnya)`
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Produk tidak ditemukan</h3>
                <p className="text-gray-600 mb-4">
                  Coba kata kunci lain atau hapus filter pencarian
                </p>
                <Button onClick={clearFilters} className="bg-[#EB216A] hover:bg-[#d11d5e]">
                  Hapus Filter
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-gray-50 overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Filter Produk</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar isMobile />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}