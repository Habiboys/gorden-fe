import { Edit, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Textarea } from '../../components/ui/textarea';
import { useConfirm } from '../../context/ConfirmContext';
import { servicesApi, uploadApi } from '../../utils/api';

export default function AdminServices() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { confirm } = useConfirm();

    // Form data
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        icon: '', // This will store the image URL
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const response = await servicesApi.getAll();
            setServices(response.data || []);
        } catch (error) {
            console.error('Error fetching services:', error);
            toast.error('Gagal memuat layanan');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            toast.loading('Mengupload icon...', { id: 'upload' });
            const res = await uploadApi.uploadFile(file);
            const url = res.url || res.data?.url;

            if (url) {
                setFormData(prev => ({ ...prev, icon: url }));
                toast.dismiss('upload');
                toast.success('Icon berhasil diupload!');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.dismiss('upload');
            toast.error('Gagal mengupload icon');
        }
    };

    const handleAdd = () => {
        setFormData({ title: '', description: '', icon: '' });
        setIsAddDialogOpen(true);
    };

    const handleEdit = (service: any) => {
        setSelectedService(service);
        setFormData({
            title: service.title || '',
            description: service.description || '',
            icon: service.icon || '',
        });
        setIsEditDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        const isConfirmed = await confirm({
            title: 'Hapus Layanan',
            description: 'Apakah Anda yakin ingin menghapus layanan ini?',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            variant: 'destructive',
        });

        if (isConfirmed) {
            try {
                await servicesApi.delete(id);
                toast.success('Layanan berhasil dihapus!');
                fetchServices();
            } catch (error) {
                console.error('Error deleting service:', error);
                toast.error('Gagal menghapus layanan!');
            }
        }
    };

    const handleSaveAdd = async () => {
        if (!formData.title) {
            toast.error('Judul layanan harus diisi!');
            return;
        }

        setSaving(true);
        try {
            await servicesApi.create(formData);
            toast.success('Layanan berhasil ditambahkan!');
            setIsAddDialogOpen(false);
            fetchServices();
        } catch (error) {
            console.error('Error creating service:', error);
            toast.error('Gagal menambahkan layanan!');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!formData.title) {
            toast.error('Judul layanan harus diisi!');
            return;
        }

        setSaving(true);
        try {
            await servicesApi.update(selectedService.id, formData);
            toast.success('Layanan berhasil diupdate!');
            setIsEditDialogOpen(false);
            fetchServices();
        } catch (error) {
            console.error('Error updating service:', error);
            toast.error('Gagal mengupdate layanan!');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-gray-900">Layanan Kami</h1>
                    <p className="text-gray-600 mt-1">Kelola daftar layanan yang ditampilkan di beranda</p>
                </div>
                <Button
                    className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                    onClick={handleAdd}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Layanan
                </Button>
            </div>

            {/* Services Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-600">Loading layanan...</p>
                </div>
            ) : services.length === 0 ? (
                <div className="text-center py-12">
                    <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Belum ada layanan</p>
                    <Button
                        className="mt-4 bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                        onClick={handleAdd}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Layanan Pertama
                    </Button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                        <Card key={service.id} className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-16 h-16 bg-[#EB216A]/10 rounded-xl flex items-center justify-center overflow-hidden">
                                    {service.icon ? (
                                        <img src={service.icon} alt={service.title} className="w-8 h-8 object-contain" />
                                    ) : (
                                        <Sparkles className="w-8 h-8 text-[#EB216A]" />
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(service)}
                                        title="Edit Layanan"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(service.id)}
                                        title="Hapus Layanan"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                            <p className="text-sm text-gray-600 line-clamp-3">
                                {service.description || 'Tidak ada deskripsi'}
                            </p>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Layanan Baru</DialogTitle>
                        <DialogDescription>
                            Tambahkan layanan baru untuk ditampilkan di beranda
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Judul Layanan *</Label>
                            <Input
                                id="title"
                                placeholder="Contoh: Konsultasi Gratis"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                placeholder="Jelaskan detail layanan..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Icon Layanan</Label>
                            <div className="flex items-center gap-4">
                                {formData.icon && (
                                    <img
                                        src={formData.icon}
                                        alt="Preview"
                                        className="w-12 h-12 object-contain rounded-md border bg-gray-50 p-1"
                                    />
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>
                            <p className="text-xs text-gray-500">Format: PNG/JPG/WEBP (Disarankan background transparan)</p>
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
                            onClick={handleSaveAdd}
                            disabled={saving}
                        >
                            {saving ? 'Menyimpan...' : 'Simpan Layanan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Layanan</DialogTitle>
                        <DialogDescription>
                            Update informasi layanan
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-title">Judul Layanan *</Label>
                            <Input
                                id="edit-title"
                                placeholder="Contoh: Konsultasi Gratis"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-description">Deskripsi</Label>
                            <Textarea
                                id="edit-description"
                                placeholder="Jelaskan detail layanan..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Icon Layanan</Label>
                            <div className="flex items-center gap-4">
                                {formData.icon && (
                                    <img
                                        src={formData.icon}
                                        alt="Preview"
                                        className="w-12 h-12 object-contain rounded-md border bg-gray-50 p-1"
                                    />
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={saving}
                        >
                            Batal
                        </Button>
                        <Button
                            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                            onClick={handleSaveEdit}
                            disabled={saving}
                        >
                            {saving ? 'Menyimpan...' : 'Update Layanan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
