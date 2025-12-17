import { Edit, FolderTree, Plus, Trash2 } from 'lucide-react';
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
import { categoriesApi } from '../../utils/api';

export default function AdminCategories() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesApi.getAll();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: '', slug: '', description: '' });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (categoryId: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Kategori',
      description: 'Apakah Anda yakin ingin menghapus kategori ini? Semua produk dalam kategori ini mungkin akan terpengaruh.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'destructive',
    });

    if (isConfirmed) {
      try {
        await categoriesApi.delete(categoryId);
        toast.success('Kategori berhasil dihapus!');
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        toast.error('Gagal menghapus kategori!');
      }
    }
  };

  const handleSaveAdd = async () => {
    if (!formData.name) {
      toast.error('Nama kategori harus diisi!');
      return;
    }

    setSaving(true);
    try {
      // Auto-generate slug if not provided
      const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');

      await categoriesApi.create({
        ...formData,
        slug,
      });

      toast.success('Kategori berhasil ditambahkan!');
      setIsAddDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Gagal menambahkan kategori!');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!formData.name) {
      toast.error('Nama kategori harus diisi!');
      return;
    }

    setSaving(true);
    try {
      const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');

      await categoriesApi.update(selectedCategory.id, {
        ...formData,
        slug,
      });

      toast.success('Kategori berhasil diupdate!');
      setIsEditDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Gagal mengupdate kategori!');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
      slug: generateSlug(value),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900">Kategori</h1>
          <p className="text-gray-600 mt-1">Kelola kategori produk</p>
        </div>
        <Button
          className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
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
          <p className="text-gray-600">Belum ada kategori</p>
          <Button
            className="mt-4 bg-[#EB216A] hover:bg-[#d11d5e] text-white"
            onClick={handleAdd}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kategori Pertama
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-[#EB216A]/10 rounded-xl flex items-center justify-center">
                  <FolderTree className="w-8 h-8 text-[#EB216A]" />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h3 className="text-lg text-gray-900 mb-2">{category.name}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {category.description || 'Tidak ada deskripsi'}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-600">Slug</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                  {category.slug}
                </code>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
            <DialogDescription>
              Lengkapi form untuk menambahkan kategori baru
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Kategori *</Label>
              <Input
                id="name"
                placeholder="Masukkan nama kategori..."
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                placeholder="nama-kategori"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
              <p className="text-xs text-gray-500">Otomatis dibuat dari nama kategori</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Masukkan deskripsi kategori..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              onClick={handleSaveAdd}
              disabled={saving}
            >
              {saving ? 'Menyimpan...' : 'Simpan Kategori'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Kategori</DialogTitle>
            <DialogDescription>
              Update informasi kategori
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nama Kategori *</Label>
              <Input
                id="edit-name"
                placeholder="Masukkan nama kategori..."
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                placeholder="nama-kategori"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                placeholder="Masukkan deskripsi kategori..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
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
              {saving ? 'Menyimpan...' : 'Update Kategori'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
