import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { HelpCircle } from 'lucide-react';
import { Button } from './ui/button';

const faqs = [
  {
    question: 'Apakah pemasangan gorden gratis?',
    answer:
      'Ya, kami menyediakan layanan pemasangan gratis untuk semua pembelian produk gorden. Tim profesional kami akan datang ke lokasi Anda untuk memastikan pemasangan dilakukan dengan sempurna.',
  },
  {
    question: 'Bagaimana cara menghitung kebutuhan gorden?',
    answer:
      'Anda dapat menggunakan kalkulator otomatis di website kami atau menghubungi tim kami untuk layanan survey gratis. Tim kami akan membantu mengukur dan menghitung kebutuhan gorden Anda secara akurat.',
  },
  {
    question: 'Apakah ada garansi untuk produk dan pemasangan?',
    answer:
      'Tentu! Kami memberikan garansi 1 tahun untuk produk dan garansi pemasangan. Jika terdapat masalah dengan produk atau pemasangan dalam periode garansi, kami akan memperbaikinya tanpa biaya tambahan.',
  },
  {
    question: 'Berapa lama proses pembuatan dan pemasangan?',
    answer:
      'Proses pembuatan memakan waktu 7-14 hari kerja tergantung pada kompleksitas pesanan. Setelah produk selesai, kami akan menghubungi Anda untuk mengatur jadwal pemasangan yang sesuai dengan waktu Anda.',
  },
  {
    question: 'Area mana saja yang dilayani?',
    answer:
      'Kami melayani area Jabodetabek dan sekitarnya. Untuk area di luar Jabodetabek, silakan hubungi tim kami untuk informasi lebih lanjut mengenai ketersediaan layanan.',
  },
  {
    question: 'Apakah bisa request custom desain?',
    answer:
      'Tentu saja! Kami menerima pesanan custom sesuai dengan kebutuhan dan preferensi Anda. Tim desainer kami akan membantu mewujudkan visi interior impian Anda.',
  },
];

export function FAQ() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#EB216A]/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Section - Header & CTA */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              {/* Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-4xl lg:text-5xl text-gray-900 mb-4">
                Ada Pertanyaan?
              </h2>
              
              <p className="text-lg text-gray-600 mb-8">
                Temukan jawaban untuk pertanyaan yang sering diajukan tentang produk dan layanan kami.
              </p>

              {/* CTA Section */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm text-gray-500 mb-4">
                  Tidak menemukan jawaban yang Anda cari?
                </p>
                <Button className="w-full bg-[#EB216A] hover:bg-[#d11d5e] text-white">
                  Hubungi Customer Service
                </Button>
              </div>
            </div>
          </div>

          {/* Right Section - FAQ Accordion */}
          <div className="lg:col-span-2">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all"
                >
                  <AccordionTrigger className="px-6 py-5 hover:text-[#EB216A] hover:no-underline text-left group">
                    <div className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-[#EB216A]/10 rounded-lg flex items-center justify-center text-[#EB216A] group-hover:bg-[#EB216A] group-hover:text-white transition-all">
                        {index + 1}
                      </span>
                      <span className="flex-1 pr-4">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-5 pl-[72px] text-gray-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}