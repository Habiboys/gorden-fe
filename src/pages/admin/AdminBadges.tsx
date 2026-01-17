import { Edit, Plus, Shield, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { badgesApi } from '../../utils/api';

interface BadgeType {
    id: number;
    label: string;
    text_color: string;
    bg_color: string;
    position: string;
    is_system: boolean;
}

export default function AdminBadges() {
    const [badges, setBadges] = useState<BadgeType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        label: '',
        text_color: '#FFFFFF',
        bg_color: '#EB216A',
        position: 'top-left'
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        try {
            setLoading(true);
            const response = await badgesApi.getAll();
            if (response.success) {
                setBadges(response.data);
            }
        } catch (error) {
            toast.error('Gagal mengambil data badge');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setFormData({
            label: '',
            text_color: '#FFFFFF',
            bg_color: '#EB216A',
            position: 'top-left'
        });
        setEditingId(null);
        setShowModal(true);
    };

    const handleEdit = (badge: BadgeType) => {
        setFormData({
            label: badge.label,
            text_color: badge.text_color,
            bg_color: badge.bg_color,
            position: badge.position
        });
        setEditingId(badge.id);
        setShowModal(true);
    };

    const handleSubmit = async () => {
        try {
            if (!formData.label) {
                toast.error('Label harus diisi');
                return;
            }

            if (editingId) {
                await badgesApi.update(editingId, formData);
                toast.success('Badge berhasil diperbarui');
            } else {
                await badgesApi.create(formData);
                toast.success('Badge berhasil dibuat');
            }
            setShowModal(false);
            fetchBadges();
        } catch (error: any) {
            toast.error(error.message || 'Terjadi kesalahan');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah anda yakin ingin menghapus badge ini?')) return;
        try {
            await badgesApi.delete(id);
            toast.success('Badge berhasil dihapus');
            fetchBadges();
        } catch (error: any) {
            toast.error('Gagal menghapus badge');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-gray-900">Manajemen Badge</h1>
                    <p className="text-gray-600 mt-1">Buat dan atur label/badge untuk produk</p>
                </div>
                <Button onClick={handleCreate} className="bg-[#EB216A] hover:bg-[#d11d5e] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Badge
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Preview</TableHead>
                            <TableHead>Label</TableHead>
                            <TableHead>Posisi</TableHead>
                            <TableHead>Tipe</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {badges.map((badge) => (
                            <TableRow key={badge.id}>
                                <TableCell>
                                    <span
                                        className="px-3 py-1 rounded text-xs font-semibold shadow-sm whitespace-nowrap"
                                        style={{ color: badge.text_color, backgroundColor: badge.bg_color }}
                                    >
                                        {badge.label}
                                    </span>
                                </TableCell>
                                <TableCell className="font-medium">{badge.label}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-gray-500">
                                        {badge.position}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {badge.is_system ? (
                                        <Badge variant="secondary" className="flex w-fit items-center gap-1">
                                            <Shield className="w-3 h-3" /> System
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">Custom</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(badge)}
                                            title="Edit Badge"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(badge.id)}
                                            disabled={badge.is_system}
                                            title={badge.is_system ? "System badge tidak bisa dihapus" : "Hapus Badge"}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {badges.length === 0 && !loading && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                    Belum ada badge. Silahkan buat baru.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Badge' : 'Buat Badge Baru'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="label" className="text-right">Label</Label>
                            <Input
                                id="label"
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                className="col-span-3"
                                placeholder="Contoh: Promo, Best Seller"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="bg_color" className="text-right">Warna Background</Label>
                            <div className="col-span-3 flex gap-2">
                                <Input
                                    id="bg_color"
                                    type="color"
                                    value={formData.bg_color}
                                    onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                                    className="w-12 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={formData.bg_color}
                                    onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                                    className="flex-1"
                                    placeholder="#EB216A"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="text_color" className="text-right">Warna Text</Label>
                            <div className="col-span-3 flex gap-2">
                                <Input
                                    id="text_color"
                                    type="color"
                                    value={formData.text_color}
                                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                                    className="w-12 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={formData.text_color}
                                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                                    className="flex-1"
                                    placeholder="#FFFFFF"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="position" className="text-right">Posisi</Label>
                            <Select
                                value={formData.position}
                                onValueChange={(val: string) => setFormData({ ...formData, position: val })}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Pilih posisi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="top-left">Top Left (Kiri Atas)</SelectItem>
                                    <SelectItem value="top-right">Top Right (Kanan Atas)</SelectItem>
                                    <SelectItem value="bottom-left">Bottom Left (Kiri Bawah)</SelectItem>
                                    <SelectItem value="bottom-right">Bottom Right (Kanan Bawah)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Live Preview */}
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50 flex justify-center items-center">
                            <div className="relative w-32 h-32 bg-white shadow-sm border rounded overflow-hidden">
                                <img src="https://placehold.co/200x200?text=Product" alt="Preview" className="w-full h-full object-cover opacity-50" />
                                <span
                                    className="absolute px-2 py-0.5 text-[10px] font-semibold rounded shadow-sm whitespace-nowrap"
                                    style={{
                                        color: formData.text_color,
                                        backgroundColor: formData.bg_color,
                                        top: formData.position.includes('top') ? '4px' : 'auto',
                                        bottom: formData.position.includes('bottom') ? '4px' : 'auto',
                                        left: formData.position.includes('left') ? '4px' : 'auto',
                                        right: formData.position.includes('right') ? '4px' : 'auto',
                                    }}
                                >
                                    {formData.label || 'Preview Badge'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
                        <Button onClick={handleSubmit} className="bg-[#EB216A] hover:bg-[#D61C5F]">Simpan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
