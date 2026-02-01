import { Edit, Plus, Store, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { useConfirm } from '../../context/ConfirmContext';
import { storesApi } from '../../utils/api';

export default function AdminStores() {
    const { confirm } = useConfirm();
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStore, setEditingStore] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        description: ''
    });

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            setLoading(true);
            const response = await storesApi.getAll();
            if (response.success) {
                setStores(response.data);
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
            toast.error('Gagal memuat data toko');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Hapus Toko',
            description: 'Apakah Anda yakin ingin menghapus toko ini? Data yang terhapus tidak dapat dikembalikan.',
            variant: 'destructive',
            confirmText: 'Hapus',
            cancelText: 'Batal'
        });

        if (!confirmed) return;

        try {
            await storesApi.delete(id);
            setStores(stores.filter(s => s.id !== id));
            toast.success('Toko berhasil dihapus');
        } catch (error) {
            toast.error('Gagal menghapus toko');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingStore) {
                await storesApi.update(editingStore.id, formData);
                toast.success('Toko berhasil diupdate');
            } else {
                await storesApi.create(formData);
                toast.success('Toko berhasil dibuat');
            }
            setShowModal(false);
            setEditingStore(null);
            setFormData({ name: '', location: '', description: '' });
            fetchStores();
        } catch (error) {
            toast.error('Gagal menyimpan toko');
        }
    };

    const openEditModal = (store: any) => {
        setEditingStore(store);
        setFormData({
            name: store.name,
            location: store.location || '',
            description: store.description || ''
        });
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Data Toko / Cabang</h1>
                    <p className="text-gray-600">Kelola daftar toko untuk fitur finance</p>
                </div>
                <Button onClick={() => {
                    setEditingStore(null);
                    setFormData({ name: '', location: '', description: '' });
                    setShowModal(true);
                }} className="bg-[#EB216A] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Toko
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-medium text-gray-500">Nama Toko</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Lokasi</th>
                            <th className="px-6 py-4 font-medium text-gray-500">Keterangan</th>
                            <th className="px-6 py-4 font-medium text-gray-500">User Assigned</th>
                            <th className="px-6 py-4 font-medium text-gray-500 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : stores.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    Belum ada data toko
                                </td>
                            </tr>
                        ) : (
                            stores.map((store) => (
                                <tr key={store.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-pink-50 rounded-lg text-[#EB216A]">
                                                <Store className="w-4 h-4" />
                                            </div>
                                            {store.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{store.location || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{store.description || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-gray-600">
                                            <Users className="w-4 h-4" />
                                            <span>{store.Users?.length || 0} Users</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openEditModal(store)}>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(store.id)}>
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">{editingStore ? 'Edit Toko' : 'Tambah Toko'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#EB216A] focus:border-[#EB216A]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#EB216A] focus:border-[#EB216A]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#EB216A] focus:border-[#EB216A]"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Batal</Button>
                                <Button type="submit" className="flex-1 bg-[#EB216A] text-white">Simpan</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
