import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Gift,
  Layers,
  Package,
  Phone,
  Tag,
  TrendingDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SectionHeader } from '../components/SectionHeader';
import { Button } from '../components/ui/button';

const benefits = [
  {
    icon: Calculator,
    title: 'Hitung Sendiri',
    description: 'Fitur hitung cepat memudahkan Anda mengetahui estimasi biaya pembuatan gorden untuk calon pelanggan.',
  },
  {
    icon: Layers,
    title: 'Sampel Bahan',
    description: 'Tersedia katalog bahan lengkap — mulai dari blackout hingga berbagai jenis kain lainnya — sehingga mempermudah proses penawaran.',
  },
  {
    icon: Coins,
    title: 'Fee',
    description: 'Dapatkan komisi 10% dari setiap penjualan atau transaksi yang berasal dari referal Anda.',
  },
  {
    icon: Tag,
    title: 'Bisa Ditawar',
    description: 'Harga yang tertera adalah harga net, sehingga Anda bisa menyesuaikan penawaran sesuai kebutuhan pelanggan.',
  },
  {
    icon: Package,
    title: 'Terlengkap',
    description: 'Amagriya menyediakan pilihan bahan gorden, blind, serta berbagai aksesori yang lengkap untuk semua kebutuhan pelanggan.',
  },
  {
    icon: TrendingDown,
    title: 'Harga Kompetitif',
    description: 'Harga langsung dari tangan pertama, membuat penawaran Anda lebih menarik dan kompetitif.',
  },
];

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Isi Formulir Pendaftaran',
    description: 'Isi formulir pendaftaran melalui link https://amagriya.com/index.php/program-affiliate/ atau klik tombol "Daftar Program Affiliate" di bagian bawah halaman ini.',
  },
  {
    number: '02',
    icon: Clock,
    title: 'Proses Verifikasi',
    description: 'Tim admin akan memproses pendaftaran Anda dalam waktu maksimal 3 hari kerja.',
  },
  {
    number: '03',
    icon: Phone,
    title: 'Menunggu Konfirmasi',
    description: 'Jika pendaftaran disetujui, admin kami akan segera menghubungi Anda untuk langkah selanjutnya.',
  },
];

const flowSteps = [
  { label: 'Referral', description: 'Anda bagikan link' },
  { label: 'Customer Order', description: 'Teman Anda beli' },
  { label: 'Order Selesai', description: 'Transaksi selesai' },
  { label: 'Komisi Masuk', description: 'Anda dapat komisi' },
];

