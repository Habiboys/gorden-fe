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
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-pink-50 pt-32 pb-20 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#EB216A]/10 text-[#EB216A] px-4 py-2 rounded-full mb-6">
                <Gift className="w-4 h-4" />
                <span className="text-sm">Program Terbaru</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl text-gray-900 mb-6">
                Program Referal
                <span className="block text-[#EB216A]">Amagriya Gorden</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                Ajak teman, bagikan rekomendasi, dan dapatkan komisi!
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button
                    size="lg"
                    className="bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-xl text-lg px-8 w-full sm:w-auto"
                  >
                    Daftar Sekarang
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-200 text-gray-900 hover:border-[#EB216A] hover:text-[#EB216A] rounded-xl text-lg px-8 w-full sm:w-auto"
                >
                  Pelajari Lebih Lanjut
                </Button>
              </div>
            </div>

            {/* Image */}
            <div className="relative mt-8 lg:mt-0">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1745847768380-2caeadbb3b71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHBhcnRuZXJzaGlwJTIwaGFuZHNoYWtlfGVufDF8fHx8MTc2NTA2MjgyOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Program Referal"
                  className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#EB216A]/20 to-transparent" />
              </div>

              {/* Floating Stats Card */}
              <div className="absolute -bottom-4 left-4 sm:-bottom-6 sm:left-6 lg:-left-6 bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-100">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#EB216A]/10 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#EB216A]" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl text-gray-900">1000+</p>
                    <p className="text-xs sm:text-sm text-gray-500">Mitra Aktif</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
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
                  className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-[#EB216A]/30 hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl text-gray-900 mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to Join Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            badge="Mudah & Cepat"
            title="Cara Bergabung Program Referal Amagriya"
            description="Proses pendaftaran yang mudah dan cepat untuk menjadi mitra kami"
          />

          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;

              return (
                <div key={index} className="relative">
                  {/* Connecting Line - Hidden on mobile */}
                  {!isLast && (
                    <div className="hidden sm:block absolute left-[52px] top-24 w-0.5 h-16 bg-gradient-to-b from-[#EB216A] to-[#EB216A]/20" />
                  )}

                  <div className="flex gap-3 sm:gap-6 items-start">
                    {/* Number Circle - Smaller on mobile */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-xl sm:text-2xl lg:text-3xl text-white">{step.number}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-7 h-7 sm:w-10 sm:h-10 bg-white rounded-lg sm:rounded-xl shadow-md flex items-center justify-center border-2 border-[#EB216A]">
                        <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-[#EB216A]" />
                      </div>
                    </div>

                    {/* Content - Adjusted padding for mobile */}
                    <div className="flex-1 bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 border border-gray-100 shadow-md hover:shadow-xl transition-shadow duration-300 min-w-0">
                      <h3 className="text-base sm:text-xl lg:text-2xl text-gray-900 mb-2 sm:mb-3">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed text-xs sm:text-base lg:text-lg break-words">
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
      <section className="py-20 bg-white">
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
                      <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                        <ArrowRight className="w-8 h-8 text-[#EB216A]" />
                      </div>
                    )}

                    {/* Step Card */}
                    <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border-2 border-gray-200 hover:border-[#EB216A] transition-all duration-300 h-full">
                      {/* Step Number Badge */}
                      <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#EB216A] rounded-lg flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm">{index + 1}</span>
                      </div>

                      <h4 className="text-xl text-gray-900 mb-2 mt-2">
                        {step.label}
                      </h4>
                      <p className="text-gray-600 text-sm">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Box */}
            <div className="mt-12 bg-gradient-to-r from-[#EB216A] to-[#d11d5e] rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                  <h3 className="text-2xl mb-2">Mulai Hasilkan Komisi Hari Ini!</h3>
                  <p className="text-white/90">Proses cepat, transparan, dan terpercaya</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl mb-1">10%</p>
                  <p className="text-white/90">Komisi per transaksi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-white to-pink-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-gray-100">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>

            <h2 className="text-3xl sm:text-4xl text-gray-900 mb-4">
              Siap Menjadi Mitra Referal Kami?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Bergabunglah dengan ribuan mitra yang sudah menghasilkan komisi setiap bulannya
            </p>

            <Link to="/register">
              <Button
                size="lg"
                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-xl text-base sm:text-lg lg:text-xl px-6 sm:px-8 lg:px-12 py-5 sm:py-6 shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto"
              >
                <span className="hidden sm:inline">Daftar Sekarang & Mulai Menghasilkan</span>
                <span className="sm:hidden">Daftar & Mulai Menghasilkan</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
              </Button>
            </Link>

            <p className="text-xs sm:text-sm text-gray-500 mt-6">
              Gratis tanpa biaya pendaftaran • Proses otomatis • Pencairan mudah
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}