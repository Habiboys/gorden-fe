import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { SectionHeader } from './SectionHeader';
import { galleryApi } from '../utils/api';

export function Gallery() {
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGalleryImages();
  }, []);

  const loadGalleryImages = async () => {
    try {
      console.log('🔄 Loading featured gallery for homepage...');
      const response = await galleryApi.getAll({ featured: true });
      console.log('✅ Featured gallery response:', response);
      
      if (response.success && response.data && response.data.length > 0) {
        // Get first 6 items for homepage
        console.log(`📊 Loaded ${response.data.length} featured gallery items`);
        setGalleryImages(response.data.slice(0, 6));
      } else {
        // Fallback to all items if no featured items
        console.log('⚠️ No featured items, loading all gallery items...');
        const allResponse = await galleryApi.getAll();
        if (allResponse.success && allResponse.data && allResponse.data.length > 0) {
          console.log(`✅ Loaded ${allResponse.data.length} gallery items for homepage`);
          setGalleryImages(allResponse.data.slice(0, 6));
        } else {
          console.log('ℹ️ No gallery items available yet. Admin can add gallery items via Admin Panel.');
          setGalleryImages([]);
        }
      }
    } catch (error) {
      console.error('❌ Error loading gallery:', error);
      setGalleryImages([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Portfolio"
            title="Galeri Proyek Kami"
            description="Lihat hasil karya dan proyek-proyek yang telah kami selesaikan"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Portfolio"
          title="Galeri Proyek Kami"
          description="Lihat hasil karya dan proyek-proyek yang telah kami selesaikan"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {galleryImages.map((item, index) => {
            const imageUrl = typeof item === 'string' ? item : item.image;
            const title = typeof item === 'string' ? `Gallery ${index + 1}` : item.title;
            
            return (
              <div
                key={index}
                className="relative h-64 overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
              >
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link to="/gallery">
            <Button
              size="lg"
              variant="outline"
              className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white"
            >
              Lihat Galeri Lengkap
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}