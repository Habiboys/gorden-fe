import { ChevronLeft, ChevronRight, Sparkles, Star, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesApi, productsApi } from '../utils/api';
import { ProductCard } from './ProductCard';
import { Button } from './ui/button';

interface ProductSliderProps {
  title: string;
  badge: string;
  badgeIcon?: React.ReactNode;
  products: any[];
  loading?: boolean;
  categoryId?: number | string; // Add categoryId prop
}

function ProductSlider({ title, badge, badgeIcon, products, loading, categoryId }: ProductSliderProps) {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{title}</h2>
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
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{title}</h2>
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
              onClick={() => navigate(categoryId ? `/products?categoryId=${categoryId}` : '/products')}
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
              className="flex-shrink-0 w-[calc(50%-4px)] lg:w-[calc(20%-9.6px)]"
            >
              <ProductCard
                id={product.id}
                sku={product.sku}
                name={product.name}
                price={Number(product.minPrice) || Number(product.price)}
                minPrice={Number(product.minPrice)}
                minPriceGross={Number(product.minPriceGross)}
                image={product.image}
                images={product.images}
                category={product.category?.name || product.category || ''}
                price_unit={product.price_unit}
                bestSeller={product.is_best_seller}
                newArrival={product.is_new_arrival}
                featured={product.is_featured}
                is_custom={product.is_custom}
                is_warranty={product.is_warranty}
                badges={product.badges}
              />
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="lg:hidden mt-6 text-center">
          <Button
            onClick={() => navigate(categoryId ? `/products?categoryId=${categoryId}` : '/products')}
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
          categoryId={category.id} // Pass categoryId
          title={category.name}
          badge={category.description || 'Koleksi Lengkap'}
          badgeIcon={
            category.icon_url ? (
              <img src={category.icon_url} alt="" className="w-4 h-4 object-contain" />
            ) : (
              <Star className="w-4 h-4" />
            )
          }
          products={productsByCategory[category.id] || []}
          loading={loading}
        />
      ))}
    </>
  );
}