import { Edit, FolderTree, Layers, Plus, Trash2 } from 'lucide-react';
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
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { useConfirm } from '../../context/ConfirmContext';
import { categoriesApi, subcategoriesApi, uploadApi } from '../../utils/api';

export default function AdminCategories() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { confirm } = useConfirm();

  // Sub-category states
  const [isSubCategoryDialogOpen, setIsSubCategoryDialogOpen] = useState(false);
  const [currentCategoryForSub, setCurrentCategoryForSub] = useState<any>(null);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [isAddSubDialogOpen, setIsAddSubDialogOpen] = useState(false);
  const [isEditSubDialogOpen, setIsEditSubDialogOpen] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState<any>(null);
  const [savingSub, setSavingSub] = useState(false);

  // Form data for category
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    icon_url: '',
  });

  // Form data for sub-category
  const [subFormData, setSubFormData] = useState({
    name: '',
    slug: '',
    description: '',
    has_max_length: false,
  });

  // File Upload Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'icon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading('Mengupload...', { id: 'upload' });
      const res = await uploadApi.uploadFile(file);
      const url = res.url || res.data?.url;

      if (url) {
        setFormData(prev => ({
          ...prev,
          [type === 'image' ? 'image' : 'icon_url']: url
        }));
        toast.dismiss('upload');
        toast.success(`${type === 'image' ? 'Gambar' : 'Icon'} berhasil diupload!`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.dismiss('upload');
      toast.error('Gagal mengupload file');
    }
  };

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
    setFormData({ name: '', slug: '', description: '', image: '', icon_url: '' });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      image: category.image || '',
      icon_url: category.icon_url || '',
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

  // ========== SUB-CATEGORY FUNCTIONS ==========

  const handleManageSubCategories = async (category: any) => {
    setCurrentCategoryForSub(category);
    setIsSubCategoryDialogOpen(true);
    setLoadingSubcategories(true);
    try {
      const response = await subcategoriesApi.getSubCategories(category.id);
      setSubcategories(response.data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast.error('Gagal memuat sub kategori');
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const handleAddSubCategory = () => {
    setSubFormData({ name: '', slug: '', description: '', has_max_length: false });
    setIsAddSubDialogOpen(true);
  };

  const handleEditSubCategory = (sub: any) => {
    setSelectedSubCategory(sub);
    setSubFormData({
      name: sub.name || '',
      slug: sub.slug || '',
      description: sub.description || '',
      has_max_length: sub.has_max_length || false,
    });
    setIsEditSubDialogOpen(true);
  };

  const handleDeleteSubCategory = async (subId: number) => {
    const isConfirmed = await confirm({
      title: 'Hapus Sub Kategori',
      description: 'Apakah Anda yakin ingin menghapus sub kategori ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'destructive',
    });

    if (isConfirmed) {
      try {
        await subcategoriesApi.delete(subId);
        toast.success('Sub kategori berhasil dihapus!');
        // Refresh subcategories list
        const response = await subcategoriesApi.getSubCategories(currentCategoryForSub.id);
        setSubcategories(response.data || []);
      } catch (error) {
        console.error('Error deleting subcategory:', error);
        toast.error('Gagal menghapus sub kategori!');
      }
    }
  };

  const handleSaveAddSubCategory = async () => {
    if (!subFormData.name) {
      toast.error('Nama sub kategori harus diisi!');
      return;
    }

    setSavingSub(true);
    try {
      const slug = subFormData.slug || generateSlug(subFormData.name);

      await subcategoriesApi.create({
        ...subFormData,
        slug,
        category_id: currentCategoryForSub.id,
      });

      toast.success('Sub kategori berhasil ditambahkan!');
      setIsAddSubDialogOpen(false);
      // Refresh subcategories list
      const response = await subcategoriesApi.getSubCategories(currentCategoryForSub.id);
      setSubcategories(response.data || []);
    } catch (error) {
      console.error('Error creating subcategory:', error);
      toast.error('Gagal menambahkan sub kategori!');
    } finally {
      setSavingSub(false);
    }
  };

  const handleSaveEditSubCategory = async () => {
    if (!subFormData.name) {
      toast.error('Nama sub kategori harus diisi!');
      return;
    }

    setSavingSub(true);
    try {
      const slug = subFormData.slug || generateSlug(subFormData.name);

      await subcategoriesApi.update(selectedSubCategory.id, {
        ...subFormData,
        slug,
      });

      toast.success('Sub kategori berhasil diupdate!');
      setIsEditSubDialogOpen(false);
      // Refresh subcategories list
      const response = await subcategoriesApi.getSubCategories(currentCategoryForSub.id);
      setSubcategories(response.data || []);
    } catch (error) {
      console.error('Error updating subcategory:', error);
      toast.error('Gagal mengupdate sub kategori!');
    } finally {
      setSavingSub(false);
    }
  };

  const handleSubNameChange = (value: string) => {
    setSubFormData({
      ...subFormData,
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
          <p className="text-gray-600 mt-1">Kelola kategori dan sub kategori produk</p>
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
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleManageSubCategories(category)}
                    title="Kelola Sub Kategori"
                  >
                    <Layers className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(category)}
                    title="Edit Kategori"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(category.id)}
                    title="Hapus Kategori"
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
              <Label>Gambar Kategori (Background)</Label>
              <div className="flex items-center gap-4">
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Icon Kategori</Label>
              <div className="flex items-center gap-4">
                {formData.icon_url && (
                  <img
                    src={formData.icon_url}
                    alt="Icon Preview"
                    className="w-10 h-10 object-contain rounded-full border bg-gray-50 p-1"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'icon')}
                />
              </div>
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
              <Label>Gambar Kategori (Background)</Label>
              <div className="flex items-center gap-4">
                {formData.image && (
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'image')}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Icon Kategori</Label>
              <div className="flex items-center gap-4">
                {formData.icon_url && (
                  <img
                    src={formData.icon_url}
                    alt="Icon Preview"
                    className="w-10 h-10 object-contain rounded-full border bg-gray-50 p-1"
                  />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'icon')}
                />
              </div>
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

      {/* Sub-Category Management Dialog */}
      <Dialog open={isSubCategoryDialogOpen} onOpenChange={setIsSubCategoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Sub Kategori: {currentCategoryForSub?.name}
            </DialogTitle>
            <DialogDescription>
              Kelola sub kategori untuk kategori ini
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Add Sub-Category Button */}
            <div className="mb-4">
              <Button
                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                onClick={handleAddSubCategory}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Sub Kategori
              </Button>
            </div>

            {/* Sub-Categories List */}
            {loadingSubcategories ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading sub kategori...</p>
              </div>
            ) : subcategories.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">Belum ada sub kategori</p>
                <p className="text-sm text-gray-500 mt-1">Klik tombol di atas untuk menambahkan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subcategories.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{sub.name}</h4>
                        {sub.has_max_length && (
                          <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                            Max Length
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Slug: <code className="bg-gray-200 px-1 rounded">{sub.slug}</code>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSubCategory(sub)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteSubCategory(sub.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubCategoryDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sub-Category Dialog */}
      <Dialog open={isAddSubDialogOpen} onOpenChange={setIsAddSubDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Sub Kategori</DialogTitle>
            <DialogDescription>
              Tambahkan sub kategori baru untuk {currentCategoryForSub?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sub-name">Nama Sub Kategori *</Label>
              <Input
                id="sub-name"
                placeholder="Masukkan nama sub kategori..."
                value={subFormData.name}
                onChange={(e) => handleSubNameChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sub-slug">Slug</Label>
              <Input
                id="sub-slug"
                placeholder="nama-sub-kategori"
                value={subFormData.slug}
                onChange={(e) => setSubFormData({ ...subFormData, slug: e.target.value })}
              />
              <p className="text-xs text-gray-500">Otomatis dibuat dari nama</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sub-description">Deskripsi</Label>
              <Textarea
                id="sub-description"
                placeholder="Masukkan deskripsi..."
                rows={2}
                value={subFormData.description}
                onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="has-max-length" className="font-medium">Panjang Maksimal</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Aktifkan jika produk dalam sub kategori ini memerlukan input panjang maksimal
                </p>
              </div>
              <Switch
                id="has-max-length"
                checked={subFormData.has_max_length}
                onCheckedChange={(checked: boolean) => setSubFormData({ ...subFormData, has_max_length: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddSubDialogOpen(false)}
              disabled={savingSub}
            >
              Batal
            </Button>
            <Button
              className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
              onClick={handleSaveAddSubCategory}
              disabled={savingSub}
            >
              {savingSub ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sub-Category Dialog */}
      <Dialog open={isEditSubDialogOpen} onOpenChange={setIsEditSubDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Sub Kategori</DialogTitle>
            <DialogDescription>
              Update informasi sub kategori
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-sub-name">Nama Sub Kategori *</Label>
              <Input
                id="edit-sub-name"
                placeholder="Masukkan nama sub kategori..."
                value={subFormData.name}
                onChange={(e) => handleSubNameChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sub-slug">Slug</Label>
              <Input
                id="edit-sub-slug"
                placeholder="nama-sub-kategori"
                value={subFormData.slug}
                onChange={(e) => setSubFormData({ ...subFormData, slug: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-sub-description">Deskripsi</Label>
              <Textarea
                id="edit-sub-description"
                placeholder="Masukkan deskripsi..."
                rows={2}
                value={subFormData.description}
                onChange={(e) => setSubFormData({ ...subFormData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="edit-has-max-length" className="font-medium">Panjang Maksimal</Label>
                <p className="text-xs text-gray-500 mt-1">
                  Aktifkan jika produk memerlukan input panjang maksimal
                </p>
              </div>
              <Switch
                id="edit-has-max-length"
                checked={subFormData.has_max_length}
                onCheckedChange={(checked: boolean) => setSubFormData({ ...subFormData, has_max_length: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditSubDialogOpen(false)}
              disabled={savingSub}
            >
              Batal
            </Button>
            <Button
              className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
              onClick={handleSaveEditSubCategory}
              disabled={savingSub}
            >
              {savingSub ? 'Menyimpan...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
