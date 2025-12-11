import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductGallery } from '../components/ProductGallery';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  ShoppingCart, 
  Plus,
  Minus,
  ChevronRight,
  MessageCircle,
  Share2,
  Check,
  Heart
} from 'lucide-react';

// Mock product data
const product = {
  id: '1',
  name: 'Fabric Only Sharp point Solar Screw seri 4000',
  subtitle: 'Ukur & Pasang Sendiri',
  category: 'Gorden Custom',
  subcategory: 'Fabric-4000-RP',
  price: 223200,
  originalPrice: 446000,
  discount: 50,
  priceUnit: 'm2',
  images: [
    'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGludGVyaW9yfGVufDF8fHx8MTc2NTA4NTY4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY3VydGFpbnMlMjBob21lfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1762360411005-863ffdaa7691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJhcGVzJTIwZmFicmljfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHN8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  ],
  packages: [
    { id: 'self', label: 'Ukur & Pasang Sendiri' },
    { id: 'measure-self', label: 'Ukur Sendiri | Pasang Teknisi' },
    { id: 'full-service', label: 'Ukur & Pasang Teknisi' }
  ],
  description: 'Gorden premium dengan kualitas terbaik. Material berkualitas tinggi dengan finishing sempurna dan jahitan rapi. Tersedia dalam berbagai pilihan warna yang elegant dan cocok untuk berbagai ruangan.',
  features: [
    'Material premium berkualitas tinggi',
    'Jahitan rapi dan presisi',
    'Tahan lama dan tidak mudah luntur',
    'Mudah dibersihkan',
    'Tersedia berbagai pilihan warna'
  ],
  howToOrder: [
    'Pilih paket yang sesuai kebutuhan Anda',
    'Tentukan jumlah meter persegi yang dibutuhkan',
    'Tambahkan catatan khusus jika diperlukan',
    'Klik tombol "Keranjang" untuk melanjutkan',
    'Lakukan pembayaran sesuai metode yang tersedia',
    'Tim kami akan menghubungi Anda untuk konfirmasi'
  ]
};

// Related products data - same category
const relatedProducts = [
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
    name: 'Smokering Blackout Luxury',
    price: 'Rp 520.000',
    image: 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGludGVyaW9yfGVufDF8fHx8MTc2NTA4NTY4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    badge: 'Populer',
  },
  {
    id: 3,
    name: 'Smokering Velvet Mewah',
    price: 'Rp 580.000',
    image: 'https://images.unsplash.com/photo-1762360411005-863ffdaa7691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJhcGVzJTIwZmFicmljfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 4,
    name: 'Smokering Linen Natural',
    price: 'Rp 480.000',
    originalPrice: 'Rp 600.000',
    discount: '20%',
    image: 'https://images.unsplash.com/photo-1763718094072-239b21e9dc20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljJTIwd2luZG93JTIwdHJlYXRtZW50fGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 5,
    name: 'Smokering Jacquard Elegant',
    price: 'Rp 620.000',
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1754611362309-71297e9f42fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjdXJ0YWlucyUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzY1MDc5ODg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export default function ProductDetail() {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState('self');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const handleQuantityChange = (type: 'increment' | 'decrement') => {
    if (type === 'increment') {
      setQuantity(prev => prev + 1);
    } else if (type === 'decrement' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const subtotal = product.price * quantity;

  // Get selected package label
  const selectedPackageLabel = product.packages.find(pkg => pkg.id === selectedPackage)?.label || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-[#EB216A] transition-colors">
              Beranda
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/products" className="hover:text-[#EB216A] transition-colors">
              Produk
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{product.category}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left Column - Gallery (7 cols) */}
          <div className="lg:col-span-7">
            <ProductGallery images={product.images} productName={product.name} />
          </div>

          {/* Right Column - Details (5 cols) */}
          <div className="lg:col-span-5">
            {/* Product Info Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 space-y-6 lg:sticky lg:top-24">
              {/* Product Name & Category */}
              <div>
                <h1 className="text-2xl lg:text-3xl text-gray-900 mb-2">
                  {product.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {product.category} | {product.subcategory}
                </p>
              </div>

              {/* Price Section */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-lg text-gray-400 line-through">
                    Rp{product.originalPrice.toLocaleString('id-ID')}
                  </span>
                  <Badge className="bg-[#EB216A] text-white border-0">
                    {product.discount}% OFF
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl lg:text-4xl text-[#EB216A]">
                    Rp{product.price.toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Harga per {product.priceUnit}</p>
              </div>

              <Separator />

              {/* Package Selection */}
              <div>
                <h3 className="text-base mb-3 text-gray-900">
                  Pilih Paket | <span className="text-[#EB216A]">{selectedPackageLabel}</span>
                </h3>
                <div className="space-y-2">
                  {product.packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-left text-sm transition-all ${
                        selectedPackage === pkg.id
                          ? 'border-[#EB216A] bg-[#EB216A]/5 text-[#EB216A]'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{pkg.label}</span>
                        {selectedPackage === pkg.id && (
                          <Check className="w-5 h-5 text-[#EB216A]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Quantity Selector */}
              <div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange('decrement')}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-[#EB216A] hover:text-[#EB216A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (val > 0) setQuantity(val);
                    }}
                    className="w-20 h-10 text-center border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                  />
                  <button
                    onClick={() => handleQuantityChange('increment')}
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-[#EB216A] hover:text-[#EB216A] transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-base mb-3 text-gray-900">Catatan</h3>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tambahkan catatan khusus..."
                  className="resize-none h-20 focus:border-[#EB216A] focus:ring-[#EB216A]"
                />
              </div>

              {/* Subtotal */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Sub Total</span>
                  <span className="text-base text-gray-900">
                    Rp{subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  size="lg"
                  className="w-full bg-[#EB216A] hover:bg-[#d11d5e] text-white py-6 shadow-lg hover:shadow-xl transition-all"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Keranjang
                </Button>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-50"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chat Admin
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - Full Width Below */}
        <div className="mt-12">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="w-full lg:w-auto bg-white border border-gray-100 p-1 rounded-xl">
              <TabsTrigger 
                value="info" 
                className="flex-1 lg:flex-none data-[state=active]:bg-[#EB216A] data-[state=active]:text-white"
              >
                Informasi
              </TabsTrigger>
              <TabsTrigger 
                value="order" 
                className="flex-1 lg:flex-none data-[state=active]:bg-[#EB216A] data-[state=active]:text-white"
              >
                Cara Pemesanan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-xl text-gray-900 mb-4">Deskripsi Produk</h3>
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>

                <Separator />

                {/* Features */}
                <div>
                  <h3 className="text-xl text-gray-900 mb-4">Keunggulan Produk</h3>
                  <ul className="space-y-3">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3 text-gray-700">
                        <div className="w-5 h-5 rounded-full bg-[#EB216A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-[#EB216A]" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="order" className="mt-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
                <h3 className="text-xl text-gray-900 mb-4">Cara Pemesanan</h3>
                <ol className="space-y-4">
                  {product.howToOrder.map((step, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#EB216A] text-white flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 leading-relaxed pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl lg:text-3xl text-gray-900">Produk Terkait</h2>
            <Button
              onClick={() => navigate('/products')}
              variant="outline"
              className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white"
            >
              Lihat Semua
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3">
            {relatedProducts.map((relatedProduct) => (
              <div key={relatedProduct.id} className="group relative h-full">
                {/* Card Container */}
                <div className="relative bg-white rounded-md overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
                  {/* Image Section */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Badge */}
                    {relatedProduct.badge && (
                      <Badge className="absolute top-3 left-3 bg-[#EB216A] text-white border-0 shadow-lg text-xs">
                        {relatedProduct.badge}
                      </Badge>
                    )}

                    {/* Wishlist Button */}
                    <button className="absolute top-3 right-3 w-8 h-8 lg:w-10 lg:h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#EB216A] hover:text-white shadow-lg">
                      <Heart className="w-4 h-4 lg:w-5 lg:h-5" />
                    </button>

                    {/* Quick View Button - Shows on Hover */}
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <Button
                        className="w-full bg-white text-[#EB216A] hover:bg-[#EB216A] hover:text-white shadow-xl text-xs lg:text-sm"
                        size="sm"
                        onClick={() => navigate(`/products/${relatedProduct.id}`)}
                      >
                        <ShoppingCart className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                        <span className="hidden lg:inline">Lihat Detail</span>
                        <span className="lg:hidden">Detail</span>
                      </Button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-3 lg:p-4 flex flex-col flex-grow">
                    <h3 className="text-sm lg:text-base text-gray-900 mb-2 lg:mb-3 group-hover:text-[#EB216A] transition-colors line-clamp-2 min-h-[40px] lg:min-h-[48px]">
                      {relatedProduct.name}
                    </h3>

                    {/* Price Section */}
                    <div className="flex items-end justify-between mt-auto">
                      <div className="flex flex-col gap-0.5 lg:gap-1">
                        {relatedProduct.originalPrice ? (
                          <>
                            <div className="flex items-center gap-1 lg:gap-2">
                              <span className="text-xs text-gray-400 line-through">
                                {relatedProduct.originalPrice}
                              </span>
                              <span className="text-[10px] lg:text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
                                -{relatedProduct.discount}
                              </span>
                            </div>
                            <span className="text-base lg:text-xl text-[#EB216A]">
                              {relatedProduct.price}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="h-4 lg:h-5" />
                            <span className="text-base lg:text-xl text-[#EB216A]">
                              {relatedProduct.price}
                            </span>
                          </>
                        )}
                        <span className="text-[10px] lg:text-xs text-gray-500">
                          Per meter
                        </span>
                      </div>
                      <button className="text-gray-400 hover:text-[#EB216A] transition-colors lg:hidden">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}