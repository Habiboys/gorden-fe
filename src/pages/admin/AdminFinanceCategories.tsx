import { FolderTree, Plus, Trash2, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useConfirm } from '../../context/ConfirmContext';
import { financeApi } from '../../utils/api';

export default function AdminFinanceCategories() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { confirm } = useConfirm();

    const [formData, setFormData] = useState({
        name: '',
        type: 'INCOME'
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await financeApi.getCategories();
            if (response.success) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Gagal memuat kategori');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setFormData({ name: '', type: 'INCOME' });
        setIsAddDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: 'Hapus Kategori',
            description: 'Apakah Anda yakin ingin menghapus kategori ini? Kategori ini mungkin digunakan dalam transaksi.',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            variant: 'destructive',
        });

        if (isConfirmed) {
            try {
                await financeApi.deleteCategory(id);
                toast.success('Kategori berhasil dihapus!');
                fetchCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
                toast.error('Gagal menghapus kategori!');
            }
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Nama kategori harus diisi!');
            return;
        }

        setSaving(true);
        try {
            await financeApi.createCategory({
                name: formData.name,
                type: formData.type
            });

            toast.success('Kategori berhasil ditambahkan!');
            setIsAddDialogOpen(false);
            fetchCategories();
        } catch (error: any) {
            console.error('Error creating category:', error);
            toast.error(error.message || 'Gagal menambahkan kategori!');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl text-gray-900 flex items-center gap-2">
                        <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-[#EB216A]" />
                        Kategori Keuangan
                    </h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">Kelola kategori pemasukan dan pengeluaran</p>
                </div>
                <Button
                    className="bg-[#EB216A] hover:bg-[#d11d5e] text-white w-full sm:w-auto"
                    onClick={handleAdd}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Kategori
                </Button>
            </div>

            {/* Categories Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-600">Loading kategori...</p>
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12">
                    <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Belum ada kategori keuangan</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {categories.map((category) => (
                        <Card key={category.id} className="p-4 sm:p-6 border-gray-200 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${category.type === 'INCOME' ? 'bg-green-100' : 'bg-red-100'}`}>
                                    <span className={`font-bold text-xl ${category.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                        {category.type === 'INCOME' ? '+' : '-'}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDelete(category.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                            <Badge className={category.type === 'INCOME' ? 'bg-green-100 text-green-700 border-0' : 'bg-red-100 text-red-700 border-0'}>
                                {category.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                            </Badge>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Category Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Kategori Keuangan</DialogTitle>
                        <DialogDescription>
                            Buat kategori baru untuk transaksi keuangan
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Tipe Kategori</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                                    className={`p-3 rounded-xl border text-center transition-all ${formData.type === 'INCOME'
                                        ? 'bg-green-50 border-green-200 text-green-700 font-bold ring-2 ring-green-500 ring-offset-2'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    Pemasukan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                    className={`p-3 rounded-xl border text-center transition-all ${formData.type === 'EXPENSE'
                                        ? 'bg-red-50 border-red-200 text-red-700 font-bold ring-2 ring-red-500 ring-offset-2'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    Pengeluaran
                                </button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nama Kategori *</Label>
                            <Input
                                id="name"
                                placeholder="Contoh: Operasional, Gaji"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsAddDialogOpen(false)}
                            disabled={saving}
                        >
                            Batal
                        </Button>
                        <Button
                            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
