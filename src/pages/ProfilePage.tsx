import { Camera, Edit2, Eye, EyeOff, Heart, Key, Loader2, LogOut, Mail, MapPin, MessageCircle, Phone, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useConfirm } from '../context/ConfirmContext';
import { useWishlist } from '../context/WishlistContext';
import { authApi } from '../utils/api';
import { getProductImageUrl } from '../utils/imageHelper';
import { chatAdminFromProfile } from '../utils/whatsappHelper';

export default function ProfilePage() {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const { items: cartItems, getTotal } = useCart();
    const { confirm } = useConfirm();
    const { wishlistCount, wishlistProducts, removeFromWishlist } = useWishlist();
    const [activeTab, setActiveTab] = useState('profile');

    // Change password states
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');

    // Redirect if not logged in
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    if (!user) {
        return null;
    }

    const handleLogout = async () => {
        const confirmed = await confirm({
            title: 'Logout',
            description: 'Yakin ingin keluar dari akun?',
            confirmText: 'Ya, Keluar',
            cancelText: 'Batal',
            variant: 'destructive'
        });

        if (confirmed) {
            logout();
            navigate('/');
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
        setPasswordError('');
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError('Semua field harus diisi');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError('Password baru minimal 6 karakter');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Password baru dan konfirmasi tidak sama');
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
                setPasswordError(response.message || 'Gagal mengubah password');
            }
        } catch (err: any) {
            setPasswordError(err.message || 'Terjadi kesalahan');
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profil', icon: Edit2 },
        { id: 'password', label: 'Ganti Password', icon: Key },
        { id: 'orders', label: 'Pesanan', icon: ShoppingBag },
        { id: 'wishlist', label: 'Wishlist', icon: Heart },
    ];

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 pt-24">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header - Simple */}
                    <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-[#EB216A] flex items-center justify-center text-3xl font-bold text-white">
                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            {/* User Info */}
                            <div className="text-center md:text-left flex-1">
                                <h1 className="text-xl font-semibold text-gray-900 mb-1">{user.name}</h1>
                                <p className="text-gray-500 text-sm flex items-center justify-center md:justify-start gap-2">
                                    <Mail className="w-4 h-4" />
                                    {user.email}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-8">
                                <div className="text-center">
                                    <div className="text-xl font-semibold text-gray-900">{cartItems.length}</div>
                                    <div className="text-gray-500 text-xs">Keranjang</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-semibold text-gray-900">0</div>
                                    <div className="text-gray-500 text-xs">Pesanan</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-semibold text-gray-900">{wishlistCount}</div>
                                    <div className="text-gray-500 text-xs">Wishlist</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-[#EB216A] text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            {activeTab === 'profile' && (
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Informasi Pribadi</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-500 mb-1.5">Nama Lengkap</label>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <Edit2 className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-900 text-sm">{user.name}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-500 mb-1.5">Email</label>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-900 text-sm">{user.email}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-500 mb-1.5">No. Telepon</label>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-400 text-sm">Belum diisi</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-500 mb-1.5">Alamat</label>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-400 text-sm">Belum diisi</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="my-6" />

                                    <Button className="bg-[#EB216A] hover:bg-[#d11d5e] text-white">
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit Profil
                                    </Button>
                                </div>
                            )}

                            {activeTab === 'password' && (
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Ganti Password</h2>

                                    {passwordError && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                            {passwordError}
                                        </div>
                                    )}

                                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                                        <div>
                                            <label className="block text-sm text-gray-500 mb-1.5">Password Lama</label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    name="currentPassword"
                                                    value={passwordData.currentPassword}
                                                    onChange={handlePasswordChange}
                                                    placeholder="Masukkan password lama"
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
                                                    onChange={handlePasswordChange}
                                                    placeholder="Minimal 6 karakter"
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
                                            <label className="block text-sm text-gray-500 mb-1.5">Konfirmasi Password Baru</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    name="confirmPassword"
                                                    value={passwordData.confirmPassword}
                                                    onChange={handlePasswordChange}
                                                    placeholder="Ulangi password baru"
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
                                            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white mt-2"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Menyimpan...
                                                </>
                                            ) : (
                                                'Simpan Password'
                                            )}
                                        </Button>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'orders' && (
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Riwayat Pesanan</h2>
                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                        <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
                                        <h3 className="text-base font-medium text-gray-900 mb-1">Belum ada pesanan</h3>
                                        <p className="text-gray-500 text-sm mb-4">Mulai belanja sekarang!</p>
                                        <Button
                                            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                                            onClick={() => navigate('/products')}
                                        >
                                            Mulai Belanja
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'wishlist' && (
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Wishlist Saya</h2>
                                    {wishlistProducts.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {wishlistProducts.map((product) => (
                                                <div key={product.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                                        <img
                                                            src={getProductImageUrl(product.images)}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                                                            {product.name}
                                                        </h3>
                                                        <p className="text-[#EB216A] font-semibold mb-2">
                                                            Rp {Number(product.price).toLocaleString('id-ID')}
                                                        </p>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white text-xs"
                                                                onClick={() => navigate(`/product/${product.id}`)}
                                                            >
                                                                Lihat Produk
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-red-500 border-red-200 hover:bg-red-50 text-xs"
                                                                onClick={() => removeFromWishlist(product.id)}
                                                            >
                                                                Hapus
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <Heart className="w-12 h-12 text-gray-300 mb-3" />
                                            <h3 className="text-base font-medium text-gray-900 mb-1">Wishlist kosong</h3>
                                            <p className="text-gray-500 text-sm mb-4">Simpan produk favorit Anda di sini</p>
                                            <Button
                                                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                                                onClick={() => navigate('/products')}
                                            >
                                                Jelajahi Produk
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            {/* Cart Summary */}
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                <h3 className="font-medium text-gray-900 mb-4">Keranjang Anda</h3>
                                {cartItems.length > 0 ? (
                                    <>
                                        <div className="space-y-3 mb-4">
                                            {cartItems.slice(0, 3).map((item) => (
                                                <div key={item.id} className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden">
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-900 truncate">{item.name}</p>
                                                        <p className="text-xs text-gray-500">x{item.quantity}</p>
                                                    </div>
                                                    <p className="text-sm font-medium text-[#EB216A]">
                                                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            ))}
                                            {cartItems.length > 3 && (
                                                <p className="text-xs text-gray-500 text-center">+{cartItems.length - 3} item lainnya</p>
                                            )}
                                        </div>
                                        <Separator className="my-3" />
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-gray-600 text-sm">Total</span>
                                            <span className="font-semibold text-[#EB216A]">
                                                Rp {getTotal().toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <Button
                                            className="w-full bg-green-500 hover:bg-green-600 text-white"
                                            onClick={() => {
                                                const productList = cartItems.map(item => `- ${item.name} (${item.quantity}x)`).join('\n');
                                                chatAdminFromProfile(user.name, productList, `Rp ${getTotal().toLocaleString('id-ID')}`);
                                            }}
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            Chat Admin
                                        </Button>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Keranjang kosong</p>
                                    </div>
                                )}
                            </div>

                            {/* Logout */}
                            <Button
                                variant="outline"
                                className="w-full border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Keluar dari Akun
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
