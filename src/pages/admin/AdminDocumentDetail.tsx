
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

interface ComponentFromDB {
    id: number;
    calculator_type_id: number;
    subcategory_id: number;
    label: string;
    is_required: boolean;
    price_calculation: 'per_meter' | 'per_unit' | 'per_10_per_meter';
    display_order: number;
}

interface CalculatorTypeFromDB {
    id: number;
    name: string;
    slug: string;
    description: string;
    has_item_type: boolean;
    has_package_type: boolean;
    fabric_multiplier: number;
    is_active: boolean;
    components: ComponentFromDB[];
}

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
            console.log('Document API response:', response);
            if (response.success && response.data) {
                const docData = response.data;
                console.log('Document data:', docData);
                console.log('Document data.data:', docData.data);
                setDoc(docData);

                // Parse quotation data - may be double-serialized JSON (string of string)
                let quotationData: any = docData.data || docData.quotationData || {};

                // Keep parsing until we get an actual object (handles double/triple serialization)
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
                console.log('Parsed quotationData:', quotationData, 'windows:', quotationData?.windows);
                console.log('Address fields:', 'address=', docData.address, 'customer_address=', docData.customer_address);
                console.log('Date fields:', 'created_at=', docData.created_at, 'createdAt=', docData.createdAt);

                // Set form data
                setFormData({
                    customerName: docData.customer_name || '',
                    customerPhone: docData.customer_phone || '',
                    customerEmail: docData.customer_email || '',
                    customerAddress: docData.address || docData.customer_address || '',
                    referralCode: docData.referral_code || '',
                    discount: (() => {
                        // Priority 1: Saved in quotation data (New Docs)
                        if (quotationData.discount !== undefined) return quotationData.discount;
                        // Priority 2: Saved in document column (Legacy 1)
                        if (docData.discount || docData.discount_percentage) return docData.discount || docData.discount_percentage;
                        // Priority 3: Reverse calculate from values (Legacy 2)
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
                    // Fetch schema if available to get labels
                    if (quotationData.calculatorTypeSlug) {
                        try {
                            // Find schema by slug (requires fetching all or specific endpoint if exists)
                            // For now, let's fetch all and find matching slug, or use ID if available in future
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
                            // Rich View (Calculator Style)
                            <div className="space-y-4">
                                {rawItems.map((item, idx) => {
                                    const window = windows[idx];
                                    if (!window) return null;

                                    // Find fabric and component items in the flattened window items
                                    const fabricItem = window.items.find(i => i.id.endsWith('-fabric'));
                                    const componentItems = window.items.filter(i => i.id.includes('-comp-'));

                                    // Calculate fabric prices for display
                                    const fabricTotalPrice = fabricItem ? calculateItemTotal(fabricItem) : 0;
                                    const fabricOriginalTotal = fabricItem ? (Number(fabricItem.price) * (fabricItem.quantity || 1)) : 0; // Note: fabric qty is meters? No, window items qty is usually item count? Wait, fabric item qty IS fabric meters in some logic, or item count? In Create: qty = item.quantity (window count). name has (Xm). price is unit price. So Original Total = Price * Qty? NO.
                                    // In Create: totalPrice = prices.fabric (which is width * panels * 2.5 * fabricPrice).
                                    // So fabricItem.price is Unit Price / m.
                                    // But fabricItem.quantity is NUMBER OF WINDOWS (e.g. 1).
                                    // So fabricItem.totalPrice is correct.
                                    // But to reverse engineer "Original Price" we need: fabricTotalPrice / (1 - discount/100).
                                    const fabricRealOriginal = fabricItem && fabricItem.discount > 0 ? (fabricTotalPrice / (1 - fabricItem.discount / 100)) : fabricTotalPrice;

                                    return (
                                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                            {/* Header */}
                                            <div className="bg-gray-50 p-3 border-b border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-lg bg-[#EB216A]/10 text-[#EB216A] text-sm font-bold flex items-center justify-center">{idx + 1}</span>
                                                    <div>
                                                        <h4 className="font-semibold">{item.itemType === 'jendela' ? 'Jendela' : 'Pintu'} - {item.packageType === 'gorden-lengkap' ? 'Paket Lengkap' : 'Gorden Saja'}</h4>
                                                        <p className="text-sm text-gray-500">Ukuran {item.width}cm × {item.height}cm • {item.panels} panel • {item.quantity} unit</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 space-y-3">
                                                {/* Fabric Row */}
                                                {fabricItem && (
                                                    <div className="flex justify-between items-start py-2 border-b border-gray-100">
                                                        <div className="flex items-start gap-3">
                                                            {item.selectedVariant?.image ? (
                                                                <img src={getProductImageUrl(item.selectedVariant.image)} className="w-12 h-12 rounded object-cover bg-gray-100" alt="" />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">IMG</div>
                                                            )}
                                                            <div>
                                                                <p className="font-medium">{fabricItem.name}</p>
                                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                    <span>Rp {Number(fabricItem.price).toLocaleString('id-ID')}</span>
                                                                    {fabricItem.discount > 0 && <span className="text-green-600 font-medium">Disc {fabricItem.discount}%</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {fabricItem.discount > 0 && (
                                                                <span className="text-xs text-gray-400 line-through block">Rp {fabricRealOriginal.toLocaleString('id-ID')}</span>
                                                            )}
                                                            <span className="font-semibold text-lg">Rp {fabricTotalPrice.toLocaleString('id-ID')}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Components Rows */}
                                                {Object.entries(item.components || {}).map(([compId, selection]: [string, any]) => {
                                                    // Find matching window item to get final calculated price
                                                    const winItem = componentItems.find(i => i.id === `${item.id}-comp-${compId}`);
                                                    if (!winItem || !selection) return null;

                                                    const compTotal = calculateItemTotal(winItem);
                                                    const compOriginal = winItem.discount > 0 ? (compTotal / (1 - winItem.discount / 100)) : compTotal;

                                                    // Get label from schema if available, else use name parsing or default
                                                    let label = 'Sub-Komponen';
                                                    if (calculatorSchema && calculatorSchema.components) {
                                                        const compDef = calculatorSchema.components.find((c: any) => c.id === parseInt(compId));
                                                        if (compDef) label = compDef.label;
                                                    } else {
                                                        // Fallback: parse from name "Label: Product Name"
                                                        if (winItem.name.includes(':')) label = winItem.name.split(':')[0];
                                                    }

                                                    return (
                                                        <div key={compId} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0 pl-14"> {/* Indented to align with text */}
                                                            <div>
                                                                <p className="font-medium text-sm text-gray-600">{label}: <span className="text-gray-900">{selection.product.name}</span></p>
                                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                                    <span>Qty: {selection.qty}</span>
                                                                    {selection.discount > 0 && <span className="text-green-600 font-medium">Disc {selection.discount}%</span>}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                {selection.discount > 0 && (
                                                                    <span className="text-xs text-gray-400 line-through block">Rp {compOriginal.toLocaleString('id-ID')}</span>
                                                                )}
                                                                <span className="font-semibold">Rp {compTotal.toLocaleString('id-ID')}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Window Subtotal */}
                                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                                                    <span className="font-medium text-sm">Subtotal</span>
                                                    <span className="text-lg font-bold text-[#EB216A]">Rp {calculateWindowTotal(window).toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
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
                                )}
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
        </div>
    );
}
