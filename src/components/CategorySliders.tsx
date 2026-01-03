import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Sparkles, Star, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { categoriesApi, productsApi } from '../utils/api';
import { getProductImageUrl } from '../utils/imageHelper';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ProductSliderProps {
  title: string;
  badge: string;
  badgeIcon?: React.ReactNode;
  products: any[];
  loading?: boolean;
}

function ProductSlider({ title, badge, badgeIcon, products, loading }: ProductSliderProps) {
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredBtnId, setHoveredBtnId] = useState<string | null>(null);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount);

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });

      setTimeout(checkScroll, 300);
    }
  };

  if (loading) {
    return (
      <section className="py-6 lg:py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#EB216A]/10 text-[#EB216A] px-3 py-1.5 rounded-full mb-3">
                {badgeIcon}
                <span className="text-xs">{badge}</span>
              </div>
              <h2 className="text-3xl text-gray-900">{title}</h2>
            </div>
          </div>
          <div className="flex gap-2 lg:gap-3 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 w-[calc(50%-4px)] lg:w-[calc(20%-9.6px)] aspect-square bg-gray-100 rounded-md animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null; // Don't render empty sections
  }

  return (
    <section className="py-6 lg:py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#EB216A]/10 text-[#EB216A] px-3 py-1.5 rounded-full mb-3">
              {badgeIcon}
              <span className="text-xs">{badge}</span>
            </div>
            <h2 className="text-3xl text-gray-900">{title}</h2>
          </div>

          {/* Navigation Arrows - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <Button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              variant="outline"
              size="icon"
              className="rounded-full disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              variant="outline"
              size="icon"
              className="rounded-full disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => navigate('/products')}
              variant="outline"
              className="ml-2"
            >
              Lihat Semua
            </Button>
          </div>
        </div>

        {/* Slider */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-2 lg:gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative flex-shrink-0 w-[calc(50%-4px)] lg:w-[calc(20%-9.6px)]"
            >
              {/* Card Container */}
              <div className="relative bg-white rounded-md overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                {/* Image Section */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={getProductImageUrl(product.images || product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Badge */}
                  {(product.is_best_seller || product.is_new_arrival || product.is_featured) && (
                    <Badge className="absolute top-3 left-3 bg-[#EB216A] text-white border-0 shadow-lg text-xs">
                      {product.is_best_seller ? 'Best Seller' : product.is_new_arrival ? 'Baru' : 'Unggulan'}
                    </Badge>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (isInWishlist(product.id)) {
                        removeFromWishlist(product.id);
                      } else {
                        addToWishlist(product.id);
                      }
                    }}
                    className={`absolute top-3 right-3 w-8 h-8 lg:w-10 lg:h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${isInWishlist(product.id) ? 'text-[#EB216A] opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-[#EB216A] hover:text-white'
                      }`}
                  >
                    <Heart className={`w-4 h-4 lg:w-5 lg:h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </button>

                  {/* Quick View Button - Shows on Hover */}
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <button
                      className="w-full shadow-xl text-xs lg:text-sm rounded-md py-2 px-3 font-medium flex items-center justify-center gap-1 lg:gap-2 transition-all"
                      style={{
                        backgroundColor: hoveredBtnId === product.id ? '#EB216A' : 'white',
                        color: hoveredBtnId === product.id ? 'white' : '#EB216A'
                      }}
                      onMouseEnter={() => setHoveredBtnId(product.id)}
                      onMouseLeave={() => setHoveredBtnId(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${product.id}`);
                      }}
                    >
                      <ShoppingCart className="w-3 h-3 lg:w-4 lg:h-4" />
                      <span className="hidden lg:inline">Lihat Detail</span>
                      <span className="lg:hidden">Detail</span>
                    </button>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-3 lg:p-4 flex flex-col flex-grow">
                  <h3 className="text-sm lg:text-base text-gray-900 mb-2 lg:mb-3 group-hover:text-[#EB216A] transition-colors line-clamp-2 min-h-[40px] lg:min-h-[48px]">
                    {product.name}
                  </h3>

                  {/* Price Section */}
                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex flex-col gap-0.5 lg:gap-1">
                      {product.original_price && Number(product.original_price) > Number(product.minPrice || product.price) ? (
                        <>
                          <div className="flex items-center gap-1 lg:gap-2">
                            <span className="text-xs text-gray-400 line-through">
                              Rp {Number(product.original_price).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] lg:text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
                              -{Math.round((1 - Number(product.minPrice || product.price) / Number(product.original_price)) * 100)}%
                            </span>
                          </div>
                          <span className="text-base lg:text-xl text-[#EB216A]">
                            {product.minPrice ? (
                              <>Mulai Rp {Number(product.minPrice).toLocaleString('id-ID')}</>
                            ) : (
                              <>Rp {Number(product.price).toLocaleString('id-ID')}</>
                            )}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="h-4 lg:h-5" />
                          <span className="text-base lg:text-xl text-[#EB216A]">
                            {product.minPrice ? (
                              <>Mulai Rp {Number(product.minPrice).toLocaleString('id-ID')}</>
                            ) : (
                              <>Rp {Number(product.price).toLocaleString('id-ID')}</>
                            )}
                          </span>
                        </>
                      )}
                      <span className="text-[10px] lg:text-xs text-gray-500">
                        {product.price_unit || 'Per meter'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isInWishlist(product.id)) {
                          removeFromWishlist(product.id);
                        } else {
                          addToWishlist(product.id);
                        }
                      }}
                      className={`transition-colors lg:hidden ${isInWishlist(product.id) ? 'text-[#EB216A]' : 'text-gray-400 hover:text-[#EB216A]'}`}
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="lg:hidden mt-6 text-center">
          <Button
            onClick={() => navigate('/products')}
            variant="outline"
            className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white"
          >
            Lihat Semua {title}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function CategorySliders() {
  const [categories, setCategories] = useState<any[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<number, any[]>>({});
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        console.log('🔄 Fetching categories for home page...');
        const catResponse = await categoriesApi.getAll();
        const cats = catResponse.data || [];
        setCategories(cats);
        console.log('✅ Categories fetched:', cats);

        // Fetch products for each category
        const productsBycat: Record<number, any[]> = {};
        for (const cat of cats) {
          try {
            const prodResponse = await productsApi.getAll({ category_id: cat.id, limit: 10 });
            productsBycat[cat.id] = prodResponse.data || [];
          } catch (e) {
            console.error(`Error fetching products for category ${cat.name}:`, e);
            productsBycat[cat.id] = [];
          }
        }
        setProductsByCategory(productsBycat);

        // Fetch new arrivals
        console.log('🔄 Fetching new arrivals...');
        const newArrResponse = await productsApi.getAll({ new_arrival: 'true', limit: 10 });
        setNewArrivals(newArrResponse.data || []);
        console.log('✅ New arrivals fetched:', newArrResponse.data?.length || 0);

        // Fetch best sellers
        console.log('🔄 Fetching best sellers...');
        const bestSellerResponse = await productsApi.getAll({ best_seller: 'true', limit: 10 });
        setBestSellers(bestSellerResponse.data || []);
        console.log('✅ Best sellers fetched:', bestSellerResponse.data?.length || 0);

      } catch (error) {
        console.error('❌ Error fetching home page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      {/* Best Sellers Section */}
      <ProductSlider
        title="Produk Terlaris"
        badge="Best Seller"
        badgeIcon={<TrendingUp className="w-4 h-4" />}
        products={bestSellers}
        loading={loading}
      />

      {/* New Arrivals Section */}
      <ProductSlider
        title="Produk Baru"
        badge="New Arrival"
        badgeIcon={<Sparkles className="w-4 h-4" />}
        products={newArrivals}
        loading={loading}
      />

      {/* Category-Based Sections */}
      {categories.map((category) => (
        <ProductSlider
          key={category.id}
          title={category.name}
          badge={category.description || 'Koleksi Lengkap'}
          badgeIcon={<Star className="w-4 h-4" />}
          products={productsByCategory[category.id] || []}
          loading={loading}
        />
      ))}
    </>
  );
}