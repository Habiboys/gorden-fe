import { Clock, HeadphonesIcon, Maximize, PenTool, Ruler, Shield, ShieldCheck, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { servicesApi } from '../utils/api';
import { SectionHeader } from './SectionHeader';
import { Card, CardContent } from './ui/card';

// Icon mapping
const iconMap: any = {
  Ruler,
  PenTool,
  Maximize,
  ShieldCheck,
  Shield,
  Truck,
  Clock,
  HeadphonesIcon,
};

export function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await servicesApi.getAll();
      if (response.success) {
        // Filter only active services
        const activeServices = response.data.filter((s: any) => s.active !== false);
        setServices(activeServices);
      }
    } catch (error) {
      console.error('Error loading services:', error);
      // Fallback to default services on error
      setServices([
        {
          id: '1',
          icon: 'Ruler',
          title: 'Survey & Ukur Gratis',
          description: 'Tim profesional kami akan datang untuk mengukur area Anda secara akurat',
        },
        {
          id: '2',
          icon: 'PenTool',
          title: 'Konsultasi Desain',
          description: 'Konsultasi gratis untuk memilih desain dan model yang tepat',
        },
        {
          id: '3',
          icon: 'Maximize',
          title: 'Custom Sesuai Ukuran',
          description: 'Produk dibuat custom sesuai dengan ukuran kebutuhan Anda',
        },
        {
          id: '4',
          icon: 'ShieldCheck',
          title: 'Garansi Pemasangan',
          description: 'Garansi pemasangan untuk memastikan kualitas layanan terbaik',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Layanan"
            title="Layanan Kami"
            description="Dapatkan pengalaman terbaik dengan layanan profesional kami"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

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
            const Icon = iconMap[service.icon] || ShieldCheck;
            return (
              <Card
                key={service.id}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="w-12 h-12 bg-[#EB216A]/10 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden">
                    {service.icon && service.icon.startsWith('http') ? (
                      <img src={service.icon} alt={service.title} className="w-6 h-6 object-contain" />
                    ) : (
                      <Icon className="h-6 w-6 text-[#EB216A]" />
                    )}
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">{service.title}</h3>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}