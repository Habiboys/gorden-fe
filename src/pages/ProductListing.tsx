import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { categoriesApi, productsApi } from '../utils/api';

export default function ProductListing() {
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([{ value: 'all', label: 'Semua Kategori' }]);
  const [loading, setLoading] = useState(true);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('🔄 Fetching products from backend...');
        const response = await productsApi.getAll();
        console.log('✅ Products fetched:', response);
        const mappedProducts = (response.data || []).map((p: any) => ({
          ...p,
          image: p.image_url, // map snake_case to camelCase for component
          category: p.category_id || p.category, // fallback
          price: typeof p.price_self_measure === 'string' ? parseFloat(p.price_self_measure) : p.price_self_measure, // ensure number
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
        const categoryOptions = [
          { value: 'all', label: 'Semua Kategori' },
          ...(response.data || []).map((cat: any) => ({
            value: cat.name,
            label: cat.name
          }))
        ];
        setCategories(categoryOptions);
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);

  const categoriesOld = [
    { value: 'all', label: 'Semua Kategori' },
    { value: 'Gorden Minimalis', label: 'Gorden Minimalis' },
    { value: 'Gorden Klasik', label: 'Gorden Klasik' },
    { value: 'Vertical Blind', label: 'Vertical Blind' },
    { value: 'Roller Blind', label: 'Roller Blind' },
    { value: 'Vitrase', label: 'Vitrase' },
  ];

  // Filter products based on search query and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl text-gray-900 mb-2">Katalog Produk</h1>
          <p className="text-gray-600">
            Temukan gorden dan blind berkualitas premium untuk rumah Anda
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Product Grid */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari produk gorden, blind, atau wallpaper..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-base border-gray-200 focus:border-[#EB216A] focus:ring-[#EB216A] rounded-xl"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`px-4 py-2 rounded-lg transition-all ${selectedCategory === category.value
                        ? 'bg-[#EB216A] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Results Count */}
                <div className="text-gray-600">
                  Menampilkan <span className="text-gray-900">{filteredProducts.length}</span> produk
                </div>

                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px]">
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
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 lg:gap-3">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl text-gray-900 mb-2">Produk tidak ditemukan</h3>
                  <p className="text-gray-600">
                    Coba kata kunci lain atau hapus filter pencarian
                  </p>
                </div>
              )}
            </div>

            {/* Load More Button */}
            <div className="mt-12 text-center">
              <Button
                variant="outline"
                size="lg"
                className="px-8 hover:border-[#EB216A] hover:text-[#EB216A]"
              >
                Muat Lebih Banyak
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}