export default function ReferralPage() {
  return (
    <div className="bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-pink-50 pt-32 pb-16 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#EB216A]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#EB216A]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#EB216A]/10 text-[#EB216A] px-3 py-1.5 rounded-full mb-4">
                <Gift className="w-4 h-4" />
                <span className="text-xs">Program Terbaru</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4 font-bold">
                Program Referal
                <span className="block text-[#EB216A]">Amagriya Gorden</span>
              </h1>

              <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
                Ajak teman, bagikan rekomendasi, dan dapatkan komisi!
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/register">
                  <Button
                    size="default"
                    className="bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-lg text-sm px-6 w-full sm:w-auto"
                  >
                    Daftar Sekarang
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button
                  size="default"
                  variant="outline"
                  className="border border-gray-200 text-gray-900 hover:border-[#EB216A] hover:text-[#EB216A] rounded-lg text-sm px-6 w-full sm:w-auto"
                >
                  Pelajari Lebih Lanjut
                </Button>
              </div>
            </div>

            {/* Image */}
            <div className="relative mt-6 lg:mt-0">
              <div className="relative rounded-2xl overflow-hidden shadow-xl">
                <img
                  src="https://images.unsplash.com/photo-1745847768380-2caeadbb3b71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBhcnRuZXJzaGlwJTIwaGFuZHNoYWtlfGVufDF8fHx8MTc2NTA2MjgyOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Program Referal"
                  className="w-full h-[250px] sm:h-[300px] lg:h-[350px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#EB216A]/20 to-transparent" />
              </div>

              {/* Floating Stats Card */}
              <div className="absolute -bottom-4 left-4 sm:-bottom-6 sm:left-6 lg:-left-6 bg-white rounded-xl shadow-lg p-3 sm:p-4 border border-gray-100">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#EB216A]/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#EB216A]" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl text-gray-900 font-bold">1000+</p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Mitra Aktif</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Keuntungan"
            title="Mengapa Bergabung dengan Program Referal Kami?"
            description="Dapatkan berbagai keuntungan dengan menjadi mitra referal Amagriya Gorden"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-[#EB216A]/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 shadow-md">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to Join Section */}
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Mudah & Cepat"
            title="Cara Bergabung Program Referal Amagriya"
            description="Proses pendaftaran yang mudah dan cepat untuk menjadi mitra kami"
          />

          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;

              return (
                <div key={index} className="relative">
                  {/* Connecting Line - Hidden on mobile */}
                  {/* Connecting Line - Hidden on mobile, adjusted centering */}
                  {!isLast && (
                    <div className="hidden sm:block absolute left-6 sm:left-10 top-16 sm:top-20 bottom-[-24px] w-0.5 bg-gradient-to-b from-[#EB216A] to-transparent -translate-x-1/2 z-0" />
                  )}

                  <div className="flex gap-3 sm:gap-4 items-start">
                    {/* Number Circle - Smaller on mobile */}
                    <div className="relative flex-shrink-0 z-10">
                      <div className="w-12 h-12 sm:w-20 sm:h-20 lg:w-20 lg:h-20 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md">
                        <span className="text-lg sm:text-xl lg:text-2xl text-white font-bold">{step.number}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-lg sm:rounded-xl shadow-sm flex items-center justify-center border border-[#EB216A]">
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-[#EB216A]" />
                      </div>
                    </div>

                    {/* Content - Adjusted padding for mobile */}
                    <div className="flex-1 bg-white rounded-xl sm:rounded-xl p-4 sm:p-5 lg:p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 min-w-0">
                      <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-xs sm:text-sm lg:text-base break-words">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Alur Kerja"
            title="Bagaimana Sistem Referal Bekerja?"
            description="Proses sederhana dari bagikan link hingga terima komisi"
          />

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
              {flowSteps.map((step, index) => {
                const isLast = index === flowSteps.length - 1;

                return (
                  <div key={index} className="relative">
                    {/* Arrow between steps */}
                    {!isLast && (
                      <div className="hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 translate-x-1/2 z-20 w-8 h-8 items-center justify-center bg-white rounded-full shadow-sm border border-gray-100">
                        <ArrowRight className="w-4 h-4 text-[#EB216A]" />
                      </div>
                    )}

                    {/* Step Card */}
                    <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200 hover:border-[#EB216A] transition-all duration-300 h-full">
                      {/* Step Number Badge - Positioned relatively inside or top-left inside */}
                      <div className="w-8 h-8 bg-[#EB216A] rounded-lg flex items-center justify-center shadow-md mb-3">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>

                      <h4 className="text-base font-semibold text-gray-900 mb-2">
                        {step.label}
                      </h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Box */}
            <div className="mt-8 bg-gradient-to-r from-[#EB216A] to-[#d11d5e] rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">Mulai Hasilkan Komisi!</h3>
                  <p className="text-white/90 text-sm">Proses cepat, transparan, dan terpercaya</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold mb-0">10%</p>
                  <p className="text-white/90 text-xs">Komisi per transaksi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-br from-pink-50 via-white to-pink-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <div className="w-12 h-12 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>

            <h2 className="text-xl sm:text-2xl text-gray-900 mb-3 font-semibold">
              Siap Menjadi Mitra Referal Kami?
            </h2>
            <p className="text-sm text-gray-600 mb-6 max-w-xl mx-auto">
              Bergabunglah dengan ribuan mitra yang sudah menghasilkan komisi setiap bulannya
            </p>

            <Link to="/register">
              <Button
                size="lg"
                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-lg text-sm sm:text-base px-6 py-3 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
              >
                <span className="hidden sm:inline">Daftar Sekarang & Mulai Menghasilkan</span>
                <span className="sm:hidden">Daftar & Mulai Menghasilkan</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>

            <p className="text-xs text-gray-500 mt-4">
              Gratis tanpa biaya pendaftaran • Proses otomatis • Pencairan mudah
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}