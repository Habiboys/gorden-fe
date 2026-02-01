import { ChevronDown, ChevronRight, Grid3X3, LayoutGrid, Search, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { badgesApi, categoriesApi, productsApi, subcategoriesApi } from '../utils/api';

export default function ProductListing() {
  const [randomSeed] = useState(Math.floor(Math.random() * 100000));
  const [sortBy, setSortBy] = useState('random'); // Default to random
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  // All filters now come from badges database - no more hardcoded filters
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [selectedBadgeFilters, setSelectedBadgeFilters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [gridCols, setGridCols] = useState<3 | 4>(4);

  // Debug: Watch badge filter changes
  useEffect(() => {
    console.log('🔔 selectedBadgeFilters state changed:', selectedBadgeFilters);
  }, [selectedBadgeFilters]);

  // Server-side pagination state
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Map product data helper
  const mapProductData = (p: any) => ({
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
    newArrival: p.is_new_arrival,
    is_custom: p.is_custom,
    is_warranty: p.is_warranty,
    badges: p.badges || []
  });

  // Fetch products from backend with pagination and filters
  const fetchProducts = useCallback(async (
    page: number = 1,
    append: boolean = false,
    filters?: { categoryId?: string | null; subcategoryId?: string | null; badgeIds?: number[]; search?: string }
  ) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: any = { limit: ITEMS_PER_PAGE, page };

      // Add random seed if sorting by random
      if (sortBy === 'random') {
        params.sort = 'random';
        params.seed = randomSeed;
      } else {
        params.sort = sortBy; // Pass other sort options
      }

      // Add category filter if specified
      if (filters?.categoryId) {
        params.category_id = filters.categoryId;
      }

      // Add subcategory filter if specified
      if (filters?.subcategoryId) {
        params.subcategory_id = filters.subcategoryId;
      }

      // Add search filter if specified
      if (filters?.search) {
        params.search = filters.search;
      }

      // Add badge filter if specified (server-side filtering)
      console.log('🔍 Badge filter check:', { badgeIds: filters?.badgeIds, length: filters?.badgeIds?.length });
      if (filters?.badgeIds && filters.badgeIds.length > 0) {
        params.badge_ids = filters.badgeIds.join(',');
        console.log('✅ Added badge_ids to params:', params.badge_ids);
      }

      console.log(`🔄 Fetching products page ${page} with filters:`, params);
      const response = await productsApi.getAll(params);
      console.log('✅ Products fetched:', response);

      const mappedProducts = (response.data || []).map(mapProductData);

      if (append) {
        setProducts(prev => [...prev, ...mappedProducts]);
      } else {
        setProducts(mappedProducts);
      }

      setTotalProducts(response.meta?.total || mappedProducts.length);
      setCurrentPage(page);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sortBy, randomSeed]);

  // Initial fetch for supporting data only (categories, subcategories, badges)
  useEffect(() => {
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

    const fetchBadges = async () => {
      try {
        const response = await badgesApi.getAll();
        setAllBadges(response.data || []);
      } catch (error) {
        console.error('❌ Error fetching badges:', error);
      }
    };

    fetchCategories();
    fetchSubcategories();
    fetchBadges();
  }, []);

  // Fetch products when filters change (including badges - server-side filtering)
  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      console.log('🔄 Filters changed, refetching products:', {
        selectedCategory,
        selectedSubcategory,
        selectedBadgeFilters,
        searchQuery,
        badgeCount: selectedBadgeFilters.length
      });
      fetchProducts(1, false, {
        categoryId: selectedCategory,
        subcategoryId: selectedSubcategory,
        badgeIds: selectedBadgeFilters,
        search: searchQuery
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [selectedCategory, selectedSubcategory, selectedBadgeFilters, searchQuery, fetchProducts]);

  // Initialize filters from URL params
  useEffect(() => {
    if (categories.length > 0) {
      const catIdParam = searchParams.get('categoryId');
      const catNameParam = searchParams.get('category');

      if (catIdParam) {
        setSelectedCategory(catIdParam);
      } else if (catNameParam) {
        // Fallback for name-based links
        const cat = categories.find(c => c.name.toLowerCase() === catNameParam.toLowerCase());
        if (cat) setSelectedCategory(String(cat.id));
      }
    }


    // Handle 'filter' query param - map to badge filter if badge exists with matching label
    const filterParam = searchParams.get('filter');
    if (filterParam && allBadges.length > 0) {
      // Normalize generic filters to badge names
      // Remove spaces and lowercase for comparison so "bestseller" matches "Best Seller"
      const normalizedFilter = filterParam.toLowerCase().replace(/\s+/g, '');

      const matchingBadge = allBadges.find((b: any) => {
        const normalizedBadgeLabel = b.label?.toLowerCase().replace(/\s+/g, '');
        return normalizedBadgeLabel === normalizedFilter || normalizedBadgeLabel.includes(normalizedFilter);
      });

      console.log('🔍 Filter param check:', {
        param: filterParam,
        normalized: normalizedFilter,
        match: matchingBadge?.label
      });

      if (matchingBadge && !selectedBadgeFilters.includes(matchingBadge.id)) {
        console.log('✅ Auto-selecting badge from URL filter:', matchingBadge.label);
        setSelectedBadgeFilters([matchingBadge.id]);
      }
    }
  }, [categories, searchParams, allBadges]);

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


  // Sort products (no random option to maintain consistent order with pagination)
  // Note: Sorting is now primarily handled by backend for pagination consistency,
  // but we keep this simple sort for client-side reordering of the current page if needed,
  // though optimally fetching with sort param is better.
  const sortedProducts = products; // Directly use products from state, assuming backend sorts correctly or we rely on default.


  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSearchQuery('');
  };

  // Check if there are more products to load from server
  // Note: If client-side filters reduce visible products, user might need to load more to find matches
  const hasMore = products.length < totalProducts;

  // Load more handler - fetches next page from server with current filters
  const handleLoadMore = () => {
    fetchProducts(currentPage + 1, true, {
      categoryId: selectedCategory,
      subcategoryId: selectedSubcategory,
      badgeIds: selectedBadgeFilters,
      search: searchQuery
    });
  };

  // Sidebar Filter Component
  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`${isMobile ? '' : 'sticky top-28'}`}>
      {/* Categories */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#EB216A]" />
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

      {/* Special Filters */}
      <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#EB216A]" />
            Filter Khusus
          </h3>
        </div>
        <div className="p-3 space-y-2">
          {/* All filters now come from database badges */}
          {allBadges.map((badge: any) => (
            <label
              key={badge.id}
              className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                console.log('🏷️ LABEL CLICKED for badge:', badge.label, badge.id);

                setSelectedBadgeFilters(prev => {
                  const isCurrentlySelected = prev.includes(badge.id);
                  const newFilters = isCurrentlySelected
                    ? prev.filter(id => id !== badge.id)
                    : [...prev, badge.id];
                  console.log('🏷️ New badge filters:', newFilters);
                  return newFilters;
                });
              }}
            >
              <input
                type="checkbox"
                checked={selectedBadgeFilters.includes(badge.id)}
                readOnly
                className="w-4 h-4 rounded border-gray-300 text-[#EB216A] focus:ring-[#EB216A] pointer-events-none"
              />
              <span className="text-sm text-gray-700">{badge.label}</span>
            </label>
          ))}
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
              <Select value={sortBy === 'random' ? '' : sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] border-gray-200">
                  <SelectValue placeholder={sortBy === 'random' ? "Acak (Default)" : "Urutkan"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Terbaru</SelectItem>
                  <SelectItem value="oldest">Terlama</SelectItem>
                  <SelectItem value="bestseller">Terlaris</SelectItem>
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
                Menampilkan <span className="font-semibold text-gray-900">{sortedProducts.length}</span> dari <span className="font-semibold text-gray-900">{totalProducts}</span> produk
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
                  {sortedProducts.map((product: any) => (
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
                        `Muat Lebih Banyak (${totalProducts - products.length} lainnya)`
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