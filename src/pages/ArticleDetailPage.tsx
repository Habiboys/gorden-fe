import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, Share2, Facebook, Twitter, MessageCircle, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

// Mock data - same as ArticlesPage
const mockArticles = [
  {
    id: 1,
    title: '10 Tips Memilih Gorden yang Tepat untuk Rumah Minimalis',
    slug: '10-tips-memilih-gorden-rumah-minimalis',
    excerpt: 'Rumah minimalis membutuhkan gorden yang tepat untuk menciptakan kesan elegan dan tidak berlebihan. Simak tips lengkapnya di sini.',
    category: 'tips',
    categoryLabel: 'Tips & Trik',
    author: 'Admin Amagriya',
    publishDate: '15 Januari 2024',
    readTime: '5 menit',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200',
    featured: true,
    views: 1250,
    content: `
      <p>Rumah minimalis kini menjadi pilihan banyak orang karena desainnya yang simpel namun elegan. Salah satu elemen penting yang dapat mempercantik rumah minimalis adalah pemilihan gorden yang tepat.</p>
      
      <h2>1. Pilih Warna Netral</h2>
      <p>Untuk rumah minimalis, warna netral seperti putih, abu-abu, atau krem adalah pilihan terbaik. Warna-warna ini memberikan kesan bersih dan tidak ramai, sesuai dengan konsep minimalis.</p>
      
      <h2>2. Perhatikan Material</h2>
      <p>Material gorden yang ringan seperti linen atau katun cocok untuk rumah minimalis. Hindari material yang terlalu tebal atau berkilau yang dapat mengganggu kesan simpel.</p>
      
      <h2>3. Model Smokering untuk Kesan Modern</h2>
      <p>Gorden model smokering memberikan lipatan yang rapi dan teratur, sangat cocok untuk rumah minimalis modern. Model ini juga mudah dibuka-tutup.</p>
      
      <h2>4. Ukuran yang Pas</h2>
      <p>Pastikan ukuran gorden sesuai dengan jendela. Gorden yang terlalu panjang atau pendek dapat mengganggu estetika ruangan minimalis Anda.</p>
      
      <h2>5. Pertimbangkan Fungsi Blackout</h2>
      <p>Untuk kamar tidur di rumah minimalis, pertimbangkan gorden blackout yang dapat memblokir cahaya sepenuhnya untuk tidur yang lebih berkualitas.</p>
      
      <h2>6. Kombinasi dengan Vitrase</h2>
      <p>Kombinasi gorden tebal dengan vitrase tipis memberikan fleksibilitas dalam mengatur pencahayaan sambil tetap menjaga privasi.</p>
      
      <h2>7. Hindari Motif yang Ramai</h2>
      <p>Konsep minimalis mengedepankan kesederhanaan. Pilih gorden polos atau dengan motif geometris simple yang tidak terlalu mencolok.</p>
      
      <h2>8. Perhatikan Sistem Rel</h2>
      <p>Pilih rel gorden yang simpel dan tidak terlalu dekoratif. Rel aluminium dengan warna netral adalah pilihan yang tepat.</p>
      
      <h2>9. Sesuaikan dengan Pencahayaan Ruangan</h2>
      <p>Jika ruangan kurang cahaya, pilih gorden dengan warna terang dan material tipis. Sebaliknya, untuk ruangan yang terlalu terang, gorden gelap dapat membantu.</p>
      
      <h2>10. Budget yang Realistis</h2>
      <p>Tentukan budget sejak awal. Gorden berkualitas tidak selalu mahal, yang penting adalah pemilihan yang tepat sesuai kebutuhan.</p>
      
      <h2>Kesimpulan</h2>
      <p>Memilih gorden untuk rumah minimalis memang memerlukan pertimbangan khusus. Dengan mengikuti 10 tips di atas, Anda dapat menemukan gorden yang sempurna untuk menciptakan rumah minimalis impian Anda.</p>
      
      <p>Butuh bantuan dalam memilih gorden? Tim Amagriya Gorden siap membantu Anda menemukan solusi terbaik. Hubungi kami untuk konsultasi gratis!</p>
    `
  },
  {
    id: 2,
    title: 'Warna Gorden Terbaik untuk Ruang Tamu Modern',
    slug: 'warna-gorden-terbaik-ruang-tamu-modern',
    excerpt: 'Pemilihan warna gorden dapat mengubah suasana ruang tamu Anda. Pelajari kombinasi warna yang sempurna untuk ruang tamu modern.',
    category: 'inspiration',
    categoryLabel: 'Inspirasi Desain',
    author: 'Admin Amagriya',
    publishDate: '12 Januari 2024',
    readTime: '7 menit',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200',
    featured: true,
    views: 980,
    content: `
      <p>Ruang tamu adalah wajah rumah Anda. Pemilihan warna gorden yang tepat dapat menciptakan atmosfer yang sempurna untuk menerima tamu dan bersantai bersama keluarga.</p>
      
      <h2>Warna Abu-abu: Elegan dan Timeless</h2>
      <p>Abu-abu adalah warna yang sangat versatile dan cocok untuk berbagai gaya interior modern. Warna ini memberikan kesan sophisticated tanpa terlihat terlalu formal.</p>
      
      <h2>Putih Gading: Clean dan Bright</h2>
      <p>Putih gading atau off-white memberikan kesan bersih dan membuat ruangan terasa lebih luas dan terang. Sempurna untuk ruang tamu berukuran kecil hingga sedang.</p>
      
      <h2>Navy Blue: Bold dan Sophisticated</h2>
      <p>Untuk tampilan yang lebih berani, navy blue adalah pilihan tepat. Warna ini memberikan depth dan karakter pada ruang tamu modern Anda.</p>
      
      <h2>Kombinasi Warna</h2>
      <p>Jangan takut untuk mengkombinasikan warna! Gorden abu-abu dengan aksen emas, atau putih dengan detail silver dapat menciptakan focal point yang menarik.</p>
      
      <p>Kunjungi showroom Amagriya Gorden untuk melihat berbagai pilihan warna dan mendapatkan sample gratis!</p>
    `
  },
];

export default function ArticleDetailPage() {
  const { slug } = useParams();
  const article = mockArticles.find(a => a.slug === slug);

  if (!article) {
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

  const relatedArticles = mockArticles
    .filter(a => a.id !== article.id && a.category === article.category)
    .slice(0, 3);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = article.title;
    
    switch(platform) {
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
        <img
          src={article.image}
          alt={article.title}
          className="w-full h-full object-cover opacity-80"
        />
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
              <span>Oleh {article.author}</span>
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
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Tags */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    gorden minimalis
                  </Badge>
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    tips interior
                  </Badge>
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    dekorasi rumah
                  </Badge>
                  <Badge variant="outline" className="border-gray-300 text-gray-700">
                    {article.categoryLabel.toLowerCase()}
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
                <h3 className="text-lg text-gray-900 mb-2">{article.author}</h3>
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
                    <img
                      src={related.image}
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
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
