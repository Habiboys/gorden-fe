import { useState } from 'react';
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react';
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
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

const mockCategories = [
  {
    id: '1',
    name: 'Gorden Custom',
    slug: 'gorden-custom',
    description: 'Gorden custom dengan berbagai pilihan kain premium',
    productCount: 156,
    icon: 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?w=100',
  },
  {
    id: '2',
    name: 'Blind',
    slug: 'blind',
    description: 'Berbagai jenis blind modern untuk ruangan Anda',
    productCount: 89,
    icon: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?w=100',
  },
  {
    id: '3',
    name: 'Vitrase',
    slug: 'vitrase',
    description: 'Vitrase tipis elegan untuk kesan mewah',
    productCount: 67,
    icon: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?w=100',
  },
  {
    id: '4',
    name: 'Wallpaper',
    slug: 'wallpaper',
    description: 'Wallpaper berkualitas dengan berbagai motif',
    productCount: 144,
    icon: 'https://images.unsplash.com/photo-1762360411005-863ffdaa7691?w=100',
  },
];

export default function AdminCategories() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (categoryId: string) => {
    if (confirm('Yakin ingin menghapus kategori ini?')) {
      console.log('Delete category:', categoryId);
    }
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
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCategories.map((category) => (
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
              {category.description}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-600">Total Produk</span>
              <span className="text-sm text-[#EB216A]">{category.productCount}</span>
            </div>
          </Card>
        ))}
      </div>

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
              <Label htmlFor="name">Nama Kategori</Label>
              <Input id="name" placeholder="Masukkan nama kategori..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" placeholder="nama-kategori" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea 
                id="description" 
                placeholder="Masukkan deskripsi kategori..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Batal
            </Button>
            <Button className="bg-[#EB216A] hover:bg-[#d11d5e] text-white">
              Simpan Kategori
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
              <Label htmlFor="edit-name">Nama Kategori</Label>
              <Input 
                id="edit-name" 
                defaultValue={selectedCategory?.name}
                placeholder="Masukkan nama kategori..." 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input 
                id="edit-slug" 
                defaultValue={selectedCategory?.slug}
                placeholder="nama-kategori" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea 
                id="edit-description"
                defaultValue={selectedCategory?.description}
                placeholder="Masukkan deskripsi kategori..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button className="bg-[#EB216A] hover:bg-[#d11d5e] text-white">
              Update Kategori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
