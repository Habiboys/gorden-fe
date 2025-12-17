import logo from 'figma:asset/729ffa7b27b7c7977cedc406f32ba754f846d200.png';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export function Footer() {
  const { settings } = useSettings();

  const quickLinks = ['Beranda', 'Produk', 'Program Referal', 'Kalkulator', 'Galeri'];

  // Dynamic Social Media
  const socialMedia = [
    { icon: Facebook, label: 'Facebook', url: settings.facebookUrl },
    { icon: Instagram, label: 'Instagram', url: settings.instagramUrl },
  ].filter(s => s.url); // Only show if URL exists

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Tagline */}
          <div>
            <div className="mb-4">
              {settings.siteLogo ? (
                <img
                  src={settings.siteLogo}
                  alt={settings.siteName}
                  className="h-16 w-auto object-contain"
                />
              ) : (
                <img
                  src={logo}
                  alt={settings.siteName || "Amagriya Gorden"}
                  className="h-16 w-auto"
                />
              )}
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
                <span>{settings.sitePhone || settings.whatsappNumber || "+62 812-3456-7890"}</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{settings.siteEmail || "info@amagriyagorden.com"}</span>
              </li>
              <li className="flex items-start gap-2 text-gray-400">
                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{settings.siteAddress || "Jl. Contoh No. 123, Jakarta Selatan, DKI Jakarta 12345"}</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="mb-4">Ikuti Kami</h4>
            <div className="flex gap-3">
              {socialMedia.length > 0 ? socialMedia.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#EB216A] transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              }) : (
                <p className="text-gray-500 text-sm">Sosial media belum diatur.</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} {settings.siteName || "Amagriya Gorden"}. All rights reserved.</p>
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