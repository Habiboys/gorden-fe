import { Edit, Plus, Search, Shield, Store, Trash2, User, UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useConfirm } from '../../context/ConfirmContext';
import { storesApi, usersApi } from '../../utils/api';

export default function AdminUsers() {
    const { confirm } = useConfirm();
    const [users, setUsers] = useState<any[]>([]);
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [editingUser, setEditingUser] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'USER', // ADMIN, FINANCE, USER
        storeId: '' // For FINANCE role
        // phone: '' // Optional if needed
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch users individually first to handle potential errors gracefully
            try {
                const usersRes = await usersApi.getAll();
                if (usersRes?.data) {
                    setUsers(usersRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch users", err);
                toast.error("Gagal memuat data user");
            }

            try {
                const storesRes = await storesApi.getAll();
                if (storesRes?.data) {
                    setStores(storesRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch stores", err);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'USER', storeId: '' });
        setIsModalOpen(false);
    };

    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const openEditModal = (user: any) => {
        setEditingUser(user);
        // Find assigned store if any
        let assignedStoreId = '';
        if (user.role === 'FINANCE' && user.Stores && user.Stores.length > 0) {
            assignedStoreId = user.Stores[0].id;
        }

        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Leave empty for no change
            confirmPassword: '',
            role: user.role,
            storeId: assignedStoreId
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error('Password dan Konfirmasi Password tidak cocok!');
            return;
        }

        if (!editingUser && !formData.password) {
            toast.error('Password wajib diisi untuk user baru!');
            return;
        }

        try {
            let resultUser;

            if (editingUser) {
                // Update
                const updateData: any = {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role
                };
                if (formData.password) {
                    updateData.password = formData.password;
                }

                const res = await usersApi.update(editingUser.id, updateData);
                resultUser = res.data;
                toast.success('User berhasil diupdate');
            } else {
                // Create
                const res = await usersApi.create({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                });
                resultUser = res.data;
                toast.success('User berhasil dibuat');
            }

            // Handle Store Assignment mainly for Finance
            // If Role is FINANCE, we update the store assignment
            if (formData.role === 'FINANCE') {
                // We might need to remove previous assignment if editing?
                // For simplicity, assignUser usually adds. 
                // A more robust backend might handle "sync" or "replace" assignment.
                // Assuming assignUser works. For update, ideally we should check if store changed.

                if (formData.storeId) {
                    // Check if store actually changed or is new
                    const currentStoreId = editingUser?.Stores?.[0]?.id;
                    if (currentStoreId !== formData.storeId) {
                        // If there was a previous store and it's different, maybe we should remove it first?
                        // But the requirements are simple. Let's try assigning.
                        // If backend is many-to-many, this adds another store. 
                        // If we want 1 store max for finance, backend/frontend should handle it.
                        // For now, let's just assign.
                        if (editingUser && currentStoreId) {
                            // Optional: Remove old store linkage if strict 1-1 needed, 
                            // but sticking to "Assign" logic for now.
                        }
                        await storesApi.assignUser(formData.storeId, resultUser.id);
                    }
                }
            }

            fetchData();
            resetForm();
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyimpan user');
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Hapus User',
            description: 'Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.',
            variant: 'destructive',
            confirmText: 'Hapus User',
            cancelText: 'Batal'
        });

        if (!confirmed) return;

        try {
            await usersApi.delete(id);
            setUsers(users.filter(u => u.id !== id));
            toast.success('User berhasil dihapus');
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Gagal menghapus user');
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === 'admin') return user.role === 'ADMIN';
        if (activeTab === 'finance') return user.role === 'FINANCE';
        if (activeTab === 'user') return user.role === 'USER';

        return true;
    });

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"><Shield className="w-3 h-3" /> Admin</span>;
            case 'FINANCE':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><Store className="w-3 h-3" /> Admin Toko</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><User className="w-3 h-3" /> User Biasa</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
                    <p className="text-gray-600">Kelola akun Admin, Finance, dan User</p>
                </div>
                <Button onClick={openCreateModal} className="bg-[#EB216A] hover:bg-[#d11d5e]">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah User
                </Button>
            </div>

            {/* Tabs & Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
                        <TabsTrigger value="all">Semua</TabsTrigger>
                        <TabsTrigger value="admin">Admin</TabsTrigger>
                        <TabsTrigger value="finance">Admin Toko</TabsTrigger>
                        <TabsTrigger value="user">User Biasa</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Cari user berdasarkan nama atau email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Nama</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Toko (Finance)</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Tidak ada user ditemukan</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {user.role === 'FINANCE' && user.Stores && user.Stores.length > 0 ? (
                                                <div className="flex gap-1 flex-wrap">
                                                    {user.Stores.map((s: any) => (
                                                        <span key={s.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">
                                                            {s.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditModal(user)}
                                                    className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                                    title="Edit User"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(user.id)}
                                                    className="h-8 w-8 p-0 text-gray-600 hover:text-red-500 hover:bg-red-50"
                                                    title="Hapus User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal (Create / Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <UserCog className="w-5 h-5 text-[#EB216A]" />
                                {editingUser ? 'Edit User' : 'Tambah User Baru'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="sr-only">Close</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Contoh: John Doe"
                                    className="focus-visible:ring-[#EB216A]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <Input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                    className="focus-visible:ring-[#EB216A]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {editingUser ? 'Password (Opsional)' : 'Password'}
                                    </label>
                                    <Input
                                        required={!editingUser}
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder={editingUser ? "Kosongkan jika tetap" : "Minimal 6 karakter"}
                                        className="focus-visible:ring-[#EB216A]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Konfirmasi
                                    </label>
                                    <Input
                                        required={!editingUser && formData.password.length > 0}
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="Ulangi Password"
                                        className="focus-visible:ring-[#EB216A]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(val: string) => setFormData({ ...formData, role: val })}
                                >
                                    <SelectTrigger className="focus:ring-[#EB216A]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">User (Customer)</SelectItem>
                                        <SelectItem value="FINANCE">Admin Toko (Finance)</SelectItem>
                                        <SelectItem value="ADMIN">Super Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Show Store Selection only if Role is FINANCE */}
                            {formData.role === 'FINANCE' && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 animate-in slide-in-from-top-2 duration-300">
                                    <label className="block text-sm font-medium text-blue-900 mb-1">Assign ke Toko (Opsional)</label>
                                    <p className="text-xs text-blue-700 mb-2">User ini akan mengelola keuangan toko yang dipilih.</p>
                                    <Select
                                        value={formData.storeId}
                                        onValueChange={(val: string) => setFormData({ ...formData, storeId: val })}
                                    >
                                        <SelectTrigger className="bg-white border-blue-200 focus:ring-blue-500">
                                            <SelectValue placeholder="Pilih Toko" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stores.length > 0 ? (
                                                stores.map(store => (
                                                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-2 text-sm text-gray-500">Tidak ada toko tersedia</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[#EB216A] text-white rounded-lg hover:bg-[#d11d5e] font-medium transition-colors"
                                >
                                    {editingUser ? 'Update User' : 'Simpan User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
