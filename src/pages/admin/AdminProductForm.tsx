import { ArrowLeft, Bold, Check, Image as ImageIcon, Italic, List, ListOrdered, Loader2, Underline, Upload, X } from 'lucide-react';
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
import { badgesApi, categoriesApi, productsApi, productVariantsApi, subcategoriesApi, uploadApi } from '../../utils/api';
import { getProductImagesArray, safelyParseImages } from '../../utils/imageHelper';
import UnifiedVariantManager from './UnifiedVariantManager';

const MAX_IMAGES = 7;

/**
 * Generate SKU from product name
 * Rules:
 * - Lowercase only
 * - No special/unique characters (only alphanumeric)
 * - Spaces replaced with dashes
 * - Multiple dashes reduced to single
 * - Trim leading/trailing dashes
 */
const generateSkuFromName = (name: string): string => {
    return name
        .toLowerCase() // Convert to lowercase
        .normalize('NFD') // Normalize unicode characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters, keep alphanumeric, spaces, and dashes
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .replace(/-+/g, '-') // Replace multiple dashes with single dash
        .replace(/^-|-$/g, ''); // Trim leading/trailing dashes
};

export default function AdminProductForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    // Rich Text Editor State
    const informationEditorRef = useRef<HTMLDivElement>(null);
    const contentImageInputRef = useRef<HTMLInputElement>(null);
    const savedSelection = useRef<Range | null>(null);
    const editorInitialized = useRef(false);
    const [uploadingContentImage, setUploadingContentImage] = useState(false);

    // Image size modal state
    const [showImageSizeModal, setShowImageSizeModal] = useState(false);
    const [pendingImageUrl, setPendingImageUrl] = useState('');
    const [imageSize, setImageSize] = useState('full');
    const [customWidth, setCustomWidth] = useState('');

    // Rich text editor helper functions
    const saveEditorSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            savedSelection.current = selection.getRangeAt(0).cloneRange();
        }
    };

    const restoreEditorSelection = () => {
        if (savedSelection.current && informationEditorRef.current) {
            informationEditorRef.current.focus();
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(savedSelection.current);
            }
        }
    };

    const execEditorCommand = (command: string, value?: string) => {
        if (informationEditorRef.current) {
            informationEditorRef.current.focus();
        }
        restoreEditorSelection();
        let finalValue = value;
        if (command === 'formatBlock' && value && !value.startsWith('<')) {
            finalValue = `<${value}>`;
        }
        document.execCommand(command, false, finalValue);
        updateInformationContent();
    };

    const updateInformationContent = () => {
        if (informationEditorRef.current) {
            setFormData(prev => ({ ...prev, information: informationEditorRef.current!.innerHTML }));
        }
    };

    const insertLink = () => {
        if (informationEditorRef.current) {
            informationEditorRef.current.focus();
        }
        restoreEditorSelection();
        const url = prompt('Masukkan URL:');
        if (url) {
            document.execCommand('createLink', false, url);
            updateInformationContent();
        }
    };

    // Insert image with selected size
    const insertImageWithSize = () => {
        if (!pendingImageUrl || !informationEditorRef.current) return;

        const img = document.createElement('img');
        img.src = pendingImageUrl;
        img.alt = 'Image';

        let inlineStyle = '';
        switch (imageSize) {
            case 'small':
                inlineStyle = 'width: 25%; max-width: 200px;';
                break;
            case 'medium':
                inlineStyle = 'width: 50%; max-width: 400px;';
                break;
            case 'full':
                inlineStyle = 'width: 100%;';
                break;
            case 'custom':
                if (customWidth) {
                    inlineStyle = `width: ${customWidth}px; max-width: 100%;`;
                }
                break;
        }

        img.className = 'h-auto rounded-lg my-4';
        img.style.cssText = inlineStyle + ' height: auto; display: block;';

        informationEditorRef.current.focus();
        try {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                if (informationEditorRef.current.contains(range.commonAncestorContainer)) {
                    range.deleteContents();
                    range.insertNode(img);
                    range.setStartAfter(img);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else {
                    informationEditorRef.current.appendChild(document.createElement('br'));
                    informationEditorRef.current.appendChild(img);
                }
            } else {
                informationEditorRef.current.appendChild(document.createElement('br'));
                informationEditorRef.current.appendChild(img);
            }
        } catch {
            informationEditorRef.current.appendChild(document.createElement('br'));
            informationEditorRef.current.appendChild(img);
        }

        updateInformationContent();
        setShowImageSizeModal(false);
        setPendingImageUrl('');
        toast.success('Gambar ditambahkan');
    };

    const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingContentImage(true);
            const response = await uploadApi.uploadFile(file);
            if (response.success) {
                // Show size selection dialog
                setPendingImageUrl(response.data.url);
                setImageSize('full');
                setCustomWidth('');
                setShowImageSizeModal(true);
            }
        } catch (error: any) {
            toast.error('Gagal upload gambar: ' + error.message);
        } finally {
            setUploadingContentImage(false);
            if (e.target) e.target.value = '';
        }
    };

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

    const [allBadges, setAllBadges] = useState<any[]>([]);
    const [selectedBadgeIds, setSelectedBadgeIds] = useState<number[]>([]);

    useEffect(() => {
        badgesApi.getAll().then(res => setAllBadges(res.data)).catch(console.error);
    }, []);

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

    // Initialize editor content only once after data loads (prevents cursor jump)
    useEffect(() => {
        if (informationEditorRef.current && formData.information && !editorInitialized.current) {
            informationEditorRef.current.innerHTML = formData.information;
            editorInitialized.current = true;
        }
    }, [formData.information]);

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

            if (product.badges) {
                setSelectedBadgeIds(product.badges.map((b: any) => b.id));
            }

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
        if (!formData.name || !formData.category) {
            toast.error('Nama dan Kategori harus diisi!');
            return;
        }
        // Auto-generate SKU if empty (ensures SKU is always set)
        const finalSku = formData.sku || generateSkuFromName(formData.name);
        setSaving(true);
        try {
            const productData = {
                name: formData.name,
                sku: finalSku,
                category_id: parseInt(formData.category),
                subcategory_id: formData.subcategory ? parseInt(formData.subcategory) : null,
                stock: formData.stock,
                status: formData.status === 'active' ? 'ACTIVE' : 'INACTIVE',
                description: formData.description,
                information: formData.information,
                meta_title: formData.metaTitle,
                meta_description: formData.metaDescription,
                meta_keywords: formData.metaKeywords,
                images: uploadedImages,
                badgeIds: selectedBadgeIds,
                // Sync legacy flags based on selected badges
                is_featured: selectedBadgeIds.some(id => allBadges.find(b => b.id === id)?.label === 'Featured'),
                is_new_arrival: selectedBadgeIds.some(id => allBadges.find(b => b.id === id)?.label === 'New Arrival'),
                is_best_seller: selectedBadgeIds.some(id => allBadges.find(b => b.id === id)?.label === 'Best Seller'),
                is_warranty: selectedBadgeIds.some(id => allBadges.find(b => b.id === id)?.label === 'Garansi 1 Tahun'),
                is_custom: selectedBadgeIds.some(id => allBadges.find(b => b.id === id)?.label === 'Gorden Custom'),
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
                                onChange={(e) => {
                                    const newName = e.target.value;
                                    const newSku = generateSkuFromName(newName);
                                    setFormData({ ...formData, name: newName, sku: newSku });
                                }}
                                placeholder="Masukkan nama produk"
                            />
                        </div>
                        <div>
                            <Label>SKU <span className="text-xs text-gray-500 font-normal">(bisa diedit)</span></Label>
                            <Input
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                placeholder="SKU Produk"
                            />
                            <p className="text-xs text-gray-500 mt-1">SKU dibuat otomatis dari nama, tapi bisa diubah manual</p>
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
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
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
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            {idx === 0 && (
                                <span className="absolute bottom-1 left-1 bg-[#EB216A] text-white text-[10px] px-1.5 py-0.5 rounded">
                                    Utama
                                </span>
                            )}
                        </div>
                    ))}
                    {/* Empty slots for remaining images */}
                    {Array.from({ length: Math.max(0, MAX_IMAGES - uploadedImages.length) }).map((_, idx) => (
                        <div
                            key={`empty-${idx}`}
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#EB216A] hover:bg-pink-50 transition-colors"
                        >
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-center text-gray-500">
                                {uploading ? '...' : 'Upload'}
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

                        {/* Rich Text Editor */}
                        <div className="border border-gray-300 rounded-lg overflow-hidden mt-1">
                            {/* Toolbar */}
                            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); execEditorCommand('bold'); }}
                                    className="p-2 hover:bg-white rounded transition-colors"
                                    title="Bold (Ctrl+B)"
                                >
                                    <Bold className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); execEditorCommand('italic'); }}
                                    className="p-2 hover:bg-white rounded transition-colors"
                                    title="Italic (Ctrl+I)"
                                >
                                    <Italic className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); execEditorCommand('underline'); }}
                                    className="p-2 hover:bg-white rounded transition-colors"
                                    title="Underline (Ctrl+U)"
                                >
                                    <Underline className="w-4 h-4" />
                                </button>

                                <div className="w-px h-6 bg-gray-300 mx-1" />

                                {/* Heading Select */}
                                <select
                                    onMouseDown={saveEditorSelection}
                                    onChange={(e) => {
                                        restoreEditorSelection();
                                        const value = e.target.value;
                                        if (value) {
                                            execEditorCommand('formatBlock', value);
                                        }
                                    }}
                                    defaultValue=""
                                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none"
                                    title="Format"
                                >
                                    <option value="" disabled>Format</option>
                                    <option value="p">Paragraph</option>
                                    <option value="h2">Heading 2</option>
                                    <option value="h3">Heading 3</option>
                                    <option value="h4">Heading 4</option>
                                </select>

                                <div className="w-px h-6 bg-gray-300 mx-1" />

                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); execEditorCommand('insertUnorderedList'); }}
                                    className="p-2 hover:bg-white rounded transition-colors"
                                    title="Bullet List"
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); execEditorCommand('insertOrderedList'); }}
                                    className="p-2 hover:bg-white rounded transition-colors"
                                    title="Numbered List"
                                >
                                    <ListOrdered className="w-4 h-4" />
                                </button>

                                <div className="w-px h-6 bg-gray-300 mx-1" />

                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={insertLink}
                                    className="p-2 hover:bg-white rounded transition-colors"
                                    title="Insert Link"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => contentImageInputRef.current?.click()}
                                    disabled={uploadingContentImage}
                                    className="p-2 hover:bg-white rounded transition-colors"
                                    title="Insert Image"
                                >
                                    {uploadingContentImage ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ImageIcon className="w-4 h-4" />
                                    )}
                                </button>
                                <input
                                    ref={contentImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleContentImageUpload}
                                    className="hidden"
                                />
                            </div>

                            {/* Editor Styles */}
                            <style>{`
                                .product-editor h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; line-height: 1.3; }
                                .product-editor h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25em; margin-bottom: 0.5em; line-height: 1.4; }
                                .product-editor h4 { font-size: 1.125rem; font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; }
                                .product-editor p { margin-bottom: 1em; line-height: 1.6; }
                                .product-editor ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
                                .product-editor ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
                                .product-editor blockquote { border-left: 4px solid #EB216A; padding-left: 1em; margin: 1em 0; font-style: italic; background-color: #FFF5F7; padding-top: 0.5em; padding-bottom: 0.5em; border-radius: 0 0.5em 0.5em 0; }
                                .product-editor a { color: #EB216A; text-decoration: underline; }
                                .product-editor img { max-width: 100%; height: auto; border-radius: 0.5em; margin: 1em 0; }
                                .product-editor strong { font-weight: 700; }
                                .product-editor em { font-style: italic; }
                            `}</style>

                            {/* ContentEditable Editor - NO dangerouslySetInnerHTML to prevent cursor jump */}
                            <div
                                ref={informationEditorRef}
                                contentEditable
                                suppressContentEditableWarning
                                onInput={updateInformationContent}
                                onMouseUp={saveEditorSelection}
                                onKeyUp={saveEditorSelection}
                                className="product-editor min-h-[200px] p-4 focus:outline-none bg-white text-gray-700"
                            />
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                            Gunakan toolbar untuk format teks, heading, link, dan menambah gambar.
                        </p>
                    </div>

                    {/* Image Size Modal */}
                    {showImageSizeModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
                                <h3 className="text-lg font-semibold mb-4">Ukuran Gambar</h3>
                                <div className="space-y-3">
                                    {[
                                        { value: 'small', label: 'Kecil (25%)', desc: 'Maks 200px' },
                                        { value: 'medium', label: 'Sedang (50%)', desc: 'Maks 400px' },
                                        { value: 'full', label: 'Penuh (100%)', desc: 'Lebar penuh' },
                                        { value: 'custom', label: 'Custom', desc: 'Atur sendiri' },
                                    ].map((opt) => (
                                        <label key={opt.value} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                            <input
                                                type="radio"
                                                name="imageSize"
                                                value={opt.value}
                                                checked={imageSize === opt.value}
                                                onChange={(e) => setImageSize(e.target.value)}
                                                className="w-4 h-4 text-pink-600"
                                            />
                                            <div>
                                                <div className="font-medium">{opt.label}</div>
                                                <div className="text-xs text-gray-500">{opt.desc}</div>
                                            </div>
                                        </label>
                                    ))}
                                    {imageSize === 'custom' && (
                                        <div className="flex items-center gap-2 ml-7">
                                            <input
                                                type="number"
                                                value={customWidth}
                                                onChange={(e) => setCustomWidth(e.target.value)}
                                                placeholder="Lebar (px)"
                                                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                            />
                                            <span className="text-sm text-gray-500">px</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => { setShowImageSizeModal(false); setPendingImageUrl(''); }}
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={insertImageWithSize}
                                        className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                                    >
                                        Sisipkan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {allBadges.map((badge) => {
                            const isSelected = selectedBadgeIds.includes(badge.id);
                            return (
                                <div
                                    key={badge.id}
                                    onClick={() => {
                                        if (isSelected) setSelectedBadgeIds(prev => prev.filter(id => id !== badge.id));
                                        else setSelectedBadgeIds(prev => [...prev, badge.id]);
                                    }}
                                    className={`cursor-pointer border rounded-lg p-3 transition-all relative ${isSelected ? 'border-[#EB216A] bg-pink-50 ring-1 ring-[#EB216A]' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-900">{badge.label}</span>
                                        {isSelected && <div className="bg-[#EB216A] rounded-full p-0.5"><Check className="w-3 h-3 text-white" /></div>}
                                    </div>
                                    <span
                                        className="text-[10px] px-2 py-0.5 rounded shadow-sm inline-block"
                                        style={{ backgroundColor: badge.bg_color, color: badge.text_color }}
                                    >
                                        Preview
                                    </span>
                                    <p className="text-xs text-gray-500 mt-2 capitalize">{badge.position.replace('-', ' ')}</p>
                                </div>
                            );
                        })}
                        {allBadges.length === 0 && (
                            <div className="col-span-full text-center py-4 text-gray-500 text-sm">
                                Belum ada badge tersedia. Silahkan buat di menu Badges.
                            </div>
                        )}
                    </div>
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
