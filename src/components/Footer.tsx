import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import logo from 'figma:asset/729ffa7b27b7c7977cedc406f32ba754f846d200.png';

export function Footer() {
  const quickLinks = ['Beranda', 'Produk', 'Program Referal', 'Kalkulator', 'Galeri'];
  const socialMedia = [
    { icon: Facebook, label: 'Facebook' },
    { icon: Instagram, label: 'Instagram' },
    { icon: Twitter, label: 'Twitter' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Tagline */}
          <div>
            <div className="mb-4">
              <img 
                src={logo} 
                alt="Amagriya Gorden" 
                className="h-16 w-auto"
              />
            </div>
            <p className="text-gray-400">
              Solusi gorden berkualitas untuk hunian nyaman dan elegan Anda.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4">Menu Cepat</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-gray-400 hover:text-[#EB216A] transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4">Kontak Kami</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-gray-400">
                <Phone className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>info@amagriyagorden.com</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>Jl. Contoh No. 123, Jakarta Selatan, DKI Jakarta 12345</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="mb-4">Ikuti Kami</h4>
            <div className="flex gap-3">
              {socialMedia.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href="#"
                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#EB216A] transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Amagriya Gorden. All rights reserved.</p>
          <a 
            href="/admin/login" 
            className="text-xs text-gray-600 hover:text-gray-500 transition-colors mt-2 inline-block"
          >
            Admin
          </a>
        </div>
      </div>
    </footer>
  );
}