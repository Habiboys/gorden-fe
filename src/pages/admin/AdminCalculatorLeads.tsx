import {
  Calendar,
  Download,
  Eye,
  FileText,
  Filter,
  Mail,
  Phone,
  Ruler,
  Search,
  ShoppingCart,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { QuotationPreview } from '../../components/QuotationPreview';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useConfirm } from '../../context/ConfirmContext';
import { calculatorLeadsApi, documentsApi } from '../../utils/api';
import { exportToCSV } from '../../utils/exportHelper';

// Mock data - nanti akan dari localStorage atau database
const mockLeads = [
  {
    id: 1,
    name: 'Budi Santoso',
    phone: '081234567890',
    email: 'budi@email.com',
    calculatorType: 'Smokering',
    estimatedPrice: 2856000,
    submittedAt: '2024-01-15 14:30',
    status: 'new',
    calculation: {
      product: {
        name: 'Fabric Only Sharp point Solar Screw seri 4000',
        sku: 'GRD-4000-BLK',
        category: 'Gorden Custom'
      },
      dimensions: {
        width: 3,
        height: 2.5,
        area: 7.5
      },
      components: [
        {
          name: 'Kain Gorden',
          type: 'Premium Blackout Solar Screw',
          quantity: 7.5,
          unit: 'm²',
          pricePerUnit: 223200,
          subtotal: 1674000
        },
        {
          name: 'Rel Gorden',
          type: 'Aluminium Single Track 3m',
          quantity: 1,
          unit: 'set',
          pricePerUnit: 450000,
          subtotal: 450000
        },
        {
          name: 'Tassel',
          type: 'Tassel Premium Gold',
          quantity: 2,
          unit: 'pcs',
          pricePerUnit: 125000,
          subtotal: 250000
        },
        {
          name: 'Hook',
          type: 'Hook Besi Premium',
          quantity: 30,
          unit: 'pcs',
          pricePerUnit: 8000,
          subtotal: 240000
        },
        {
          name: 'Vitrase',
          type: 'Kain Vitrase Sheer White',
          quantity: 7.5,
          unit: 'm²',
          pricePerUnit: 85000,
          subtotal: 637500,
          isOptional: true
        },
        {
          name: 'Rel Vitrase',
          type: 'Rel Vitrase Aluminium',
          quantity: 1,
          unit: 'set',
          pricePerUnit: 180000,
          subtotal: 180000,
          isOptional: true
        }
      ],
      installation: {
        type: 'Ukur & Pasang Teknisi',
        price: 350000
      },
      notes: 'Customer request pemasangan weekend, prefer warna cream untuk tassel'
    }
  },
  {
    id: 2,
    name: 'Siti Nurhaliza',
    phone: '082345678901',
    email: 'siti@email.com',
    calculatorType: 'Kupu-kupu',
    estimatedPrice: 4250000,
    submittedAt: '2024-01-16 10:15',
    status: 'contacted',
    calculation: {
      product: {
        name: 'Velvet Luxury Premium Series',
        sku: 'GRD-VLV-001',
        category: 'Gorden Custom'
      },
      dimensions: {
        width: 4,
        height: 3,
        area: 12
      },
      components: [
        {
          name: 'Kain Gorden',
          type: 'Velvet Luxury Maroon',
          quantity: 12,
          unit: 'm²',
          pricePerUnit: 285000,
          subtotal: 3420000
        },
        {
          name: 'Rel Gorden',
          type: 'Bracket Manual Double Track 4m',
          quantity: 1,
          unit: 'set',
          pricePerUnit: 550000,
          subtotal: 550000
        },
        {
          name: 'Tassel',
          type: 'Tassel Gold Luxury',
          quantity: 2,
          unit: 'pcs',
          pricePerUnit: 180000,
          subtotal: 360000
        },
        {
          name: 'Hook',
          type: 'Hook Premium Stainless',
          quantity: 40,
          unit: 'pcs',
          pricePerUnit: 12000,
          subtotal: 480000
        }
      ],
      installation: {
        type: 'Ukur Sendiri + Pasang Teknisi',
        price: 250000
      },
      notes: 'Prefer jadwal pagi hari untuk pemasangan'
    }
  },
  {
    id: 3,
    name: 'Ahmad Hidayat',
    phone: '083456789012',
    email: 'ahmad@email.com',
    calculatorType: 'Blind',
    estimatedPrice: 1850000,
    submittedAt: '2024-01-17 16:45',
    status: 'quoted',
    calculation: {
      product: {
        name: 'Modern Roller Blind Premium',
        sku: 'BLD-RLR-2024',
        category: 'Blind'
      },
      dimensions: {
        width: 2,
        height: 2,
        area: 4
      },
      components: [
        {
          name: 'Blind Material',
          type: 'Blackout Roller Blind',
          quantity: 4,
          unit: 'm²',
          pricePerUnit: 350000,
          subtotal: 1400000
        },
        {
          name: 'Sistem Kontrol',
          type: 'Motorized Remote Control',
          quantity: 1,
          unit: 'set',
          pricePerUnit: 650000,
          subtotal: 650000
        }
      ],
      installation: {
        type: 'Ukur & Pasang Teknisi',
        price: 200000
      },
      notes: 'Request instalasi minggu depan'
    }
  }
];

