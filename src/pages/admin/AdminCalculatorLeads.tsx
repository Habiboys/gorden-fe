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
    // Ensure raw_items for editor reconstruction
    // We map calcItems back to a structure resembling original calculator items if possible, 
    // or just pass them as raw_items if they are detailed enough.
    // The calcItems from CalculatorPage ARE detailed (components, dimensions, etc).

    return {
      amount: calcData.grandTotal || lead.estimated_price || 0,
      quotationData: {
        raw_items: calcItems, // Vital for "Rich Edit" mode
        calculatorType: calcData.calculatorType?.name || lead.calculator_type || 'Smokering',
        calculatorTypeSlug: calcData.calculatorType?.slug,
        baseFabric: fabric,
        windows: calcItems.map((item: any, idx: number) => {
          // Reconstruct window items for legacy view / PDF generation
          const winItems = [];

          // Fabric Item
          const fabricPrice = item.fabricPrice || 0;
          winItems.push({
            id: `${item.id}-fabric`,
            name: `${item.selectedVariant?.name || item.fabricName || fabric.name || 'Kain'} (${item.fabricMeters?.toFixed(2)}m)`,
            price: item.fabricPricePerMeter || fabric.price || 0,
            discount: 0,
            quantity: item.quantity,
            totalPrice: fabricPrice
          });

          // Component Items
          (item.components || []).forEach((comp: any) => {
            winItems.push({
              id: `${item.id}-comp-${comp.componentId}`,
              name: `${comp.label}: ${comp.productName}`,
              price: comp.productPrice || 0,
              discount: 0,
              quantity: comp.qty * item.quantity, // Total items = qty per window * quantity windows? Wait.
              // In CalculatorPage: components are per ITEM.
              // In AdminDocumentCreate: windowItems include components.
              // The qty in component list is PER WINDOW.
              // So we typically show Qty per window * Windows count? 
              // Or Qty per window.
              // AdminDocumentCreate payload stores "quantity: selection.qty" (per window).
              qty: comp.qty,
              totalPrice: (comp.productPrice || 0) * (comp.qty || 1)
            });
          });

          return {
            id: item.id || String(idx + 1),
            title: `${idx + 1} ${item.itemType === 'jendela' ? 'Jendela' : 'Pintu'}`,
            size: `Ukuran ${item.dimensions?.width}cm x ${item.dimensions?.height}cm`,
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
                Rp{leads.reduce((sum, l) => sum + (Number(l.grandTotal) || Number(l.estimatedPrice) || Number(l.estimated_price) || 0), 0).toLocaleString('id-ID')}
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
                        Rp{(lead.grandTotal || lead.estimatedPrice || lead.estimated_price || 0).toLocaleString('id-ID')}
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
                        Rp {(selectedLead.grandTotal || selectedLead.estimatedPrice || selectedLead.estimated_price || 0).toLocaleString('id-ID')}
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

                {(selectedLead.calculation_data?.items || []).map((item: any, idx: number) => (
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
                        Rp {(item.subtotal || 0).toLocaleString('id-ID')}
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
                            {item.fabricMeters?.toFixed(2)}m × Rp {Number(item.fabricPricePerMeter || selectedLead.calculation_data?.fabric?.price || 0).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          Rp {(item.fabricPrice || 0).toLocaleString('id-ID')}
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
                            Rp {(comp.productPrice * comp.qty).toLocaleString('id-ID')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-white sticky bottom-0 z-10">
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedLead(null)}>
                  Tutup
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