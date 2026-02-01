import { Gift, ShieldCheck, Truck } from 'lucide-react';
import { Button } from './ui/button';

export function PromoBanner() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#EB216A] to-[#f067a0] p-8 lg:p-12">
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm mb-6">
                <Gift className="w-4 h-4" />
                Promo Spesial
              </div>

              {/* Headline */}
              <h2 className="text-3xl lg:text-4xl text-white mb-4 font-bold">
                Gratis Survey & Pasang!
              </h2>

              {/* Description */}
              <p className="text-lg text-white/90 mb-8 max-w-xl">
                Dapatkan layanan survey ukuran dan pemasangan gratis untuk setiap pembelian gorden. Berlaku untuk area Sumbar.
              </p>

              {/* CTA Button */}
              <Button
                size="lg"
                className="bg-white text-[#EB216A] hover:bg-gray-100 px-8 py-6 text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                Belanja Sekarang
              </Button>
            </div>

            {/* Right Content - Benefits */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-4 lg:max-w-md lg:ml-auto">
              {/* Gratis Ongkir */}
              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-6 flex items-center gap-4 hover:bg-white/30 transition-all flex-1">
                <div className="flex-shrink-0 w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div className="text-white">
                  <h3 className="text-xl mb-1">Gratis Ongkir</h3>
                  <p className="text-sm text-white/80">Min. 2 juta</p>
                </div>
              </div>

              {/* Garansi */}
              <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-6 flex items-center gap-4 hover:bg-white/30 transition-all flex-1">
                <div className="flex-shrink-0 w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="text-white">
                  <h3 className="text-xl mb-1">Garansi 1 Tahun</h3>
                  <p className="text-sm text-white/80">Full service</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}