const statusConfig = {
  new: { label: 'Baru', color: 'bg-blue-500' },
  contacted: { label: 'Dihubungi', color: 'bg-yellow-500' },
  quoted: { label: 'Penawaran Terkirim', color: 'bg-green-500' },
  closed: { label: 'Deal', color: 'bg-purple-500' },
  rejected: { label: 'Reject', color: 'bg-red-500' }
};

// Helper function to format currency - handles string values from database DECIMAL type
const formatRupiah = (value: any): string => {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('id-ID');
};

export default function AdminCalculatorLeads() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showQuotation, setShowQuotation] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();

  // Fetch leads from backend
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Fetch leads from backend
  const fetchLeads = async (page = 1) => {
    try {
      setLoading(true);
      console.log('🔄 Fetching calculator leads from backend...');
      const response = await calculatorLeadsApi.getAll({
        page,
        limit: pagination.itemsPerPage,
        status: filterStatus !== 'all' ? filterStatus : undefined
      });
      console.log('✅ Calculator leads fetched:', response);

      // Handle both old (array) and new (paginated object) response structures
      const leadsData = Array.isArray(response.data) ? response.data : [];
      const paginationData = response.pagination || {
        page: 1,
        totalPages: 1,
        total: leadsData.length,
        limit: 10
      };

      // Parse calculation_data if it's a string (JSON)
      const parsedLeads = leadsData.map((lead: any) => {
        if (lead.calculation_data && typeof lead.calculation_data === 'string') {
          try {
            lead.calculation_data = JSON.parse(lead.calculation_data);
          } catch (e) {
            console.warn('Failed to parse calculation_data for lead:', lead.id);
          }
        }
        return lead;
      });

      setLeads(parsedLeads);
      setPagination({
        currentPage: paginationData.page,
        totalPages: paginationData.totalPages,
        totalItems: paginationData.total,
        itemsPerPage: paginationData.limit
      });
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Gagal mengambil data leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1);
  }, [filterStatus]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchLeads(newPage);
    }
  };

  // Add sample test data function
  const handleAddTestData = async () => {
    const isConfirmed = await confirm({
      title: 'Tambah Data Test',
      description: 'Tambahkan data test ke database?',
      confirmText: 'Ya, Tambahkan',
      cancelText: 'Batal',
    });

    if (!isConfirmed) return;

    const testLead = {
      customerName: 'Budi Santoso (Test)',
      customerPhone: '081234567890',
      calculatorType: 'smokering',
      productName: 'Gorden Blackout Premium',
      productPrice: 125000,
      items: [
        {
          width: 300,
          height: 250,
          quantity: 1,
          totalPrice: 2500000,
        }
      ],
      grandTotal: 2500000,
      totalItems: 1,
      totalUnits: 1,
    };

    try {
      console.log('➕ Adding test lead...');
      const response = await calculatorLeadsApi.submit(testLead);
      console.log('✅ Test lead added:', response);

      // Refresh the list
      const updatedResponse = await calculatorLeadsApi.getAll();
      setLeads(updatedResponse.data || []);

      toast.success('✅ Data test berhasil ditambahkan!');
    } catch (error: any) {
      console.error('❌ Error adding test lead:', error);
      toast.error('Error adding test data: ' + error.message);
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchSearch = lead.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.customerPhone?.includes(searchTerm) ||
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm);
    const matchStatus = filterStatus === 'all' || lead.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      toast.error('Tidak ada data untuk diexport');
      return;
    }

    const dataToExport = filteredLeads.map(lead => ({
      'ID': lead.id,
      'Tanggal': lead.createdAt ? new Date(lead.createdAt).toLocaleString('id-ID') : lead.submittedAt,
      'Nama Customer': lead.customerName || lead.name,
      'Telepon': lead.customerPhone || lead.phone,
      'Email': lead.customerEmail || lead.email || '-',
      'Tipe Kalkulator': lead.calculatorType || lead.calculator_type || 'Unknown',
      'Estimasi Harga': lead.grandTotal || lead.estimatedPrice || lead.estimated_price || 0,
      'Status': (statusConfig as any)[lead.status]?.label || lead.status,
      'Total Item': lead.calculation_data?.items?.length || lead.totalItems || 0,
      'Total Unit': lead.calculation_data?.items?.reduce((s: number, i: any) => s + (i.quantity || 0), 0) || lead.totalUnits || 0
    }));

    exportToCSV(dataToExport, `calculator-leads-${new Date().toISOString().split('T')[0]}`);
    toast.success('Data berhasil didownload');
  };

  // Create real document from lead
  const handleCreateDocument = async (lead: any) => {
    const isConfirmed = await confirm({
      title: 'Buat Draft Penawaran',
      description: `Buat dokumen penawaran resmi untuk ${lead.customerName || lead.name}? Anda akan diarahkan ke halaman editor.`,
      confirmText: 'Ya, Buat Dokumen',
      cancelText: 'Batal'
    });

    if (!isConfirmed) return;

    try {
      const quotationData = convertToQuotation(lead); // Reuse existing conversion logic but adapt for payload

      // Prepare Payload for API
      const payload = {
        type: 'QUOTATION',
        customer_name: lead.customerName || lead.name,
        customer_phone: lead.customerPhone || lead.phone,
        customer_email: lead.customerEmail || lead.email || null,
        customer_address: null, // Lead doesn't usually have address
        discount_percentage: 0,
        valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days
        total_amount: quotationData.amount,
        status: 'DRAFT',
        data: quotationData.quotationData // This contains windows, items, paymentTerms, etc.
      };

      console.log('Creating document from lead:', payload);
      const response = await documentsApi.create(payload);

      if (response.success && response.data) {
        toast.success('Draft Penawaran berhasil dibuat!');
        // Update lead status
        await calculatorLeadsApi.updateStatus(lead.id, 'quoted');
        // Navigate to Edit Page
        navigate(`/admin/documents/edit/${response.data.id}`);
      } else {
        throw new Error(response.message || 'Gagal membuat dokumen');
      }
    } catch (error: any) {
      console.error('Error creating document:', error);
      toast.error('Gagal membuat dokumen: ' + error.message);
    }
  };

  const handleSendQuote = (lead: any) => {
    handleCreateDocument(lead); // Redirect to Create Doc logic
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Lead',
      description: 'Apakah Anda yakin ingin menghapus data ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'destructive',
    });

    if (!isConfirmed) {
      return;
    }

    try {
      console.log('🗑️ Deleting lead:', id);
      await calculatorLeadsApi.delete(id);
      console.log('✅ Lead deleted successfully');

      // Remove from local state
      setLeads(leads.filter(lead => lead.id !== id));
      toast.success('✅ Data berhasil dihapus!');
    } catch (error: any) {
      console.error('❌ Error deleting lead:', error);
      toast.error('Error deleting lead: ' + error.message);
    }
  };

  const convertToQuotation = (lead: any) => {
    const calcData = lead.calculation_data || lead.calculation || {};
    const calcItems = calcData.items || [];
    const fabric = calcData.fabric || {};

    // Transform calcItems to the CalculatorItem format expected by AdminDocumentCreate
    // CalculatorPage saves: dimensions.width, dimensions.height, components[] array
    // AdminDocumentCreate expects: width, height, components{} object keyed by componentId
    // For Blind, we want to group by Product ID
    const isBlind = (calcData.calculatorType?.slug || '').toLowerCase().includes('blind') ||
      (lead.calculator_type || '').toLowerCase().includes('blind');

    const transformedItems = calcItems.map((item: any, idx: number) => {
      // Transform components array to object
      const componentsObj: any = {};
      (item.components || []).forEach((comp: any) => {
        componentsObj[comp.componentId] = {
          product: {
            id: comp.productId,
            name: comp.productName,
            price: comp.productPrice
          },
          qty: comp.qty || 1,
          discount: comp.discount || 0
        };
      });

      // Determine product first to use ID for grouping
      const product = item.product || {
        id: fabric.id,
        name: item.fabricName || fabric.name,
        price: item.fabricPricePerMeter || fabric.price
      };

      // Preserve original groupId from lead data
      // Only generate fallback if truly missing (for legacy data without groupId)
      // Use unique fallback per item to avoid unintended merging
      const groupId = item.groupId || (isBlind ? `blind-fallback-${Date.now()}-${idx}` : undefined);

      return {
        id: item.id || String(Date.now() + idx),
        groupId: groupId || undefined,
        itemType: item.itemType || 'jendela',
        packageType: item.packageType || 'gorden-lengkap',
        name: item.name || undefined,
        // Transform: use product from lead OR reconstruct from fabric
        product: product,
        // Transform: dimensions object to direct properties
        width: item.dimensions?.width || item.width || 0,
        height: item.dimensions?.height || item.height || 0,
        panels: item.dimensions?.panels || item.panels || 2,
        quantity: item.quantity || 1,
        fabricDiscount: item.fabricDiscount || 0,
        itemDiscount: item.itemDiscount || 0,
        // Transform: array to object
        components: componentsObj,
        // Preserve selectedVariant if exists
        selectedVariant: item.selectedVariant || undefined
      };
    });

    return {
      amount: calcData.grandTotal || lead.estimated_price || 0,
      quotationData: {
        raw_items: transformedItems, // Now in correct format for AdminDocumentCreate
        calculatorType: calcData.calculatorType?.name || lead.calculator_type || 'Smokering',
        calculatorTypeSlug: calcData.calculatorType?.slug,
        baseFabric: {
          id: fabric.id,
          name: fabric.name,
          price: fabric.price,
          image: fabric.image
        },
        windows: calcItems.map((item: any, idx: number) => {
          // Reconstruct window items for legacy view / PDF generation
          const winItems = [];

          // Fabric Item
          const fabricPrice = item.fabricPrice || item.subtotal || 0;
          winItems.push({
            id: `${item.id}-fabric`,
            name: `${item.selectedVariant?.name || item.fabricName || fabric.name || 'Kain'} (${(item.fabricMeters || 0).toFixed(2)}m)`,
            price: item.fabricPricePerMeter || fabric.price || 0,
            discount: item.fabricDiscount || 0,
            quantity: item.quantity || 1,
            totalPrice: fabricPrice
          });

          // Component Items
          (item.components || []).forEach((comp: any) => {
            winItems.push({
              id: `${item.id}-comp-${comp.componentId}`,
              name: `${comp.label}: ${comp.productName}`,
              price: comp.productPrice || 0,
              discount: comp.discount || 0,
              quantity: comp.qty || 1,
              totalPrice: (comp.productPrice || 0) * (comp.qty || 1)
            });
          });

          return {
            id: item.id || String(idx + 1),
            title: `${idx + 1} ${item.itemType === 'jendela' ? 'Jendela' : 'Pintu'}`,
            size: `Ukuran ${item.dimensions?.width || item.width || 0}cm x ${item.dimensions?.height || item.height || 0}cm`,
            fabricType: item.packageType === 'gorden-lengkap' ? 'Gorden Lengkap' : 'Gorden Saja',
            items: winItems,
            subtotal: item.subtotal || 0
          };
        }),
        paymentTerms: 'Bank BRI 0763 0100 1160 564 a.n ABDUL RAHIM',
        notes: calcData.notes || 'Terima kasih atas kepercayaannya'
      }
    };
  };

  const handleWhatsAppClick = (lead: any) => {
    const customerName = lead.customerName || lead.name;
    let phone = lead.customerPhone || lead.phone;
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }

    const calcData = lead.calculation_data || {};
    const items = calcData.items || [];
    const currentType = lead.calculatorType || calcData.calculatorType || { name: 'Gorden' };
    const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let message = `*ESTIMASI ORDER GORDEN*\n`;
    message += `Tanggal: ${date}\n`;
    message += `Jenis: ${currentType.name}\n\n`;

    message += `*DATA PEMESAN*\n`;
    message += `Nama: ${customerName}\n`;
    message += `No. HP: ${phone}\n`;
    message += `------------------------------\n\n`;

    // Group Items (Universal Grouping)
    const groups: { [key: string]: any[] } = {};
    items.forEach((item: any) => {
      const groupKey = item.groupId || item.product?.id || 'default';
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(item);
    });

    Object.values(groups).forEach((groupItems) => {
      const firstItem = groupItems[0];
      const productName = firstItem.product?.name || firstItem.fabricName || calcData.fabric?.name || 'Produk';
      const productPrice = firstItem.product?.price || firstItem.fabricPricePerMeter || calcData.fabric?.price || 0;

      const groupTotal = groupItems.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);

      message += `*PRODUK: ${productName}*\n`;
      message += `Harga: Rp ${formatRupiah(productPrice)}/m\n\n`;

      message += `*DAFTAR ITEM & UKURAN:*\n`;
      groupItems.forEach((item: any, idx: number) => {
        const w = item.width || item.dimensions?.width || 0;
        const h = item.height || item.dimensions?.height || 0;
        const qty = item.quantity || 1;
        const sub = item.subtotal || 0;
        const type = item.itemType === 'pintu' ? 'Pintu' : 'Jendela';

        message += `${idx + 1}. ${type} ${w}cm x ${h}cm\n`;
        message += `   Jumlah: ${qty} unit\n`;

        // Variant
        if (item.selectedVariant) {
          message += `   - Varian: ${item.selectedVariant.name}\n`;
        }

        // Components logic handles both Array (DB) and Object (Frontend) structures
        if (item.components) {
          const comps = Array.isArray(item.components) ? item.components : Object.values(item.components);

          comps.forEach((comp: any) => {
            // Admin/DB structure usually has 'productName' and 'label'
            // Frontend structure has 'product.name' and 'label' derived from currentType
            const label = comp.label || 'Komponen';
            const name = comp.productName || comp.product?.name || comp.name;
            const cQty = comp.qty || comp.quantity || 1;

            if (name) {
              message += `   - ${label}: ${name} (${cQty}x)\n`;
            }
          });
        }

        message += `   Total: Rp ${formatRupiah(sub)}\n\n`;
      });

      message += `Subtotal Group: *Rp ${formatRupiah(groupTotal)}*\n`;
      message += `------------------------------\n\n`;
    });

    const total = lead.grandTotal || lead.estimatedPrice || lead.estimated_price || 0;
    message += `*TOTAL ESTIMASI: Rp ${formatRupiah(total)}*\n\n`;
    message += `Apakah Anda ingin melanjutkan ke proses pemesanan?`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#EB216A] mb-4"></div>
          <p className="text-gray-600">Loading calculator leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl text-gray-900">Database Kalkulator</h1>
          <p className="text-gray-600 mt-1">Kelola data pelanggan yang menggunakan kalkulator gorden</p>
        </div>
        <div className="flex gap-2">
          {/* Test Data Button - Only show if no leads exist */}
          {leads.length === 0 && (
            <Button
              onClick={handleAddTestData}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Tambah Data Test
            </Button>
          )}
          <Button
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leads</p>
              <p className="text-2xl text-gray-900 mt-1">{leads.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Baru</p>
              <p className="text-2xl text-gray-900 mt-1">
                {mockLeads.filter(l => l.status === 'new').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Penawaran Terkirim</p>
              <p className="text-2xl text-gray-900 mt-1">
                {mockLeads.filter(l => l.status === 'quoted').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Estimasi</p>
              <p className="text-2xl text-gray-900 mt-1">
                Rp {formatRupiah(leads.reduce((sum, l) => sum + (Number(l.grandTotal) || Number(l.estimatedPrice) || Number(l.estimated_price) || 0), 0))}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, telepon, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
            >
              <option value="all">Semua Status</option>
              <option value="new">Baru</option>
              <option value="contacted">Dihubungi</option>
              <option value="quoted">Penawaran Terkirim</option>
              <option value="closed">Deal</option>
              <option value="rejected">Reject</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Tanggal</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Nama & Kontak</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Tipe</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Estimasi Harga</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-[#EB216A] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-gray-600">Loading calculator leads...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-900 mb-1">No Calculator Leads Found</p>
                        <p className="text-sm text-gray-500">
                          {searchTerm || filterStatus !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Calculator leads will appear here when customers submit calculations'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : lead.submittedAt}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900">{lead.customerName || lead.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          {lead.customerPhone || lead.phone}
                        </div>
                        {(lead.customerEmail || lead.email) && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail className="w-3 h-3" />
                            {lead.customerEmail || lead.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className="bg-purple-100 text-purple-700 border-0">
                        {lead.calculatorType || lead.calculator_type || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        Rp {formatRupiah(lead.grandTotal || lead.estimatedPrice || lead.estimated_price || 0)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {(statusConfig as any)[lead.status] ? (
                        <Badge className={`${(statusConfig as any)[lead.status].color} text-white border-0`}>
                          {(statusConfig as any)[lead.status].label}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500 text-white border-0">
                          {lead.status || 'NEW'}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300"
                          onClick={() => {
                            setSelectedLead(lead);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleSendQuote(lead)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-500 text-green-600 hover:bg-green-50"
                          onClick={() => handleWhatsAppClick(lead)}
                          title="Kirim ke WhatsApp"
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(lead.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {leads.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Menampilkan {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} dari {pagination.totalItems} leads
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Sebelumnya
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (pagination.totalPages > 5) {
                    if (pagination.currentPage > 3) {
                      pageNum = pagination.currentPage - 2 + i;
                    }
                    if (pageNum > pagination.totalPages) {
                      pageNum = pagination.totalPages - (4 - i);
                    }
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${pagination.currentPage === pageNum
                        ? 'bg-[#EB216A] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Unified Clean Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#EB216A]/10 flex items-center justify-center">
                  <Ruler className="w-6 h-6 text-[#EB216A]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Detail Kalkulasi</h2>
                  <p className="text-sm text-gray-500">#{selectedLead.id} • {new Date(selectedLead.createdAt || selectedLead.submittedAt).toLocaleString('id-ID')}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">

              {/* 1. Customer Info & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">Data Customer</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Nama</p>
                      <p className="font-medium">{selectedLead.customerName || selectedLead.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Telepon</p>
                      <p className="font-medium">{selectedLead.customerPhone || selectedLead.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium">{selectedLead.customerEmail || selectedLead.email || '-'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">Ringkasan</h3>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Tipe Kalkulator</p>
                      <Badge className="bg-purple-100 text-purple-700 border-0 mt-1">
                        {selectedLead.calculatorType || selectedLead.calculator_type || selectedLead.calculation_data?.calculatorType?.name || 'Unknown'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Estimasi Total</p>
                      <p className="text-xl font-bold text-[#EB216A]">
                        Rp {formatRupiah(selectedLead.grandTotal || selectedLead.estimatedPrice || selectedLead.estimated_price || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <Badge className={`${(statusConfig as any)[selectedLead.status]?.color || 'bg-gray-500'} text-white border-0 mt-1`}>
                        {(statusConfig as any)[selectedLead.status]?.label || selectedLead.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Items Detail List */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <ShoppingCart className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">Rincian Item</h3>
                </div>

                {(() => {
                  const isBlind = (selectedLead.calculatorType || selectedLead.calculator_type || '').toLowerCase().includes('blind') ||
                    (selectedLead.calculation_data?.calculatorType?.name || '').toLowerCase().includes('blind');

                  let displayItems: any[] = [];
                  const rawItems = selectedLead.calculation_data?.items || [];

                  if (isBlind) {
                    const groups: { [key: string]: any } = {};
                    rawItems.forEach((item: any) => {
                      // Group by product name as fallback invalid key
                      const key = item.product?.name || item.fabricName || 'Unknown Product';

                      if (!groups[key]) {
                        const newGroup = {
                          isGroup: true,
                          name: key,
                          product: item.product || { name: item.fabricName, price: item.fabricPricePerMeter },
                          items: [],
                          total: 0
                        };
                        groups[key] = newGroup;
                        displayItems.push(newGroup);
                      }
                      groups[key].items.push(item);
                      groups[key].total += (item.subtotal || 0);
                    });
                  } else {
                    displayItems = rawItems;
                  }

                  return displayItems.map((item: any, idx: number) => {
                    if (item.isGroup) {
                      // RENDER GROUPED VIEW (Blind)
                      return (
                        <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                          {/* Group Header */}
                          <div className="bg-gray-50/80 p-4 border-b border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Ruler className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                <p className="text-xs text-gray-500">{item.items.length} Ukuran</p>
                              </div>
                            </div>
                            <p className="font-bold text-gray-900 text-lg">
                              Rp {formatRupiah(item.total || 0)}
                            </p>
                          </div>

                          {/* Group Items Table */}
                          <div className="p-0">
                            <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                  <th className="px-4 py-2">Label</th>
                                  <th className="px-4 py-2 text-center">Ukuran (LxT)</th>
                                  <th className="px-4 py-2 text-center">Vol (m²)</th>
                                  <th className="px-4 py-2 text-right">Harga</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50 text-gray-600">
                                {item.items.map((subItem: any, sIdx: number) => (
                                  <tr key={sIdx} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                      {subItem.name || `Jendela ${sIdx + 1}`}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {subItem.dimensions?.width}cm x {subItem.dimensions?.height}cm
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {subItem.fabricMeters?.toFixed(2) || ((subItem.dimensions?.width * subItem.dimensions?.height) / 10000).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">
                                      Rp {formatRupiah(subItem.subtotal || 0)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    }

                    // RENDER SINGLE ITEM (Existing Logic)
                    return (
                      <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        {/* Item Header */}
                        <div className="bg-gray-50/80 p-4 border-b border-gray-100 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#EB216A] text-white flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {item.itemType === 'jendela' ? 'Jendela' : 'Pintu'} - {item.packageType === 'gorden-lengkap' ? 'Paket Lengkap' : 'Gorden Saja'}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {item.dimensions?.width}cm × {item.dimensions?.height}cm • {item.panels} Panel • {item.quantity} Unit
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-gray-900">
                            Rp {formatRupiah(item.subtotal || 0)}
                          </p>
                        </div>

                        <div className="p-4 space-y-3">
                          {/* Fabric */}
                          <div className="flex justify-between items-start py-2 border-b border-gray-50">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {item.selectedVariant?.name || item.fabricName || selectedLead.calculation_data?.fabric?.name || 'Kain'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.fabricMeters?.toFixed(2)}m × Rp {formatRupiah(item.fabricPricePerMeter || selectedLead.calculation_data?.fabric?.price || 0)}
                              </p>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              Rp {formatRupiah(item.fabricPrice || 0)}
                            </p>
                          </div>

                          {/* Components */}
                          {(item.components || []).map((comp: any, cIdx: number) => (
                            <div key={cIdx} className="flex justify-between items-start py-1 pl-4 border-l-2 border-gray-100">
                              <div>
                                <p className="text-sm text-gray-700">{comp.label}: {comp.productName}</p>
                                <p className="text-xs text-gray-500">Qty: {comp.qty} {comp.unit}</p>
                              </div>
                              <p className="text-sm text-gray-700">
                                Rp {formatRupiah(comp.productPrice * comp.qty)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Tutup
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleWhatsAppClick(selectedLead)}
                  className="border-green-500 text-green-600 hover:bg-green-50"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 mr-2 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                  Kirim WA
                </Button>
                <Button
                  onClick={() => handleCreateDocument(selectedLead)}
                  className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Buat Draft Penawaran
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Quotation Preview */}
      {showQuotation && selectedLead && (
        <QuotationPreview
          doc={convertToQuotation(selectedLead)}
          onClose={() => setShowQuotation(false)}
        />
      )}
    </div>
  );
}