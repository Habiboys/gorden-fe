import defaultLogo from "figma:asset/b13089223dffdf43231fd2882ccaadb8c454e1f0.png";
import {
    ArrowRight,
    Loader2,
    Mail,
    RefreshCw
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useSettings } from '../context/SettingsContext';
import { authApi } from '../utils/api';

export default function VerificationPendingPage() {
    const { settings } = useSettings();
    const location = useLocation();
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const [resendError, setResendError] = useState('');

    // Get email from navigation state
    const email = location.state?.email || '';

    // Use dynamic logo from settings or fallback to default
    const logoSrc = settings.siteLogo || defaultLogo;

    const handleResend = async () => {
        if (!email) {
            setResendError('Email tidak ditemukan. Silakan daftar ulang.');
            return;
        }

        setIsResending(true);
        setResendMessage('');
        setResendError('');

        try {
            const response = await authApi.resendVerification(email);
            if (response.success) {
                setResendMessage(response.message || 'Email verifikasi telah dikirim ulang!');
            } else {
                setResendError(response.message || 'Gagal mengirim ulang email');
            }
        } catch (err: any) {
            setResendError(err.message || 'Terjadi kesalahan');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
                </div>

                {/* Pending Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-pink-50 rounded-full flex items-center justify-center">
                        <Mail className="w-10 h-10 text-[#EB216A]" />
                    </div>

                    <h1 className="text-2xl text-gray-900 mb-2">
                        Cek Email Anda
                    </h1>
                    <p className="text-gray-600 mb-2">
                        Kami telah mengirim link verifikasi ke:
                    </p>
                    {email && (
                        <p className="text-[#EB216A] font-medium mb-6">
                            {email}
                        </p>
                    )}

                    <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 mb-6">
                        <p className="text-sm text-gray-700">
                            Klik link di email untuk memverifikasi akun Anda.
                            Link akan kadaluarsa dalam <strong>24 jam</strong>.
                        </p>
                    </div>

                    {/* Success Message */}
                    {resendMessage && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">
                            {resendMessage}
                        </div>
                    )}

                    {/* Error Message */}
                    {resendError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                            {resendError}
                        </div>
                    )}

                    <div className="space-y-3">
                        <Button
                            onClick={handleResend}
                            disabled={isResending || !email}
                            variant="outline"
                            className="w-full rounded-xl py-6 group disabled:opacity-50"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Mengirim...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                                    Kirim Ulang Email
                                </>
                            )}
                        </Button>

                        <Link to="/login">
                            <Button className="w-full bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-xl py-6 shadow-lg hover:shadow-xl transition-all group">
                                Masuk ke Akun
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                            Tidak menerima email? Cek folder spam atau{' '}
                            <button
                                onClick={handleResend}
                                disabled={isResending || !email}
                                className="text-[#EB216A] hover:text-[#d11d5e] transition-colors disabled:opacity-50"
                            >
                                kirim ulang
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
