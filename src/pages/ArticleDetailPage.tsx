import { ArrowLeft, Calendar, Clock, Eye, Facebook, Loader2, MessageCircle, Share2, Twitter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { articlesApi } from '../utils/api';

export default function ArticleDetailPage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [relatedArticles, setRelatedArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    if (!slug) return;

    setLoading(true);
    setError(false);

    try {
      const response = await articlesApi.getBySlug(slug);
      if (response.success && response.data) {
        const articleData = {
          ...response.data,
          image: response.data.image_url,
          publishDate: new Date(response.data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          readTime: '5 menit',
          categoryLabel: getCategoryLabel(response.data.category),
          views: response.data.view_count || 0,
          featured: response.data.is_featured || false
        };
        setArticle(articleData);

        // Load related articles
        loadRelatedArticles(response.data.category, response.data.id);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error loading article:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedArticles = async (category: string, currentId: string) => {
    try {
      const response = await articlesApi.getAll({ category, limit: 4 });
      if (response.success && response.data) {
        const related = response.data
          .filter((a: any) => a.id !== currentId)
          .slice(0, 3)
          .map((a: any) => ({
            ...a,
            image: a.image_url,
            publishDate: new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
            categoryLabel: getCategoryLabel(a.category)
          }));
        setRelatedArticles(related);
      }
    } catch (err) {
      console.error('Error loading related articles:', err);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'tips': 'Tips & Trik',
      'inspiration': 'Inspirasi Desain',
      'inspirasi': 'Inspirasi Desain',
      'guide': 'Panduan',
      'trend': 'Tren Terkini',
      'tutorial': 'Tutorial',
      'perawatan': 'Perawatan'
    };
    return labels[category] || 'Artikel';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-20">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#EB216A] mx-auto mb-4" />
            <p className="text-gray-600">Memuat artikel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl text-gray-900 mb-4">Artikel tidak ditemukan</h1>
          <Link to="/articles">
            <Button className="bg-[#EB216A] hover:bg-[#d11d5e] text-white">
              Kembali ke Artikel
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = article.title;

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${text} ${url}`, '_blank');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Image */}
      <div className="relative h-[60vh] bg-gray-900">
        {article.image ? (
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#EB216A] to-purple-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        {/* Back Button */}
        <Link
          to="/articles"
          className="absolute top-28 left-4 sm:left-8 z-10 flex items-center gap-2 text-white hover:text-pink-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Kembali</span>
        </Link>

        {/* Article Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
          <div className="max-w-4xl mx-auto">
            <Badge className="bg-[#EB216A] text-white border-0 mb-4">
              {article.categoryLabel}
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/90">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {article.publishDate}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {article.readTime}
              </span>
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                {article.views} views
              </span>
              <span>Oleh {article.author || 'Admin Amagriya'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Article Excerpt */}
              {article.excerpt && (
                <p className="text-xl text-gray-600 mb-8 leading-relaxed italic border-l-4 border-[#EB216A] pl-4">
                  {article.excerpt}
                </p>
              )}

              {/* Article Body */}
              <div
                className="prose prose-lg max-w-none
                  prose-headings:text-gray-900 prose-headings:font-serif
                  prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                  prose-strong:text-gray-900
                  prose-a:text-[#EB216A] prose-a:no-underline hover:prose-a:underline
                "
                dangerouslySetInnerHTML={{ __html: article.content || '' }}
              />

              {/* Tags */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    gorden
                  </Badge>
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    interior
                  </Badge>
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    dekorasi rumah
                  </Badge>
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    {article.categoryLabel?.toLowerCase()}
                  </Badge>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
                <p className="text-sm text-gray-600 mb-4">Bagikan artikel ini:</p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="border-sky-500 text-sky-500 hover:bg-sky-50"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('whatsapp')}
                    className="border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(window.location.href)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 space-y-6">
              {/* Author Card */}
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
                <div className="w-16 h-16 bg-[#EB216A] rounded-full flex items-center justify-center text-white text-xl mb-4">
                  A
                </div>
                <h3 className="text-lg text-gray-900 mb-2">{article.author || 'Admin Amagriya'}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Tim ahli Amagriya Gorden yang berpengalaman dalam desain interior dan solusi gorden.
                </p>
              </div>

              {/* CTA Card */}
              <div className="bg-gradient-to-br from-[#EB216A] to-pink-600 rounded-2xl p-6 text-white">
                <h3 className="text-xl mb-3">Butuh Konsultasi?</h3>
                <p className="text-sm text-white/90 mb-4">
                  Dapatkan konsultasi gratis untuk memilih gorden yang tepat untuk rumah Anda.
                </p>
                <Button className="w-full bg-white text-[#EB216A] hover:bg-gray-100">
                  Hubungi Kami
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl text-gray-900 mb-8">Artikel Terkait</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  to={`/articles/${related.slug}`}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-[#EB216A]/20 hover:shadow-lg transition-all"
                >
                  <div className="relative h-40 overflow-hidden">
                    {related.image ? (
                      <img
                        src={related.image}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm text-gray-900 mb-2 line-clamp-2 group-hover:text-[#EB216A] transition-colors">
                      {related.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {related.publishDate}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

