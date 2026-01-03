import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import {
  ChevronLeft,
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
import { toast } from 'sonner';
import { ProductGallery } from '../components/ProductGallery';
import { SEO } from '../components/SEO';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { productsApi, productVariantsApi } from '../utils/api';
import { getProductImageUrl } from '../utils/imageHelper';
import { safeJSONParse } from '../utils/jsonHelper';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [showAllVariants, setShowAllVariants] = useState(false);
  const [calcHovered, setCalcHovered] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Lihat produk ${product.name} di Amagriya Gorden!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link produk disalin ke clipboard!');
    }
  };
  const handleAddToCart = () => {
    if (!product) return;

    // Build variant info for cart
    let variantInfo = '';
    if (selectedVariant?.attributes) {
      const attrs = safeJSONParse(selectedVariant.attributes, {}) as Record<string, any>;
      variantInfo = Object.entries(attrs)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: selectedPrice,
      image: getProductImageUrl(product.images || product.image),
      packageType: variantInfo,
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

  // Get selected variant price (Net = discounted/final price)
  const selectedPrice = selectedVariant
    ? (Number(selectedVariant.price_net) || Number(selectedVariant.price_gross) || 0)
    : 0;
  const subtotal = selectedPrice * quantity;

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

    const fetchVariants = async () => {
      if (!id) return;
      try {
        const response = await productVariantsApi.getByProduct(id);
        const variantData = response.data || [];
        setVariants(variantData);

        // Initialize selections if variants exist and have attributes
        if (variantData.length > 0) {
          const first = variantData[0];
          if (first.attributes) {
            // IMPORTANT: Parse the attributes as they come as a string from DB
            const parsedAttrs = safeJSONParse(first.attributes, {}) as Record<string, any>;
            setSelectedAttributes(parsedAttrs);
            setSelectedVariant(first);
          } else {
            // Fallback for old way
            setSelectedVariant(first);
          }
        }
      } catch (error) {
        console.error('Error fetching variants:', error);
      }
    };

    const fetchRelatedProducts = async () => {
      if (!id) return;

      try {
        console.log('🔄 Fetching related products...');
        const response = await productsApi.getAll({ limit: 25 });
        console.log('✅ Related products fetched:', response);
        setRelatedProducts(response.data || []);
      } catch (error) {
        console.error('❌ Error fetching related products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    fetchVariants();
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
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <div className="flex flex-col gap-1 text-sm text-gray-600">
                  {product.sku && (
                    <div>SKU: <span className="font-medium text-gray-800">{product.sku}</span></div>
                  )}
                  <div>Kategori: <span className="font-medium text-gray-800">{typeof product.category === 'object' ? product.category?.name : product.category}</span></div>
                  {product.subcategory && (
                    <div>Sub Kategori: <span className="font-medium text-gray-800">{product.subcategory}</span></div>
                  )}
                </div>
              </div>

              {/* Price Section - Based on selected variant */}
              <div className="bg-gray-50 rounded-xl p-4">
                {selectedVariant ? (
                  <>
                    {/* Main Price (Net = Discounted Price) */}
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-3xl lg:text-4xl font-bold text-[#EB216A]">
                        Rp{(Number(selectedVariant.price_net) || Number(selectedVariant.price_gross) || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                      {/* Strikethrough Original Price (Gross) */}
                      {Number(selectedVariant.price_gross) > Number(selectedVariant.price_net) && Number(selectedVariant.price_net) > 0 && (
                        <span className="text-lg text-gray-400 line-through">
                          Rp{Number(selectedVariant.price_gross).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      )}
                      {/* Discount Badge */}
                      {Number(selectedVariant.price_gross) > Number(selectedVariant.price_net) && Number(selectedVariant.price_net) > 0 && (
                        <span className="bg-red-500 text-white text-sm font-semibold px-2 py-0.5 rounded">
                          -{Math.round((1 - Number(selectedVariant.price_net) / Number(selectedVariant.price_gross)) * 100)}%
                        </span>
                      )}
                    </div>
                    {/* Variant Info */}
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedVariant.attributes
                        ? Object.entries(safeJSONParse(selectedVariant.attributes, {}) as Record<string, any>).map(([k, v]) => `${k}: ${v}`).join(', ')
                        : `${selectedVariant.attribute_name}: ${selectedVariant.attribute_value}`}
                    </p>
                  </>
                ) : variants.length > 0 ? (
                  <p className="text-gray-500">Pilih varian di bawah untuk melihat harga</p>
                ) : (
                  <p className="text-gray-500">Produk ini belum memiliki varian</p>
                )}
              </div>

              <Separator />

              {/* Variant Selection */}
              {variants.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold mb-3 text-gray-900">
                    Pilih Varian
                  </h3>
                  {(() => {
                    // Check if we use new Attribute system (JSON)
                    const useAttributes = variants.some(v => v.attributes);

                    if (useAttributes) {
                      // Gather all available keys from product variant_options OR inferred from variants
                      let keys: string[] = [];

                      const options = safeJSONParse(product.variant_options, []);

                      if (Array.isArray(options) && options.length > 0) {
                        keys = options.map((o: any) => o.name);
                      } else {
                        // Infer keys from first variant (must parse attributes first)
                        const firstVariantAttrs = safeJSONParse(variants[0]?.attributes, {}) as Record<string, any>;
                        keys = Object.keys(firstVariantAttrs);
                      }

                      return keys.map(key => {
                        // Unique values for this key
                        // Advanced: Filter available values based on OTHER selected attributes?
                        // For simplicity, show all values present in variants.
                        // To make it better: Only show values that exist in combination with current OTHER selections.

                        const availableValues = Array.from(new Set(
                          variants.map(v => {
                            const attrs = safeJSONParse(v.attributes, {}) as Record<string, any>;
                            // Case-insensitive key lookup
                            const matchingKey = Object.keys(attrs).find(k => k.toLowerCase() === key.toLowerCase());
                            return matchingKey ? attrs[matchingKey] : undefined;
                          }).filter(Boolean)
                        ));

                        return (
                          <div key={key} className="mb-4">
                            <p className="text-sm font-semibold text-gray-900 mb-2">{key}</p>
                            <div className="flex flex-wrap gap-2">
                              {availableValues.map((val: any) => {
                                const isSelected = selectedAttributes[key] === val;
                                return (
                                  <button
                                    key={val}
                                    onClick={() => {
                                      const newAttrs = { ...selectedAttributes, [key]: val };
                                      setSelectedAttributes(newAttrs);

                                      // Find matching variant with robust comparison
                                      const match = variants.find((variant) => {
                                        const variantAttrs = safeJSONParse(variant.attributes, {}) as Record<string, any>;
                                        // Normalize variant attribute keys for matching
                                        const normalizedVariantAttrs: Record<string, any> = {};
                                        Object.keys(variantAttrs).forEach(k => {
                                          normalizedVariantAttrs[k.trim().toLowerCase()] = String(variantAttrs[k]).trim();
                                        });

                                        return Object.entries(newAttrs).every(([attrKey, attrVal]) => {
                                          const normalizedKey = attrKey.trim().toLowerCase();
                                          const normalizedVal = String(attrVal).trim();
                                          return normalizedVariantAttrs[normalizedKey] === normalizedVal;
                                        });
                                      });

                                      setSelectedVariant(match || null);
                                    }}
                                    className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${isSelected
                                      ? 'border-[#EB216A] bg-[#EB216A]/5 text-[#EB216A]'
                                      : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                      }`}
                                  >
                                    {val}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      });
                    } else {
                      // Legacy handling (Attribute Name grouping)
                      const grouped: Record<string, any[]> = {};
                      variants.forEach((v: any) => {
                        const attr = v.attribute_name || 'Varian';
                        if (!grouped[attr]) grouped[attr] = [];
                        grouped[attr].push(v);
                      });
                      return Object.entries(grouped).map(([attrName, varList]) => (
                        <div key={attrName} className="mb-4">
                          <p className="text-sm font-semibold text-gray-900 mb-2">{attrName}</p>
                          <div className="flex flex-wrap gap-2">
                            {varList.map((v: any) => (
                              <button
                                key={v.id}
                                onClick={() => setSelectedVariant(v)}
                                className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${selectedVariant?.id === v.id
                                  ? 'border-[#EB216A] bg-[#EB216A]/5 text-[#EB216A]'
                                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                  }`}
                              >
                                {v.attribute_value}
                              </button>
                            ))}
                          </div>
                        </div>
                      ));
                    }
                  })()}
                </div>
              )}

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

              {/* Calculator CTA */}


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

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 px-2"
                    onClick={() => {
                      // Build price string from selected variant
                      const price = selectedVariant
                        ? (Number(selectedVariant.price_net) || Number(selectedVariant.price_gross) || 0)
                        : 0;
                      const priceStr = price > 0
                        ? `Rp ${price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                        : 'Harga belum dipilih';

                      // Build variant info
                      const variantInfo = selectedVariant?.attributes
                        ? Object.entries(safeJSONParse(selectedVariant.attributes, {}) as Record<string, any>)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')
                        : '';

                      // Create full product name with variant
                      const fullProductName = variantInfo
                        ? `${product.name} (${variantInfo})`
                        : product.name;

                      // Create message with product link
                      const productLink = window.location.href;
                      const message = `Halo kak, saya tertarik dengan produk "${fullProductName}" seharga ${priceStr}. Boleh minta info lebih lanjut?\n\nLink: ${productLink}`;

                      // Open WhatsApp directly
                      const phoneNumber = '6285142247464';
                      const encodedMessage = encodeURIComponent(message);
                      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Chat</span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 px-2"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className={`px-2 border-gray-300 ${isInWishlist(product.id) ? 'text-[#EB216A] border-[#EB216A] bg-[#EB216A]/5' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => {
                      if (isInWishlist(product.id)) {
                        removeFromWishlist(product.id);
                      } else {
                        addToWishlist(product.id);
                      }
                    }}
                  >
                    <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">Wishlist</span>
                  </Button>
                </div>
              </div>

              {/* Calculator CTA - Moved to bottom */}
              <div className="border-2 border-dashed border-[#EB216A]/30 rounded-xl p-4 bg-[#EB216A]/5">
                <p className="text-sm text-gray-700 mb-3">
                  Anda bisa hitung sendiri biaya gorden dan memilih bahan yang sesuai dengan budget.
                  Klik tombol di bawah untuk menghitung.
                </p>
                <button
                  onClick={() => navigate('/calculator')}
                  onMouseEnter={() => setCalcHovered(true)}
                  onMouseLeave={() => setCalcHovered(false)}
                  className="w-full py-2.5 px-4 rounded-lg border-2 border-[#EB216A] font-medium transition-all"
                  style={{
                    backgroundColor: calcHovered ? '#EB216A' : 'white',
                    color: calcHovered ? 'white' : '#EB216A'
                  }}
                >
                  🧮 Hitung dengan Kalkulator
                </button>
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
              {variants.length > 0 && (
                <TabsTrigger
                  value="variants"
                  className="flex-1 lg:flex-none data-[state=active]:bg-[#EB216A] data-[state=active]:text-white"
                >
                  Varian ({variants.length})
                </TabsTrigger>
              )}
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
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Deskripsi Produk</h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {product.information || product.description || 'Deskripsi produk belum tersedia.'}
                  </div>
                </div>

                <Separator />


                {/* Separator only if dimensions exist */}
                {(product.min_width || product.max_width || product.min_length || product.max_length) && <Separator />}
              </div>
            </TabsContent>

            <TabsContent value="order" className="mt-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
                <h3 className="text-xl text-gray-900 mb-4">Cara Pemesanan</h3>
                <ol className="list-decimal list-inside space-y-3 text-gray-700">
                  {product.howToOrder.map((step: string, index: number) => (
                    <li key={index} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </TabsContent>

            {/* Variants Tab Content */}
            {variants.length > 0 && (
              <TabsContent value="variants" className="mt-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
                  <h3 className="text-xl text-gray-900 mb-4">Pilihan Varian</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Pilih varian yang sesuai dengan kebutuhan Anda.
                  </p>

                  {/* Group variants by first attribute key or show all */}
                  {(() => {
                    const INITIAL_SHOW = 6;
                    const displayedVariants = showAllVariants ? variants : variants.slice(0, INITIAL_SHOW);
                    const hasMore = variants.length > INITIAL_SHOW;

                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {displayedVariants.map((variant: any) => {
                            const attrs = safeJSONParse(variant.attributes, {}) as Record<string, any>;
                            const attrDisplay = Object.entries(attrs)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' - ');

                            return (
                              <div
                                key={variant.id}
                                className="border border-gray-200 rounded-xl p-4 hover:border-[#EB216A] hover:bg-[#EB216A]/5 transition-colors cursor-pointer"
                                onClick={() => {
                                  const safeAttrs = typeof attrs === 'object' && attrs !== null && !Array.isArray(attrs)
                                    ? attrs
                                    : safeJSONParse(attrs, {}) as Record<string, any>;
                                  setSelectedAttributes(safeAttrs);
                                  setSelectedVariant(variant);
                                }}
                              >
                                <p className="font-medium text-gray-900 mb-2">
                                  {attrDisplay || 'Varian'}
                                </p>
                                <div className="flex flex-col gap-1">
                                  {Number(variant.price_gross) > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Harga Gross:</span>
                                      <span className="font-semibold text-gray-700">
                                        Rp {Number(variant.price_gross).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                      </span>
                                    </div>
                                  )}
                                  {Number(variant.price_net) > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-gray-500">Harga Net:</span>
                                      <span className="font-semibold text-[#EB216A]">
                                        Rp {Number(variant.price_net).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {hasMore && (
                          <div className="mt-4 text-center">
                            <Button
                              variant="outline"
                              onClick={() => setShowAllVariants(!showAllVariants)}
                              className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white"
                            >
                              {showAllVariants ? 'Sembunyikan' : `Lihat Selengkapnya (${variants.length - INITIAL_SHOW} lainnya)`}
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800">
                      <strong>Tips:</strong> Gunakan Kalkulator Gorden kami untuk menghitung kebutuhan dan harga yang lebih akurat berdasarkan ukuran jendela Anda.
                    </p>
                  </div>
                </div>
              </TabsContent>
            )}
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

          {/* Grid Section - First 10 Items */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3 mb-8">
            {relatedProducts.slice(0, 10).map((relatedProduct) => (
              <ProductCardForDetail key={relatedProduct.id} product={relatedProduct} navigate={navigate} addToWishlist={addToWishlist} removeFromWishlist={removeFromWishlist} isInWishlist={isInWishlist} />
            ))}
          </div>

          {/* Slider Section - Remaining Items */}
          {relatedProducts.length > 10 && (
            <div className="relative">
              <RelatedProductsSlider products={relatedProducts.slice(10)} navigate={navigate} addToWishlist={addToWishlist} removeFromWishlist={removeFromWishlist} isInWishlist={isInWishlist} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-component for Product Card to reduce duplication
function ProductCardForDetail({ product, navigate, addToWishlist, removeFromWishlist, isInWishlist }: any) {
  return (
    <div className="group relative h-full">
      {/* Card Container */}
      <div className="relative bg-white rounded-md overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={getProductImageUrl(product.images)}
            alt={product.name}
            className="w-full h-full object-cover"
          />

          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badge */}
          {(product.badge || product.featured || product.bestSeller || product.newArrival) && (
            <Badge className="absolute top-3 left-3 bg-[#EB216A] text-white border-0 shadow-lg text-xs">
              {product.badge || (product.bestSeller ? 'Best Seller' : product.newArrival ? 'New' : 'Featured')}
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
            <Button
              className="w-full bg-white text-[#EB216A] hover:bg-[#EB216A] hover:text-white shadow-xl text-xs lg:text-sm"
              size="sm"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <ShoppingCart className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
              <span className="hidden lg:inline">Lihat Detail</span>
              <span className="lg:hidden">Detail</span>
            </Button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 lg:p-4 flex flex-col flex-grow">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 lg:mb-3 line-clamp-2 min-h-[40px] lg:min-h-[48px]">
            {product.name}
          </h3>

          {/* Price Section */}
          <div className="flex items-end justify-between mt-auto">
            <div className="flex flex-col gap-0.5 lg:gap-1">
              {/* Show discount if Gross > Net */}
              {product.minPriceGross && product.minPrice && Number(product.minPriceGross) > Number(product.minPrice) ? (
                <>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <span className="text-xs text-gray-400 line-through">
                      Rp {Number(product.minPriceGross).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] lg:text-xs bg-[#EB216A] text-white px-1.5 py-0.5 rounded">
                      -{Math.round((1 - Number(product.minPrice) / Number(product.minPriceGross)) * 100)}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-normal leading-tight">Mulai dari</span>
                    <span className="text-base lg:text-xl text-[#EB216A] font-semibold leading-tight">
                      Rp {Number(product.minPrice).toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              ) : product.minPrice && !isNaN(Number(product.minPrice)) ? (
                <>
                  <div className="h-4 lg:h-5" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-normal leading-tight">Mulai dari</span>
                    <span className="text-base lg:text-xl text-[#EB216A] font-semibold leading-tight">
                      Rp {Number(product.minPrice).toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-sm text-gray-500">Lihat varian</span>
              )}
              <span className="text-[10px] text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 mt-1 self-start">
                Per {product.price_unit || 'meter'}
              </span>
            </div>
            <button className="text-gray-400 hover:text-[#EB216A] transition-colors lg:hidden">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Slider Component
function RelatedProductsSlider({ products, navigate, addToWishlist, removeFromWishlist, isInWishlist }: any) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    breakpoints: {
      '(min-width: 1024px)': { align: 'start' }
    }
  }, [Autoplay({ delay: 4000, stopOnInteraction: true })]);

  return (
    <div className="relative group/slider">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-2 lg:-ml-3 py-4"> {/* Negative margin to offset padding */}
          {products.map((product: any) => (
            <div key={product.id} className="flex-[0_0_50%] sm:flex-[0_0_33.33%] lg:flex-[0_0_20%] min-w-0 pl-2 lg:pl-3 h-full">
              <ProductCardForDetail product={product} navigate={navigate} addToWishlist={addToWishlist} removeFromWishlist={removeFromWishlist} isInWishlist={isInWishlist} />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 lg:-ml-4 w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-[#EB216A] disabled:opacity-0 transition-all z-10 opacity-0 group-hover/slider:opacity-100"
        onClick={() => emblaApi?.scrollPrev()}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 lg:-mr-4 w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-[#EB216A] disabled:opacity-0 transition-all z-10 opacity-0 group-hover/slider:opacity-100"
        onClick={() => emblaApi?.scrollNext()}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}