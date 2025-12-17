import {
    CheckCircle,
    Download,
    Edit3,
    Eye,
    FileText,
    Gift,
    Loader2,
    Plus,
    Printer,
    Save,
    Send,
    Trash2,
    X
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { documentsApi } from '../utils/api';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface DocumentDetailModalProps {
    doc: any;
    onClose: () => void;
    onRefresh?: () => void;
}

interface QuotationItem {
    id: string;
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

const statusConfig = {
    draft: { label: 'Draft', color: 'bg-gray-500', nextStatus: 'SENT', nextLabel: 'Kirim' },
    sent: { label: 'Terkirim', color: 'bg-blue-500', nextStatus: 'OPENED', nextLabel: 'Dibuka' },
    opened: { label: 'Dibuka', color: 'bg-green-500', nextStatus: 'PAID', nextLabel: 'Lunas' },
    paid: { label: 'Lunas', color: 'bg-purple-500', nextStatus: null, nextLabel: null },
};

export function DocumentDetailModal({ doc, onClose, onRefresh }: DocumentDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [saving, setSaving] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Get quotation data from doc.data or doc.quotationData
    const quotationData = doc?.data || doc?.quotationData || {};

    // Form state
    const [formData, setFormData] = useState({
        customerName: doc?.customer_name || doc?.customerName || '',
        customerPhone: doc?.customer_phone || doc?.customerPhone || '',
        customerEmail: doc?.customer_email || doc?.customerEmail || '',
        customerAddress: doc?.address || doc?.customerAddress || '',
        referralCode: doc?.referral_code || doc?.referralCode || '',
        discount: doc?.discount || 0,
        paymentTerms: quotationData?.paymentTerms || 'Bank BRI 0763 0100 1160 564 a.n ABDUL RAHIM',
        notes: quotationData?.notes || ''
    });

    const [windows, setWindows] = useState<QuotationWindow[]>(
        quotationData?.windows || [{
            id: '1',
            title: '1 Pintu',
            size: 'Ukuran 200cm x 270cm',
            fabricType: 'Gorden Langkap',
            items: []
        }]
    );

    const currentStatus = (doc?.status || 'DRAFT').toLowerCase() as keyof typeof statusConfig;
    const statusInfo = statusConfig[currentStatus] || statusConfig.draft;
    const documentNumber = doc?.document_number || doc?.documentNumber || '-';

    // Safe date formatting
    const formatDate = (dateValue: any): string => {
        if (!dateValue) return '-';
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    };
    const createdAt = formatDate(doc?.created_at || doc?.createdAt);

    // Window and item management
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

    const addItemToWindow = (windowId: string) => {
        setWindows(windows.map(w => {
            if (w.id === windowId) {
                const newItem: QuotationItem = {
                    id: `${windowId}-${Date.now()}`,
                    name: '',
                    price: 0,
                    discount: 0,
                    quantity: 1
                };
                return { ...w, items: [...w.items, newItem] };
            }
            return w;
        }));
    };

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

    // Calculations
    const calculateItemTotal = (item: QuotationItem) => {
        const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
        return discountedPrice * (item.quantity || 1);
    };

    const calculateWindowTotal = (window: QuotationWindow) => {
        return window.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    };

    const calculateTotal = () => {
        return windows.reduce((total, window) => {
            return total + calculateWindowTotal(window);
        }, 0);
    };

    const calculateGrandDiscount = () => {
        return calculateTotal() * (formData.discount / 100);
    };

    const calculateGrandTotal = () => {
        return calculateTotal() - calculateGrandDiscount();
    };

    // Actions
    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                customer_name: formData.customerName,
                customer_phone: formData.customerPhone,
                customer_email: formData.customerEmail,
                address: formData.customerAddress,
                referral_code: formData.referralCode,
                discount_amount: calculateGrandDiscount(),
                total_amount: calculateGrandTotal(),
                data: {
                    windows,
                    paymentTerms: formData.paymentTerms,
                    notes: formData.notes
                }
            };

            const response = await documentsApi.update(doc.id, payload);
            if (response.success) {
                toast.success('Dokumen berhasil disimpan');
                onRefresh?.();
            }
        } catch (error: any) {
            toast.error('Gagal menyimpan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloadingPdf(true);
            await documentsApi.downloadPDF(doc.id, `${documentNumber}.pdf`);
            toast.success('PDF berhasil diunduh');
        } catch (error: any) {
            toast.error('Gagal mengunduh PDF: ' + error.message);
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleSendEmail = async () => {
        try {
            setSendingEmail(true);
            const response = await documentsApi.sendEmail(doc.id);
            if (response.success) {
                toast.success(`Email berhasil dikirim ke ${formData.customerEmail}`);
                onRefresh?.();
            }
        } catch (error: any) {
            toast.error('Gagal mengirim email: ' + error.message);
        } finally {
            setSendingEmail(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            setUpdatingStatus(true);
            const response = await documentsApi.updateStatus(doc.id, newStatus);
            if (response.success) {
                toast.success(response.message || 'Status berhasil diperbarui');
                onRefresh?.();
            }
        } catch (error: any) {
            toast.error('Gagal memperbarui status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!doc) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-6xl w-full my-8">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-xl text-gray-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-[#EB216A]" />
                                {documentNumber}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">Dibuat: {createdAt}</p>
                        </div>
                        <Badge className={`${statusInfo.color} text-white`}>
                            {statusInfo.label}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status progression */}
                        {statusInfo.nextStatus && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-300 text-purple-600 hover:bg-purple-50"
                                onClick={() => handleUpdateStatus(statusInfo.nextStatus!)}
                                disabled={updatingStatus}
                            >
                                {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                {statusInfo.nextLabel}
                            </Button>
                        )}

                        <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-600"
                            onClick={handleDownloadPDF}
                            disabled={downloadingPdf}
                        >
                            {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
                            PDF
                        </Button>

                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleSendEmail}
                            disabled={sendingEmail}
                        >
                            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                            Email
                        </Button>

                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-100 px-6">
                    <div className="flex gap-4">
                        <button
                            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'edit'
                                ? 'border-[#EB216A] text-[#EB216A]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('edit')}
                        >
                            <Edit3 className="w-4 h-4 inline mr-2" />
                            Edit Dokumen
                        </button>
                        <button
                            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preview'
                                ? 'border-[#EB216A] text-[#EB216A]'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            onClick={() => setActiveTab('preview')}
                        >
                            <Eye className="w-4 h-4 inline mr-2" />
                            Preview
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[calc(100vh-280px)] overflow-y-auto">
                    {activeTab === 'edit' ? (
                        /* Edit Form */
                        <div className="space-y-6">
                            {/* Customer Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-4">Informasi Pelanggan</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Nama Pelanggan</Label>
                                        <Input
                                            value={formData.customerName}
                                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                            placeholder="Nama lengkap"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>No. Telepon</Label>
                                        <Input
                                            value={formData.customerPhone}
                                            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                                            placeholder="08xxxxxxxxxx"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={formData.customerEmail}
                                            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                                            placeholder="email@example.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Kode Referral</Label>
                                        <div className="relative">
                                            <Gift className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-500" />
                                            <Input
                                                className="pl-10"
                                                value={formData.referralCode}
                                                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                                                placeholder="Kode referral (opsional)"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>Alamat</Label>
                                        <Textarea
                                            value={formData.customerAddress}
                                            onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                                            placeholder="Alamat lengkap"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Windows & Items */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-gray-700">Detail Produk</h3>
                                    <Button size="sm" variant="outline" onClick={addWindow}>
                                        <Plus className="w-4 h-4 mr-1" /> Tambah Jendela/Pintu
                                    </Button>
                                </div>

                                {windows.map((window, windowIndex) => (
                                    <div key={window.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                        {/* Window Header */}
                                        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 border-b border-gray-200">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <Input
                                                    className="w-32 bg-white"
                                                    value={window.title}
                                                    onChange={(e) => updateWindowField(window.id, 'title', e.target.value)}
                                                    placeholder="Judul"
                                                />
                                                <Input
                                                    className="flex-1 min-w-[150px] bg-white"
                                                    value={window.size}
                                                    onChange={(e) => updateWindowField(window.id, 'size', e.target.value)}
                                                    placeholder="Ukuran"
                                                />
                                                <Input
                                                    className="w-40 bg-white"
                                                    value={window.fabricType}
                                                    onChange={(e) => updateWindowField(window.id, 'fabricType', e.target.value)}
                                                    placeholder="Tipe"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => removeWindow(window.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Items Table */}
                                        <div className="p-4">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-gray-500">
                                                        <th className="pb-2">Nama Item</th>
                                                        <th className="pb-2 w-28 text-right">Harga</th>
                                                        <th className="pb-2 w-20 text-center">Disc%</th>
                                                        <th className="pb-2 w-16 text-center">Qty</th>
                                                        <th className="pb-2 w-28 text-right">Total</th>
                                                        <th className="pb-2 w-10"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {window.items.map((item) => (
                                                        <tr key={item.id}>
                                                            <td className="py-2 pr-2">
                                                                <Input
                                                                    value={item.name}
                                                                    onChange={(e) => updateItem(window.id, item.id, 'name', e.target.value)}
                                                                    placeholder="Nama item"
                                                                    className="text-sm"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-1">
                                                                <Input
                                                                    type="number"
                                                                    value={item.price}
                                                                    onChange={(e) => updateItem(window.id, item.id, 'price', parseFloat(e.target.value) || 0)}
                                                                    className="text-right text-sm"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-1">
                                                                <Input
                                                                    type="number"
                                                                    value={item.discount}
                                                                    onChange={(e) => updateItem(window.id, item.id, 'discount', parseFloat(e.target.value) || 0)}
                                                                    className="text-center text-sm"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-1">
                                                                <Input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => updateItem(window.id, item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                                    className="text-center text-sm"
                                                                />
                                                            </td>
                                                            <td className="py-2 px-1 text-right text-gray-900">
                                                                Rp{calculateItemTotal(item).toLocaleString('id-ID')}
                                                            </td>
                                                            <td className="py-2 pl-1">
                                                                <button
                                                                    className="text-red-400 hover:text-red-600"
                                                                    onClick={() => removeItemFromWindow(window.id, item.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="mt-2 text-[#EB216A]"
                                                onClick={() => addItemToWindow(window.id)}
                                            >
                                                <Plus className="w-4 h-4 mr-1" /> Tambah Item
                                            </Button>

                                            <div className="mt-3 pt-3 border-t border-gray-100 text-right">
                                                <span className="text-gray-600">Subtotal: </span>
                                                <span className="font-medium">Rp{calculateWindowTotal(window).toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4">
                                <div className="flex justify-end">
                                    <div className="w-64 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span className="text-gray-900">Rp{calculateTotal().toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Diskon:</span>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    className="w-16 text-center text-sm"
                                                    value={formData.discount}
                                                    onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                                />
                                                <span className="text-gray-500">%</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between text-sm text-red-600">
                                            <span>Potongan:</span>
                                            <span>- Rp{calculateGrandDiscount().toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="pt-2 border-t border-pink-200 flex justify-between">
                                            <span className="font-medium">Total:</span>
                                            <span className="text-lg font-bold text-[#EB216A]">
                                                Rp{calculateGrandTotal().toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment & Notes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Info Pembayaran</Label>
                                    <Textarea
                                        value={formData.paymentTerms}
                                        onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Catatan</Label>
                                    <Textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Preview */
                        <div className="max-w-4xl mx-auto" id="quotation-document">
                            {/* Letterhead */}
                            <div className="mb-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h1 className="text-3xl text-[#EB216A] mb-2">AMAGRIYA GORDEN</h1>
                                        <p className="text-sm text-gray-600">
                                            Jl. Contoh Alamat No. 123<br />
                                            Jakarta Selatan, DKI Jakarta 12345<br />
                                            Telp: (021) 1234-5678 | WA: 0812-3456-7890<br />
                                            Email: info@amagriyagorden.com
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">No. Surat</p>
                                        <p className="text-base text-gray-900">{documentNumber}</p>
                                        <p className="text-sm text-gray-600 mt-2">Tanggal</p>
                                        <p className="text-base text-gray-900">{createdAt}</p>
                                    </div>
                                </div>

                                <div className="border-t-4 border-[#EB216A] my-6"></div>

                                <div className="text-center mb-6">
                                    <h2 className="text-xl text-gray-900">SURAT PENAWARAN</h2>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-600 mb-1">Kepada Yth,</p>
                                <p className="text-base text-gray-900">{formData.customerName}</p>
                                <p className="text-sm text-gray-600">{formData.customerPhone}</p>
                                <p className="text-sm text-gray-600">{formData.customerEmail}</p>
                                {formData.customerAddress && (
                                    <p className="text-sm text-gray-600 mt-1">{formData.customerAddress}</p>
                                )}
                                {formData.referralCode && (
                                    <p className="text-sm text-purple-600 mt-2">Kode Referral: {formData.referralCode}</p>
                                )}
                            </div>

                            {/* Intro */}
                            <div className="mb-6">
                                <p className="text-sm text-gray-700">
                                    Dengan hormat,<br />
                                    Bersama ini kami mengajukan penawaran harga untuk pembuatan gorden sebagai berikut:
                                </p>
                            </div>

                            {/* Items */}
                            <div className="space-y-4 mb-6">
                                {windows.map((window) => (
                                    <div key={window.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-900">{window.title}</p>
                                                    <p className="text-xs text-gray-600">{window.size} - {window.fabricType}</p>
                                                </div>
                                                <p className="text-sm text-gray-900">
                                                    Subtotal: Rp{calculateWindowTotal(window).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs text-gray-600">No</th>
                                                    <th className="px-4 py-2 text-left text-xs text-gray-600">Nama Item</th>
                                                    <th className="px-4 py-2 text-right text-xs text-gray-600">Harga</th>
                                                    <th className="px-4 py-2 text-center text-xs text-gray-600">Disc</th>
                                                    <th className="px-4 py-2 text-center text-xs text-gray-600">Qty</th>
                                                    <th className="px-4 py-2 text-right text-xs text-gray-600">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {window.items.map((item, idx) => (
                                                    <tr key={item.id}>
                                                        <td className="px-4 py-2">{idx + 1}</td>
                                                        <td className="px-4 py-2">{item.name}</td>
                                                        <td className="px-4 py-2 text-right">Rp{item.price.toLocaleString('id-ID')}</td>
                                                        <td className="px-4 py-2 text-center">{item.discount}%</td>
                                                        <td className="px-4 py-2 text-center">{item.quantity}</td>
                                                        <td className="px-4 py-2 text-right">Rp{calculateItemTotal(item).toLocaleString('id-ID')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="border-t-2 border-gray-300 pt-4 mb-6">
                                <div className="flex justify-end">
                                    <div className="w-64 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span>Rp{calculateTotal().toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Diskon ({formData.discount}%):</span>
                                            <span className="text-red-600">- Rp{calculateGrandDiscount().toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="border-t border-gray-300 pt-2 flex justify-between">
                                            <span className="font-medium">Total:</span>
                                            <span className="text-lg text-[#EB216A]">Rp{calculateGrandTotal().toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment */}
                            {formData.paymentTerms && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium mb-2">Informasi Pembayaran:</h3>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <p className="text-sm text-gray-700 whitespace-pre-line">{formData.paymentTerms}</p>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {formData.notes && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-medium mb-2">Catatan:</h3>
                                    <p className="text-sm text-gray-700 whitespace-pre-line">{formData.notes}</p>
                                </div>
                            )}

                            {/* Signatures */}
                            <div className="mt-12 pt-6 border-t border-gray-200">
                                <div className="flex justify-between">
                                    <div className="text-sm text-gray-600">
                                        <p>Hormat kami,</p>
                                        <p className="mt-16">_________________</p>
                                        <p className="text-gray-900">Amagriya Gorden</p>
                                    </div>
                                    <div className="text-right text-sm text-gray-600">
                                        <p>Mengetahui,</p>
                                        <p className="mt-16">_________________</p>
                                        <p className="text-gray-900">{formData.customerName}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center rounded-b-2xl">
                    <div className="text-sm text-gray-600">
                        Total: <span className="text-lg font-bold text-[#EB216A]">Rp{calculateGrandTotal().toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Tutup
                        </Button>
                        {activeTab === 'edit' && (
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Simpan Perubahan
                            </Button>
                        )}
                        {activeTab === 'preview' && (
                            <Button variant="outline" onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          #quotation-document { max-width: none; padding: 0; }
        }
      `}</style>
        </div>
    );
}
