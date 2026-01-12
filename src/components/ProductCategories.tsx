import { Blinds, Circle, Folder, Grid3x3, Sparkles, Square, Sun, Waves, Wind } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi } from '../utils/api';
import { SectionHeader } from './SectionHeader';
import { Card } from './ui/card';

// Icon mapping for categories
const iconMap: { [key: string]: any } = {
  'Gorden Smokering': Waves,
  'Gorden Kupu-kupu': Wind,
  'Zebra Blind': Grid3x3,
  'Wooden Blind': Blinds,
  'Roller Blind': Square,
  'Vertical Blind': Grid3x3,
  'Wallpaper': Sparkles,
  'Lantai Vynil': Square,
  'Jipproll': Circle,
  'Outdoor': Sun,
  'Blinds': Blinds,
  'default': Folder
};

// Default placeholder image
const defaultImage = 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?w=800';

function getIconComponent(categoryName: string, iconUrl?: string) {
  if (iconUrl) {
    return (props: any) => (
      <img
        src={iconUrl}
        alt={categoryName}
        className={props.className}
        style={{ objectFit: 'contain' }}
      />
    );
  }
  return iconMap[categoryName] || iconMap['default'];
}

export function ProductCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('🔄 Fetching categories for homepage...');
        const response = await categoriesApi.getAll();
        console.log('✅ Categories fetched:', response);

        if (response.success && response.data && response.data.length > 0) {
          setCategories(response.data);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Koleksi"
            title="Kategori Produk"
            description="Pilih kategori produk yang sesuai dengan kebutuhan Anda"
          />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-md animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Koleksi"
            title="Kategori Produk"
            description="Pilih kategori produk yang sesuai dengan kebutuhan Anda"
          />
          <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <p className="text-gray-500 mb-2">Belum ada kategori yang tersedia</p>
            <p className="text-sm text-gray-400">
              Silakan tambahkan kategori melalui Admin Panel
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Koleksi"
          title="Kategori Produk"
          description="Pilih kategori produk yang sesuai dengan kebutuhan Anda"
        />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {categories.map((category) => {
            const Icon = getIconComponent(category.name, category.icon_url);
            // Prioritize uploaded image, then image_url (legacy), then default
            const imageUrl = category.image || category.image_url || defaultImage;
            return (
              <Link key={category.id || category.name} to={`/products?categoryId=${category.id}`}>
                <Card
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group rounded-md"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                      <div className="w-10 h-10 bg-[#EB216A] rounded-full flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-base font-medium">{category.name}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}