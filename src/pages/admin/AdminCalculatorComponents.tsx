import {
  Box,
  DollarSign,
  Filter,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { Textarea } from '../../components/ui/textarea';
import { calculatorComponentsApi } from '../../utils/api';

const componentTypes = [
  { value: 'product', label: 'Produk Gorden', icon: Package },
  { value: 'relGorden', label: 'Rel Gorden', icon: Box },
  { value: 'tassel', label: 'Tassel', icon: Package },
  { value: 'hook', label: 'Hook', icon: Package },
  { value: 'kainVitrase', label: 'Kain Vitrase', icon: Package },
  { value: 'relVitrase', label: 'Rel Vitrase', icon: Box },
];

export default function AdminCalculatorComponents() {
  const [components, setComponents] = useState<any>({
    products: [],
    relGorden: [],
    tassel: [],
    hook: [],
    kainVitrase: [],
    relVitrase: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'product',
    price: '',
    maxWidth: '',
    description: '',
    image: '',
  });

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading calculator components...');
      const response = await calculatorComponentsApi.getAll();
      console.log('✅ Components loaded:', response);

      if (response.success) {
        setComponents(response.data);
      }
    } catch (error: any) {
      console.error('❌ Error loading components:', error);
      toast.error('Gagal memuat komponen: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (component?: any) => {
    if (component) {
      setEditingComponent(component);
      setFormData({
        name: component.name,
        type: component.type,
        price: component.price.toString(),
        maxWidth: component.maxWidth?.toString() || '',
        description: component.description || '',
        image: component.image || '',
      });
    } else {
      setEditingComponent(null);
      setFormData({
        name: '',
        type: 'product',
        price: '',
        maxWidth: '',
        description: '',
        image: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingComponent(null);
    setFormData({
      name: '',
      type: 'product',
      price: '',
      maxWidth: '',
      description: '',
      image: '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.type || !formData.price) {
        toast.error('Nama, tipe, dan harga wajib diisi');
        return;
      }

      const componentData = {
        name: formData.name,
        type: formData.type,
        price: parseFloat(formData.price),
        maxWidth: formData.maxWidth ? parseFloat(formData.maxWidth) : undefined,
        description: formData.description,
        image: formData.image,
      };

      if (editingComponent) {
        console.log('📝 Updating component:', editingComponent.id);
        await calculatorComponentsApi.update(editingComponent.id, componentData);
        toast.success('Komponen berhasil diperbarui!');
      } else {
        console.log('➕ Creating new component');
        await calculatorComponentsApi.create(componentData);
        toast.success('Komponen berhasil ditambahkan!');
      }

      handleCloseDialog();
      loadComponents();
    } catch (error: any) {
      console.error('❌ Error saving component:', error);
      toast.error('Gagal menyimpan komponen: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus komponen ini?')) {
      return;
    }

    try {
      console.log('🗑️ Deleting component:', id);
      await calculatorComponentsApi.delete(id);
      toast.success('Komponen berhasil dihapus!');
      loadComponents();
    } catch (error: any) {
      console.error('❌ Error deleting component:', error);
      toast.error('Gagal menghapus komponen: ' + error.message);
    }
  };

  const handleSeedData = async () => {
    if (!confirm('Ini akan menambahkan data contoh komponen kalkulator. Lanjutkan?')) {
      return;
    }

    const seedComponents = [
      // Products
      { name: 'Gorden Blackout Premium', type: 'product', price: 125000, image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400', description: 'Kain gorden blackout berkualitas premium' },
      { name: 'Gorden Sheer Elegant', type: 'product', price: 95000, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400', description: 'Gorden sheer tipis dan elegan' },
      { name: 'Gorden Dimout Modern', type: 'product', price: 110000, image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400', description: 'Gorden dimout modern' },

      // Rel Gorden
      { name: 'Rel Single Track Basic', type: 'relGorden', price: 65000, maxWidth: 300, description: 'Untuk lebar hingga 3m', image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400' },
      { name: 'Rel Single Track Premium', type: 'relGorden', price: 95000, maxWidth: 400, description: 'Untuk lebar hingga 4m', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400' },
      { name: 'Rel Double Track Standard', type: 'relGorden', price: 125000, maxWidth: 300, description: 'Untuk lebar hingga 3m', image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400' },

      // Tassel
      { name: 'Tassel Basic Polos', type: 'tassel', price: 25000, description: 'Simple & minimalis', image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400' },
      { name: 'Tassel Elegant Bordir', type: 'tassel', price: 45000, description: 'Dengan detail bordir', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400' },

      // Hook
      { name: 'Hook Plastik Standard', type: 'hook', price: 2500, description: 'Ekonomis & kuat', image: 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=400' },
      { name: 'Hook Metal Chrome', type: 'hook', price: 4500, description: 'Tahan lama, finishing chrome', image: 'https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=400' },

      // Kain Vitrase
      { name: 'Vitrase Sheer Polos', type: 'kainVitrase', price: 45000, description: 'Tipis & transparan', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400' },
      { name: 'Vitrase Emboss Pattern', type: 'kainVitrase', price: 65000, description: 'Dengan motif emboss', image: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400' },

      // Rel Vitrase
      { name: 'Rel Vitrase Slim Basic', type: 'relVitrase', price: 55000, maxWidth: 300, description: 'Untuk lebar hingga 3m', image: 'https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=400' },
      { name: 'Rel Vitrase Standard', type: 'relVitrase', price: 75000, maxWidth: 400, description: 'Untuk lebar hingga 4m', image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400' },
    ];

    try {
      console.log('🌱 Seeding calculator components...');
      await calculatorComponentsApi.bulkCreate(seedComponents);
      toast.success('Data contoh berhasil ditambahkan!');
      loadComponents();
    } catch (error: any) {
      console.error('❌ Error seeding components:', error);
      toast.error('Gagal menambahkan data contoh: ' + error.message);
    }
  };

  // Flatten and filter components - Now it's already flat
  const getAllComponents = () => {
    return Array.isArray(components) ? components : [];
  };

  const filteredComponents = getAllComponents()
    .filter((comp) => {
      const matchType = selectedType === 'all' || comp.type === selectedType;
      const matchSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchSearch;
    });

  const getTotalComponents = () => {
    return Array.isArray(components) ? components.length : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#EB216A] mb-4"></div>
          <p className="text-gray-600">Loading components...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl text-gray-900">Komponen Kalkulator</h1>
          <p className="text-gray-600 mt-1">Kelola harga dan komponen untuk kalkulator gorden</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSeedData}
            variant="outline"
            className="border-gray-300"
          >
            <Upload className="w-4 h-4 mr-2" />
            Seed Data
          </Button>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Komponen
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Komponen</p>
              <p className="text-2xl text-gray-900 mt-1">{getTotalComponents()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Produk Gorden</p>
              <p className="text-2xl text-gray-900 mt-1">
                {Array.isArray(components) ? components.filter(c => c.type === 'product').length : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Komponen Lain</p>
              <p className="text-2xl text-gray-900 mt-1">
                {Array.isArray(components) ? components.filter(c => c.type !== 'product').length : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Box className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari komponen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                {componentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredComponents.map((component) => (
          <div
            key={component.id}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Image */}
            {component.image && (
              <div className="h-40 bg-gray-100">
                <img
                  src={component.image}
                  alt={component.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <Badge className="bg-purple-100 text-purple-700 border-0 mb-2">
                    {componentTypes.find(t => t.value === component.type)?.label}
                  </Badge>
                  <h3 className="text-lg text-gray-900">{component.name}</h3>
                </div>
              </div>

              {component.description && (
                <p className="text-sm text-gray-600 mb-3">{component.description}</p>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[#EB216A]">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-lg">Rp {component.price.toLocaleString('id-ID')}</span>
                </div>
                {component.maxWidth && (
                  <Badge variant="outline" className="text-xs">
                    Max: {component.maxWidth}cm
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleOpenDialog(component)}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(component.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredComponents.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg text-gray-900 mb-2">Tidak ada komponen</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedType !== 'all'
              ? 'Coba ubah filter atau pencarian Anda'
              : 'Mulai dengan menambahkan komponen baru'}
          </p>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Komponen
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingComponent ? 'Edit Komponen' : 'Tambah Komponen Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingComponent
                ? 'Perbarui informasi komponen kalkulator'
                : 'Tambahkan komponen baru untuk kalkulator gorden'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="type">Tipe Komponen *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  {componentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="name">Nama Komponen *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Rel Single Track Basic"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Harga (Rp) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="125000"
                />
              </div>
              <div>
                <Label htmlFor="maxWidth">Lebar Maksimal (cm)</Label>
                <Input
                  id="maxWidth"
                  type="number"
                  value={formData.maxWidth}
                  onChange={(e) => setFormData({ ...formData, maxWidth: e.target.value })}
                  placeholder="300"
                />
                <p className="text-xs text-gray-500 mt-1">Opsional, untuk rel saja</p>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi singkat komponen..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image">URL Gambar</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://..."
              />
              {formData.image && (
                <div className="mt-2">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
            >
              {editingComponent ? 'Simpan Perubahan' : 'Tambah Komponen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
