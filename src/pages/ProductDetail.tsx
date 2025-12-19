import {
  Check,
  ChevronRight,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  Share2,
  ShoppingCart
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProductGallery } from '../components/ProductGallery';
import { SEO } from '../components/SEO';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { productsApi } from '../utils/api';
import { getProductImageUrl } from '../utils/imageHelper';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState('self');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!product) return;

    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: getProductImageUrl(product.images || product.image),
      packageType: selectedPackage === 'self' ? 'Ukur & Pasang Sendiri' : 'Termasuk Pasang',
      notes: notes,
    }, quantity);
  };

  const handleQuantityChange = (type: 'increment' | 'decrement') => {
    if (type === 'increment') {
      setQuantity(prev => prev + 1);
    } else if (type === 'decrement' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const subtotal = product ? product.price * quantity : 0;

  // Get selected package label
  const selectedPackageLabel = product ? product.packages.find(pkg => pkg.id === selectedPackage)?.label || '' : '';

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        console.log('🔄 Fetching product:', id);
        const response = await productsApi.getById(id);
        console.log('✅ Product fetched:', response);

        // Transform backend data to match frontend expectations
        const productData = response.data;
        setProduct({
          ...productData,
          // Default values if not present
          subtitle: productData.subtitle || 'Ukur & Pasang Sendiri',
          subcategory: productData.subcategory || productData.category,
          originalPrice: productData.comparePrice || productData.price * 2,
          discount: productData.comparePrice ? Math.round((1 - productData.price / productData.comparePrice) * 100) : 0,
          priceUnit: productData.priceUnit || 'm2',
          packages: productData.packages || [
            { id: 'self', label: 'Ukur & Pasang Sendiri' },
            { id: 'measure-self', label: 'Ukur Sendiri | Pasang Teknisi' },
            { id: 'full-service', label: 'Ukur & Pasang Teknisi' }
          ],
          features: productData.features || [
            'Material premium berkualitas tinggi',
            'Jahitan rapi dan presisi',
            'Tahan lama dan tidak mudah luntur',
            'Mudah dibersihkan',
            'Tersedia berbagai pilihan warna'
          ],
          howToOrder: productData.howToOrder || [
            'Pilih paket yang sesuai dengan kebutuhan Anda.',
            'Tentukan jumlah meter persegi yang dibutuhkan.',
            'Tambahkan catatan khusus jika ada permintaan spesial.',
            'Klik tombol "Keranjang" untuk menambahkan ke keranjang.',
            'Lakukan proses pembayaran sesuai metode yang tersedia.',
            'Tim kami akan menghubungi Anda untuk konfirmasi detail pesanan.'
          ]
        });
      } catch (error: any) {
        console.error('❌ Error fetching product:', error);
        alert('Error loading product: ' + error.message);
        navigate('/products');
      }
    };

    const fetchRelatedProducts = async () => {
      if (!id) return;

      try {
        console.log('🔄 Fetching related products...');
        const response = await productsApi.getAll({ limit: 5 });
        console.log('✅ Related products fetched:', response);
        setRelatedProducts(response.data || []);
      } catch (error) {
        console.error('❌ Error fetching related products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    fetchRelatedProducts();
  }, [id, navigate]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!product) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={product.metaTitle || product.name}
        description={product.metaDescription || product.description}
        keywords={product.metaKeywords}
        image={product.images?.[0] || product.image}
        url={window.location.href}
        type="product"
      />
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
                      className={`w-full px-4 py-3 rounded-xl border-2 text-left text-sm transition-all ${selectedPackage === pkg.id
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
                  onClick={handleAddToCart}
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
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  {product.howToOrder.map((step, index) => (
                    <li key={index} className="leading-relaxed">
                      {step}
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
                      src={getProductImageUrl(relatedProduct.images)}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Badge */}
                    {(relatedProduct.badge || relatedProduct.featured || relatedProduct.bestSeller || relatedProduct.newArrival) && (
                      <Badge className="absolute top-3 left-3 bg-[#EB216A] text-white border-0 shadow-lg text-xs">
                        {relatedProduct.badge || (relatedProduct.bestSeller ? 'Best Seller' : relatedProduct.newArrival ? 'New' : 'Featured')}
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
                        onClick={() => navigate(`/product/${relatedProduct.id}`)}
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
                        {relatedProduct.comparePrice && (
                          <>
                            <div className="flex items-center gap-1 lg:gap-2">
                              <span className="text-xs text-gray-400 line-through">
                                Rp {relatedProduct.comparePrice.toLocaleString('id-ID')}
                              </span>
                              <span className="text-[10px] lg:text-xs bg-green-500 text-white px-1.5 py-0.5 rounded">
                                -{Math.round((1 - relatedProduct.price / relatedProduct.comparePrice) * 100)}%
                              </span>
                            </div>
                          </>
                        )}
                        <span className="text-base lg:text-xl text-[#EB216A]">
                          Rp {relatedProduct.price.toLocaleString('id-ID')}
                        </span>
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