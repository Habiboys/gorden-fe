import {
    ArrowLeft,
    Gift,
    Plus,
    Save,
    Search,
    Trash2,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { documentsApi, productsApi } from '../../utils/api';

interface QuotationItem {
    id: string;
    productId?: string;
    name: string;
    price: number;
    discount: number;
    quantity: number;
}

interface QuotationWindow {
    id: string;
    title: string;
    size: string;
    fabricType: string;
    items: QuotationItem[];
}

export default function AdminDocumentCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Products state
    const [products, setProducts] = useState<any[]>([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [showProductPicker, setShowProductPicker] = useState<string | null>(null);

    // Form state
    const [docType, setDocType] = useState('QUOTATION');

    // Default valid_until is 14 days from now
    const getDefaultValidUntil = () => {
        const date = new Date();
        date.setDate(date.getDate() + 14);
        return date.toISOString().split('T')[0];
    };

    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        referralCode: '',
        discount: 20,
        validUntil: getDefaultValidUntil(),
        paymentTerms: 'Bank BRI 0763 0100 1160 564 a.n ABDUL RAHIM',
        notes: 'Pembayaran dapat ditransfer melalui\n\nPastikan nilai total tagihan Anda sudah benar sebelum melakukan transfer\n\nTerima kasih atas kepercayaannya'
    });

    const [windows, setWindows] = useState<QuotationWindow[]>([
        {
            id: '1',
            title: 'Jendela 1',
            size: '',
            fabricType: '',
            items: []
        }
    ]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await productsApi.getAll();
            if (response.success) {
                setProducts(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Gagal memuat data produk');
        }
    };

    const addWindow = () => {
        const newWindow: QuotationWindow = {
            id: Date.now().toString(),
            title: `${windows.length + 1} Jendela`,
            size: 'Ukuran',
            fabricType: 'Gorden Langkap',
            items: []
        };
        setWindows([...windows, newWindow]);
    };

    const removeWindow = (windowId: string) => {
        setWindows(windows.filter(w => w.id !== windowId));
    };

    const addProductToWindow = (windowId: string, product: any) => {
        setWindows(windows.map(w => {
            if (w.id === windowId) {
                const price = parseFloat(product.price_self_measure || product.price || 0);
                const newItem: QuotationItem = {
                    id: `${windowId}-${Date.now()}`,
                    productId: product.id,
                    name: product.name,
                    price: price,
                    discount: 0,
                    quantity: 1
                };
                return { ...w, items: [...w.items, newItem] };
            }
            return w;
        }));
        setShowProductPicker(null);
        setProductSearchTerm('');
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        p.category?.toLowerCase?.()?.includes(productSearchTerm.toLowerCase())
    );

    const removeItemFromWindow = (windowId: string, itemId: string) => {
        setWindows(windows.map(w => {
            if (w.id === windowId) {
                return { ...w, items: w.items.filter(i => i.id !== itemId) };
            }
            return w;
        }));
    };

    const updateWindowField = (windowId: string, field: string, value: string) => {
        setWindows(windows.map(w => {
            if (w.id === windowId) {
                return { ...w, [field]: value };
            }
            return w;
        }));
    };

    const updateItem = (windowId: string, itemId: string, field: string, value: any) => {
        setWindows(windows.map(w => {
            if (w.id === windowId) {
                return {
                    ...w,
                    items: w.items.map(item => {
                        if (item.id === itemId) {
                            return { ...item, [field]: value };
                        }
                        return item;
                    })
                };
            }
            return w;
        }));
    };

    const calculateItemTotal = (item: QuotationItem) => {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        const discount = typeof item.discount === 'string' ? parseFloat(item.discount) : item.discount;
        const quantity = typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity;

        if (isNaN(price)) return 0;

        const discountedPrice = price * (1 - (discount || 0) / 100);
        return discountedPrice * (quantity || 1);
    };

    const calculateTotal = () => {
        return windows.reduce((total, window) => {
            return total + window.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
        }, 0);
    };

    const calculateGrandDiscount = () => {
        const subtotal = calculateTotal();
        return subtotal * (formData.discount / 100);
    };

    const calculateGrandTotal = () => {
        return calculateTotal() - calculateGrandDiscount();
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const payload = {
                type: docType,
                customer_name: formData.customerName,
                customer_phone: formData.customerPhone,
                customer_email: formData.customerEmail,
                address: formData.customerAddress,
                referral_code: formData.referralCode,
                discount_amount: calculateGrandDiscount(),
                total_amount: calculateGrandTotal(),
                valid_until: docType === 'QUOTATION' ? formData.validUntil : null,
                data: {
                    windows,
                    paymentTerms: formData.paymentTerms,
                    notes: formData.notes
                }
            };

            const response = await documentsApi.create(payload);
            if (response.success) {
                toast.success('Dokumen berhasil dibuat!');
                navigate('/admin/documents');
            }
        } catch (error: any) {
            console.error('Error creating document:', error);
            toast.error('Gagal membuat dokumen: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/admin/documents')}
                        className="hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Button>
                    <div>
                        <h1 className="text-2xl lg:text-3xl text-gray-900">Buat Dokumen Baru</h1>
                        <p className="text-gray-600 mt-1">Lengkapi form untuk membuat dokumen baru</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/admin/documents')}
                        className="border-gray-300"
                    >
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-[#EB216A] hover:bg-[#d11d5e] text-white min-w-[120px]"
                    >
                        {loading ? 'Menyimpan...' : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Simpan
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-5">Informasi Customer</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nama Lengkap *</Label>
                                <Input
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                    placeholder="Nama customer"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>No. Telepon *</Label>
                                <Input
                                    value={formData.customerPhone}
                                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email *</Label>
                                <Input
                                    type="email"
                                    value={formData.customerEmail}
                                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipe Dokumen</Label>
                                <select
                                    value={docType}
                                    onChange={(e) => setDocType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                                >
                                    <option value="QUOTATION">Surat Penawaran</option>
                                    <option value="INVOICE">Invoice</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Kode Referral (Optional)</Label>
                                <div className="relative">
                                    <Gift className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input
                                        value={formData.referralCode}
                                        onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                                        placeholder="REF-XXXXX"
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            {docType === 'QUOTATION' && (
                                <div className="space-y-2">
                                    <Label>Berlaku Sampai</Label>
                                    <Input
                                        type="date"
                                        value={formData.validUntil}
                                        onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-500">Penawaran berlaku sampai tanggal ini</p>
                                </div>
                            )}
                            <div className="space-y-2 md:col-span-2">
                                <Label>Alamat Lengkap *</Label>
                                <Textarea
                                    value={formData.customerAddress}
                                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                                    placeholder="Alamat lengkap customer"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Windows/Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Detail Penawaran</h3>
                            <Button
                                size="sm"
                                onClick={addWindow}
                                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Jendela/Pintu
                            </Button>
                        </div>

                        {windows.map((window) => (
                            <div key={window.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Window Header */}
                                <div className="bg-gray-50 p-4 border-b border-gray-200">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <Input
                                                value={window.title}
                                                onChange={(e) => updateWindowField(window.id, 'title', e.target.value)}
                                                placeholder="1 Pintu / 1 Jendela"
                                            />
                                            <Input
                                                value={window.size}
                                                onChange={(e) => updateWindowField(window.id, 'size', e.target.value)}
                                                placeholder="Ukuran: 200cm x 270cm"
                                            />
                                            <Input
                                                value={window.fabricType}
                                                onChange={(e) => updateWindowField(window.id, 'fabricType', e.target.value)}
                                                placeholder="Gorden Langkap / Kupu-kupu"
                                            />
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-red-300 text-red-600 hover:bg-red-50"
                                            onClick={() => removeWindow(window.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50/50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs text-gray-600 w-8">#</th>
                                                <th className="px-4 py-3 text-left text-xs text-gray-600">Nama Item</th>
                                                <th className="px-4 py-3 text-left text-xs text-gray-600 w-32">Harga</th>
                                                <th className="px-4 py-3 text-left text-xs text-gray-600 w-24">Diskon %</th>
                                                <th className="px-4 py-3 text-left text-xs text-gray-600 w-20">Qty</th>
                                                <th className="px-4 py-3 text-left text-xs text-gray-600 w-32">Total</th>
                                                <th className="px-4 py-3 w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {window.items.map((item, itemIndex) => (
                                                <tr key={item.id} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 text-sm text-gray-600">{itemIndex + 1}</td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm text-gray-900">{item.name}</p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <p className="text-sm text-gray-900">
                                                            Rp{item.price.toLocaleString('id-ID')}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Input
                                                            type="number"
                                                            value={item.discount}
                                                            onChange={(e) => updateItem(window.id, item.id, 'discount', parseFloat(e.target.value) || 0)}
                                                            placeholder="0"
                                                            className="text-sm h-8"
                                                            max="100"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(window.id, item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                            placeholder="1"
                                                            className="text-sm h-8"
                                                            min="1"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        Rp{calculateItemTotal(item).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => removeItemFromWindow(window.id, item.id)}
                                                            className="text-red-400 hover:text-red-600 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Add Item Section */}
                                <div className="p-3 bg-gray-50/50 border-t border-gray-200">
                                    {showProductPicker === window.id ? (
                                        <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                            <div className="relative">
                                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <Input
                                                    type="text"
                                                    placeholder="Cari produk..."
                                                    value={productSearchTerm}
                                                    onChange={(e) => setProductSearchTerm(e.target.value)}
                                                    className="pl-10 h-9"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg">
                                                {filteredProducts.length > 0 ? (
                                                    filteredProducts.slice(0, 10).map((product) => (
                                                        <button
                                                            key={product.id}
                                                            onClick={() => addProductToWindow(window.id, product)}
                                                            className="w-full px-3 py-2 text-left hover:bg-pink-50 border-b border-gray-50 last:border-b-0 transition-colors"
                                                        >
                                                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                Rp{parseFloat(product.price_self_measure || product.price || 0).toLocaleString('id-ID')}
                                                                {product.category && ` • ${typeof product.category === 'object' ? product.category.name : product.category}`}
                                                            </p>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                                                        Tidak ada produk ditemukan
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => { setShowProductPicker(null); setProductSearchTerm(''); }}
                                                className="w-full h-8 text-gray-500 hover:text-gray-700"
                                            >
                                                Batal
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setShowProductPicker(window.id)}
                                            className="w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-[#EB216A] hover:text-[#EB216A] hover:bg-pink-50/50 h-9"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Tambah Produk
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-6 space-y-6">
                        <h3 className="text-lg font-semibold text-gray-900">Ringkasan Pembayaran</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between text-base">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-gray-900 font-medium">Rp{calculateTotal().toLocaleString('id-ID')}</span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Diskon Global (%)</span>
                                    <div className="w-20">
                                        <Input
                                            type="number"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                            className="text-right h-8"
                                            max="100"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>Potongan</span>
                                    <span>-Rp{calculateGrandDiscount().toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Total</span>
                                <span className="text-lg font-bold text-[#EB216A]">Rp{calculateGrandTotal().toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="space-y-2">
                                <Label>Informasi Pembayaran</Label>
                                <Textarea
                                    value={formData.paymentTerms}
                                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                    placeholder="Bank BRI..."
                                    rows={2}
                                    className="text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Catatan</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Terima kasih..."
                                    rows={4}
                                    className="text-sm"
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full bg-[#EB216A] hover:bg-[#d11d5e] text-white py-6 text-lg"
                        >
                            {loading ? 'Menyimpan...' : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Simpan Dokumen
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
