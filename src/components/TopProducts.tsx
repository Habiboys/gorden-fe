import { Heart, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../utils/api';
import { getProductImageUrl } from '../utils/imageHelper';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { SectionHeader } from './SectionHeader';
import { Badge } from './ui/badge';
import { Button } from './ui/button';


export function TopProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('🔄 Fetching featured products for homepage...');
        const response = await productsApi.getAll({ featured: true, limit: 8 });
        console.log('✅ Featured products fetched:', response);

        // If no featured products, get latest products instead
        if (!response.data || response.data.length === 0) {
          console.log('⚠️ No featured products found, fetching latest products...');
          const latestResponse = await productsApi.getAll({ limit: 8 });
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
        <SectionHeader
          badge="Pilihan Terbaik"
          title="Produk Teratas"
          description="Produk pilihan terbaik dan paling diminati pelanggan kami"
        />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3">
          {products.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id} className="group relative h-full block">
              {/* Card Container */}
              <div className="relative bg-white rounded-md overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                {/* Image Section */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={getProductImageUrl(product.images)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Badge */}
                  {(product.is_featured || product.is_best_seller || product.is_new_arrival) && (
                    <Badge className="absolute top-4 left-4 bg-[#EB216A] text-white border-0 shadow-lg">
                      {product.is_best_seller ? 'Best Seller' : product.is_new_arrival ? 'New' : 'Featured'}
                    </Badge>
                  )}

                  {/* Wishlist Button - prevent Link navigation */}
                  <button
                    onClick={(e) => e.preventDefault()}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#EB216A] hover:text-white shadow-lg"
                  >
                    <Heart className="w-5 h-5" />
                  </button>

                  {/* Quick View Button - Shows on Hover */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <Button
                      className="w-full bg-white text-[#EB216A] hover:bg-[#EB216A] hover:text-white shadow-xl"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Tambah ke Keranjang
                    </Button>
                  </div>
                </div>

                {/* Content Section - Fixed Height */}
                <div className="p-3 lg:p-5 flex flex-col flex-grow">
                  <h3 className="text-sm lg:text-base text-gray-900 mb-2 lg:mb-3 group-hover:text-[#EB216A] transition-colors line-clamp-2 min-h-[40px] lg:min-h-[48px]">
                    {product.name}
                  </h3>

                  {/* Price Section */}
                  <div className="flex items-end justify-between mt-auto">
                    <div className="flex flex-col gap-1">
                      {product.original_price && product.original_price > product.price ? (
                        <>
                          <div className="flex items-center gap-1 lg:gap-2">
                            <span className="text-xs lg:text-sm text-gray-400 line-through">
                              Rp {Number(product.original_price).toLocaleString('id-ID')}
                            </span>
                            <span className="text-[10px] lg:text-xs bg-green-500 text-white px-1.5 lg:px-2 py-0.5 rounded">
                              -{Math.round((1 - product.price / product.original_price) * 100)}%
                            </span>
                          </div>
                          <span className="text-lg lg:text-xl text-[#EB216A]">
                            Rp {Number(product.price).toLocaleString('id-ID')}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="h-4 lg:h-5" />
                          <span className="text-lg lg:text-xl text-[#EB216A]">
                            Rp {Number(product.price).toLocaleString('id-ID')}
                          </span>
                        </>
                      )}
                      <span className="text-xs text-gray-500">Per meter</span>
                    </div>
                    <button
                      onClick={(e) => e.preventDefault()}
                      className="text-gray-400 hover:text-[#EB216A] transition-colors"
                    >
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}