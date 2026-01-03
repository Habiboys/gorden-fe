import {
  Copy,
  Edit,
  Eye,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
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
import { useConfirm } from '../../context/ConfirmContext';
import { categoriesApi, productsApi, productVariantsApi, subcategoriesApi, uploadApi } from '../../utils/api';
import { exportToCSV } from '../../utils/exportHelper';
import { getProductImagesArray, getProductImageUrl, safelyParseImages } from '../../utils/imageHelper';

// Detail Modal Component with variants display
function DetailModalContent({ product, onClose }: { product: any; onClose: () => void }) {
  const [variants, setVariants] = useState<any[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(true);

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        const res = await productVariantsApi.getByProduct(product.id);
        setVariants(res.data || []);
      } catch (err) {
        console.error('Error fetching variants:', err);
      } finally {
        setLoadingVariants(false);
      }
    };
    fetchVariants();
  }, [product.id]);

  // Group variants by attribute_name
  const groupedVariants: Record<string, any[]> = {};
  variants.forEach((v) => {
    const attrName = v.attribute_name || 'Varian';
    if (!groupedVariants[attrName]) {
      groupedVariants[attrName] = [];
    }
    groupedVariants[attrName].push(v);
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl text-gray-900">Detail Produk</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <img
                src={safelyParseImages(product.images)[0] || product.image || 'https://images.unsplash.com/photo-1684261556324-a09b2cdf68b1?w=100'}
                alt={product.name}
                className="w-full h-64 object-cover rounded-xl"
              />
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-600">Nama Produk</Label>
                <p className="text-lg text-gray-900">{product.name}</p>
              </div>
              <div>
                <Label className="text-gray-600">SKU</Label>
                <p className="text-gray-900">{product.sku}</p>
              </div>
              <div>
                <Label className="text-gray-600">Kategori</Label>
                <p className="text-gray-900">{product.Category?.name || '-'} {product.SubCategory?.name ? `/ ${product.SubCategory.name}` : ''}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {product.is_featured && <Badge className="bg-purple-100 text-purple-700">Featured</Badge>}
                {product.is_new_arrival && <Badge className="bg-green-100 text-green-700">New Arrival</Badge>}
                {product.is_best_seller && <Badge className="bg-orange-100 text-orange-700">Best Seller</Badge>}
                {product.is_warranty && <Badge className="bg-blue-100 text-blue-700">Garansi 1 Tahun</Badge>}
                {product.is_custom && <Badge className="bg-pink-100 text-pink-700">Gorden Custom</Badge>}
              </div>
            </div>
          </div>

          {/* Varian */}
          <div>
            <Label className="text-gray-600">Varian ({variants.length})</Label>
            {loadingVariants ? (
              <p className="text-gray-500 text-sm mt-2">Memuat varian...</p>
            ) : variants.length === 0 ? (
              <p className="text-gray-500 text-sm mt-2">Tidak ada varian</p>
            ) : (
              <div className="mt-3 space-y-4">
                {Object.entries(groupedVariants).map(([attrName, variantList]) => (
                  <div key={attrName}>
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded mb-2">{attrName}</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {variantList.map((v: any) => (
                        <div key={v.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <p className="font-medium text-gray-900">{v.attribute_value}</p>
                          <div className="text-xs text-gray-500 mt-1">
                            {v.price_gross > 0 && <span>Gross: Rp {Number(v.price_gross).toLocaleString('id-ID')}</span>}
                            {v.price_net > 0 && <span className="ml-2 text-[#EB216A]">Net: Rp {Number(v.price_net).toLocaleString('id-ID')}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {product.description && (
            <div>
              <Label className="text-gray-600">Deskripsi</Label>
              <p className="text-gray-900 mt-2">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [selectedSubcategoryHasMaxLength, setSelectedSubcategoryHasMaxLength] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirm } = useConfirm();
  const navigate = useNavigate();

  // Variants state
  const [variants, setVariants] = useState<any[]>([]);
  const [pendingVariants, setPendingVariants] = useState<any[]>([]); // For inline creation before save
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<any>(null);
  const [editingPendingIndex, setEditingPendingIndex] = useState<number | null>(null);
  const [variantForm, setVariantForm] = useState({
    attribute_name: '',
    attribute_value: '',
    price_gross: 0,
    price_net: 0,
  });

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    subcategory: '',
    stock: 0,
    status: 'active',
    priceSelfMeasure: 0,
    priceSelfMeasureInstall: 0,
    priceMeasureInstall: 0,
    minWidth: null as number | null,
    maxWidth: null as number | null,
    minLength: null as number | null,
    maxLength: null as number | null,
    description: '',
    information: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    featured: false,
    newArrival: false,
    bestSeller: false,
    sibak: 0, // Added Sibak field
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('🔄 Fetching products from backend...');
        const response = await productsApi.getProducts();
        console.log('✅ Products fetched:', response);
        setProducts(response.data || []);
        setFilteredProducts(response.data || []);
      } catch (error) {
        console.error('❌ Error fetching products:', error);
        toast.error('Gagal memuat produk dari backend. Silakan cek console untuk detail error.');
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        console.log('🔄 Fetching categories from backend...');
        const response = await categoriesApi.getCategories();
        console.log('✅ Categories fetched:', response);
        setCategories(response.data || []);
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
      }
    };

    fetchProducts();
    fetchCategories();
  }, []);

  // Filter products when search or filters change
  useEffect(() => {
    let filtered = products;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.Category?.name === categoryFilter);
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter);
    }

    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, statusFilter, products]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const response = await uploadApi.uploadMultiple(fileArray);

      if (response.success) {
        // Use the robust helper to parse whatever backend sends
        const newImages = safelyParseImages(response.data.urls || response.data);

        if (newImages.length > 0) {
          setUploadedImages(prev => [...prev, ...newImages]);
          toast.success(`${newImages.length} gambar berhasil diupload!`);
        } else {
          console.error('Parsed 0 images from:', response);
          toast.error('Gagal memproses respon gambar.');
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal upload gambar. Silakan coba lagi.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };



  const handleDuplicateProduct = async (id: string) => {
    const ok = await confirm({
      title: 'Duplikat Produk',
      description: 'Apakah Anda yakin ingin menduplikasi produk ini beserta semua variannya?',
      confirmText: 'Duplikat',
      cancelText: 'Batal'
    });

    if (!ok) return;

    setLoading(true); // Show loading on table
    try {
      const response = await productsApi.duplicate(id);
      if (response.success) {
        toast.success(`Produk "${response.data.name}" berhasil dibuat`);
        // Refresh list
        const res = await productsApi.getProducts();
        setProducts(res.data || []);
        setFilteredProducts(res.data || []);
      }
    } catch (error) {
      console.error('Error duplicating product:', error);
      toast.error('Gagal menduplikasi produk');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setModalMode('add');
    setFormData({
      name: '',
      sku: '',
      category: '',
      subcategory: '',
      stock: 0,
      status: 'active',
      priceSelfMeasure: 0,
      priceSelfMeasureInstall: 0,
      priceMeasureInstall: 0,
      minWidth: null,
      maxWidth: null,
      minLength: null,
      maxLength: null,
      description: '',
      information: '',
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
      featured: false,
      newArrival: false,
      bestSeller: false,
      sibak: 0,
    });
    setUploadedImages([]);
    setSubcategories([]);
    setSelectedSubcategoryHasMaxLength(false);
    setActiveTab('basic');
    setIsProductModalOpen(true);
  };

  const handleEdit = async (product: any) => {
    setModalMode('edit');
    setSelectedProduct(product);

    // Fetch subcategories for the product's category
    if (product.Category?.id) {
      try {
        const response = await subcategoriesApi.getSubCategories(product.Category.id);
        setSubcategories(response.data || []);
      } catch (error) {
        console.error('Error fetching subcategories:', error);
        setSubcategories([]);
      }
    }

    // Check if subcategory has max_length
    const hasMaxLength = product.SubCategory?.has_max_length || false;
    setSelectedSubcategoryHasMaxLength(hasMaxLength);

    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      category: product.Category?.name || '',
      subcategory: product.SubCategory?.name || '',
      stock: product.stock || 0,
      status: product.status === 'ACTIVE' ? 'active' : 'inactive',
      priceSelfMeasure: product.price_self_measure || 0,
      priceSelfMeasureInstall: product.price_self_measure_install || 0,
      priceMeasureInstall: product.price_measure_install || 0,
      minWidth: product.min_width || null,
      maxWidth: product.max_width || null,
      minLength: product.min_length || null,
      maxLength: product.max_length || null,
      description: product.description || '',
      information: product.information || '',
      metaTitle: product.meta_title || '',
      metaDescription: product.meta_description || '',
      metaKeywords: product.meta_keywords || '',
      featured: product.is_featured || false,
      newArrival: product.is_new_arrival || false,
      bestSeller: product.is_best_seller || false,
      sibak: product.sibak || 0,
    });
    const parsedImages = safelyParseImages(product.images);
    console.log('Edit product:', product.name, 'Raw images:', product.images, 'Parsed:', parsedImages);
    setUploadedImages(parsedImages);
    setActiveTab('basic');
    setIsProductModalOpen(true);

    // Load variants for this product
    setLoadingVariants(true);
    try {
      const variantsRes = await productVariantsApi.getByProduct(product.id);
      setVariants(variantsRes.data || []);
    } catch (error) {
      console.error('Error loading variants:', error);
      setVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sku || !formData.category) {
      toast.error('Nama, SKU, dan Kategori harus diisi!');
      return;
    }

    setSaving(true);
    try {
      // Find category ID
      const selectedCategory = categories.find(c => c.name === formData.category);
      if (!selectedCategory) {
        toast.error('Kategori tidak valid');
        setSaving(false);
        return;
      }

      // Find subcategory ID if selected
      const selectedSubcategory = subcategories.find(s => s.name === formData.subcategory);

      const productData: any = {
        name: formData.name,
        sku: formData.sku,
        category_id: selectedCategory.id,
        subcategory_id: selectedSubcategory?.id || null,
        stock: formData.stock,
        status: formData.status === 'active' ? 'ACTIVE' : 'INACTIVE',
        price: formData.priceSelfMeasure, // Default price usually base price
        price_self_measure: formData.priceSelfMeasure,
        // Only include if value is greater than 0 (optional fields)
        price_self_measure_install: formData.priceSelfMeasureInstall || null,
        price_measure_install: formData.priceMeasureInstall || null,
        min_width: formData.minWidth || null,
        max_width: formData.maxWidth || null,
        min_length: formData.minLength || null,
        max_length: formData.maxLength || null,
        description: formData.description,
        information: formData.information,
        meta_title: formData.metaTitle,
        meta_description: formData.metaDescription,
        meta_keywords: formData.metaKeywords,
        is_featured: formData.featured,
        is_new_arrival: formData.newArrival,
        is_best_seller: formData.bestSeller,
        sibak: formData.sibak || null,
        images: uploadedImages,
      };

      if (modalMode === 'add') {
        const newProductRes = await productsApi.create(productData);
        const newProductId = newProductRes.data?.id || newProductRes.id;

        // Save pending variants if any
        if (pendingVariants.length > 0 && newProductId) {
          for (const pv of pendingVariants) {
            await productVariantsApi.create(newProductId, pv);
          }
          setPendingVariants([]);
        }

        toast.success('Produk berhasil ditambahkan!');
      } else {
        await productsApi.update(selectedProduct.id, productData);
        toast.success('Produk berhasil diupdate!');
      }

      // Refresh products list
      const response = await productsApi.getProducts();
      setProducts(response.data || response); // Handle if response is array or object
      setIsProductModalOpen(false);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error('Gagal menyimpan produk: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetail = (product: any) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };
  const handleDelete = async (productId: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Produk',
      description: 'Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'destructive',
    });

    if (isConfirmed) {
      try {
        await productsApi.delete(productId);
        toast.success('Produk berhasil dihapus!');
        // Refresh products list
        const response = await productsApi.getProducts();
        setProducts(response.data || response);
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Gagal menghapus produk!');
      }
    }
  };

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    const dataToExport = filteredProducts.map(prod => ({
      'ID': prod.id,
      'Nama Produk': prod.name,
      'SKU': prod.sku,
      'Kategori': prod.Category?.name || prod.category_id || 'Uncategorized',
      'Sub Kategori': prod.SubCategory?.name || '-',
      'Stok': prod.stock,
      'Status': prod.status,
      'Harga (Ukur Sendiri)': prod.price_self_measure || prod.price || 0,
      'Harga (Ukur + Pasang)': prod.price_self_measure_install || 0,
      'Harga (Ukur + Pasang Teknisi)': prod.price_measure_install || 0,
      'Dimensi Min': `${prod.min_width || '-'}x${prod.min_length || '-'}`,
      'Dimensi Max': `${prod.max_width || '-'}x${prod.max_length || '-'}`,
      'Deskripsi': prod.description || '-',
      'Meta Title': prod.meta_title || '-',
      'Featured': prod.is_featured ? 'Yes' : 'No',
      'Created At': prod.created_at || prod.createdAt
    }));

    exportToCSV(dataToExport, `products-catalog-${new Date().toISOString().split('T')[0]}`);
    toast.success('Katalog produk berhasil didownload');
  };

  const tabs = [
    { id: 'basic', label: 'Informasi Dasar' },
    { id: 'pricing', label: 'Harga & Layanan' },
    { id: 'description', label: 'Deskripsi & Info' },
    { id: 'seo', label: 'SEO & Meta' },
    { id: 'advanced', label: 'Pengaturan Lanjutan' },
    { id: 'variants', label: 'Varian Produk' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900">Produk</h1>
          <p className="text-gray-600 mt-1">Kelola semua produk Amagriya Gorden</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={handleExportCSV}
          >
            <Upload className="w-4 h-4 mr-2 rotate-180" /> {/* Reusing Upload icon rotated for Export/Download look if Download not imported? Download IS imported in other files but checked imports here... Upload is imported. Download is NOT. Use Upload rotated or add Download import. Let's add Download import later or reuse. Upload rotated 180 is basically Download. */}
            Export CSV
          </Button>
          <Button
            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
            onClick={() => navigate('/admin/products/add')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 border-gray-200">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari produk atau SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Non-aktif</SelectItem>
                <SelectItem value="out_of_stock">Habis</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Menampilkan {filteredProducts.length} dari {products.length} produk</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="h-6 px-2 text-xs"
              >
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Products Table */}
      <Card className="border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Produk</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">SKU</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Kategori</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Varian</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Stok</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Status</th>
                <th className="text-right px-6 py-4 text-sm text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    <p className="text-gray-600">Loading...</p>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <p className="text-gray-600">
                      {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all'
                        ? 'Tidak ada produk yang sesuai dengan filter'
                        : 'Belum ada produk'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getProductImageUrl(product.images)}
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
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {product.sku}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{product.Category?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        Lihat Detail
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{product.stock || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        (product.status === 'ACTIVE' || product.status === 'active')
                          ? 'bg-green-100 text-green-700 border-0'
                          : 'bg-red-100 text-red-700 border-0'
                      }>
                        {product.status === 'ACTIVE' || product.status === 'active' ? 'Aktif' : 'Habis/Nonaktif'}
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
                          <DropdownMenuItem onClick={() => handleDuplicateProduct(product.id)}>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplikat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewDetail(product)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/products/edit/${product.id}`)}>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl text-gray-900">
                  {modalMode === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {modalMode === 'add' ? 'Lengkapi semua informasi produk' : 'Update informasi produk'}
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-100 px-6">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.id
                      ? 'border-[#EB216A] text-[#EB216A]'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Nama Produk *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Masukkan nama produk"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU *</Label>
                      <Input
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="Contoh: GRD-4000-BLK"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Kategori *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={async (value: string) => {
                          setFormData({ ...formData, category: value, subcategory: '' });
                          setSelectedSubcategoryHasMaxLength(false);
                          // Fetch subcategories for selected category
                          const selectedCat = categories.find(c => c.name === value);
                          if (selectedCat) {
                            try {
                              const response = await subcategoriesApi.getSubCategories(selectedCat.id);
                              setSubcategories(response.data || []);
                            } catch (error) {
                              console.error('Error fetching subcategories:', error);
                              setSubcategories([]);
                            }
                          } else {
                            setSubcategories([]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sub Kategori</Label>
                      <Select
                        value={formData.subcategory}
                        onValueChange={(value: string) => {
                          setFormData({ ...formData, subcategory: value });
                          // Check if selected subcategory has max_length requirement
                          const selectedSub = subcategories.find(s => s.name === value);
                          setSelectedSubcategoryHasMaxLength(selectedSub?.has_max_length || false);
                        }}
                        disabled={!formData.category || subcategories.length === 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={!formData.category ? "Pilih kategori dulu" : subcategories.length === 0 ? "Tidak ada sub kategori" : "Pilih sub kategori"} />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategories.map((sub) => (
                            <SelectItem key={sub.id} value={sub.name}>
                              {sub.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label>Stok</Label>
                      <Input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: string) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Non-aktif</SelectItem>
                          <SelectItem value="out_of_stock">Habis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedSubcategoryHasMaxLength && (
                      <div className="space-y-2">
                        <Label>Panjang Maksimal (cm) <span className="text-gray-400 text-xs">(Opsional)</span></Label>
                        <Input
                          type="number"
                          value={formData.maxLength || ''}
                          onChange={(e) => setFormData({ ...formData, maxLength: parseFloat(e.target.value) || null })}
                          placeholder="Contoh: 300"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Panjang/Tinggi (cm)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={formData.minLength || ''}
                          onChange={(e) => setFormData({ ...formData, minLength: parseFloat(e.target.value) || null })}
                          placeholder="Min"
                        />
                        <span className="self-center">-</span>
                        <Input
                          type="number"
                          value={formData.maxLength || ''}
                          onChange={(e) => setFormData({ ...formData, maxLength: parseFloat(e.target.value) || null })}
                          placeholder="Max"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Lebar (cm)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={formData.minWidth || ''}
                          onChange={(e) => setFormData({ ...formData, minWidth: parseFloat(e.target.value) || null })}
                          placeholder="Min"
                        />
                        <span className="self-center">-</span>
                        <Input
                          type="number"
                          value={formData.maxWidth || ''}
                          onChange={(e) => setFormData({ ...formData, maxWidth: parseFloat(e.target.value) || null })}
                          placeholder="Max"
                        />
                      </div>
                    </div>

                    {/* Sibak Field - Added here */}
                    <div className="space-y-2">
                      <Label>Sibak (Multiplier)</Label>
                      <Input
                        type="number"
                        value={formData.sibak || ''}
                        onChange={(e) => setFormData({ ...formData, sibak: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500">
                        Multiplier (e.g. 2 for pair).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Gambar Produk</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#EB216A] transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-1">
                        {uploading ? 'Uploading...' : 'Click to upload atau drag & drop'}
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WEBP up to 5MB (Multiple files allowed)
                      </p>
                    </div>

                    {Array.isArray(uploadedImages) && uploadedImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mt-4">
                        {getProductImagesArray(uploadedImages).map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Info:</strong> Hanya harga "Ukur Sendiri" yang wajib diisi. Harga layanan teknisi bersifat opsional - kosongkan jika produk tidak menyediakan layanan tersebut.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base text-gray-900">Ukur Sendiri</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Customer mengukur sendiri dan memesan produk
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 border-0">Basic</Badge>
                      </div>
                      <div className="space-y-2">
                        <Label>Harga (per meter / unit) *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">Rp</span>
                          <Input
                            type="number"
                            value={formData.priceSelfMeasure}
                            onChange={(e) => setFormData({ ...formData, priceSelfMeasure: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base text-gray-900">Ukur Sendiri + Pasang Teknisi</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Customer mengukur, teknisi membantu pemasangan
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-0">Standard</Badge>
                      </div>
                      <div className="space-y-2">
                        <Label>Harga (per meter / unit) <span className="text-gray-400 text-xs">(Opsional)</span></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">Rp</span>
                          <Input
                            type="number"
                            value={formData.priceSelfMeasureInstall}
                            onChange={(e) => setFormData({ ...formData, priceSelfMeasureInstall: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-base text-gray-900">Ukur & Pasang Teknisi</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Teknisi mengukur dan memasang (Full Service)
                          </p>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700 border-0">Premium</Badge>
                      </div>
                      <div className="space-y-2">
                        <Label>Harga (per meter / unit) <span className="text-gray-400 text-xs">(Opsional)</span></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600">Rp</span>
                          <Input
                            type="number"
                            value={formData.priceMeasureInstall}
                            onChange={(e) => setFormData({ ...formData, priceMeasureInstall: parseInt(e.target.value) || 0 })}
                            placeholder="0"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <h4 className="text-sm text-gray-900 mb-3">Preview Harga</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ukur Sendiri:</span>
                        <span className="text-gray-900">Rp {formData.priceSelfMeasure.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ukur Sendiri + Pasang:</span>
                        <span className="text-gray-900">Rp {formData.priceSelfMeasureInstall.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ukur & Pasang:</span>
                        <span className="text-gray-900">Rp {formData.priceMeasureInstall.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Description Tab */}
              {activeTab === 'description' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Deskripsi Singkat</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Deskripsi singkat produk yang akan tampil di listing..."
                      rows={4}
                    />
                    <p className="text-xs text-gray-500">Max 200 karakter</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Informasi Lengkap Produk</Label>
                    <Textarea
                      value={formData.information}
                      onChange={(e) => setFormData({ ...formData, information: e.target.value })}
                      placeholder="Informasi detail produk, spesifikasi, material, cara perawatan, dll..."
                      rows={10}
                    />
                    <p className="text-xs text-gray-500">
                      Tulis informasi lengkap tentang produk. Gunakan line breaks untuk membuat paragraf baru.
                    </p>
                  </div>
                </div>
              )}

              {/* SEO Tab */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-sm text-purple-900">
                      <strong>Info SEO:</strong> Optimasi untuk search engine dan social media sharing. Jika kosong, akan menggunakan data default dari nama dan deskripsi produk.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Meta Title</Label>
                    <Input
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      placeholder="Judul untuk SEO (max 60 karakter)"
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500">
                      {formData.metaTitle.length}/60 karakter
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Meta Description</Label>
                    <Textarea
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      placeholder="Deskripsi untuk SEO (max 160 karakter)"
                      rows={3}
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500">
                      {formData.metaDescription.length}/160 karakter
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Meta Keywords</Label>
                    <Input
                      value={formData.metaKeywords}
                      onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                      placeholder="gorden, blackout, premium, luxury (pisahkan dengan koma)"
                    />
                    <p className="text-xs text-gray-500">
                      Pisahkan setiap keyword dengan koma
                    </p>
                  </div>

                  {/* SEO Preview */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <h4 className="text-sm text-gray-900 mb-3">Preview Google Search</h4>
                    <div className="space-y-2">
                      <p className="text-blue-600 text-lg">
                        {formData.metaTitle || formData.name || 'Nama Produk'}
                      </p>
                      <p className="text-green-700 text-xs">
                        amagriyagorden.com &gt; products &gt; {formData.sku?.toLowerCase() || 'sku'}
                      </p>
                      <p className="text-sm text-gray-700">
                        {formData.metaDescription || formData.description || 'Deskripsi produk akan tampil di sini...'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Settings Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-base text-gray-900">Pengaturan Tampilan</h3>

                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-900">Featured Product</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Tampilkan di section featured/unggulan
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EB216A]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-900">New Arrival</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Tampilkan badge "New" di produk
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.newArrival}
                          onChange={(e) => setFormData({ ...formData, newArrival: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EB216A]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                      <div>
                        <p className="text-sm text-gray-900">Best Seller</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Tampilkan badge "Best Seller" di produk
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.bestSeller}
                          onChange={(e) => setFormData({ ...formData, bestSeller: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EB216A]"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Variants Tab */}
              {activeTab === 'variants' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base text-gray-900">Varian Produk</h3>
                      <p className="text-sm text-gray-600">Kelola varian dengan atribut fleksibel (Layanan, Ukuran, Warna, dll)</p>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingVariant(null);
                        setEditingPendingIndex(null);
                        setVariantForm({ attribute_name: '', attribute_value: '', price_gross: 0, price_net: 0 });
                        setIsVariantModalOpen(true);
                      }}
                      className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Varian
                    </Button>
                  </div>

                  {/* Show pending variants (for add mode) */}
                  {modalMode === 'add' && pendingVariants.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <p className="text-sm text-blue-800 mb-2">Varian akan disimpan setelah produk disimpan:</p>
                      <div className="space-y-2">
                        {pendingVariants.map((pv, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg">
                            <div>
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mr-2">{pv.attribute_name}</span>
                              <span className="font-medium">{pv.attribute_value}</span>
                              <span className="text-gray-500 ml-3">Gross: Rp {Number(pv.price_gross).toLocaleString('id-ID')}</span>
                              <span className="text-gray-500 ml-2">Net: Rp {Number(pv.price_net).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingPendingIndex(idx);
                                setVariantForm(pv);
                                setIsVariantModalOpen(true);
                              }}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-red-600" onClick={() => {
                                setPendingVariants(prev => prev.filter((_, i) => i !== idx));
                              }}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {modalMode === 'add' && pendingVariants.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <p className="text-sm text-yellow-800">
                        Tambahkan varian di sini, akan disimpan bersamaan dengan produk.
                      </p>
                    </div>
                  )}

                  {/* Show existing variants for edit mode */}
                  {modalMode === 'edit' && (
                    loadingVariants ? (
                      <div className="text-center py-8"><p className="text-gray-600">Memuat varian...</p></div>
                    ) : variants.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <p className="text-gray-600">Belum ada varian untuk produk ini.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left">Atribut</th>
                              <th className="px-4 py-3 text-left">Nilai</th>
                              <th className="px-4 py-3 text-right">Harga Gross</th>
                              <th className="px-4 py-3 text-right">Harga Net</th>
                              <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {variants.map((v: any) => (
                              <tr key={v.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <span className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                                    {v.attribute_name || 'Varian'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-medium">{v.attribute_value || '-'}</td>
                                <td className="px-4 py-3 text-right">Rp {Number(v.price_gross || 0).toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right text-[#EB216A]">Rp {Number(v.price_net || 0).toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingVariant(v);
                                        setEditingPendingIndex(null);
                                        setVariantForm({
                                          attribute_name: v.attribute_name || '',
                                          attribute_value: v.attribute_value || '',
                                          price_gross: v.price_gross || 0,
                                          price_net: v.price_net || 0,
                                        });
                                        setIsVariantModalOpen(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600"
                                      onClick={async () => {
                                        const ok = await confirm({
                                          title: 'Hapus Varian',
                                          description: 'Yakin ingin menghapus varian ini?',
                                          confirmText: 'Hapus',
                                          cancelText: 'Batal',
                                          variant: 'destructive',
                                        });
                                        if (ok) {
                                          try {
                                            await productVariantsApi.delete(v.id);
                                            toast.success('Varian berhasil dihapus');
                                            const res = await productVariantsApi.getByProduct(selectedProduct.id);
                                            setVariants(res.data || []);
                                          } catch (err) {
                                            toast.error('Gagal menghapus varian');
                                          }
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setIsProductModalOpen(false)}
                className="border-gray-300"
              >
                Batal
              </Button>
              <Button
                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Menyimpan...' : (modalMode === 'add' ? 'Tambah Produk' : 'Update Produk')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedProduct && (
        <DetailModalContent
          product={selectedProduct}
          onClose={() => setIsDetailModalOpen(false)}
        />
      )}

      {/* Variant Form Modal */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg text-gray-900">
                {editingVariant ? 'Edit Varian' : (editingPendingIndex !== null ? 'Edit Varian (Pending)' : 'Tambah Varian Baru')}
              </h3>
              <button onClick={() => setIsVariantModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Nama Atribut *</Label>
                <Input
                  value={variantForm.attribute_name}
                  onChange={(e) => setVariantForm({ ...variantForm, attribute_name: e.target.value })}
                  placeholder="Contoh: Layanan, Ukuran, Warna"
                />
                <p className="text-xs text-gray-500 mt-1">Nama kategori varian (e.g., Layanan, Ukuran, Warna)</p>
              </div>

              <div>
                <Label>Nilai Atribut *</Label>
                <Input
                  value={variantForm.attribute_value}
                  onChange={(e) => setVariantForm({ ...variantForm, attribute_value: e.target.value })}
                  placeholder="Contoh: Ukur Pasang Sendiri, 60x210, Merah"
                />
                <p className="text-xs text-gray-500 mt-1">Nilai spesifik dari atribut</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Harga Gross (Rp)</Label>
                  <Input
                    type="number"
                    value={variantForm.price_gross}
                    onChange={(e) => setVariantForm({ ...variantForm, price_gross: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label>Harga Net (Rp)</Label>
                  <Input
                    type="number"
                    value={variantForm.price_net}
                    onChange={(e) => setVariantForm({ ...variantForm, price_net: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setIsVariantModalOpen(false)}>
                Batal
              </Button>
              <Button
                className="flex-1 bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                onClick={async () => {
                  if (!variantForm.attribute_name || !variantForm.attribute_value) {
                    toast.error('Nama Atribut dan Nilai Atribut wajib diisi!');
                    return;
                  }

                  try {
                    if (modalMode === 'add') {
                      // Add to pending variants for new product
                      if (editingPendingIndex !== null) {
                        // Edit existing pending variant
                        setPendingVariants(prev => prev.map((pv, idx) =>
                          idx === editingPendingIndex ? variantForm : pv
                        ));
                      } else {
                        // Add new pending variant
                        setPendingVariants(prev => [...prev, variantForm]);
                      }
                      toast.success('Varian ditambahkan');
                      setIsVariantModalOpen(false);
                    } else {
                      // Save to API for existing product
                      if (editingVariant) {
                        await productVariantsApi.update(editingVariant.id, variantForm);
                        toast.success('Varian berhasil diupdate');
                      } else {
                        await productVariantsApi.create(selectedProduct.id, variantForm);
                        toast.success('Varian berhasil ditambahkan');
                      }
                      // Refresh variants
                      const res = await productVariantsApi.getByProduct(selectedProduct.id);
                      setVariants(res.data || []);
                      setIsVariantModalOpen(false);
                    }
                  } catch (error) {
                    console.error('Error saving variant:', error);
                    toast.error('Gagal menyimpan varian');
                  }
                }}
              >
                {editingVariant ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
