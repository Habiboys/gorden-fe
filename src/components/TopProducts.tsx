import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShoppingCart, Heart } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

const products = [
  {
    id: 1,
    name: 'Gorden Smokering Premium',
    price: 'Rp 450.000',
    originalPrice: 'Rp 650.000',
    discount: '30%',
    image: 'https://images.unsplash.com/photo-1754611362309-71297e9f42fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjdXJ0YWlucyUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzY1MDc5ODg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Best Seller',
  },
  {
    id: 2,
    name: 'Gorden Kupu-Kupu Elegan',
    price: 'Rp 380.000',
    originalPrice: 'Rp 500.000',
    discount: '24%',
    image: 'https://images.unsplash.com/photo-1621215052063-6ed29c948b31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGJlZHJvb218ZW58MXx8fHwxNzY1MDc5ODkwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Populer',
  },
  {
    id: 3,
    name: 'Vitras Modern',
    price: 'Rp 320.000',
    image: 'https://images.unsplash.com/photo-1763939919676-97187d9f4db0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwY3VydGFpbnMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'New',
  },
  {
    id: 4,
    name: 'Blind Minimalis',
    price: 'Rp 280.000',
    originalPrice: 'Rp 400.000',
    discount: '30%',
    image: 'https://images.unsplash.com/photo-1518002903142-1f4ef6851390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBibGluZHMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Best Seller',
  },
];

export function TopProducts() {
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
            <div key={product.id} className="group relative h-full">
              {/* Card Container */}
              <div className="relative bg-white rounded-md overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                {/* Image Section */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Badge */}
                  <Badge className="absolute top-4 left-4 bg-[#EB216A] text-white border-0 shadow-lg">
                    {product.badge}
                  </Badge>

                  {/* Wishlist Button */}
                  <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#EB216A] hover:text-white shadow-lg">
                    <Heart className="w-5 h-5" />
                  </button>

                  {/* Quick View Button - Shows on Hover */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <Button 
                      className="w-full bg-white text-[#EB216A] hover:bg-[#EB216A] hover:text-white shadow-xl"
                      size="sm"
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
                      {product.originalPrice ? (
                        <>
                          <div className="flex items-center gap-1 lg:gap-2">
                            <span className="text-xs lg:text-sm text-gray-400 line-through">
                              {product.originalPrice}
                            </span>
                            <span className="text-[10px] lg:text-xs bg-green-500 text-white px-1.5 lg:px-2 py-0.5 rounded">
                              -{product.discount}
                            </span>
                          </div>
                          <span className="text-lg lg:text-xl text-[#EB216A]">{product.price}</span>
                        </>
                      ) : (
                        <>
                          <div className="h-4 lg:h-5" />
                          <span className="text-lg lg:text-xl text-[#EB216A]">{product.price}</span>
                        </>
                      )}
                      <span className="text-xs text-gray-500">Per meter</span>
                    </div>
                    <button className="text-gray-400 hover:text-[#EB216A] transition-colors">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}