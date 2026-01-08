import { ArrowLeft, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
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
import { categoriesApi, productsApi, productVariantsApi, subcategoriesApi, uploadApi } from '../../utils/api';
import { getProductImagesArray, safelyParseImages } from '../../utils/imageHelper';
import UnifiedVariantManager from './UnifiedVariantManager';

const MAX_IMAGES = 4;

export default function AdminProductForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Unified Variant State
    const [generatedVariants, setGeneratedVariants] = useState<any[]>([]);
    const [variantOptions, setVariantOptions] = useState<any[]>([]);

    // Legacy state can be removed or kept for transition if needed, but strictly we are replacing it.
    // cleaning up old modal states

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        subcategory: '',
        stock: 0,
        status: 'active',
        description: '',
        information: '',
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        featured: false,
        newArrival: false,
        bestSeller: false,
        warranty: false,
        custom: false,
        variant_options: [] as any[],
    });

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await categoriesApi.getCategories();
                setCategories(res.data || res || []);
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        if (isEditMode && id) loadProduct(id);
    }, [id, isEditMode]);

    const loadProduct = async (productId: string) => {
        setLoading(true);
        try {
            const res = await productsApi.getById(productId);
            const product = res.data || res;
            if (product.Category?.id) {
                const subRes = await subcategoriesApi.getSubCategories(product.Category.id);
                setSubcategories(subRes.data || []);
            }
            setFormData({
                name: product.name || '',
                sku: product.sku || '',
                category: product.Category?.id ? String(product.Category.id) : '',
                subcategory: product.SubCategory?.id ? String(product.SubCategory.id) : '',
                stock: product.stock || 0,
                status: product.status === 'ACTIVE' ? 'active' : 'inactive',
                description: product.description || '',
                information: product.information || '',
                metaTitle: product.meta_title || '',
                metaDescription: product.meta_description || '',
                metaKeywords: product.meta_keywords || '',
                featured: product.is_featured || false,
                newArrival: product.is_new_arrival || false,
                bestSeller: product.is_best_seller || false,
                warranty: product.is_warranty || false,
                custom: product.is_custom || false,
                variant_options: product.variant_options || [],
            });
            setUploadedImages(safelyParseImages(product.images));

            // Determine variant options from product or infer
            let loadedOptions = product.variant_options || [];
            if (typeof loadedOptions === 'string') {
                try {
                    loadedOptions = JSON.parse(loadedOptions);
                } catch (e) {
                    console.error('Failed to parse variant_options:', e);
                    loadedOptions = [];
                }
            }
            setVariantOptions(loadedOptions);
            loadVariants(productId, product);
        } catch (error) {
            console.error('Error loading product:', error);
            toast.error('Gagal memuat data produk');
        } finally {
            setLoading(false);
        }
    };

    const loadVariants = async (productId: string, productContext?: any) => {
        try {
            const res = await productVariantsApi.getByProduct(productId);
            const variantData = res.data || [];

            // Safe parse attributes if they are strings (handle potential double-stringification)
            const parsedVariants = variantData.map((v: any) => {
                let attrs = v.attributes;
                // Parse up to 2 times to handle double encoding
                if (typeof attrs === 'string') {
                    try { attrs = JSON.parse(attrs); } catch (e) { attrs = {}; }
                }
                if (typeof attrs === 'string') {
                    try { attrs = JSON.parse(attrs); } catch (e) { attrs = {}; }
                }
                return { ...v, attributes: attrs };
            });

            // Map legacy variants to new structure if needed
            if ((!productContext?.variant_options || productContext.variant_options.length === 0) && parsedVariants.length > 0) {
                // Try to infer options from first variant attributes
                if (parsedVariants[0].attributes) {
                    const inferredOptions = Object.keys(parsedVariants[0].attributes).map(key => ({
                        name: key,
                        values: [...new Set(parsedVariants.map((v: any) => v.attributes[key]))]
                    }));
                    setVariantOptions(inferredOptions);
                }
            }

            setGeneratedVariants(parsedVariants);
        } catch (error) {
            console.error('Error loading variants:', error);
        }
    };

    const handleCategoryChange = async (value: string) => {
        setFormData({ ...formData, category: value, subcategory: '' });

        if (value) {
            try {
                const categoryId = parseInt(value);
                const res = await subcategoriesApi.getSubCategories(categoryId);
                setSubcategories(res.data || []);
            } catch (error) {
                console.error('Error fetching subcategories:', error);
                setSubcategories([]);
            }
        } else {
            console.log('Category not found in list');
            setSubcategories([]);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = MAX_IMAGES - uploadedImages.length;
        if (remainingSlots <= 0) {
            toast.error(`Maksimal ${MAX_IMAGES} gambar`);
            return;
        }

        setUploading(true);
        try {
            const filesToUpload = Array.from(files).slice(0, remainingSlots);
            for (const file of filesToUpload) {
                const result = await uploadApi.uploadFile(file);
                // Check internal data structure or top level (fallback)
                const url = result.data?.url || result.url;
                if (url) setUploadedImages(prev => [...prev, url]);
            }
            toast.success('Gambar berhasil diupload!');
        } catch (error) {
            toast.error('Gagal mengupload gambar');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.sku || !formData.category) {
            toast.error('Nama, SKU, dan Kategori harus diisi!');
            return;
        }
        setSaving(true);
        try {
            const productData = {
                name: formData.name,
                sku: formData.sku,
                category_id: parseInt(formData.category),
                subcategory_id: formData.subcategory ? parseInt(formData.subcategory) : null,
                stock: formData.stock,
                status: formData.status === 'active' ? 'ACTIVE' : 'INACTIVE',
                description: formData.description,
                information: formData.information,
                meta_title: formData.metaTitle,
                meta_description: formData.metaDescription,
                meta_keywords: formData.metaKeywords,
                is_featured: formData.featured,
                is_new_arrival: formData.newArrival,
                is_best_seller: formData.bestSeller,
                is_warranty: formData.warranty,
                is_custom: formData.custom,
                variant_options: variantOptions,
                images: uploadedImages,
            };

            let productId = id;
            if (isEditMode && id) {
                await productsApi.update(id, productData);
                toast.success('Produk berhasil diupdate!');
            } else {
                const res = await productsApi.create(productData);
                productId = res.data.id || res.id;
                toast.success('Produk berhasil ditambahkan!');
            }

            // Save Variants (Bulk Create/Update logic)
            // Backend bulkCreate deletes all existing and creates new, so call it even if empty to sync
            if (productId) {
                // Filter out valid variants (must have attributes)
                const variantsToSave = generatedVariants.filter(v => Object.keys(v.attributes || {}).length > 0);
                // Always call bulkCreate to sync - if variantsToSave is empty, it will delete all existing variants
                await productVariantsApi.bulkCreate(productId, variantsToSave);
            }

            navigate('/admin/products');
        } catch (error: any) {
            // Extract error message from server response
            const serverMessage = error.response?.data?.message || error.message || 'Unknown error';
            toast.error(serverMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleVariantsUpdate = (newVariants: any[], newOptions: any[]) => {
        setGeneratedVariants(newVariants);
        setVariantOptions(newOptions);
    };



    if (loading)
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-600">Memuat data produk...</p>
            </div>
        );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        {isEditMode ? 'Edit Produk' : 'Tambah Produk Baru'}
                    </h1>
                    <p className="text-sm text-gray-600">
                        {isEditMode ? 'Update informasi produk' : 'Lengkapi semua informasi produk'}
                    </p>
                </div>
            </div>

            {/* Section: Informasi Dasar */}
            <Card className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Nama Produk *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Masukkan nama produk"
                            />
                        </div>
                        <div>
                            <Label>SKU *</Label>
                            <Input
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                placeholder="GRD-4000-BLK"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Kategori *</Label>
                            <Select value={formData.category} onValueChange={handleCategoryChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Sub Kategori</Label>
                            <Select
                                value={formData.subcategory}
                                onValueChange={(v: string) => setFormData({ ...formData, subcategory: v })}
                                disabled={!formData.category}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={
                                            !formData.category
                                                ? 'Pilih kategori dulu'
                                                : subcategories.length === 0
                                                    ? 'Tidak ada sub kategori'
                                                    : 'Pilih sub kategori'
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {subcategories.length === 0 ? (
                                        <SelectItem value="none" disabled>
                                            Tidak ada sub kategori tersedia
                                        </SelectItem>
                                    ) : (
                                        subcategories.map((sub) => (
                                            <SelectItem key={sub.id} value={String(sub.id)}>
                                                {sub.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Stok</Label>
                            <Input
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(v: string) => setFormData({ ...formData, status: v })}>
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
            </Card>

            {/* Section: Gambar Produk (4 Slot) */}
            <Card className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Gambar Produk</h2>
                <p className="text-sm text-gray-500 mb-4">Maksimal {MAX_IMAGES} gambar</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Render uploaded images */}
                    {getProductImagesArray(uploadedImages).map((img, idx) => (
                        <div key={idx} className="relative group aspect-square">
                            <img
                                src={img}
                                alt={`Product ${idx + 1}`}
                                className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                                onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {idx === 0 && (
                                <span className="absolute bottom-2 left-2 bg-[#EB216A] text-white text-xs px-2 py-1 rounded">
                                    Utama
                                </span>
                            )}
                        </div>
                    ))}
                    {/* Empty slots for remaining images */}
                    {Array.from({ length: MAX_IMAGES - uploadedImages.length }).map((_, idx) => (
                        <div
                            key={`empty-${idx}`}
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#EB216A] hover:bg-pink-50 transition-colors"
                        >
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-500">
                                {uploading ? 'Uploading...' : 'Upload'}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Section: Variasi */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">Variasi Produk</h2>
                        <p className="text-sm text-gray-600">
                            Kelola varian dengan atribut fleksibel (Layanan, Ukuran, Warna, dll)
                        </p>
                    </div>
                </div>

                {!isEditMode ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                            Simpan produk terlebih dahulu sebelum menambahkan varian.
                        </p>
                    </div>
                ) : (
                    <UnifiedVariantManager
                        variants={generatedVariants}
                        variantOptions={variantOptions}
                        onVariantsChange={handleVariantsUpdate}
                    />
                )}
            </Card>

            {/* Section: Deskripsi */}
            <Card className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Deskripsi & Informasi</h2>
                <div className="space-y-4">
                    <div>
                        <Label>Deskripsi Singkat</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Deskripsi singkat produk..."
                        />
                    </div>
                    <div>
                        <Label>Deskripsi Lengkap</Label>
                        <Textarea
                            value={formData.information}
                            onChange={(e) => setFormData({ ...formData, information: e.target.value })}
                            rows={6}
                            placeholder="Informasi detail produk..."
                        />
                    </div>
                </div>
            </Card>



            {/* Section: SEO & Meta */}
            <Card className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">SEO & Meta</h2>
                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <Label>Meta Title</Label>
                            <Input
                                value={formData.metaTitle}
                                onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                                maxLength={60}
                                placeholder="Judul halaman di hasil pencarian"
                            />
                            <div className="flex justify-between mt-1">
                                <p className="text-xs text-gray-500">Disarankan 50-60 karakter</p>
                                <p className={`text-xs ${formData.metaTitle.length > 60 ? 'text-red-500' : 'text-gray-500'}`}>
                                    {formData.metaTitle.length}/60
                                </p>
                            </div>
                        </div>
                        <div>
                            <Label>Meta Description</Label>
                            <Textarea
                                value={formData.metaDescription}
                                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                                rows={3}
                                maxLength={160}
                                placeholder="Deskripsi singkat yang muncul di hasil pencarian"
                            />
                            <div className="flex justify-between mt-1">
                                <p className="text-xs text-gray-500">Disarankan 150-160 karakter</p>
                                <p className={`text-xs ${formData.metaDescription.length > 160 ? 'text-red-500' : 'text-gray-500'}`}>
                                    {formData.metaDescription.length}/160
                                </p>
                            </div>
                        </div>
                        <div>
                            <Label>Meta Keywords</Label>
                            <Input
                                value={formData.metaKeywords}
                                onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                                placeholder="keyword1, keyword2, ..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Pisahkan dengan koma</p>
                        </div>
                    </div>

                    {/* Google Search Preview */}
                    <div>
                        <Label className="mb-4 block">Preview Google Search</Label>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm select-none">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center p-1">
                                    <img src="/logo.svg" alt="Icon" className="w-4 h-4 opacity-50" onError={(e) => (e.currentTarget.src = 'https://www.google.com/favicon.ico')} />
                                </div>
                                <div>
                                    <div className="text-xs text-gray-800 font-medium">Amagriya Gorden</div>
                                    <div className="text-[10px] text-gray-500">amagriyagorden.com {'>'} products {'>'} {formData.name ? formData.name.toLowerCase().replace(/ /g, '-') : 'nama-produk'}</div>
                                </div>
                            </div>
                            <h3 className="text-[#1a0dab] text-lg font-medium hover:underline cursor-pointer truncate leading-tight">
                                {formData.metaTitle || formData.name || 'Judul Produk'}
                            </h3>
                            <p className="text-sm text-[#4d5156] mt-1 line-clamp-2 leading-relaxed">
                                {formData.metaDescription || formData.description || 'Deskripsi produk akan tampil di sini...'}
                            </p>
                        </div>
                        <div className="mt-4 bg-blue-50 text-blue-800 p-3 rounded-md text-xs border border-blue-100">
                            <p>ℹ️ <strong>Tips SEO:</strong> Gunakan kata kunci yang relevan di judul dan deskripsi untuk meningkatkan visibilitas produk Anda di mesin pencari.</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Section: Pengaturan Lanjutan */}
            <Card className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Lanjutan</h2>
                <div className="space-y-3">
                    {[
                        { key: 'featured', label: 'Featured Product', desc: 'Tampil di section unggulan' },
                        { key: 'newArrival', label: 'New Arrival', desc: 'Tampilkan badge "New"' },
                        { key: 'bestSeller', label: 'Best Seller', desc: 'Tampilkan badge "Best Seller"' },
                        { key: 'warranty', label: 'Garansi 1 Tahun', desc: 'Produk memiliki garansi 1 tahun' },
                        { key: 'custom', label: 'Gorden Custom', desc: 'Produk bisa di-custom sesuai pesanan' },
                    ].map((item) => (
                        <div
                            key={item.key}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                                <p className="text-xs text-gray-600">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={(formData as any)[item.key]}
                                    onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EB216A]"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pb-8">
                <Button variant="outline" onClick={() => navigate('/admin/products')}>
                    Batal
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#EB216A] hover:bg-[#d11d5e] text-white px-8"
                >
                    {saving ? 'Menyimpan...' : isEditMode ? 'Update Produk' : 'Simpan Produk'}
                </Button>
            </div>
        </div >
    );
}
