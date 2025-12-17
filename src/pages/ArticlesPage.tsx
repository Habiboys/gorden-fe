import { ArrowRight, Calendar, Clock, Search, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { articlesApi } from '../utils/api';

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

      const response = await articlesApi.getAll(params);
      if (response.success && response.data && response.data.length > 0) {
        const mappedArticles = response.data.map((article: any) => ({
          ...article,
          image: article.image_url,
          publishDate: new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          readTime: '5 menit',
          categoryLabel: article.category === 'tips' ? 'Tips & Trik' : article.category === 'inspiration' ? 'Inspirasi Desain' : 'Artikel',
          excerpt: article.excerpt || (article.content ? article.content.substring(0, 100) + '...' : '')
        }));
        setArticles(mappedArticles);
      } else {
        console.log('ℹ️ No articles available yet. Admin can add articles via Admin Panel.');
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
      <section className="relative bg-gradient-to-br from-[#EB216A] via-pink-600 to-purple-600 text-white pt-32 pb-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6">
              Artikel & Inspirasi Gorden
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              Tips, panduan, dan inspirasi desain untuk menciptakan rumah impian Anda
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-6 rounded-full text-base border-0 shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 fill-white" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ transform: 'scaleY(-1)' }}>
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
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