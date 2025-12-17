import {
  Calendar,
  Camera,
  MapPin,
  MessageCircle,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '../components/ui/dialog';
import { galleryApi } from '../utils/api';

const categories = [
  { id: 'all', name: 'Semua' },
  { id: 'Rumah Tinggal', name: 'Rumah Tinggal' },
  { id: 'Apartemen', name: 'Apartemen' },
  { id: 'Kantor', name: 'Kantor' },
  { id: 'Cafe / Resto', name: 'Cafe / Resto' },
];

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGalleryItems();
  }, []);

  const loadGalleryItems = async () => {
    try {
      console.log('🔄 Loading gallery items for public page...');
      const response = await galleryApi.getAll();
      console.log('✅ Gallery API response:', response);

      if (response.success && response.data && response.data.length > 0) {
        console.log(`✅ Loaded ${response.data.length} gallery items from backend`);
        // Map backend fields to frontend expectation
        const mappedItems = response.data.map((item: any) => ({
          ...item,
          image: item.image_url,
          category: item.category, // ensure category matches strictly if needed, backend sends string
          type: item.type || item.installation_type, // fallback
          date: item.date, // already dateonly string
          location: item.location
        }));
        setGalleryItems(mappedItems);
      } else {
        console.log('ℹ️ No gallery items available yet. Check Admin Panel to add gallery items.');
        setGalleryItems([]);
      }
    } catch (error) {
      console.error('❌ Error loading gallery:', error);
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (item: any) => {
    setSelectedImage(item);
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    setTimeout(() => setSelectedImage(null), 300);
  };

  // Filter galeri berdasarkan kategori
  const filteredGallery = selectedCategory === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <section className="relative bg-gradient-to-br from-pink-50 via-white to-pink-50 pt-32 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-6 animate-pulse"></div>
            <div className="h-16 bg-gray-200 rounded w-96 mx-auto mb-6 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-64 mx-auto animate-pulse"></div>
          </div>
        </section>
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-200 rounded-2xl h-96 animate-pulse"></div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Header Section */}
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-pink-50 pt-32 pb-16 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#EB216A]/10 text-[#EB216A] px-4 py-2 rounded-full mb-6">
            <Camera className="w-4 h-4" />
            <span className="text-sm">Portofolio Kami</span>
          </div>

          <h1 className="text-5xl lg:text-6xl text-gray-900 mb-6">
            Galeri Proyek Amagriya
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Kumpulan dokumentasi pemasangan gorden dari berbagai klien.
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="inline-flex bg-gray-100 rounded-2xl p-1.5 gap-1.5 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-xl transition-all duration-300 ${selectedCategory === category.id
                      ? 'bg-[#EB216A] text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Counter */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Menampilkan <span className="text-[#EB216A]">{filteredGallery.length}</span> proyek
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                onClick={() => handleImageClick(item)}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer"
              >
                {/* Image */}
                <div className="relative h-72 overflow-hidden bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />

                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Category Badge */}
                  <Badge className="absolute top-4 left-4 bg-[#EB216A] text-white border-0 shadow-lg">
                    {item.category}
                  </Badge>

                  {/* Hover Text */}
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <p className="text-white text-sm">Klik untuk melihat detail</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg text-gray-900 mb-2 group-hover:text-[#EB216A] transition-colors">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{item.location}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="border-gray-300 text-gray-700">
                      {item.type}
                    </Badge>
                    <span className="text-xs text-gray-500">{item.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredGallery.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl text-gray-900 mb-2">Tidak ada proyek ditemukan</h3>
              <p className="text-gray-600">Coba pilih kategori lain</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-white to-pink-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-gray-100">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4">
              Ingin Pasang Gorden Seperti Ini?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Konsultasikan kebutuhan gorden Anda dengan tim profesional kami sekarang
            </p>

            <Button
              size="lg"
              className="bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-xl text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-12 py-5 sm:py-6 shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto"
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              <span className="hidden sm:inline">Hubungi Kami Sekarang</span>
              <span className="sm:hidden">Hubungi Kami</span>
            </Button>

            <p className="text-xs sm:text-sm text-gray-500 mt-6">
              Gratis konsultasi • Survey & pengukuran • Instalasi profesional
            </p>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      <Dialog open={isLightboxOpen} onOpenChange={handleCloseLightbox}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-transparent border-0" aria-describedby="gallery-image-description">
          <DialogDescription id="gallery-image-description" className="sr-only">
            Tampilan detail gambar galeri dengan informasi lokasi, tipe pemasangan, dan tanggal
          </DialogDescription>
          {selectedImage && (
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={handleCloseLightbox}
                className="absolute top-4 right-4 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-all shadow-xl"
              >
                <X className="w-6 h-6 text-gray-900" />
              </button>

              {/* Image */}
              <div className="relative w-full h-[60vh] md:h-[70vh] bg-black rounded-t-2xl overflow-hidden">
                <img
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Info Section */}
              <div className="bg-white rounded-b-2xl p-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Badge className="bg-[#EB216A]/10 text-[#EB216A] border-0 mb-3">
                      {selectedImage.category}
                    </Badge>
                    <h2 className="text-3xl text-gray-900 mb-2">
                      {selectedImage.title}
                    </h2>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#EB216A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-[#EB216A]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Lokasi</p>
                      <p className="text-gray-900">{selectedImage.location}</p>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#EB216A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Camera className="w-5 h-5 text-[#EB216A]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tipe Pemasangan</p>
                      <p className="text-gray-900">{selectedImage.type}</p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#EB216A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-[#EB216A]" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Tanggal Pemasangan</p>
                      <p className="text-gray-900">{selectedImage.date}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}