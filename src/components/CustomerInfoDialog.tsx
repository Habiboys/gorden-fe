import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { UserCircle, Phone } from 'lucide-react';

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
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
      
      // Prevent ESC key from closing
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
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
      newErrors.name = 'Nama harus diisi';
      isValid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = 'Nomor HP harus diisi';
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
    console.log('📝 Form submitted:', { name, phone });
    
    if (validateForm()) {
      console.log('✅ Form valid, calling onSubmit');
      onSubmit(name, phone);
      setName('');
      setPhone('');
      setErrors({ name: '', phone: '' });
    } else {
      console.log('❌ Form validation failed');
    }
  };

  if (!isOpen) {
    console.log('❌ CustomerInfoDialog closed');
    return null;
  }
  
  console.log('✅ CustomerInfoDialog open');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Dialog - Made more compact */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header with gradient - Reduced padding */}
        <div className="bg-gradient-to-br from-[#EB216A] to-[#d11d5e] p-6 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
            <UserCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl text-white mb-1">
            Dapatkan Estimasi Gratis
          </h2>
          <p className="text-white/90 text-xs">
            Lengkapi data untuk akses kalkulator
          </p>
        </div>

        {/* Form - Reduced padding and spacing */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-xs text-gray-700 mb-1.5">
              Nama Lengkap <span className="text-[#EB216A]">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <UserCircle className="w-4 h-4" />
              </div>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className={`pl-10 py-2.5 text-sm border-2 focus:border-[#EB216A] focus:ring-[#EB216A] ${
                  errors.name ? 'border-red-500' : ''
                }`}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Phone Input */}
          <div>
            <label htmlFor="phone" className="block text-xs text-gray-700 mb-1.5">
              Nomor HP <span className="text-[#EB216A]">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Phone className="w-4 h-4" />
              </div>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className={`pl-10 py-2.5 text-sm border-2 focus:border-[#EB216A] focus:ring-[#EB216A] ${
                  errors.phone ? 'border-red-500' : ''
                }`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Info Text - More compact */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800 text-center leading-relaxed">
              🔒 Data Anda aman dan hanya untuk komunikasi pemesanan
            </p>
          </div>

          {/* Submit Button - Reduced padding */}
          <Button
            type="submit"
            size="lg"
            className="w-full bg-[#EB216A] hover:bg-[#d11d5e] text-white py-3 text-sm shadow-lg hover:shadow-xl transition-all"
          >
            Lanjutkan ke Kalkulator
          </Button>

          {/* Terms - Smaller text */}
          <p className="text-xs text-gray-500 text-center leading-relaxed pt-1">
            Dengan melanjutkan, Anda menyetujui untuk dihubungi oleh tim Amagriya Gorden
          </p>
        </form>
      </div>
    </div>
  );
}