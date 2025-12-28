import { ArrowLeft, Edit, Plus, Trash2, Upload, X } from 'lucide-react';
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
import { useConfirm } from '../../context/ConfirmContext';
import { categoriesApi, productsApi, productVariantsApi, subcategoriesApi, uploadApi } from '../../utils/api';
import { safelyParseImages } from '../../utils/imageHelper';

export default function AdminProductForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;
    const { confirm } = useConfirm();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Variants state
    const [variants, setVariants] = useState<any[]>([]);
    const [loadingVariants, setLoadingVariants] = useState(false);
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState<any>(null);
    const [variantForm, setVariantForm] = useState({
        width: 60, wave: 6, height: 210, sibak: 1, price: 0,
        recommended_min_width: 0, recommended_max_width: 0, recommended_height: 210,
    });

    // Form data
    const [formData, setFormData] = useState({
        name: '', sku: '', category: '', subcategory: '', stock: 0, status: 'active',
        priceSelfMeasure: 0, priceSelfMeasureInstall: 0, priceMeasureInstall: 0,
        minWidth: null as number | null, maxWidth: null as number | null,
        minLength: null as number | null, maxLength: null as number | null,
        description: '', information: '', metaTitle: '', metaDescription: '', metaKeywords: '',
        featured: false, newArrival: false, bestSeller: false, sibak: 0,
    });

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await categoriesApi.getCategories();
                setCategories(res.data || res || []);
            } catch (error) { console.error('Error loading categories:', error); }
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
                name: product.name || '', sku: product.sku || '',
                category: product.Category?.name || '', subcategory: product.SubCategory?.name || '',
                stock: product.stock || 0, status: product.status === 'ACTIVE' ? 'active' : 'inactive',
                priceSelfMeasure: product.price_self_measure || 0,
                priceSelfMeasureInstall: product.price_self_measure_install || 0,
                priceMeasureInstall: product.price_measure_install || 0,
                minWidth: product.min_width || null, maxWidth: product.max_width || null,
                minLength: product.min_length || null, maxLength: product.max_length || null,
                description: product.description || '', information: product.information || '',
                metaTitle: product.meta_title || '', metaDescription: product.meta_description || '',
                metaKeywords: product.meta_keywords || '',
                featured: product.is_featured || false, newArrival: product.is_new_arrival || false,
                bestSeller: product.is_best_seller || false, sibak: product.sibak || 0,
            });
            setUploadedImages(safelyParseImages(product.images));
            loadVariants(productId);
        } catch (error) {
            console.error('Error loading product:', error);
            toast.error('Gagal memuat data produk');
        } finally { setLoading(false); }
    };

    const loadVariants = async (productId: string) => {
        setLoadingVariants(true);
        try {
            const res = await productVariantsApi.getByProduct(productId);
            setVariants(res.data || []);
        } catch (error) { console.error('Error loading variants:', error); }
        finally { setLoadingVariants(false); }
    };

    const handleCategoryChange = async (value: string) => {
        setFormData({ ...formData, category: value, subcategory: '' });
        const selectedCat = categories.find(c => c.name === value);
        if (selectedCat) {
            try {
                const res = await subcategoriesApi.getSubCategories(selectedCat.id);
                setSubcategories(res.data || []);
            } catch (error) { setSubcategories([]); }
        } else { setSubcategories([]); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        try {
            for (const file of Array.from(files)) {
                const result = await uploadApi.uploadFile(file);
                if (result.url) setUploadedImages(prev => [...prev, result.url]);
            }
            toast.success('Gambar berhasil diupload!');
        } catch (error) { toast.error('Gagal mengupload gambar'); }
        finally { setUploading(false); }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.sku || !formData.category) {
            toast.error('Nama, SKU, dan Kategori harus diisi!');
            return;
        }
        setSaving(true);
        try {
            const selectedCategory = categories.find(c => c.name === formData.category);
            if (!selectedCategory) { toast.error('Kategori tidak valid'); setSaving(false); return; }
            const selectedSubcategory = subcategories.find(s => s.name === formData.subcategory);
            const productData = {
                name: formData.name, sku: formData.sku, category_id: selectedCategory.id,
                subcategory_id: selectedSubcategory?.id || null, stock: formData.stock,
                status: formData.status === 'active' ? 'ACTIVE' : 'INACTIVE',
                price: formData.priceSelfMeasure, price_self_measure: formData.priceSelfMeasure,
                price_self_measure_install: formData.priceSelfMeasureInstall || null,
                price_measure_install: formData.priceMeasureInstall || null,
                min_width: formData.minWidth, max_width: formData.maxWidth,
                min_length: formData.minLength, max_length: formData.maxLength,
                description: formData.description, information: formData.information,
                meta_title: formData.metaTitle, meta_description: formData.metaDescription,
                meta_keywords: formData.metaKeywords, is_featured: formData.featured,
                is_new_arrival: formData.newArrival, is_best_seller: formData.bestSeller,
                sibak: formData.sibak || null, images: uploadedImages,
            };
            if (isEditMode && id) {
                await productsApi.update(id, productData);
                toast.success('Produk berhasil diupdate!');
            } else {
                await productsApi.create(productData);
                toast.success('Produk berhasil ditambahkan!');
            }
            navigate('/admin/products');
        } catch (error: any) {
            toast.error('Gagal menyimpan produk: ' + (error.message || 'Unknown error'));
        } finally { setSaving(false); }
    };

    const handleOpenVariantModal = (variant?: any) => {
        if (variant) {
            setEditingVariant(variant);
            setVariantForm({
                width: variant.width, wave: variant.wave || 0, height: variant.height,
                sibak: variant.sibak, price: variant.price,
                recommended_min_width: variant.recommended_min_width || 0,
                recommended_max_width: variant.recommended_max_width || 0,
                recommended_height: variant.recommended_height || 0,
            });
        } else {
            setEditingVariant(null);
            setVariantForm({ width: 60, wave: 6, height: 210, sibak: 1, price: 0, recommended_min_width: 0, recommended_max_width: 0, recommended_height: 210 });
        }
        setIsVariantModalOpen(true);
    };

    const handleSaveVariant = async () => {
        if (!id) { toast.error('Simpan produk terlebih dahulu'); return; }
        try {
            if (editingVariant) {
                await productVariantsApi.update(editingVariant.id, variantForm);
                toast.success('Varian berhasil diupdate');
            } else {
                await productVariantsApi.create(id, variantForm);
                toast.success('Varian berhasil ditambahkan');
            }
            loadVariants(id);
            setIsVariantModalOpen(false);
        } catch (error) { toast.error('Gagal menyimpan varian'); }
    };

    const handleDeleteVariant = async (variantId: string) => {
        const ok = await confirm({ title: 'Hapus Varian', description: 'Yakin ingin menghapus varian ini?', confirmText: 'Hapus', cancelText: 'Batal', variant: 'destructive' });
        if (ok && id) {
            try {
                await productVariantsApi.delete(variantId);
                toast.success('Varian berhasil dihapus');
                loadVariants(id);
            } catch (error) { toast.error('Gagal menghapus varian'); }
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-600">Memuat data produk...</p></div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">{isEditMode ? 'Edit Produk' : 'Tambah Produk Baru'}</h1>
                    <p className="text-sm text-gray-600">{isEditMode ? 'Update informasi produk' : 'Lengkapi semua informasi produk'}</p>
                </div>
            </div>

            {/* Section: Informasi Dasar */}
            <Card className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Nama Produk *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Masukkan nama produk" /></div>
                        <div><Label>SKU *</Label><Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="GRD-4000-BLK" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Kategori *</Label>
                            <Select value={formData.category} onValueChange={handleCategoryChange}>
                                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                                <SelectContent>{categories.map((cat) => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div><Label>Sub Kategori</Label>
                            <Select value={formData.subcategory} onValueChange={(v) => setFormData({ ...formData, subcategory: v })} disabled={!formData.category || subcategories.length === 0}>
                                <SelectTrigger><SelectValue placeholder={!formData.category ? "Pilih kategori dulu" : "Pilih sub kategori"} /></SelectTrigger>
                                <SelectContent>{subcategories.map((sub) => <SelectItem key={sub.id} value={sub.name}>{sub.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><Label>Stok</Label><Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} /></div>
                        <div><Label>Status</Label>
                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="active">Aktif</SelectItem><SelectItem value="inactive">Non-aktif</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div><Label>Sibak</Label><Input type="number" value={formData.sibak || ''} onChange={(e) => setFormData({ ...formData, sibak: parseInt(e.target.value) || 0 })} placeholder="0" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><Label>Lebar (cm)</Label><div className="flex gap-2"><Input type="number" value={formData.minWidth || ''} onChange={(e) => setFormData({ ...formData, minWidth: parseFloat(e.target.value) || null })} placeholder="Min" /><span className="self-center">-</span><Input type="number" value={formData.maxWidth || ''} onChange={(e) => setFormData({ ...formData, maxWidth: parseFloat(e.target.value) || null })} placeholder="Max" /></div></div>
                        <div><Label>Tinggi (cm)</Label><div className="flex gap-2"><Input type="number" value={formData.minLength || ''} onChange={(e) => setFormData({ ...formData, minLength: parseFloat(e.target.value) || null })} placeholder="Min" /><span className="self-center">-</span><Input type="number" value={formData.maxLength || ''} onChange={(e) => setFormData({ ...formData, maxLength: parseFloat(e.target.value) || null })} placeholder="Max" /></div></div>
                    </div>
                </div>
            </Card>

            {/* Section: Gambar */}
            <Card className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Gambar Produk</h2>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#EB216A] transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{uploading ? 'Uploading...' : 'Click atau drag & drop'}</p>
                </div>
                {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-4 mt-4">
                        {uploadedImages.map((img, idx) => (
                            <div key={idx} className="relative group">
                                <img src={img} alt={`Preview ${idx}`} className="w-full h-24 object-cover rounded-lg" />
                                <button onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Section: Harga */}
            <Card className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Harga & Layanan</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label>Ukur Sendiri (Rp) *</Label><Input type="number" value={formData.priceSelfMeasure} onChange={(e) => setFormData({ ...formData, priceSelfMeasure: parseInt(e.target.value) || 0 })} /></div>
                    <div><Label>Ukur Sendiri + Pasang (Rp)</Label><Input type="number" value={formData.priceSelfMeasureInstall} onChange={(e) => setFormData({ ...formData, priceSelfMeasureInstall: parseInt(e.target.value) || 0 })} /></div>
                    <div><Label>Ukur & Pasang Teknisi (Rp)</Label><Input type="number" value={formData.priceMeasureInstall} onChange={(e) => setFormData({ ...formData, priceMeasureInstall: parseInt(e.target.value) || 0 })} /></div>
                </div>
            </Card>

            {/* Section: Deskripsi */}
            <Card className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Deskripsi & Informasi</h2>
                <div className="space-y-4">
                    <div><Label>Deskripsi Singkat</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Deskripsi singkat produk..." /></div>
                    <div><Label>Informasi Lengkap</Label><Textarea value={formData.information} onChange={(e) => setFormData({ ...formData, information: e.target.value })} rows={6} placeholder="Informasi detail produk..." /></div>
                </div>
            </Card>

            {/* Section: SEO */}
            <Card className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">SEO & Meta</h2>
                <div className="space-y-4">
                    <div><Label>Meta Title</Label><Input value={formData.metaTitle} onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })} maxLength={60} /><p className="text-xs text-gray-500 mt-1">{formData.metaTitle.length}/60</p></div>
                    <div><Label>Meta Description</Label><Textarea value={formData.metaDescription} onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })} rows={2} maxLength={160} /><p className="text-xs text-gray-500 mt-1">{formData.metaDescription.length}/160</p></div>
                    <div><Label>Meta Keywords</Label><Input value={formData.metaKeywords} onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })} placeholder="keyword1, keyword2, ..." /></div>
                </div>
            </Card>

            {/* Section: Pengaturan */}
            <Card className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Lanjutan</h2>
                <div className="space-y-3">
                    {[{ key: 'featured', label: 'Featured Product', desc: 'Tampilkan di section unggulan' },
                    { key: 'newArrival', label: 'New Arrival', desc: 'Tampilkan badge "New"' },
                    { key: 'bestSeller', label: 'Best Seller', desc: 'Tampilkan badge "Best Seller"' }].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div><p className="text-sm text-gray-900">{item.label}</p><p className="text-xs text-gray-600">{item.desc}</p></div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={(formData as any)[item.key]} onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EB216A]"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Section: Varian Produk */}
            <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">Varian Produk</h2>
                        <p className="text-sm text-gray-600">Kelola varian dengan ukuran dan harga berbeda</p>
                    </div>
                    {isEditMode && <Button onClick={() => handleOpenVariantModal()} className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"><Plus className="w-4 h-4 mr-2" /> Tambah Varian</Button>}
                </div>
                {!isEditMode ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><p className="text-sm text-yellow-800">Simpan produk terlebih dahulu sebelum menambahkan varian.</p></div>
                ) : loadingVariants ? (
                    <p className="text-gray-600 text-center py-6">Memuat varian...</p>
                ) : variants.length === 0 ? (
                    <p className="text-gray-600 text-center py-6 bg-gray-50 rounded-lg">Belum ada varian.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Lebar</th><th className="px-3 py-2 text-left">Tinggi</th><th className="px-3 py-2 text-left">Sibak</th><th className="px-3 py-2 text-left">Harga</th><th className="px-3 py-2 text-left">Cocok Untuk</th><th className="px-3 py-2 text-right">Aksi</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {variants.map((v) => (
                                    <tr key={v.id}>
                                        <td className="px-3 py-2">{v.width}cm</td>
                                        <td className="px-3 py-2">{v.height}cm</td>
                                        <td className="px-3 py-2">{v.sibak}</td>
                                        <td className="px-3 py-2">Rp {Number(v.price).toLocaleString('id-ID')}</td>
                                        <td className="px-3 py-2 text-xs text-gray-600">{v.recommended_min_width && v.recommended_max_width ? `${v.recommended_min_width}-${v.recommended_max_width}cm` : '-'}</td>
                                        <td className="px-3 py-2 text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenVariantModal(v)}><Edit className="w-4 h-4" /></Button>
                                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteVariant(v.id)}><Trash2 className="w-4 h-4" /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pb-8">
                <Button variant="outline" onClick={() => navigate('/admin/products')}>Batal</Button>
                <Button onClick={handleSave} disabled={saving} className="bg-[#EB216A] hover:bg-[#d11d5e] text-white px-8">
                    {saving ? 'Menyimpan...' : isEditMode ? 'Update Produk' : 'Simpan Produk'}
                </Button>
            </div>

            {/* Variant Modal */}
            {isVariantModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium">{editingVariant ? 'Edit Varian' : 'Tambah Varian'}</h3>
                            <button onClick={() => setIsVariantModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div><Label>Lebar (cm)</Label><Input type="number" value={variantForm.width} onChange={(e) => setVariantForm({ ...variantForm, width: parseInt(e.target.value) || 0 })} /></div>
                                <div><Label>Gelombang</Label><Input type="number" value={variantForm.wave} onChange={(e) => setVariantForm({ ...variantForm, wave: parseInt(e.target.value) || 0 })} /></div>
                                <div><Label>Tinggi (cm)</Label><Input type="number" value={variantForm.height} onChange={(e) => setVariantForm({ ...variantForm, height: parseInt(e.target.value) || 0 })} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Sibak</Label><Input type="number" value={variantForm.sibak} onChange={(e) => setVariantForm({ ...variantForm, sibak: parseInt(e.target.value) || 1 })} /></div>
                                <div><Label>Harga (Rp)</Label><Input type="number" value={variantForm.price} onChange={(e) => setVariantForm({ ...variantForm, price: parseInt(e.target.value) || 0 })} /></div>
                            </div>
                            <div className="border-t pt-4"><Label className="mb-2 block">Cocok Untuk (Rekomendasi)</Label>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><Label className="text-xs text-gray-500">Min Lebar</Label><Input type="number" value={variantForm.recommended_min_width} onChange={(e) => setVariantForm({ ...variantForm, recommended_min_width: parseInt(e.target.value) || 0 })} /></div>
                                    <div><Label className="text-xs text-gray-500">Max Lebar</Label><Input type="number" value={variantForm.recommended_max_width} onChange={(e) => setVariantForm({ ...variantForm, recommended_max_width: parseInt(e.target.value) || 0 })} /></div>
                                    <div><Label className="text-xs text-gray-500">Tinggi</Label><Input type="number" value={variantForm.recommended_height} onChange={(e) => setVariantForm({ ...variantForm, recommended_height: parseInt(e.target.value) || 0 })} /></div>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" className="flex-1" onClick={() => setIsVariantModalOpen(false)}>Batal</Button>
                            <Button className="flex-1 bg-[#EB216A] hover:bg-[#d11d5e] text-white" onClick={handleSaveVariant}>{editingVariant ? 'Update' : 'Simpan'}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
