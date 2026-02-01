import { ArrowRight, Heart, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { productsApi } from '../utils/api';
import { getProductImageUrl } from '../utils/imageHelper';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SectionHeader } from './SectionHeader';
import { Badge } from './ui/badge';


export function TopProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBtnId, setHoveredBtnId] = useState<string | null>(null);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('🔄 Fetching featured products for homepage...');
        const response = await productsApi.getAll({ featured: true, limit: 10 });
        console.log('✅ Featured products fetched:', response);

        // If no featured products, get latest products instead
        if (!response.data || response.data.length === 0) {
          console.log('⚠️ No featured products found, fetching latest products...');
          const latestResponse = await productsApi.getAll({ limit: 10 });
          console.log('✅ Latest products fetched:', latestResponse);
          setProducts(latestResponse.data || []);
        } else {
          setProducts(response.data || []);
        }
      } catch (error) {
        console.error('❌ Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Pilihan Terbaik"
            title="Produk Teratas"
            description="Produk pilihan terbaik dan paling diminati pelanggan kami"
          />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-100 rounded-md animate-pulse aspect-square" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If no products at all
  if (products.length === 0) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Pilihan Terbaik"
            title="Produk Teratas"
            description="Produk pilihan terbaik dan paling diminati pelanggan kami"
          />
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <p className="text-gray-500 mb-2">Belum ada produk yang tersedia</p>
            <p className="text-sm text-gray-400">
              Silakan tambahkan produk melalui Admin Panel dan centang "Featured Product"
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-2">
          <SectionHeader
            badge="Pilihan Terbaik"
            title="Produk Teratas"
            description="Produk pilihan terbaik dan paling diminati pelanggan kami"
            alignment="left"
          />
          <Link
            to="/products?filter=unggulan"
            className="hidden md:flex items-center gap-2 text-[#EB216A] font-medium hover:gap-3 transition-all mb-12"
          >
            Lihat Semua <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3">
          {products.map((product) => (
            <Link to={`/product/${product.sku || product.id}`} key={product.id} className="group relative h-full block">
              {/* Card Container */}
              <div className="relative bg-white rounded-md overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                {/* Image Section */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={getProductImageUrl(product.images)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Combined Badges Rendering: Dynamic + Legacy */}
                  {(() => {
                    const dynamicBadges = product.badges || [];
                    const legacyBadges: { id: string; label: string; bg_color: string; text_color: string; position: string }[] = [];

                    // Check if dynamic badge for each type exists (to avoid duplicates)
                    const hasBestSellerBadge = dynamicBadges.some((b: any) => b.label.toLowerCase().includes('best seller') || b.label.toLowerCase().includes('terlaris'));
                    const hasNewArrivalBadge = dynamicBadges.some((b: any) => b.label.toLowerCase().includes('new') || b.label.toLowerCase().includes('baru'));
                    const hasFeaturedBadge = dynamicBadges.some((b: any) => b.label.toLowerCase().includes('featured') || b.label.toLowerCase().includes('unggulan'));
                    const hasWarrantyBadge = dynamicBadges.some((b: any) => b.label.toLowerCase().includes('garansi'));
                    const hasCustomBadge = dynamicBadges.some((b: any) => b.label.toLowerCase().includes('custom'));

                    // Add legacy badges only if no corresponding dynamic badge exists
                    if (product.is_best_seller && !hasBestSellerBadge) {
                      legacyBadges.push({ id: 'legacy-bestseller', label: 'Best Seller', bg_color: '#EB216A', text_color: '#FFFFFF', position: 'top-left' });
                    }
                    if (product.is_new_arrival && !hasNewArrivalBadge && !product.is_best_seller) {
                      legacyBadges.push({ id: 'legacy-newarrival', label: 'New', bg_color: '#EB216A', text_color: '#FFFFFF', position: 'top-left' });
                    }
                    if (product.is_featured && !hasFeaturedBadge && !product.is_best_seller && !product.is_new_arrival) {
                      legacyBadges.push({ id: 'legacy-featured', label: 'Featured', bg_color: '#EB216A', text_color: '#FFFFFF', position: 'top-left' });
                    }

                    // Combine: dynamic badges first (their positions from DB), then legacy
                    const allBadges = [...dynamicBadges, ...legacyBadges];

                    return (
                      <>
                        {/* Top Left Group */}
                        <div className="absolute top-4 left-4 flex flex-col gap-1 items-start z-10">
                          {allBadges.filter((b: any) => b.position === 'top-left').map((badge: any) => (
                            <Badge key={badge.id} className="border-0 shadow-lg text-[10px] px-1.5 py-0.5 whitespace-nowrap" style={{ backgroundColor: badge.bg_color, color: badge.text_color }}>
                              {badge.label}
                            </Badge>
                          ))}
                        </div>
                        {/* Top Right Group */}
                        <div className="absolute top-4 right-4 flex flex-col gap-1 items-end z-20">
                          {allBadges.filter((b: any) => b.position === 'top-right').map((badge: any) => (
                            <Badge key={badge.id} className="border-0 shadow-lg text-[10px] px-1.5 py-0.5 whitespace-nowrap" style={{ backgroundColor: badge.bg_color, color: badge.text_color }}>
                              {badge.label}
                            </Badge>
                          ))}
                        </div>
                        {/* Bottom Left Group */}
                        <div className="absolute bottom-4 left-4 flex flex-col gap-1 items-start z-10 group-hover:opacity-0 transition-opacity">
                          {allBadges.filter((b: any) => b.position === 'bottom-left').map((badge: any) => (
                            <Badge key={badge.id} className="border-0 shadow-lg text-[10px] px-1.5 py-0.5 whitespace-nowrap" style={{ backgroundColor: badge.bg_color, color: badge.text_color }}>
                              {badge.label}
                            </Badge>
                          ))}
                        </div>
                      </>
                    );

                  })()}

                  {/* Quick View Button - Shows on Hover */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <button
                      className="w-full shadow-xl rounded-md py-2 px-3 text-sm font-medium flex items-center justify-center gap-2 transition-all"
                      style={{
                        backgroundColor: hoveredBtnId === product.id ? '#EB216A' : 'white',
                        color: hoveredBtnId === product.id ? 'white' : '#EB216A'
                      }}
                      onMouseEnter={() => setHoveredBtnId(product.id)}
                      onMouseLeave={() => setHoveredBtnId(null)}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        e.preventDefault();
                        addToCart({
                          id: product.id,
                          name: product.name,
                          sku: product.sku,
                          price: Number(product.price),
                          image: getProductImageUrl(product.images)
                        });
                      }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span className="font-medium">Tambah ke Keranjang</span>
                    </button>
                  </div>
                </div>

                {/* Content Section - Fixed Height */}
                <div className="p-3 lg:p-5 flex flex-col flex-grow">
                  <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 lg:mb-3 line-clamp-2 min-h-[40px] lg:min-h-[48px]">
                    {product.name}
                  </h3>

                  {/* Price Section */}
                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex flex-col gap-1">
                      {/* Show discount if Gross > Net */}
                      {product.minPriceGross && product.minPrice && Number(product.minPriceGross) > Number(product.minPrice) ? (
                        <>
                          <div className="flex items-center gap-1 lg:gap-2">
                            <span className="text-xs lg:text-sm text-gray-400 line-through">
                              Rp {Number(product.minPriceGross).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] lg:text-xs bg-[#EB216A] text-white px-1.5 lg:px-2 py-0.5 rounded">
                              -{Math.round((1 - (Number(product.minPrice) / Number(product.minPriceGross))) * 100)}%
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-normal leading-tight">Mulai dari</span>
                            <span className="text-lg lg:text-xl text-[#EB216A] font-semibold leading-tight">
                              Rp {Number(product.minPrice).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </>
                      ) : product.minPrice && !isNaN(Number(product.minPrice)) ? (
                        <>
                          <div className="h-4 lg:h-5" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-500 font-normal leading-tight">Mulai dari</span>
                            <span className="text-lg lg:text-xl text-[#EB216A] font-semibold leading-tight">
                              Rp {Number(product.minPrice).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">Lihat varian</span>
                      )}
                      <span className="text-[10px] text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 mt-1 self-start">Per {product.price_unit || 'meter'}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (isInWishlist(product.id)) {
                          removeFromWishlist(product.id);
                        } else {
                          addToWishlist(product.id);
                        }
                      }}
                      className={`transition-colors ${isInWishlist(product.id) ? 'text-[#EB216A]' : 'text-gray-400 hover:text-[#EB216A]'}`}
                    >
                      <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="md:hidden mt-6 text-center">
          <Link
            to="/products?filter=unggulan"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#EB216A] text-white rounded-full font-medium hover:bg-[#d11d5f] transition-colors"
          >
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}