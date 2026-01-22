import { ArrowRight, Calendar, Clock, Search, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { articlesApi } from '../utils/api';
import { getProductImageUrl } from '../utils/imageHelper';

const categories = [
  { id: 'all', name: 'Semua Artikel' },
  { id: 'tips', name: 'Tips & Trik' },
  { id: 'inspiration', name: 'Inspirasi Desain' },
  { id: 'guide', name: 'Panduan' },
  { id: 'trend', name: 'Tren Terkini' },
];

export default function ArticlesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, [selectedCategory, searchQuery]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      // Enforce published status for public page
      params.status = 'PUBLISHED';

      const response = await articlesApi.getAll(params);
      if (response.success && response.data && response.data.length > 0) {
        // Force client-side filtering for PUBLISHED only
        const publishedOnly = response.data.filter((a: any) => a.status === 'PUBLISHED' || a.status === 'published');

        const mappedArticles = publishedOnly.map((article: any) => {
          // Handle case sensitivity for valid JSON date field
          const dateRaw = article.createdAt || article.created_at || article.updatedAt || article.updated_at;

          return {
            ...article,
            image: getProductImageUrl(article.image_url || article.image),
            publishDate: (() => {
              if (!dateRaw) return '-';
              const date = new Date(dateRaw);
              return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            })(),
            readTime: '5 menit',
            categoryLabel: article.category === 'tips' ? 'Tips & Trik' : article.category === 'inspiration' ? 'Inspirasi Desain' : 'Artikel',
            excerpt: article.excerpt || (article.content ? article.content.substring(0, 100) + '...' : ''),
            featured: article.is_featured || false
          };
        });
        setArticles(mappedArticles);
      } else {
        console.log('No articles available yet. Admin can add articles via Admin Panel.');
        setArticles([]);
      }
    } catch (error) {
      console.error('❌ Error loading articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles;
  const featuredArticles = articles.filter(a => a.featured).slice(0, 2);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-pink-50 pt-32 pb-16 overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#EB216A]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#EB216A]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4 font-bold">
              Artikel & Inspirasi Gorden
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Tips, panduan, dan inspirasi desain untuk menciptakan rumah impian Anda
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-5 rounded-full text-sm border border-gray-200 shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 border-b border-gray-100 sticky top-24 bg-white z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-2 rounded-full whitespace-nowrap text-sm transition-all ${selectedCategory === cat.id
                  ? 'bg-[#EB216A] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {selectedCategory === 'all' && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-8">
              <TrendingUp className="w-6 h-6 text-[#EB216A]" />
              <h2 className="text-2xl text-gray-900">Artikel Pilihan</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/articles/${article.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <Badge className="absolute top-4 left-4 bg-[#EB216A] text-white border-0">
                      {article.categoryLabel}
                    </Badge>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl text-gray-900 mb-3 group-hover:text-[#EB216A] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {article.publishDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {article.readTime}
                        </span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-[#EB216A] group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Articles */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl text-gray-900 mb-2">
              {selectedCategory === 'all' ? 'Semua Artikel' : categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <p className="text-sm text-gray-600">
              {filteredArticles.length} artikel ditemukan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                to={`/articles/${article.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#EB216A]/20 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <Badge className="absolute top-3 left-3 bg-white/90 text-gray-900 border-0 text-xs">
                    {article.categoryLabel}
                  </Badge>
                </div>
                <div className="p-5">
                  <h3 className="text-base text-gray-900 mb-2 line-clamp-2 group-hover:text-[#EB216A] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {article.publishDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.readTime}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* No Results */}
          {filteredArticles.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl text-gray-900 mb-2">Artikel tidak ditemukan</h3>
              <p className="text-gray-600 mb-6">
                Coba ubah kata kunci pencarian atau pilih kategori lain
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
              >
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl text-gray-900 mb-4">
            Dapatkan Update Artikel Terbaru
          </h2>
          <p className="text-gray-600 mb-8">
            Subscribe newsletter kami untuk mendapatkan tips, inspirasi, dan promo menarik langsung ke email Anda
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Email Anda"
              className="flex-1"
            />
            <Button className="bg-[#EB216A] hover:bg-[#d11d5e] text-white whitespace-nowrap">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}