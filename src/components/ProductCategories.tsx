import { Card } from './ui/card';
import { Blinds, Waves, Wind, Grid3x3, Square, Sparkles, Sun, Circle } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

const categories = [
  {
    name: 'Gorden Smokering',
    icon: Waves,
    image: 'https://images.unsplash.com/photo-1754611362309-71297e9f42fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjdXJ0YWlucyUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzY1MDc5ODg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Gorden Kupu-kupu',
    icon: Wind,
    image: 'https://images.unsplash.com/photo-1621215052063-6ed29c948b31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGJlZHJvb218ZW58MXx8fHwxNzY1MDc5ODkwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Zebra Blind',
    icon: Grid3x3,
    image: 'https://images.unsplash.com/photo-1518002903142-1f4ef6851390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBibGluZHMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Wooden Blind',
    icon: Blinds,
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHM8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Roller Blind',
    icon: Square,
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2xsZXIlMjBibGluZHMlMjBtb2Rlcm58ZW58MXx8fHwxNzY1MDg1Njg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Vertical Blind',
    icon: Grid3x3,
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB3aW5kb3clMjBibGluZHM8ZW58MXx8fHwxNzY1MDg1Njg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Wallpaper',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGludGVyaW9yfGVufDF8fHx8MTc2NTA4NTY4NXww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Lantai Vynil',
    icon: Square,
    image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjYXJwZXQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4OTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Jipproll',
    icon: Circle,
    image: 'https://images.unsplash.com/photo-1763939919676-97187d9f4db0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwY3VydGFpbnMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Outdoor',
    icon: Sun,
    image: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwY3VydGFpbnMlMjBob21lfGVufDF8fHx8MTc2NTA4NTY4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export function ProductCategories() {
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
            const Icon = category.icon;
            return (
              <Card
                key={category.name}
                className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group rounded-md"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-3 text-white">
                    <div className="w-12 h-12 bg-[#EB216A] rounded-full flex items-center justify-center">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-lg">{category.name}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}