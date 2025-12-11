import { Button } from './ui/button';
import { SectionHeader } from './SectionHeader';

const galleryImages = [
  'https://images.unsplash.com/photo-1754611362309-71297e9f42fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjdXJ0YWlucyUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzY1MDc5ODg5fDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1621215052063-6ed29c948b31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBjdXJ0YWlucyUyMGJlZHJvb218ZW58MXx8fHwxNzY1MDc5ODkwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1763939919676-97187d9f4db0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwY3VydGFpbnMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1518002903142-1f4ef6851390?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3clMjBibGluZHMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBjYXJwZXQlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4OTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
  'https://images.unsplash.com/photo-1763939919676-97187d9f4db0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwaW50ZXJpb3IlMjBjdXJ0YWluc3xlbnwxfHx8fDE3NjUwNzk4OTB8MA&ixlib=rb-4.1.0&q=80&w=1080',
];

export function Gallery() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Portfolio"
          title="Galeri Proyek Kami"
          description="Lihat hasil karya dan proyek-proyek yang telah kami selesaikan"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="relative h-64 overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
            >
              <img
                src={image}
                alt={`Gallery ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white"
          >
            Lihat Galeri Lengkap
          </Button>
        </div>
      </div>
    </section>
  );
}