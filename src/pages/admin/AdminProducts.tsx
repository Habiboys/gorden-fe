import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreVertical
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const mockProducts = [
  {
    id: '1',
    name: 'Fabric Only Sharp point Solar Screw seri 4000',
    category: 'Gorden Custom',
    price: 223200,
    stock: 45,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?w=100',
  },
  {
    id: '2',
    name: 'Modern Blind Minimalist Premium',
    category: 'Blind',
    price: 350000,
    stock: 23,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1527776702328-f127392d764f?w=100',
  },
  {
    id: '3',
    name: 'Vitrase Sheer Elegant Classic',
    category: 'Vitrase',
    price: 180000,
    stock: 67,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1617597190828-1bf579d485ee?w=100',
  },
  {
    id: '4',
    name: 'Gorden Blackout Premium Luxury',
    category: 'Gorden Custom',
    price: 450000,
    stock: 0,
    status: 'out_of_stock',
    image: 'https://images.unsplash.com/photo-1762360411005-863ffdaa7691?w=100',
  },
  {
    id: '5',
    name: 'Roller Blind Office Professional',
    category: 'Blind',
    price: 280000,
    stock: 34,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?w=100',
  },
];

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (productId: string) => {
    if (confirm('Yakin ingin menghapus produk ini?')) {
      console.log('Delete product:', productId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900">Produk</h1>
          <p className="text-gray-600 mt-1">Kelola semua produk Amagriya Gorden</p>
        </div>
        <Button 
          className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="border-gray-300">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Produk</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Kategori</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Harga</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Stok</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Status</th>
                <th className="text-right px-6 py-4 text-sm text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm text-gray-900 max-w-xs truncate">
                          {product.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{product.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      Rp {product.price.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{product.stock}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={
                      product.status === 'active'
                        ? 'bg-green-100 text-green-700 border-0'
                        : 'bg-red-100 text-red-700 border-0'
                    }>
                      {product.status === 'active' ? 'Aktif' : 'Habis'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Produk Baru</DialogTitle>
            <DialogDescription>
              Lengkapi form untuk menambahkan produk baru
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Produk</Label>
              <Input id="name" placeholder="Masukkan nama produk..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Kategori</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gorden">Gorden Custom</SelectItem>
                    <SelectItem value="blind">Blind</SelectItem>
                    <SelectItem value="vitrase">Vitrase</SelectItem>
                    <SelectItem value="wallpaper">Wallpaper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Harga</Label>
                <Input id="price" type="number" placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stock">Stok</Label>
                <Input id="stock" type="number" placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue="active">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Non-aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea 
                id="description" 
                placeholder="Masukkan deskripsi produk..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Batal
            </Button>
            <Button className="bg-[#EB216A] hover:bg-[#d11d5e] text-white">
              Simpan Produk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
            <DialogDescription>
              Update informasi produk
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nama Produk</Label>
              <Input 
                id="edit-name" 
                defaultValue={selectedProduct?.name}
                placeholder="Masukkan nama produk..." 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Kategori</Label>
                <Select defaultValue="gorden">
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gorden">Gorden Custom</SelectItem>
                    <SelectItem value="blind">Blind</SelectItem>
                    <SelectItem value="vitrase">Vitrase</SelectItem>
                    <SelectItem value="wallpaper">Wallpaper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Harga</Label>
                <Input 
                  id="edit-price" 
                  type="number" 
                  defaultValue={selectedProduct?.price}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-stock">Stok</Label>
                <Input 
                  id="edit-stock" 
                  type="number" 
                  defaultValue={selectedProduct?.stock}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select defaultValue={selectedProduct?.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Non-aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button className="bg-[#EB216A] hover:bg-[#d11d5e] text-white">
              Update Produk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
