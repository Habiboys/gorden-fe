import { Award, Briefcase, DollarSign, Users } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { Card, CardContent } from './ui/card';

const features = [
  {
    icon: Award,
    title: 'Material Premium',
    description: 'Menggunakan bahan berkualitas tinggi yang tahan lama dan mudah perawatan',
  },
  {
    icon: Users,
    title: 'Banyak Testimoni',
    description: 'Dipercaya oleh ribuan pelanggan dengan rating kepuasan tinggi',
  },
  {
    icon: DollarSign,
    title: 'Harga Transparan',
    description: 'Harga jelas tanpa biaya tersembunyi, sesuai dengan kualitas produk',
  },
  {
    icon: Briefcase,
    title: 'Tim Profesional',
    description: 'Tim ahli berpengalaman lebih dari 10 tahun di bidangnya',
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Keunggulan"
          title="Kenapa Memilih Kami?"
          description="Alasan mengapa Amagriya Gorden menjadi pilihan terbaik untuk hunian Anda"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="text-center hover:shadow-lg transition-all hover:-translate-y-1 duration-300"
              >
                <CardContent className="p-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}