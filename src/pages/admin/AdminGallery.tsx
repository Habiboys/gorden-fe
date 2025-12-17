import {
  Calendar,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';
import { useConfirm } from '../../context/ConfirmContext';
import { galleryApi, uploadApi } from '../../utils/api';

const categories = ['Rumah Tinggal', 'Apartemen', 'Kantor', 'Cafe / Resto'];

export default function AdminGallery() {
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    category: '',
    type: '',
    location: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    featured: false,
    order: 0,
  });

  useEffect(() => {
    loadGalleryItems();
  }, []);

  const loadGalleryItems = async () => {
    try {
      setLoading(true);
      const response = await galleryApi.getAll();
      if (response && response.data) {
        setGalleryItems(response.data);
      } else if (Array.isArray(response)) {
        setGalleryItems(response);
      } else {
        setGalleryItems([]);
      }
    } catch (error) {
      console.error('Error loading gallery items:', error);
      toast.error('Gagal memuat galeri');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Mohon upload file gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB');
      return;
    }

    try {
      setUploading(true);
      const response = await uploadApi.uploadFile(file);

      if (response.success) {
        setFormData(prev => ({ ...prev, image: response.data.url }));
        toast.success('Gambar berhasil diupload');
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error('Gagal upload gambar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.image || !formData.category) {
        toast.error('Judul, gambar, dan kategori harus diisi');
        return;
      }

      const payload = {
        title: formData.title,
        image_url: formData.image,
        category: formData.category,
        type: formData.type,
        location: formData.location,
        description: formData.description,
        date: formData.date,
        is_featured: formData.featured,
        sort_order: formData.order,
      };

      if (editingItem) {
        await galleryApi.update(editingItem.id, payload);
        toast.success('Item galeri berhasil diupdate');
      } else {
        await galleryApi.create(payload);
        toast.success('Item galeri berhasil ditambahkan');
      }

      loadGalleryItems();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error saving gallery item:', error);
      toast.error(error.message || 'Gagal menyimpan item galeri');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus item galeri ini?')) return;

    try {
      const response = await galleryApi.delete(id);
      if (response.success || response.message === 'Project deleted') {
        toast.success('Item galeri berhasil dihapus');
        loadGalleryItems();
      }
    } catch (error: any) {
      console.error('Error deleting gallery item:', error);
      toast.error(error.message || 'Gagal menghapus item galeri');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      image: item.image_url || item.image,
      category: item.category,
      type: item.type || '',
      location: item.location || '',
      description: item.description || '',
      date: item.date || new Date().toISOString().split('T')[0],
      featured: item.is_featured || item.featured || false,
      order: item.sort_order || item.order || 0,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      title: '',
      image: '',
      category: '',
      type: '',
      location: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      featured: false,
      order: 0,
    });
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      image: '',
      category: '',
      type: '',
      location: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      featured: false,
      order: 0,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-gray-200 rounded w-64 mb-8 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl text-gray-900">Manajemen Galeri</h1>
          <p className="text-gray-600 mt-1">
            Kelola galeri proyek pemasangan gorden
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleAddNew}
            className="bg-[#EB216A] hover:bg-[#d11d5e]"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tambah Item Galeri
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {galleryItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Belum ada item galeri. Klik tombol &quot;Tambah Item Galeri&quot; untuk mulai menambahkan.
                </TableCell>
              </TableRow>
            ) : (
              galleryItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <img
                      src={item.image_url || item.image}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{item.title}</div>
                    {item.type && (
                      <div className="text-xs text-gray-500">{item.type}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge>{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{item.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(item.is_featured || item.featured) ? (
                      <Badge className="bg-yellow-500">Featured</Badge>
                    ) : (
                      <Badge variant="outline">Normal</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Item Galeri' : 'Tambah Item Galeri'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Edit detail item galeri ini' : 'Tambah item galeri baru'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="image">Gambar *</Label>
              <div className="space-y-3 mt-2">
                {formData.image && (
                  <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {formData.image ? 'Change Image' : 'Upload Image'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="title">Judul *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Apartemen Modern Jakarta Selatan"
                />
              </div>

              <div>
                <Label htmlFor="category">Kategori *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Tipe Produk</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  placeholder="Gorden Smokering"
                />
              </div>

              <div>
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Jakarta Selatan"
                />
              </div>

              <div>
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi singkat tentang proyek ini..."
                  rows={3}
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <Label htmlFor="featured" className="cursor-pointer">
                      Featured Item
                    </Label>
                    <p className="text-sm text-gray-500">
                      Item ini akan ditampilkan di posisi prioritas
                    </p>
                  </div>
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, featured: checked })
                    }
                  />
                </div>
              </div>

              <div className="col-span-2">
                <Label htmlFor="order">Urutan Tampil (Order)</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Angka lebih kecil akan tampil lebih dulu
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleSave}
                disabled={uploading}
                className="flex-1 bg-[#EB216A] hover:bg-[#d11d5e]"
              >
                {editingItem ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}