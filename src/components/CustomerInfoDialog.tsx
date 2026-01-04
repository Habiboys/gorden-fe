import { Phone, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CustomerInfoDialogProps {
  isOpen: boolean;
  onSubmit: (name: string, phone: string) => void;
}

export function CustomerInfoDialog({ isOpen, onSubmit }: CustomerInfoDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({ name: '', phone: '' });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', phone: '' };

    if (!name.trim()) {
      newErrors.name = 'Nama wajib diisi';
      isValid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = 'Nomor HP wajib diisi';
      isValid = false;
    } else if (!/^(\+62|62|0)[0-9]{9,12}$/.test(phone.trim())) {
      newErrors.phone = 'Format nomor HP tidak valid';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(name, phone);
      setName('');
      setPhone('');
      setErrors({ name: '', phone: '' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 top-24 z-40 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-all duration-300" />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Mulai Hitung Estimasi
            </h2>
            <p className="text-gray-500 text-sm">
              Lengkapi data berikut untuk melanjutkan ke kalkulator
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-gray-700 block text-left">
                Nama Lengkap
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EB216A] transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#EB216A] focus:ring-[#EB216A] transition-all ${errors.name ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                />
              </div>
              {errors.name && (
                <p className="text-red-500 text-xs text-left animate-in slide-in-from-top-1">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700 block text-left">
                Nomor WhatsApp
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#EB216A] transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className={`pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#EB216A] focus:ring-[#EB216A] transition-all ${errors.phone ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-xs text-left animate-in slide-in-from-top-1">{errors.phone}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-[#EB216A] hover:bg-[#d11d5e] text-white h-11 rounded-lg font-medium shadow-lg shadow-pink-200 hover:shadow-pink-300 transition-all duration-200"
              >
                Lanjutkan
              </Button>
            </div>

            <p className="text-xs text-center text-gray-400">
              Data Anda aman dan tidak akan dibagikan ke pihak lain
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}