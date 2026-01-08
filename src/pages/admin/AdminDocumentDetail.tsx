
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
        // Apply variant multiplier if component is configured to follow it
        const variantMultiplier = (comp.multiply_with_variant && selection.variantMultiplier)
            ? selection.variantMultiplier
            : 1;
        return priceBeforeDiscount * variantMultiplier * (1 - (selection.discount || 0) / 100);
    };

    const calculateItemPriceRich = (item: any) => {
        const product = item.product || baseFabric;
        if (!product || !calculatorSchema) return { fabric: 0, fabricMeters: 0, components: 0, total: 0, totalAfterItemDiscount: 0, fabricPricePerMeter: 0 };

        const widthM = item.width / 100;
        const heightM = item.height / 100;

        const fabricPricePerMeter = item.selectedVariant?.price ?? product.price;
        const variantMultiplier = item.selectedVariant?.quantity_multiplier || 1;

        let fabricPriceBeforeDiscount = 0;
        let fabricMeters = 0;

        // Check if this is Blind flow (simpler pricing)
        const isBlind = calculatorSchema.slug?.toLowerCase().includes('blind') || calculatorSchema.has_item_type === false;

        if (isBlind) {
            // BLIND FLOW: Price × Area (m²) × Qty
            fabricMeters = widthM * heightM; // Area in m²
            fabricPriceBeforeDiscount = fabricPricePerMeter * fabricMeters * item.quantity;
        } else if (variantMultiplier > 1) {
            // GORDEN FLOW with Multiplier: Price × Multiplier × Qty
            fabricPriceBeforeDiscount = fabricPricePerMeter * variantMultiplier * item.quantity;
            fabricMeters = 0;
        } else {
            // GORDEN FLOW standard: Area Calculation
            fabricMeters = widthM * (calculatorSchema.fabric_multiplier || 2.4) * heightM;
            fabricPriceBeforeDiscount = fabricMeters * fabricPricePerMeter * item.quantity;
        }

        const fabricPrice = fabricPriceBeforeDiscount * (1 - (item.fabricDiscount || 0) / 100);

        let componentsPrice = 0;
        if (item.packageType === 'gorden-lengkap' && calculatorSchema.components) {
            calculatorSchema.components.forEach((comp: any) => {
                const selection = item.components ? item.components[comp.id] : null;
                if (selection) {
                    // Pass variant multiplier to component calculation
                    const selectionWithMultiplier = { ...selection, variantMultiplier };
                    componentsPrice += calculateComponentPrice(item, comp, selectionWithMultiplier);
                }
            });
        }

        const subtotal = fabricPrice + componentsPrice;
        const totalAfterItemDiscount = subtotal * (1 - (item.itemDiscount || 0) / 100);

        return {
            fabric: fabricPrice,
            fabricBeforeDiscount: fabricPriceBeforeDiscount,
            fabricMeters,
            fabricPricePerMeter,
            components: componentsPrice,
            total: subtotal,
            totalAfterItemDiscount
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
                                                const groupDiscount = firstItem.groupDiscount || 0; // Get group discount
                                                const groupTotalRaw = items.reduce((sum, item) => sum + calculateItemPriceRich(item).total, 0);
                                                const groupTotalAfterGroupDisc = groupTotalRaw * (1 - groupDiscount / 100);

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
                                                                                        <p className="font-medium text-gray-900">
                                                                                            {(() => {
                                                                                                // Name Fix Logic
                                                                                                let displayName = item.name;

                                                                                                // If name is missing or broken (contains 'undefined'), try to reconstruct
                                                                                                if (!displayName || displayName.includes('undefined')) {
                                                                                                    if (item.selectedVariant) {
                                                                                                        // Try variant name first
                                                                                                        if (item.selectedVariant.name && !item.selectedVariant.name.includes('undefined')) {
                                                                                                            return `${item.itemType === 'jendela' ? 'Jendela' : 'Pintu'} (${item.selectedVariant.name})`;
                                                                                                        }

                                                                                                        // Fallback: Parse Attributes
                                                                                                        try {
                                                                                                            const attrs = typeof item.selectedVariant.attributes === 'string'
                                                                                                                ? JSON.parse(item.selectedVariant.attributes)
                                                                                                                : item.selectedVariant.attributes;

                                                                                                            if (attrs && Object.keys(attrs).length > 0) {
                                                                                                                // Format: "Warna: Gold, Motif: Bunga"
                                                                                                                const attrString = Object.entries(attrs)
                                                                                                                    .map(([k, v]) => `${k}: ${v}`).join(', ');
                                                                                                                return `${item.itemType === 'jendela' ? 'Jendela' : 'Pintu'} (${attrString})`;
                                                                                                            }
                                                                                                        } catch (e) { }
                                                                                                    }

                                                                                                    // Last Resort: Dimensions
                                                                                                    if (item.width && item.height) {
                                                                                                        return `${item.itemType === 'jendela' ? 'Jendela' : 'Pintu'} (${item.width}cm x ${item.height}cm)`;
                                                                                                    }
                                                                                                }

                                                                                                return displayName || '-';
                                                                                            })()}
                                                                                        </p>
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
                                                                            <td colSpan={7} className="py-3 px-3 text-right font-semibold text-gray-600">
                                                                                Subtotal Grup
                                                                                {groupDiscount > 0 && (
                                                                                    <span className="ml-2 text-green-600 text-xs font-normal">(Disc {groupDiscount}%)</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="py-3 px-3 text-right font-bold text-[#EB216A] text-lg">
                                                                                <div className="flex flex-col items-end">
                                                                                    {groupDiscount > 0 && (
                                                                                        <span className="text-xs text-gray-400 line-through font-normal">
                                                                                            Rp {groupTotalRaw.toLocaleString('id-ID')}
                                                                                        </span>
                                                                                    )}
                                                                                    <span>Rp {groupTotalAfterGroupDisc.toLocaleString('id-ID')}</span>
                                                                                </div>
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
                                // Item Block View (Curtain / Table Style like AdminDocumentCreate)
                                <div className="space-y-6 mt-6">
                                    {rawItems.map((item, itemIdx) => {
                                        // Find matching window for this item which has pre-calculated values
                                        const matchingWindow = windows.find(w => w.id === item.id);

                                        // Collect all rows: Use windows.items if available, else fallback to raw calculation
                                        const allRows: { type: string; name: string; variant?: string; priceGross: number; discount: number; priceNet: number; qty: number; total: number; image?: string }[] = [];

                                        if (matchingWindow && matchingWindow.items && matchingWindow.items.length > 0) {
                                            // ===== USE PRE-CALCULATED WINDOWS.ITEMS =====
                                            matchingWindow.items.forEach((wItem: any, idx: number) => {
                                                let displayName = wItem.name || '-';
                                                displayName = displayName.replace(/^Pilih\s+[^:]+:\s*/i, '');
                                                displayName = displayName.replace(/undefined/g, '-');

                                                allRows.push({
                                                    type: idx === 0 ? (item.product?.name || 'Gorden') : 'Komponen',
                                                    name: displayName,
                                                    priceGross: Math.round(wItem.price_gross || wItem.price || 0),
                                                    discount: wItem.discount || 0,
                                                    priceNet: Math.round(wItem.price_net || wItem.price || 0),
                                                    qty: wItem.quantity || 1,
                                                    total: Math.round(wItem.totalPrice || 0), // Use pre-calculated totalPrice
                                                    image: idx === 0 ? (item.product?.image || item.product?.images?.[0]) : undefined
                                                });
                                            });
                                        } else {
                                            // ===== FALLBACK: Calculate from raw_items =====
                                            const prices = calculateItemPriceRich(item);

                                            // FABRIC ROW
                                            const fabricGross = Number(item.selectedVariant?.price_gross) || Number(item.selectedVariant?.price) || Number(item.product?.price) || 0;
                                            const fabricNet = Number(item.selectedVariant?.price_net) || fabricGross;
                                            const fabricDiscount = item.fabricDiscount || (fabricGross > 0 ? Math.round(((fabricGross - fabricNet) / fabricGross) * 100) : 0);
                                            const variantMultiplier = item.selectedVariant?.quantity_multiplier || 1;
                                            const effectiveQty = variantMultiplier * item.quantity;
                                            const fabricTotal = prices.fabric || (fabricNet * effectiveQty);

                                            // Clean variant name
                                            let cleanVariantName = '-';
                                            if (item.selectedVariant) {
                                                try {
                                                    const attrs = typeof item.selectedVariant.attributes === 'string'
                                                        ? JSON.parse(item.selectedVariant.attributes)
                                                        : item.selectedVariant.attributes;
                                                    if (attrs && Object.keys(attrs).length > 0) {
                                                        cleanVariantName = Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ');
                                                    } else if (item.selectedVariant.name && !item.selectedVariant.name.includes('undefined')) {
                                                        cleanVariantName = item.selectedVariant.name;
                                                    }
                                                } catch (e) {
                                                    if (item.selectedVariant.name && !item.selectedVariant.name.includes('undefined')) {
                                                        cleanVariantName = item.selectedVariant.name;
                                                    }
                                                }
                                            }

                                            allRows.push({
                                                type: item.product?.name || item.productName || 'Gorden',
                                                name: `${item.product?.name || item.productName || 'Gorden Custom'} (${cleanVariantName})`,
                                                variant: cleanVariantName,
                                                priceGross: Math.round(fabricGross),
                                                discount: fabricDiscount,
                                                priceNet: Math.round(fabricNet),
                                                qty: effectiveQty,
                                                total: Math.round(fabricTotal),
                                                image: item.product?.image || item.product?.images?.[0]
                                            });

                                            // Add Component Rows
                                            if (item.packageType === 'gorden-lengkap' && item.components) {
                                                const componentsList = Array.isArray(item.components)
                                                    ? item.components
                                                    : Object.values(item.components);

                                                componentsList.forEach((comp: any) => {
                                                    const compGross = Number(comp.productPriceGross) || Number(comp.productPrice) || Number(comp.product?.price_gross) || Number(comp.product?.price) || 0;
                                                    const compNet = Number(comp.productPriceNet) || Number(comp.product?.price_net) || compGross;
                                                    const effectiveCompDiscount = comp.discount || (compGross > 0 ? Math.round(((compGross - compNet) / compGross) * 100) : 0);
                                                    // If displayQty is missing (legacy data), calculate it: selection.qty * item.quantity (window count)
                                                    // This assumes components in a package always scale with the number of windows
                                                    const compQty = comp.displayQty || ((comp.qty || 1) * item.quantity);
                                                    const compTotal = comp.componentTotal || (compNet * compQty);
                                                    const compName = comp.productName || comp.product?.name || comp.name || 'Komponen';
                                                    const compLabel = comp.label || 'Komponen';
                                                    const compImage = comp.productImage || comp.product?.image || comp.productImages?.[0] || comp.product?.images?.[0];

                                                    allRows.push({
                                                        type: compLabel,
                                                        name: compName,
                                                        priceGross: Math.round(compGross),
                                                        discount: effectiveCompDiscount,
                                                        priceNet: Math.round(compNet),
                                                        qty: compQty,
                                                        total: Math.round(compTotal),
                                                        image: compImage
                                                    });
                                                });
                                            }
                                        }

                                        return (
                                            <div key={item.id} className="border rounded-lg overflow-hidden bg-white">
                                                {/* ITEM HEADER */}
                                                <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-8 h-8 rounded-full bg-[#EB216A] text-white flex items-center justify-center text-sm font-bold">
                                                            {item.quantity}
                                                        </span>
                                                        <span className="font-bold text-gray-800">
                                                            {item.itemType === 'jendela' ? 'Jendela' : 'Pintu'} - {item.packageType === 'gorden-lengkap' ? 'Paket Lengkap' : 'Kain Saja'}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {item.width} cm × {item.height} cm
                                                    </span>
                                                </div>

                                                {/* TABLE */}
                                                <div className="p-4">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="text-gray-500 text-xs border-b">
                                                                <th className="py-2 px-2 text-left font-medium">Produk</th>
                                                                <th className="py-2 px-2 text-right font-medium w-24">Harga</th>
                                                                <th className="py-2 px-2 text-center font-medium w-16">Disc(%)</th>
                                                                <th className="py-2 px-2 text-right font-medium w-24">Harga Net</th>
                                                                <th className="py-2 px-2 text-center font-medium w-12">Qty</th>
                                                                <th className="py-2 px-2 text-right font-medium w-28">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {allRows.map((row, rowIdx) => (
                                                                <tr key={rowIdx} className="hover:bg-gray-50/50">
                                                                    <td className="py-3 px-2">
                                                                        <div className="flex items-center gap-3">
                                                                            {row.image && (
                                                                                <img
                                                                                    src={getProductImageUrl(row.image)}
                                                                                    className="w-10 h-10 rounded object-cover border"
                                                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                                />
                                                                            )}
                                                                            <div className="flex flex-col">
                                                                                <span className="text-xs text-[#EB216A] font-medium uppercase">{row.type}</span>
                                                                                <span className="font-medium text-gray-900">{row.name}</span>
                                                                                {row.variant && row.variant !== row.name && (
                                                                                    <span className="text-xs text-gray-500">{row.variant}</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-2 text-right text-gray-600">
                                                                        Rp {row.priceGross.toLocaleString('id-ID')}
                                                                    </td>
                                                                    <td className="py-3 px-2 text-center">
                                                                        {row.discount > 0 ? (
                                                                            <span className="text-green-600 font-medium">{row.discount}</span>
                                                                        ) : (
                                                                            <span className="text-gray-400">-</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-2 text-right text-gray-700">
                                                                        Rp {row.priceNet.toLocaleString('id-ID')}
                                                                    </td>
                                                                    <td className="py-3 px-2 text-center font-medium">
                                                                        {row.qty}
                                                                    </td>
                                                                    <td className="py-3 px-2 text-right font-bold text-gray-900">
                                                                        Rp {row.total.toLocaleString('id-ID')}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>

                                                    {/* FOOTER per Item */}
                                                    {(() => {
                                                        // Use pre-calculated subtotal from window if available
                                                        let subtotalAfterDiscount;
                                                        if (matchingWindow && matchingWindow.subtotal !== undefined) {
                                                            // Use the pre-calculated subtotal which was correctly computed during save
                                                            subtotalAfterDiscount = matchingWindow.subtotal;
                                                        } else {
                                                            // Fallback: calculate from allRows (may be inaccurate for old data)
                                                            const rowsTotal = allRows.reduce((sum, r) => sum + r.total, 0);
                                                            const itemDiscount = item.itemDiscount || 0;
                                                            subtotalAfterDiscount = rowsTotal * (1 - itemDiscount / 100);
                                                        }

                                                        return (
                                                            <div className="flex justify-between items-center pt-3 mt-3 border-t">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-gray-500">Diskon Item:</span>
                                                                    <span className="text-sm font-medium">{item.itemDiscount || 0}%</span>
                                                                </div>
                                                                <div className="flex items-center gap-4">
                                                                    <span className="text-gray-500 font-medium">Subtotal</span>
                                                                    <span className="text-[#EB216A] text-xl font-bold">Rp {Math.round(subtotalAfterDiscount).toLocaleString('id-ID')}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
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
