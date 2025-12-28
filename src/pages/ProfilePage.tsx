import {
    ArrowRight,
    Calculator,
    CheckCircle2,
    Clock,
    Coins,
    Copy,
    Edit2,
    Eye,
    EyeOff,
    FileText,
    Gift,
    Layers,
    LayoutDashboard,
    Loader2,
    LogOut,
    Mail,
    Package,
    Phone,
    Settings,
    Tag,
    TrendingDown,
    User,
    Wallet
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { SectionHeader } from '../components/SectionHeader';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { authApi, referralsApi } from '../utils/api';

// --- GUEST VIEW COMPONENTS (Landing Page) ---

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
        description: 'Isi formulir pendaftaran melalui link affiliate atau klik tombol "Daftar Program Affiliate" di halaman ini.',
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

const GuestView = () => {
    return (
        <div className="bg-white overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-pink-50 via-white to-pink-50 pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Text Content */}
                        <div>
                            <div className="inline-flex items-center gap-2 bg-[#EB216A]/10 text-[#EB216A] px-4 py-2 rounded-full mb-6">
                                <Gift className="w-4 h-4" />
                                <span className="text-sm">Program Mitra Terbaru</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl text-gray-900 mb-6">
                                Dashboard Mitra
                                <span className="block text-[#EB216A]">Amagriya Gorden</span>
                            </h1>

                            <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                                Gabung sebagai mitra, rekomendasikan gorden berkualitas, dan dapatkan penghasilan tambahan dengan mudah!
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link to="/login">
                                    <Button
                                        size="lg"
                                        className="bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-xl text-lg px-8 w-full sm:w-auto"
                                    >
                                        Log in Mitra
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="border-2 border-gray-200 text-gray-900 hover:border-[#EB216A] hover:text-[#EB216A] rounded-xl text-lg px-8 w-full sm:w-auto"
                                    >
                                        Daftar Sekarang
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Image */}
                        <div className="relative mt-8 lg:mt-0">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                    alt="Program Referal"
                                    className="w-full h-[300px] sm:h-[400px] lg:h-[500px] object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#EB216A]/20 to-transparent" />
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
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader
                        badge="Mudah & Cepat"
                        title="Cara Bergabung Program Referal Amagriya"
                        description="Proses pendaftaran yang mudah dan cepat untuk menjadi mitra kami"
                    />

                    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            return (
                                <div key={index} className="flex gap-3 sm:gap-6 items-start">
                                    <div className="relative flex-shrink-0">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl border border-gray-200 flex items-center justify-center shadow-sm z-10 relative">
                                            <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#EB216A]" />
                                        </div>
                                        {index !== steps.length - 1 && (
                                            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-200 -z-0" />
                                        )}
                                    </div>
                                    <div className="flex-1 pt-2">
                                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
};

// --- DASHBOARD VIEW COMPONENTS (Logged In) ---

const StatsCard = ({ title, value, icon: Icon, subValue, colorClass = "text-[#EB216A]" }: any) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-start justify-between mb-4">
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-gray-50 ${colorClass}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
        {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
    </div>
);

const PasswordChangeForm = () => {
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setError('Semua field harus diisi');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('Password baru minimal 6 karakter');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('Password baru dan konfirmasi tidak sama');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authApi.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (response.success) {
                toast.success('Password berhasil diubah!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setError(response.message || 'Gagal mengubah password');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm text-gray-500 mb-1.5">Password Lama</label>
                <div className="relative">
                    <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB216A] focus:border-transparent text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm text-gray-500 mb-1.5">Password Baru</label>
                <div className="relative">
                    <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB216A] focus:border-transparent text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-sm text-gray-500 mb-1.5">Konfirmasi Password</label>
                <div className="relative">
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EB216A] focus:border-transparent text-sm"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white w-full"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Password'}
            </Button>
        </form>
    );
};

