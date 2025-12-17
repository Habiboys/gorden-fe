import {
  Calendar,
  Download,
  Eye,
  FileText,
  Filter,
  Mail,
  Package,
  Phone,
  Ruler,
  Search,
  ShoppingCart,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { QuotationPreview } from '../../components/QuotationPreview';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useConfirm } from '../../context/ConfirmContext';
import { calculatorLeadsApi } from '../../utils/api';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showQuotation, setShowQuotation] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();

  // Fetch leads from backend
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        console.log('🔄 Fetching calculator leads from backend...');
        const response = await calculatorLeadsApi.getAll();
        console.log('✅ Calculator leads fetched:', response);
        setLeads(response.data || []);
      } catch (error) {
        console.error('❌ Error fetching calculator leads:', error);

        // Check if it's a network error
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          console.warn('⚠️ Backend not available - using empty data. Server may need to warm up.');
          toast.error('Backend tidak tersedia. Silakan coba lagi dalam beberapa saat atau hubungi admin untuk memastikan server sudah berjalan.');
        } else {
          toast.error('Error fetching leads: ' + (error as any).message);
        }

        // Set empty array as fallback
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

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
    // Export logic here
    toast.info('Export CSV functionality');
  };

  const handleSendQuote = (lead: any) => {
    toast.info(`Kirim penawaran ke ${lead.customerName || lead.name}`);
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

  // Convert calculator lead to quotation format
  const convertToQuotation = (lead: any) => {
    const items = [
      ...lead.calculation.components.map((comp: any, idx: number) => ({
        id: `1-${idx + 1}`,
        name: `${comp.name} - ${comp.type}`,
        price: comp.pricePerUnit,
        discount: 0,
        quantity: comp.quantity
      })),
      {
        id: '1-install',
        name: lead.calculation.installation.type,
        price: lead.calculation.installation.price,
        discount: 0,
        quantity: 1
      }
    ];

    return {
      id: lead.id,
      type: 'quotation',
      documentNumber: `QT-CALC-${lead.id.toString().padStart(4, '0')}`,
      customerName: lead.customerName || lead.name,
      customerEmail: lead.customerEmail || lead.email || '-',
      customerPhone: lead.customerPhone || lead.phone,
      customerAddress: '',
      amount: lead.grandTotal || lead.estimatedPrice,
      createdAt: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('id-ID') : new Date(lead.submittedAt).toLocaleDateString('id-ID'),
      sentAt: null,
      status: 'draft',
      referralCode: '',
      discount: 0,
      quotationData: {
        windows: [
          {
            id: '1',
            title: `Gorden ${lead.calculatorType}`,
            size: `Ukuran ${lead.calculation.dimensions.width}m x ${lead.calculation.dimensions.height}m (${lead.calculation.dimensions.area}m²)`,
            fabricType: lead.calculation.product.name,
            items: items
          }
        ],
        paymentTerms: 'Bank BRI 0763 0100 1160 564 a.n ABDUL RAHIM',
        notes: lead.calculation.notes || 'Terima kasih atas kepercayaannya'
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
                Rp{(leads.reduce((sum, l) => sum + (l.grandTotal || l.estimatedPrice || 0), 0) / 1000000).toFixed(1)}M
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
                        {lead.calculatorType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        Rp{(lead.grandTotal || lead.estimatedPrice).toLocaleString('id-ID')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${statusConfig[lead.status as keyof typeof statusConfig].color} text-white border-0`}>
                        {statusConfig[lead.status as keyof typeof statusConfig].label}
                      </Badge>
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
      </div>

      {/* Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#EB216A] to-pink-600">
              <div>
                <h2 className="text-xl text-white">Detail Kalkulasi Gorden</h2>
                <p className="text-sm text-pink-100 mt-1">#{selectedLead.id} - {selectedLead.calculatorType}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-white hover:text-pink-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base text-gray-900">Informasi Customer</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Nama Lengkap</p>
                    <p className="text-sm text-gray-900">{selectedLead.customerName || selectedLead.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">No. Telepon</p>
                    <p className="text-sm text-gray-900">{selectedLead.customerPhone || selectedLead.phone}</p>
                  </div>
                  {(selectedLead.customerEmail || selectedLead.email) && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Email</p>
                      <p className="text-sm text-gray-900">{selectedLead.customerEmail || selectedLead.email || '-'}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tanggal Submit</p>
                    <p className="text-sm text-gray-900">{selectedLead.createdAt ? new Date(selectedLead.createdAt).toLocaleString('id-ID') : selectedLead.submittedAt}</p>
                  </div>
                </div>
              </div>

              {/* Product & Calculator Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-purple-600" />
                  <h3 className="text-base text-gray-900">Informasi Kalkulasi</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Tipe Kalkulator</p>
                    <Badge className="bg-purple-100 text-purple-700 border-0">
                      {selectedLead.calculatorType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Produk</p>
                    <p className="text-sm text-gray-900">{selectedLead.productName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Item</p>
                    <p className="text-sm text-gray-900">{selectedLead.totalItems || 0} item ({selectedLead.totalUnits || 0} unit)</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              {selectedLead.items && selectedLead.items.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-gray-600" />
                      <h3 className="text-base text-gray-900">Detail Pesanan</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    {selectedLead.items.map((item: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm text-gray-900 mb-1">
                              Item #{index + 1}
                            </p>
                            <p className="text-xs text-gray-600">
                              Ukuran: {item.width}m x {item.height}m | Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm text-[#EB216A]">
                            Rp{item.totalPrice?.toLocaleString('id-ID')}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                          {item.relGorden && (
                            <div className="bg-white rounded p-2">
                              <p className="text-gray-600 mb-1">Rel Gorden:</p>
                              <p className="text-gray-900">{item.relGorden.name}</p>
                            </div>
                          )}
                          {item.tassel && (
                            <div className="bg-white rounded p-2">
                              <p className="text-gray-600 mb-1">Tassel:</p>
                              <p className="text-gray-900">{item.tassel.name}</p>
                            </div>
                          )}
                          {item.hook && (
                            <div className="bg-white rounded p-2">
                              <p className="text-gray-600 mb-1">Hook:</p>
                              <p className="text-gray-900">{item.hook.name}</p>
                            </div>
                          )}
                          {item.kainVitrase && (
                            <div className="bg-blue-50 rounded p-2">
                              <p className="text-gray-600 mb-1">Kain Vitrase:</p>
                              <p className="text-gray-900">{item.kainVitrase.name}</p>
                            </div>
                          )}
                          {item.relVitrase && (
                            <div className="bg-blue-50 rounded p-2">
                              <p className="text-gray-600 mb-1">Rel Vitrase:</p>
                              <p className="text-gray-900">{item.relVitrase.name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#EB216A] text-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-base">Total Estimasi Harga</p>
                      <p className="text-xl">
                        Rp{(selectedLead.grandTotal || selectedLead.estimatedPrice).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Show old format if exists */}
              {selectedLead.calculation && selectedLead.calculation.product && selectedLead.calculation.components && (
                <>
                  {/* Product Info */}
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="w-5 h-5 text-purple-600" />
                      <h3 className="text-base text-gray-900">Produk yang Dipilih</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-gray-900">{selectedLead.calculation.product.name}</p>
                          <p className="text-xs text-gray-600 mt-1">{selectedLead.calculation.product.category}</p>
                        </div>
                        <code className="text-xs bg-white px-2 py-1 rounded border border-purple-300 text-purple-700">
                          {selectedLead.calculation.product.sku}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Ruler className="w-5 h-5 text-green-600" />
                      <h3 className="text-base text-gray-900">Ukuran & Dimensi</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Lebar</p>
                        <p className="text-sm text-gray-900">{selectedLead.calculation.dimensions.width} meter</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Tinggi</p>
                        <p className="text-sm text-gray-900">{selectedLead.calculation.dimensions.height} meter</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Total Area</p>
                        <p className="text-sm text-gray-900">{selectedLead.calculation.dimensions.area} m²</p>
                      </div>
                    </div>
                  </div>

                  {/* Component Breakdown */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-gray-600" />
                        <h3 className="text-base text-gray-900">Rincian Komponen & Harga</h3>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs text-gray-600">Komponen</th>
                            <th className="px-4 py-3 text-left text-xs text-gray-600">Tipe/Jenis</th>
                            <th className="px-4 py-3 text-center text-xs text-gray-600">Qty</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-600">Harga Satuan</th>
                            <th className="px-4 py-3 text-right text-xs text-gray-600">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedLead.calculation.components.map((component: any, index: number) => (
                            <tr key={index} className={component.isOptional ? 'bg-blue-50/50' : ''}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-gray-900">{component.name}</p>
                                  {component.isOptional && (
                                    <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                                      Optional
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-xs text-gray-600">{component.type}</p>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <p className="text-sm text-gray-900">{component.quantity} {component.unit}</p>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <p className="text-sm text-gray-900">
                                  Rp{component.pricePerUnit.toLocaleString('id-ID')}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <p className="text-sm text-gray-900">
                                  Rp{component.subtotal.toLocaleString('id-ID')}
                                </p>
                              </td>
                            </tr>
                          ))}

                          {/* Installation */}
                          <tr className="bg-yellow-50/50">
                            <td className="px-4 py-3">
                              <p className="text-sm text-gray-900">Biaya Instalasi</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs text-gray-600">{selectedLead.calculation.installation.type}</p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <p className="text-sm text-gray-900">1 paket</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-sm text-gray-900">
                                Rp{selectedLead.calculation.installation.price.toLocaleString('id-ID')}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="text-sm text-gray-900">
                                Rp{selectedLead.calculation.installation.price.toLocaleString('id-ID')}
                              </p>
                            </td>
                          </tr>

                          {/* Total */}
                          <tr className="bg-[#EB216A] text-white">
                            <td colSpan={4} className="px-4 py-4 text-right">
                              <p className="text-base">Total Estimasi Harga</p>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <p className="text-lg">
                                Rp{(selectedLead.grandTotal || selectedLead.estimatedPrice).toLocaleString('id-ID')}
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedLead.calculation.notes && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                      <h3 className="text-sm text-gray-900 mb-2">Catatan Customer</h3>
                      <p className="text-sm text-gray-700 italic">&quot;{selectedLead.calculation.notes}&quot;</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                  onClick={() => {
                    setShowQuotation(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Lihat Surat Penawaran
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleSendQuote(selectedLead)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Kirim via Email
                </Button>
                <Button
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.open(`https://wa.me/${selectedLead.phone.replace(/^0/, '62')}`)}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  WhatsApp
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