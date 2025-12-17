import defaultLogo from "figma:asset/b13089223dffdf43231fd2882ccaadb8c454e1f0.png";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { useSettings } from '../context/SettingsContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');

  // Use dynamic logo from settings or fallback to default
  const logoSrc = settings.siteLogo || defaultLogo;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!agreedToTerms) {
      setError('Anda harus menyetujui syarat dan ketentuan!');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak sama!');
      return;
    }

    if (formData.name && formData.email && formData.password) {
      // Set user auth
      localStorage.setItem('userAuth', 'true');
      localStorage.setItem('user', JSON.stringify({
        name: formData.name,
        email: formData.email,
      }));

      // Navigate to home
      navigate('/');
    } else {
      setError('Semua field harus diisi!');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-md hover:shadow-lg transition-all group border border-gray-200 z-50"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Kembali</span>
      </button>

      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group mb-6">
            <img
              src={logoSrc}
              alt={settings.siteName || "Amagriya Gorden & Blind"}
              className="h-16 mx-auto group-hover:scale-105 transition-transform"
            />
          </Link>

          <h1 className="text-3xl text-gray-900 mb-2">
            Daftar Akun Baru
          </h1>
          <p className="text-gray-600">
            Bergabunglah dengan Amagriya dan nikmati berbagai keuntungan.
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm text-gray-700 mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#EB216A] focus:ring-2 focus:ring-[#EB216A]/20 transition-all"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#EB216A] focus:ring-2 focus:ring-[#EB216A]/20 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 8 karakter"
                  required
                  className="w-full pl-12 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#EB216A] focus:ring-2 focus:ring-[#EB216A]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-gray-700 mb-2">
                Konfirmasi Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ulangi password"
                  required
                  className="w-full pl-12 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#EB216A] focus:ring-2 focus:ring-[#EB216A]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-700 cursor-pointer select-none leading-relaxed"
              >
                Saya menyetujui{' '}
                <Link to="/terms" className="text-[#EB216A] hover:text-[#d11d5e] transition-colors">
                  Syarat & Ketentuan
                </Link>
                {' '}dan{' '}
                <Link to="/privacy" className="text-[#EB216A] hover:text-[#d11d5e] transition-colors">
                  Kebijakan Privasi
                </Link>
              </label>
            </div>

            {/* Register Button */}
            <Button
              type="submit"
              className="w-full bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-xl py-6 shadow-lg hover:shadow-xl transition-all group"
            >
              Daftar Sekarang
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{' '}
              <Link
                to="/login"
                className="text-[#EB216A] hover:text-[#d11d5e] transition-colors"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}