const DashboardView = ({ user, logout, confirm }: any) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await referralsApi.getMyStats();
                if (response.success) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch referral stats', error);
                toast.error('Gagal memuat data referral');
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, []);

    const handleLogout = async () => {
        const confirmed = await confirm({
            title: 'Logout',
            description: 'Yakin ingin keluar dari akun mitra?',
            confirmText: 'Ya, Keluar',
            cancelText: 'Batal',
            variant: 'destructive'
        });

        if (confirmed) {
            logout();
            navigate('/');
        }
    };

    const copyReferralCode = () => {
        if (stats?.referral_code) {
            navigator.clipboard.writeText(stats.referral_code);
            toast.success('Kode referral disalin!');
        }
    };

    if (loadingStats) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#EB216A] animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-48">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Card */}
                <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-[#EB216A] flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                        {user.name?.charAt(0).toUpperCase() || 'M'}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-gray-500 mb-4 md:mb-0">
                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Mitra Aktif</span>
                        </div>
                    </div>

                    {/* Referral Code Box */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300 flex flex-col items-center min-w-[200px]">
                        <p className="text-xs text-gray-500 mb-1">Kode Referral Anda</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-mono font-bold text-[#EB216A] tracking-wider">
                                {stats?.referral_code || '-'}
                            </span>
                            <button
                                onClick={copyReferralCode}
                                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <Copy className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard'
                            ? 'bg-[#EB216A] text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'profile'
                            ? 'bg-[#EB216A] text-white shadow-md'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                    >
                        <User className="w-4 h-4" />
                        Profil & Password
                    </button>
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Keluar
                    </Button>
                </div>

                {/* Content Area */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatsCard
                                title="Total Pendapatan"
                                value={`Rp ${parseInt(stats?.total_earnings || 0).toLocaleString('id-ID')}`}
                                icon={Wallet}
                                colorClass="text-green-600"
                            />
                            <StatsCard
                                title="Menunggu Pencairan"
                                value={`Rp ${parseInt(stats?.pending_earnings || 0).toLocaleString('id-ID')}`}
                                icon={Clock}
                                colorClass="text-orange-500"
                            />
                            <StatsCard
                                title="Sudah Dicairkan"
                                value={`Rp ${parseInt(stats?.paid_earnings || 0).toLocaleString('id-ID')}`}
                                icon={CheckCircle2}
                                colorClass="text-blue-500"
                            />
                            <StatsCard
                                title="Total Referral"
                                value={`${stats?.total_referrals || 0} Orang`}
                                icon={User}
                                colorClass="text-[#EB216A]"
                            />
                        </div>

                        {/* Recent History Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900">Riwayat Referral</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">No</th>
                                            <th className="px-6 py-3">Tanggal</th>
                                            <th className="px-6 py-3">Info Order</th>
                                            <th className="px-6 py-3">Komisi</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {stats?.history && stats.history.length > 0 ? (
                                            stats.history.map((item: any, idx: number) => {
                                                const orderData = item.Order || item.Document;
                                                const isOrder = !!item.Order;
                                                // const isDocument = !!item.Document;
                                                const date = new Date(item.created_at || item.createdAt);

                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">{idx + 1}</td>
                                                        <td className="px-6 py-4">
                                                            {date instanceof Date && !isNaN(date.getTime()) ? date.toLocaleDateString('id-ID', {
                                                                day: 'numeric', month: 'long', year: 'numeric'
                                                            }) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {orderData ? (
                                                                <div>
                                                                    <div className="font-medium text-gray-900">
                                                                        {isOrder ? `Order #${orderData.id}` : `Document #${orderData.id}`}
                                                                    </div>
                                                                    <div className="text-xs text-gray-500">
                                                                        Total: Rp {parseInt(orderData.total_amount).toLocaleString('id-ID')}
                                                                    </div>
                                                                </div>
                                                            ) : <span className="text-gray-400">Belum ada order</span>}
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-[#EB216A]">
                                                            Rp {parseInt(item.commission_amount || 0).toLocaleString('id-ID')}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'PAID'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {item.status === 'PAID' ? 'Sudah Cair' : 'Menunggu'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                    Belum ada riwayat referral
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Profile Info */}
                        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Informasi Akun</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Nama Lengkap</label>
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <Edit2 className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-900">{user.name}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Email</label>
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="text-gray-900">{user.email}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Status Kemitraan</label>
                                    <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100 text-green-700">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="font-medium">Mitra Resmi Terverifikasi</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Change Password */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-6">
                                <Settings className="w-5 h-5 text-gray-400" />
                                <h2 className="text-lg font-bold text-gray-900">Ubah Password</h2>
                            </div>
                            <PasswordChangeForm />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function ProfilePage() {
    const { user, isAuthenticated, logout } = useAuth();
    const { confirm } = useConfirm();

    return (
        <>
            <Navbar />
            {isAuthenticated && user ? (
                <DashboardView user={user} logout={logout} confirm={confirm} />
            ) : (
                <GuestView />
            )}
            <Footer />
        </>
    );
}
