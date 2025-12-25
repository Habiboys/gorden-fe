import defaultLogo from "figma:asset/b13089223dffdf43231fd2882ccaadb8c454e1f0.png";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';

import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { authApi } from '../utils/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      // Check if user is admin
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Use dynamic logo from settings or fallback to default
  const logoSrc = settings.siteLogo || defaultLogo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Email dan password harus diisi!');
      setIsLoading(false);
      return;
    }

    try {
      // Call API
      const response = await authApi.login({ email, password });

      if (response.success) {
        // Login context
        login(response.token, response.user);

        console.log('Login response user:', response.user);
        console.log('User role:', response.user?.role);

        // Redirect based on role (case-insensitive check)
        const userRole = response.user?.role?.toUpperCase();
        if (userRole === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        // Check if email needs verification
        if (response.requiresVerification) {
          navigate('/verification-pending', {
            state: { email: response.email || email }
          });
        } else {
          setError(response.message || 'Login gagal');
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      // Check if error response indicates verification required
      if (err.message && err.message.includes('belum diverifikasi')) {
        navigate('/verification-pending', { state: { email } });
      } else {
        setError(err.message || 'Terjadi kesalahan saat login');
      }
    } finally {
      setIsLoading(false);
    }
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
            Masuk ke Akun
          </h1>
          <p className="text-gray-600">
            Selamat datang kembali! Silakan masuk.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-700 cursor-pointer select-none"
                >
                  Ingat saya
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-sm text-[#EB216A] hover:text-[#d11d5e] transition-colors"
              >
                Lupa password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-xl py-6 shadow-lg hover:shadow-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
              {!isLoading && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          <div className="mt-6 text-center"></div>
        </div>
      </div>
    </div>
  );
}