import { useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

// Mock product data
const products = [
  {
    id: '1',
    name: 'Gorden Blackout Minimalis Premium',
    price: 185000,
    image: 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGludGVyaW9yfGVufDF8fHx8MTc2NTA4NTY4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Minimalis'
  },
  {
    id: '2',
    name: 'Vertical Blind Modern Elegan',
    price: 165000,
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHN8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Vertical Blind'
  },
  {
    id: '3',
    name: 'Gorden Klasik Mewah Berkualitas',
    price: 225000,
    image: 'https://images.unsplash.com/photo-1762360411005-863ffdaa7691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJhcGVzJTIwZmFicmljfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Klasik'
  },
  {
    id: '4',
    name: 'Vitrase Sheer Tipis Transparan',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY3VydGFpbnMlMjBob21lfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Vitrase'
  },
  {
    id: '5',
    name: 'Roller Blind Anti UV Terbaik',
    price: 145000,
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2xsZXIlMjBibGluZHMlMjBtb2Rlcm58ZW58MXx8fHwxNzY1MDg1Njg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Roller Blind'
  },
  {
    id: '6',
    name: 'Gorden Katun Linen Natural',
    price: 175000,
    image: 'https://images.unsplash.com/photo-1763718094072-239b21e9dc20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGFzc2ljJTIwd2luZG93JTIwdHJlYXRtZW50fGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Minimalis'
  },
  {
    id: '7',
    name: 'Gorden Polyester Premium Awet',
    price: 135000,
    image: 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGludGVyaW9yfGVufDF8fHx8MTc2NTA4NTY4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Minimalis'
  },
  {
    id: '8',
    name: 'Gorden Suede Luxury Eksklusif',
    price: 285000,
    image: 'https://images.unsplash.com/photo-1762360411005-863ffdaa7691?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZHJhcGVzJTIwZmFicmljfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Klasik'
  },
  {
    id: '9',
    name: 'Gorden Satin Glossy Mengkilap',
    price: 195000,
    image: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY3VydGFpbnMlMjBob21lfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Gorden Minimalis'
  }
];

export default function ProductListing() {
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
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
                    className={`px-4 py-2 rounded-lg transition-all ${
                      selectedCategory === category.value
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