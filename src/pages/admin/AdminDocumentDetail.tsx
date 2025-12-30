
import {
    ArrowLeft,
    Download,
    Edit3,
    FileCheck,
    Info,
    Loader2,
    Mail,
    MessageCircle,
    Printer,
    Send
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '../../components/ui/hover-card';
import { useConfirm } from '../../context/ConfirmContext';
import { calculatorTypesApi, documentsApi } from '../../utils/api';
import { getProductImageUrl } from '../../utils/imageHelper';

// ================== TYPES ==================

// Unused interface - kept for reference
// interface ComponentFromDB {
//     id: number;
//     calculator_type_id: number;
//     subcategory_id: number;
//     label: string;
//     is_required: boolean;
//     price_calculation: 'per_meter' | 'per_unit' | 'per_10_per_meter';
//     display_order: number;
// }

// Unused interface - kept for reference
// interface CalculatorTypeFromDB {
//     id: number;
//     name: string;
//     slug: string;
//     description: string;
//     has_item_type: boolean;
//     has_package_type: boolean;
//     fabric_multiplier: number;
//     is_active: boolean;
//     components: ComponentFromDB[];
// }

interface QuotationItem {
    id: string;
    name: string;
    price: number;
    discount: number;
    quantity: number;
    totalPrice?: number;
}

interface QuotationWindow {
    id: string;
    title: string;
    size: string;
    fabricType: string;
    items: QuotationItem[];
    discount?: number;  // Per-window discount percentage
    subtotal?: number;
    discountedSubtotal?: number;
}

// Status configs for different document types
const quotationStatusConfig: Record<string, { label: string; color: string; nextStatus: string | null; nextLabel: string | null }> = {
    draft: { label: 'Draft', color: 'bg-gray-500', nextStatus: 'SENT', nextLabel: 'Kirim Penawaran' },
    sent: { label: 'Terkirim', color: 'bg-blue-500', nextStatus: 'OPENED', nextLabel: 'Tandai Dibuka' },
    opened: { label: 'Dibuka', color: 'bg-cyan-500', nextStatus: 'ACCEPTED', nextLabel: 'Tandai Disetujui' },
    accepted: { label: 'Disetujui', color: 'bg-green-600', nextStatus: null, nextLabel: null },
    rejected: { label: 'Ditolak', color: 'bg-red-500', nextStatus: null, nextLabel: null },
    expired: { label: 'Kadaluarsa', color: 'bg-orange-500', nextStatus: null, nextLabel: null },
};

const invoiceStatusConfig: Record<string, { label: string; color: string; nextStatus: string | null; nextLabel: string | null }> = {
    draft: { label: 'Draft', color: 'bg-gray-500', nextStatus: 'SENT', nextLabel: 'Kirim Invoice' },
    sent: { label: 'Terkirim', color: 'bg-blue-500', nextStatus: 'OPENED', nextLabel: 'Tandai Dibuka' },
    opened: { label: 'Dibuka', color: 'bg-cyan-500', nextStatus: 'PENDING', nextLabel: 'Menunggu Bayar' },
    pending: { label: 'Menunggu Bayar', color: 'bg-yellow-500', nextStatus: 'PAID', nextLabel: 'Tandai Lunas' },
    paid: { label: 'Lunas', color: 'bg-green-600', nextStatus: null, nextLabel: null },
    cancelled: { label: 'Dibatalkan', color: 'bg-red-500', nextStatus: null, nextLabel: null },
    overdue: { label: 'Jatuh Tempo', color: 'bg-red-500', nextStatus: 'PAID', nextLabel: 'Tandai Lunas' },
};

const getStatusConfig = (docType: string) => {
    return docType === 'INVOICE' ? invoiceStatusConfig : quotationStatusConfig;
};

// ================== COMPONENT ==================

export default function AdminDocumentDetail() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { confirm } = useConfirm();
    const [loading, setLoading] = useState(true);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [converting, setConverting] = useState(false);
    // isEditMode removed in favor of full page edit
    const [doc, setDoc] = useState<any>(null);

    // Form state
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        referralCode: '',
        discount: 0,
        validUntil: '',
        paymentTerms: '',
        notes: ''
    });

    // Windows data (from quotationData)
    const [windows, setWindows] = useState<QuotationWindow[]>([]);

    // Raw Items data (for full fidelity view)
    const [rawItems, setRawItems] = useState<any[]>([]);
    const [calculatorSchema, setCalculatorSchema] = useState<any>(null); // To store schema for labels
    const [baseFabric, setBaseFabric] = useState<any>(null); // For price calc fallback

    // ================== LOAD DATA ==================
    useEffect(() => {
        if (id) {
            loadDocument();
        }
    }, [id]);

    const loadDocument = async () => {
        setLoading(true);
        try {
            const response = await documentsApi.getOne(id!);
            if (response.success && response.data) {
                const docData = response.data;
                setDoc(docData);

                // Parse quotation data
                let quotationData: any = docData.data || docData.quotationData || {};
                let parseAttempts = 0;
                while (typeof quotationData === 'string' && parseAttempts < 5) {
                    try {
                        quotationData = JSON.parse(quotationData);
                        parseAttempts++;
                    } catch (e) {
                        console.error('Failed to parse quotation data', e);
                        quotationData = {};
                        break;
                    }
                }

                // Set form data
                setFormData({
                    customerName: docData.customer_name || '',
                    customerPhone: docData.customer_phone || '',
                    customerEmail: docData.customer_email || '',
                    customerAddress: docData.address || docData.customer_address || '',
                    referralCode: docData.referral_code || '',
                    discount: (() => {
                        if (quotationData.discount !== undefined) return quotationData.discount;
                        if (docData.discount || docData.discount_percentage) return docData.discount || docData.discount_percentage;
                        if (docData.discount_amount && docData.total_amount) {
                            const net = Number(docData.total_amount);
                            const disc = Number(docData.discount_amount);
                            const gross = net + disc;
                            if (gross > 0) return Math.round((disc / gross) * 100);
                        }
                        return 0;
                    })(),
                    validUntil: docData.valid_until ? docData.valid_until.split('T')[0] : '',
                    paymentTerms: quotationData.paymentTerms || docData.payment_terms || '',
                    notes: quotationData.notes || docData.notes || ''
                });

                // Set windows
                setWindows(quotationData.windows || []);
                if (quotationData.raw_items) {
                    setRawItems(quotationData.raw_items);

                    // Fetch schema if available
                    if (quotationData.calculatorTypeSlug) {
                        try {
                            const typesRes = await calculatorTypesApi.getAllTypes();
                            if (typesRes.success) {
                                const matchedType = typesRes.data.find((t: any) => t.slug === quotationData.calculatorTypeSlug);
                                if (matchedType) {
                                    setCalculatorSchema(matchedType);
                                }
                            }
                        } catch (err) {
                            console.error('Error fetching schema for detail view:', err);
                        }
                    }

                    // Set Base Fabric
                    if (quotationData.baseFabric) {
                        setBaseFabric(quotationData.baseFabric);
                    }
                }
            } else {
                toast.error('Gagal memuat dokumen');
                navigate('/admin/documents');
            }
        } catch (error: any) {
            console.error('Error loading document:', error);
            toast.error('Gagal memuat dokumen');
            navigate('/admin/documents');
        } finally {
            setLoading(false);
        }
    };

    // ================== CALCULATIONS ==================

    const isBlindType = () => {
        return calculatorSchema?.slug?.includes('blind') || calculatorSchema?.has_item_type === false;
    };

    const calculateComponentPrice = (item: any, comp: any, selection: any) => {
        const widthM = item.width / 100;
        const basePrice = (() => {
            switch (comp.price_calculation) {
                case 'per_meter':
                    return Math.max(1, widthM) * selection.product.price * item.quantity;
                case 'per_unit':
                    return selection.product.price * item.quantity;
                case 'per_10_per_meter':
                    return Math.ceil(widthM * 10) * selection.product.price * item.quantity;
                default:
                    return 0;
            }
        })();
        const priceBeforeDiscount = basePrice * selection.qty;
        return priceBeforeDiscount * (1 - (selection.discount || 0) / 100);
    };

    const calculateItemPriceRich = (item: any) => {
        const product = item.product || baseFabric;
        if (!product || !calculatorSchema) return { fabric: 0, fabricMeters: 0, components: 0, total: 0, fabricPricePerMeter: 0 };

        const widthM = item.width / 100;
        const heightM = item.height / 100;

        const fabricPricePerMeter = item.selectedVariant?.price ?? product.price;
        const fabricMeters = widthM * (calculatorSchema.fabric_multiplier || 2.4) * heightM;
        const fabricPriceBeforeDiscount = fabricMeters * fabricPricePerMeter * item.quantity;
        const fabricPrice = fabricPriceBeforeDiscount * (1 - (item.fabricDiscount || 0) / 100);

        let componentsPrice = 0;
        if (item.packageType === 'gorden-lengkap' && calculatorSchema.components) {
            calculatorSchema.components.forEach((comp: any) => {
                const selection = item.components ? item.components[comp.id] : null;
                if (selection) {
                    componentsPrice += calculateComponentPrice(item, comp, selection);
                }
            });
        }

        return {
            fabric: fabricPrice,
            fabricBeforeDiscount: fabricPriceBeforeDiscount,
            fabricMeters,
            fabricPricePerMeter,
            components: componentsPrice,
            total: fabricPrice + componentsPrice
        };
    };

    // ================== CALCULATIONS ==================
    const calculateItemTotal = (item: QuotationItem) => {
        if (item.totalPrice) return item.totalPrice;
        const discountedPrice = item.price * (1 - (item.discount || 0) / 100);
        return discountedPrice * (item.quantity || 1);
    };

    const calculateWindowTotal = (window: QuotationWindow) => {
        if (window.subtotal) return window.subtotal;
        return window.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    };

    const calculateTotal = () => {
        return windows.reduce((total, window) => total + calculateWindowTotal(window), 0);
    };

    const calculateGrandTotal = () => {
        const subtotal = calculateTotal();
        const discountAmount = subtotal * (formData.discount / 100);
        return subtotal - discountAmount;
    };

    // ================== DATE FORMATTING ==================
    const formatDate = (dateValue: any): string => {
        if (!dateValue) return '-';
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return '-';
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return '-';
        }
    };

    // ================== ACTIONS ==================
    // handleSave removed (Edit logic moved to Create/Edit page)

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            const response = await documentsApi.updateStatus(id!, newStatus);
            if (response.success) {
                toast.success(`Status berhasil diubah ke ${newStatus} `);
                loadDocument();
            }
        } catch (error: any) {
            toast.error('Gagal mengubah status');
        }
    };

    const handleDownloadPDF = async () => {
        try {
            await documentsApi.downloadPDF(id!, `${doc?.document_number || 'document'}.pdf`);
            toast.success('PDF berhasil diunduh');
        } catch (error: any) {
            toast.error('Gagal mengunduh PDF');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleSendEmail = async () => {
        if (!formData.customerEmail) {
            toast.error('Email customer belum diisi');
            return;
        }
        try {
            setSendingEmail(true);
            const response = await documentsApi.sendEmail(id!);
            if (response.success) {
                toast.success(`Email berhasil dikirim ke ${formData.customerEmail} `);
                loadDocument();
            }
        } catch (error: any) {
            toast.error('Gagal mengirim email: ' + error.message);
        } finally {
            setSendingEmail(false);
        }
    };

    const handleSendWhatsApp = () => {
        if (!formData.customerPhone) {
            toast.error('No. telepon customer belum diisi');
            return;
        }
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const pdfUrl = `${apiBaseUrl} /documents/${id}/pdf`;
        const message = `Halo kak,\n\nBerikut adalah dokumen ${doc?.type === 'INVOICE' ? 'Invoice' : 'Penawaran'} Anda:\n\n*No. Dokumen:* ${doc?.document_number}\n*Nama:* ${formData.customerName}\n*Total:* Rp ${calculateGrandTotal().toLocaleString('id-ID')}\n\n*Link Dokumen PDF:*\n${pdfUrl}\n\nTerima kasih telah mempercayakan kebutuhan gorden Anda kepada Amagriya Gorden.`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappNumber = formData.customerPhone?.replace(/^0/, '62').replace(/[^0-9]/g, '') || '';
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    const handleConvertToInvoice = async () => {
        const confirmed = await confirm({
            title: 'Konversi ke Invoice',
            description: 'Apakah Anda yakin ingin mengkonversi Penawaran ini menjadi Invoice?',
            confirmText: 'Ya, Jadikan Invoice',
            cancelText: 'Batal'
        });
        if (!confirmed) return;
        try {
            setConverting(true);
            const response = await documentsApi.convertToInvoice(id!);
            if (response.success) {
                toast.success('Penawaran berhasil dikonversi ke Invoice!');
                navigate('/admin/documents');
            }
        } catch (error: any) {
            toast.error('Gagal mengkonversi: ' + error.message);
        } finally {
            setConverting(false);
        }
    };

    // ================== RENDER ==================

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#EB216A]" />
            </div>
        );
    }

    if (!doc) {
        return null;
    }

    const currentStatus = (doc.status || 'DRAFT').toLowerCase();
    const statusConfig = getStatusConfig(doc.type);
    const statusInfo = statusConfig[currentStatus] || statusConfig.draft;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/documents')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-gray-900">{doc.document_number}</h1>
                            <Badge className={`${statusInfo.color} text-white`}>{statusInfo.label}</Badge>

                            <HoverCard>
                                <HoverCardTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-gray-400 hover:text-gray-600">
                                        <Info className="w-4 h-4" />
                                    </Button>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-80 p-4">
                                    <h4 className="font-semibold mb-2">Alur Status Dokumen</h4>
                                    {doc.type === 'QUOTATION' ? (
                                        <div className="text-sm space-y-2">
                                            <p><span className="font-medium text-gray-500">Draft:</span> Dokumen baru dibuat.</p>
                                            <p><span className="font-medium text-blue-500">Sent:</span> Sudah dikirim ke customer (Email/WA).</p>
                                            <p><span className="font-medium text-green-500">Accepted:</span> Penawaran disetujui customer.</p>
                                            <p><span className="font-medium text-red-500">Rejected:</span> Penawaran ditolak.</p>
                                            <p className="mt-2 text-xs text-gray-400 border-t pt-2">Note: Penawaran yang disetujui dapat dikonversi menjadi Invoice.</p>
                                        </div>
                                    ) : (
                                        <div className="text-sm space-y-2">
                                            <p><span className="font-medium text-gray-500">Draft:</span> Invoice baru dibuat/dikonversi.</p>
                                            <p><span className="font-medium text-yellow-500">Pending:</span> Menunggu pembayaran.</p>
                                            <p><span className="font-medium text-green-600">Paid:</span> Pembayaran lunas.</p>
                                            <p><span className="font-medium text-red-500">Cancelled:</span> Invoice dibatalkan.</p>
                                        </div>
                                    )}
                                </HoverCardContent>
                            </HoverCard>
                        </div>
                        <p className="text-gray-500">{doc.type === 'QUOTATION' ? 'Surat Penawaran' : 'Invoice'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(`/admin/documents/edit/${id}`)}>
                        <Edit3 className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" /> Print
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPDF}>
                        <Download className="w-4 h-4 mr-2" /> PDF
                    </Button>
                    <Button variant="outline" onClick={handleSendEmail} disabled={sendingEmail}>
                        {sendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                        Email
                    </Button>
                    <Button variant="outline" onClick={handleSendWhatsApp} className="text-green-600 border-green-300 hover:bg-green-50">
                        <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                    </Button>
                    {doc.type === 'QUOTATION' && (
                        <Button variant="outline" onClick={handleConvertToInvoice} disabled={converting} className="text-purple-600 border-purple-300 hover:bg-purple-50">
                            {converting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
                            Jadikan Invoice
                        </Button>
                    )}
                    {statusInfo.nextStatus && (
                        <Button onClick={() => handleUpdateStatus(statusInfo.nextStatus!)} className="bg-[#EB216A] hover:bg-[#d11d5e]">
                            <Send className="w-4 h-4 mr-2" /> {statusInfo.nextLabel}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Items */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Windows/Items */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold mb-4">Daftar Item</h3>

                        {/* Items List Rendering - Support both Raw/Rich view and Legacy/Simple view */}
                        {(rawItems && rawItems.length > 0) ? (
                            isBlindType() ? (
                                // BLIND GROUPING VIEW
                                (() => {
                                    // Group Items Logic
                                    const groupedItems = rawItems.reduce((groups, item) => {
                                        const groupId = item.groupId || `ungrouped-${item.id}`;
                                        if (!groups[groupId]) {
                                            groups[groupId] = [];
                                        }
                                        groups[groupId].push(item);
                                        return groups;
                                    }, {} as Record<string, any[]>);

                                    return (
                                        <div className="space-y-6">
                                            {Object.entries(groupedItems).map(([groupId, groupItems]) => {
                                                const items = groupItems as any[];
                                                const firstItem = items[0];
                                                const groupProduct = firstItem.product || baseFabric;
                                                const groupTotal = items.reduce((sum, item) => sum + calculateItemPriceRich(item).total, 0);

                                                return (
                                                    <div key={groupId} className="bg-white border rounded-xl shadow-sm overflow-hidden mb-6">
                                                        {/* Product Header */}
                                                        <div className="bg-gray-50 p-4 flex items-center justify-between border-b">
                                                            <div className="flex items-center gap-4">
                                                                <img
                                                                    src={getProductImageUrl(groupProduct?.images || groupProduct?.image)}
                                                                    className="w-16 h-16 rounded-lg object-cover bg-white border"
                                                                />
                                                                <div>
                                                                    <h3 className="font-bold text-lg text-gray-900">{groupProduct?.name || 'Produk Custom'}</h3>
                                                                    <p className="text-[#EB216A] font-medium">Rp {(groupProduct?.price ?? 0).toLocaleString('id-ID')}/m</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Items Table */}
                                                        <div className="p-4">
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr className="bg-gray-50 text-gray-600 border-b">
                                                                            <th className="py-2 px-3 text-left font-medium">Label</th>
                                                                            <th className="py-2 px-3 text-center font-medium">L x T (cm)</th>
                                                                            <th className="py-2 px-3 text-center font-medium">Vol (m²)</th>
                                                                            <th className="py-2 px-3 text-right font-medium">Harga Satuan</th>
                                                                            <th className="py-2 px-3 text-center font-medium">Disc (%)</th>
                                                                            <th className="py-2 px-3 text-right font-medium">Harga Net</th>
                                                                            <th className="py-2 px-3 text-center font-medium">Qty</th>
                                                                            <th className="py-2 px-3 text-right font-medium">Total</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100">
                                                                        {items.map((item) => {
                                                                            const prices = calculateItemPriceRich(item);
                                                                            return (
                                                                                <tr key={item.id} className="hover:bg-gray-50/50">
                                                                                    <td className="py-3 px-3 relative">
                                                                                        <p className="font-medium text-gray-900">{item.name || '-'}</p>
                                                                                    </td>
                                                                                    <td className="py-3 px-3 text-center">
                                                                                        {item.width} x {item.height}
                                                                                    </td>
                                                                                    <td className="py-3 px-3 text-center text-gray-500">
                                                                                        {prices.fabricMeters.toFixed(2)}
                                                                                    </td>
                                                                                    <td className="py-3 px-3 text-right text-gray-600">
                                                                                        Rp {(prices.fabricPricePerMeter ?? 0).toLocaleString('id-ID')}
                                                                                    </td>
                                                                                    <td className="py-3 px-3 text-center text-gray-600">
                                                                                        {item.fabricDiscount ? `${item.fabricDiscount}%` : '-'}
                                                                                    </td>
                                                                                    <td className="py-3 px-3 text-right text-gray-700 bg-gray-50/50">
                                                                                        Rp {(prices.fabricPricePerMeter * (1 - (item.fabricDiscount || 0) / 100)).toLocaleString('id-ID')}
                                                                                    </td>
                                                                                    <td className="py-3 px-3 text-center font-medium">
                                                                                        {item.quantity}
                                                                                    </td>
                                                                                    <td className="py-3 px-3 text-right font-bold text-gray-900">
                                                                                        Rp {prices.total.toLocaleString('id-ID')}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                    <tfoot className="border-t border-gray-200">
                                                                        <tr>
                                                                            <td colSpan={7} className="py-3 px-3 text-right font-semibold text-gray-600">Subtotal Grup</td>
                                                                            <td className="py-3 px-3 text-right font-bold text-[#EB216A] text-lg">
                                                                                Rp {groupTotal.toLocaleString('id-ID')}
                                                                            </td>
                                                                        </tr>
                                                                    </tfoot>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()
                            ) : (
                                // Item Block View (Curtain / Legacy Style)
                                <div className="space-y-6 mt-6">
                                    {rawItems.map((item) => {
                                        const prices = calculateItemPriceRich(item);
                                        // Calculate Unit Prices for display
                                        // Use logic from Create Page:
                                        // Fabric
                                        const fabricNet = prices.fabric;
                                        const unitNet = fabricNet / item.quantity;

                                        return (
                                            <div key={item.id} className="border rounded-xl overflow-hidden shadow-sm bg-white">
                                                {/* ITEM HEADER */}
                                                <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-800 text-lg">
                                                            {item.quantity} {item.itemType === 'jendela' ? 'Jendela' : 'Pintu'}
                                                        </span>
                                                        <span className="text-gray-500 mx-2">|</span>
                                                        <span className="font-medium text-gray-700">
                                                            Ukuran {item.width}cm x {item.height}cm
                                                        </span>
                                                        <span className="text-gray-500 mx-2">|</span>
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                            {item.packageType === 'gorden-lengkap' ? 'Gorden Lengkap' : 'Gorden Saja'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* COMPONENT LIST (Card Style in Detail) */}
                                                <div className="p-4 space-y-3">
                                                    {/* Column Headers */}
                                                    <div className="flex items-center justify-between p-3 text-xs font-medium text-gray-500 border-b border-dashed mb-2">
                                                        <div className="flex-1">Produk</div>
                                                        <div className="flex items-center gap-6">
                                                            <div className="w-24 text-right">Harga</div>
                                                            <div className="w-16 text-center">Disc</div>
                                                            <div className="w-16 text-center">Qty</div>
                                                            <div className="w-28 text-right">Total</div>
                                                        </div>
                                                    </div>

                                                    {/* 1. Main Fabric Row */}
                                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <div className="w-12 h-8 flex items-center justify-center bg-gray-100 rounded text-xs font-bold text-gray-500">
                                                                ITEM
                                                            </div>
                                                            <span className="font-semibold text-gray-700 min-w-[120px]">
                                                                Gorden {item.product?.name || item.productName || 'Custom'}
                                                            </span>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600 border-l pl-3 ml-2">
                                                                <div className="flex flex-col leading-tight">
                                                                    <span className="font-medium text-gray-900 line-clamp-1">
                                                                        {item.selectedVariant?.name || item.product?.name || item.productName || 'Produk'}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-500">
                                                                        Varian: {item.selectedVariant?.name || item.variant || '-'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-6">
                                                            <div className="w-24 text-right">
                                                                <span className="text-sm font-medium text-gray-600">Rp {Math.round(unitNet).toLocaleString('id-ID')}</span>
                                                            </div>
                                                            <div className="w-16 flex justify-center text-sm text-gray-500">
                                                                {item.fabricDiscount ? `${item.fabricDiscount}%` : '-'}
                                                            </div>
                                                            <div className="w-16 text-center text-sm text-gray-700 font-medium">
                                                                {item.quantity}
                                                            </div>
                                                            <div className="w-28 text-right font-bold text-gray-900">
                                                                Rp {Math.round(fabricNet).toLocaleString('id-ID')}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 2. Components Rows */}
                                                    {item.packageType === 'gorden-lengkap' && item.components && typeof item.components === 'object' && Object.entries(item.components).map(([compId, comp]: [string, any], idx) => {
                                                        // comp has structure: { product: { id, name, price }, qty, discount }
                                                        const compTotal = (comp.product?.price || 0) * (comp.qty || 1) * (1 - (comp.discount || 0) / 100);
                                                        const compDiscount = comp.discount || 0;
                                                        const unitPriceGross = comp.product?.price || 0;

                                                        return (
                                                            <div key={compId} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                                                                <div className="flex items-center gap-3 flex-1">
                                                                    <div className="w-12 h-8 flex items-center justify-center bg-gray-100 rounded text-xs font-bold text-gray-500">
                                                                        #{idx + 1}
                                                                    </div>
                                                                    <span className="font-semibold text-gray-700 min-w-[120px]">
                                                                        {comp.product?.name || comp.name || 'Komponen'}
                                                                    </span>
                                                                    <div className="flex items-center gap-2 text-sm text-gray-600 border-l pl-3 ml-2">
                                                                        <div className="flex flex-col leading-tight">
                                                                            <span className="font-medium text-gray-900 line-clamp-1">{comp.product?.name || comp.name || '-'}</span>
                                                                            <span className="text-[10px] text-gray-500">Qty: {comp.qty || 1}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-6">
                                                                    <div className="w-24 text-right">
                                                                        <span className="text-sm font-medium text-gray-600">Rp {Math.round(unitPriceGross).toLocaleString('id-ID')}</span>
                                                                    </div>

                                                                    <div className="w-16 flex justify-center text-sm text-gray-500">
                                                                        {compDiscount ? `${compDiscount}%` : '-'}
                                                                    </div>

                                                                    <div className="w-16 text-center text-sm text-gray-700 font-medium">
                                                                        {comp.qty || '-'}
                                                                    </div>

                                                                    <div className="w-28 text-right font-bold text-gray-900">
                                                                        Rp {Math.round(compTotal).toLocaleString('id-ID')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* FOOTER per Item */}
                                                    <div className="flex justify-end pt-2 mt-2 border-t border-dashed">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-gray-500 font-medium">Subtotal</span>
                                                            <span className="text-[#EB216A] text-xl font-bold">Rp {Math.round(prices.total).toLocaleString('id-ID')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>)) : (
                            // Legacy View (Simple Flat List)
                            <div className="space-y-4">
                                {windows.length === 0 ? (
                                    <p className="text-center text-gray-400 py-8">Tidak ada item</p>
                                ) : (
                                    windows.map((window, idx) => (
                                        <div key={window.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                            {/* Window Header */}
                                            <div className="bg-gray-50 p-4 border-b border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-lg bg-[#EB216A]/10 text-[#EB216A] text-sm font-bold flex items-center justify-center">{idx + 1}</span>
                                                    <div>
                                                        <h4 className="font-semibold">{window.title}</h4>
                                                        <p className="text-sm text-gray-500">{window.size} • {window.fabricType}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Window Items */}
                                            <div className="p-4 space-y-3">
                                                {window.items.map((item) => (
                                                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                                                        <div>
                                                            <p className="font-medium">{item.name}</p>
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                {item.discount > 0 ? (
                                                                    <>
                                                                        <span>Rp {Number(item.price).toLocaleString('id-ID')} × {item.quantity}</span>
                                                                        <span className="text-green-600 font-medium">Disc {item.discount}%</span>
                                                                    </>
                                                                ) : (
                                                                    <span>Rp {Number(item.price).toLocaleString('id-ID')} × {item.quantity}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {item.discount > 0 && (
                                                                <span className="text-xs text-gray-400 line-through block">
                                                                    Rp {(Number(item.price) * item.quantity).toLocaleString('id-ID')}
                                                                </span>
                                                            )}
                                                            <span className="font-semibold">Rp {calculateItemTotal(item).toLocaleString('id-ID')}</span>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Window Subtotal */}
                                                <div className="flex justify-between items-center pt-2">
                                                    <span className="font-medium">Subtotal</span>
                                                    <span className="text-lg font-bold text-[#EB216A]">Rp {calculateWindowTotal(window).toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )
                                }
                            </div>
                        )}

                        {/* Grand Total */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-medium">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                            </div>
                            {formData.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Diskon ({formData.discount}%)</span>
                                    <span>- Rp {(calculateTotal() * formData.discount / 100).toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-bold pt-2 border-t">
                                <span>Total</span>
                                <span className="text-[#EB216A]">Rp {calculateGrandTotal().toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Info */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold">Data Customer</h3>
                        <div><span className="text-gray-500">Nama:</span> <span className="font-medium">{formData.customerName || '-'}</span></div>
                        <div><span className="text-gray-500">Telepon:</span> <span className="font-medium">{formData.customerPhone || '-'}</span></div>
                        <div><span className="text-gray-500">Email:</span> <span className="font-medium">{formData.customerEmail || '-'}</span></div>
                        <div><span className="text-gray-500">Alamat:</span> <span className="font-medium">{formData.customerAddress || '-'}</span></div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold">Informasi Dokumen</h3>
                        <div><span className="text-gray-500">Tanggal:</span> <span className="font-medium">{formatDate(doc.created_at || doc.createdAt)}</span></div>
                        <div><span className="text-gray-500">Berlaku Sampai:</span> <span className="font-medium">{formatDate(formData.validUntil)}</span></div>
                        {formData.referralCode && (
                            <div><span className="text-gray-500">Kode Referral:</span> <span className="font-medium">{formData.referralCode}</span></div>
                        )}
                    </div>

                    {/* Payment Terms & Notes */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                        <h3 className="font-semibold">Catatan</h3>
                        {formData.paymentTerms && <div><span className="text-gray-500">Syarat Pembayaran:</span><p className="mt-1">{formData.paymentTerms}</p></div>}
                        {formData.notes && <div><span className="text-gray-500">Catatan:</span><p className="mt-1">{formData.notes}</p></div>}
                    </div>
                </div>
            </div>
        </div >
    );
}
