import { Card, CardContent } from './ui/card';
import { Ruler, PenTool, Maximize, ShieldCheck } from 'lucide-react';
import { SectionHeader } from './SectionHeader';

const services = [
  {
    icon: Ruler,
    title: 'Survey & Ukur Gratis',
    description: 'Tim profesional kami akan datang untuk mengukur area Anda secara akurat',
  },
  {
    icon: PenTool,
    title: 'Konsultasi Desain',
    description: 'Konsultasi gratis untuk memilih desain dan model yang tepat',
  },
  {
    icon: Maximize,
    title: 'Custom Sesuai Ukuran',
    description: 'Produk dibuat custom sesuai dengan ukuran kebutuhan Anda',
  },
  {
    icon: ShieldCheck,
    title: 'Garansi Pemasangan',
    description: 'Garansi pemasangan untuk memastikan kualitas layanan terbaik',
  },
];

export function Services() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Layanan"
          title="Layanan Kami"
          description="Dapatkan pengalaman terbaik dengan layanan profesional kami"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card
                key={service.title}
                className="text-center hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-[#EB216A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-[#EB216A]" />
                  </div>
                  <h3 className="mb-3">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}