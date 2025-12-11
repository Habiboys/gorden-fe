import { Button } from './ui/button';
import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="relative min-h-[700px] flex items-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1763939919676-97187d9f4db0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwY3VydGFpbnMlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NjUwNzk4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-[#EB216A]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-[#EB216A]/10 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pt-40">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#EB216A]/90 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm">Terpercaya sejak 2014</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">
            Solusi Gorden Berkualitas untuk Hunian{' '}
            <span className="text-[#EB216A]">Nyaman & Elegan</span>
          </h1>

          {/* Subtext */}
          <p className="text-xl md:text-2xl mb-10 text-gray-200 leading-relaxed">
            Pilih model terbaik, hitung kebutuhan otomatis, dan pesan langsung. 
            Dapatkan gratis survey dan konsultasi desain dari tim profesional kami.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/products">
              <Button
                size="lg"
                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white px-8 py-6 text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all w-full sm:w-auto"
              >
                Lihat Produk
              </Button>
            </Link>
            <Link to="/calculator">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-[#EB216A] px-8 py-6 text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all w-full sm:w-auto"
              >
                Hitung Kebutuhan
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t border-white/20">
            <div>
              <div className="text-4xl text-[#EB216A] mb-2">1000+</div>
              <div className="text-gray-300">Pelanggan Puas</div>
            </div>
            <div>
              <div className="text-4xl text-[#EB216A] mb-2">10+</div>
              <div className="text-gray-300">Tahun Pengalaman</div>
            </div>
            <div>
              <div className="text-4xl text-[#EB216A] mb-2">100%</div>
              <div className="text-gray-300">Garansi Pemasangan</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}