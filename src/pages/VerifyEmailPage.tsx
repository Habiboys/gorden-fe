import defaultLogo from "figma:asset/b13089223dffdf43231fd2882ccaadb8c454e1f0.png";
import {
    CheckCircle,
    Loader2,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useSettings } from '../context/SettingsContext';
import { authApi } from '../utils/api';

export default function VerifyEmailPage() {
    const { token } = useParams<{ token: string }>();
    const { settings } = useSettings();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    // Use dynamic logo from settings or fallback to default
    const logoSrc = settings.siteLogo || defaultLogo;

    useEffect(() => {
        const verifyEmail = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Token verifikasi tidak valid');
                return;
            }

            try {
                const response = await authApi.verifyEmail(token);
                if (response.success) {
                    setStatus('success');
                    setMessage(response.message || 'Email berhasil diverifikasi!');
                } else {
                    setStatus('error');
                    setMessage(response.message || 'Verifikasi gagal');
                }
            } catch (err: any) {
                setStatus('error');
                setMessage(err.message || 'Terjadi kesalahan saat verifikasi');
            }
        };

        verifyEmail();
    }, [token]);

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

                {/* Verification Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
                    {status === 'loading' && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 bg-pink-50 rounded-full flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-[#EB216A] animate-spin" />
                            </div>
                            <h1 className="text-2xl text-gray-900 mb-2">
                                Memverifikasi Email...
                            </h1>
                            <p className="text-gray-600">
                                Mohon tunggu sebentar
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h1 className="text-2xl text-gray-900 mb-2">
                                Verifikasi Berhasil!
                            </h1>
                            <p className="text-gray-600 mb-6">
                                {message}
                            </p>
                            <Link to="/login">
                                <Button className="w-full bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-xl py-6 shadow-lg hover:shadow-xl transition-all">
                                    Masuk ke Akun
                                </Button>
                            </Link>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
                                <XCircle className="w-10 h-10 text-red-500" />
                            </div>
                            <h1 className="text-2xl text-gray-900 mb-2">
                                Verifikasi Gagal
                            </h1>
                            <p className="text-gray-600 mb-6">
                                {message}
                            </p>
                            <div className="space-y-3">
                                <Link to="/register">
                                    <Button className="w-full bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-xl py-6 shadow-lg hover:shadow-xl transition-all">
                                        Daftar Ulang
                                    </Button>
                                </Link>
                                <Link to="/">
                                    <Button variant="outline" className="w-full rounded-xl py-6">
                                        Kembali ke Beranda
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
