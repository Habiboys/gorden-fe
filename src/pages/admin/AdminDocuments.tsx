import {
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Gift,
  Loader2,
  Plus,
  Search,
  Send,
  Trash2,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DocumentDetailModal } from '../../components/DocumentDetailModal';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useConfirm } from '../../context/ConfirmContext';
import { documentsApi, productsApi } from '../../utils/api';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
  sent: { label: 'Terkirim', color: 'bg-blue-500', icon: Send },
  opened: { label: 'Dibuka', color: 'bg-green-500', icon: CheckCircle },
  paid: { label: 'Lunas', color: 'bg-purple-500', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-red-500', icon: XCircle }
};

const typeConfig = {
  quotation: { label: 'Penawaran', color: 'bg-blue-100 text-blue-700' },
  invoice: { label: 'Invoice', color: 'bg-green-100 text-green-700' }
};

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

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [showProductPicker, setShowProductPicker] = useState<string | null>(null); // windowId when open
  const [docType, setDocType] = useState('QUOTATION');
  const { confirm } = useConfirm();

  // Fetch documents and products from API
  useEffect(() => {
    fetchDocuments();
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
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsApi.getAll();
      if (response.success) {
        setDocuments(response.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Gagal memuat dokumen');
    } finally {
      setLoading(false);
    }
  };

  // Form state untuk surat penawaran
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    referralCode: '',
    discount: 20,
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

  const filteredDocs = documents.filter(doc => {
    const customerName = doc.customer_name || '';
    const docNumber = doc.document_number || '';
    const matchSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      docNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'all' || doc.type?.toLowerCase() === filterType;
    const matchStatus = filterStatus === 'all' || doc.status?.toLowerCase() === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const handleDownloadPDF = async (doc: any) => {
    try {
      setDownloadingPdf(doc.id);
      await documentsApi.downloadPDF(doc.id, `${doc.document_number}.pdf`);
      toast.success('PDF berhasil diunduh');
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast.error('Gagal mengunduh PDF: ' + error.message);
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Dokumen',
      description: 'Apakah Anda yakin ingin menghapus dokumen ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'destructive',
    });

    if (isConfirmed) {
      try {
        const response = await documentsApi.delete(id);
        if (response.success) {
          toast.success('Dokumen berhasil dihapus');
          fetchDocuments();
        }
      } catch (error: any) {
        console.error('Error deleting document:', error);
        toast.error('Gagal menghapus dokumen');
      }
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

  // Filter products based on search
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

    // Safety check
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
      const payload = {
        type: docType,
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

      const response = await documentsApi.create(payload);
      if (response.success) {
        toast.success('Dokumen berhasil dibuat!');
        setShowCreateModal(false);
        fetchDocuments();
        // Reset form
        setDocType('QUOTATION');
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          customerAddress: '',
          referralCode: '',
          discount: 20,
          paymentTerms: 'Bank BRI 0763 0100 1160 564 a.n ABDUL RAHIM',
          notes: 'Pembayaran dapat ditransfer melalui\n\nPastikan nilai total tagihan Anda sudah benar sebelum melakukan transfer\n\nTerima kasih atas kepercayaannya'
        });
        setWindows([{
          id: '1',
          title: 'Jendela 1',
          size: '',
          fabricType: '',
          items: []
        }]);
      }
    } catch (error: any) {
      console.error('Error creating document:', error);
      toast.error('Gagal membuat dokumen: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl text-gray-900">Dokumen</h1>
          <p className="text-gray-600 mt-1">Kelola penawaran dan invoice</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Buat Dokumen
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Dokumen</p>
              <p className="text-2xl text-gray-900 mt-1">{documents.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Penawaran</p>
              <p className="text-2xl text-gray-900 mt-1">
                {documents.filter(d => d.type === 'QUOTATION').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Invoice</p>
              <p className="text-2xl text-gray-900 mt-1">
                {documents.filter(d => d.type === 'INVOICE').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Nilai</p>
              <p className="text-2xl text-gray-900 mt-1">
                Rp{documents.reduce((sum, d) => sum + (parseFloat(d.total_amount) || 0), 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor dokumen atau nama customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
          >
            <option value="all">Semua Tipe</option>
            <option value="quotation">Penawaran</option>
            <option value="invoice">Invoice</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Terkirim</option>
            <option value="opened">Dibuka</option>
            <option value="paid">Lunas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-600">No. Dokumen</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Tipe</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Customer</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Nilai</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Tanggal</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDocs.map((doc) => {
                const statusKey = (doc.status || 'draft').toLowerCase() as keyof typeof statusConfig;
                const StatusIcon = statusConfig[statusKey]?.icon || Clock;
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900">{doc.document_number}</p>
                        {doc.referral_code && (
                          <div className="flex items-center gap-1 text-xs text-purple-600">
                            <Gift className="w-3 h-3" />
                            {doc.referral_code}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${typeConfig[doc.type?.toLowerCase() as keyof typeof typeConfig]?.color || 'bg-gray-100 text-gray-700'} border-0`}>
                        {typeConfig[doc.type?.toLowerCase() as keyof typeof typeConfig]?.label || doc.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900">{doc.customer_name}</p>
                        <p className="text-xs text-gray-600">{doc.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">Rp{parseFloat(doc.total_amount || 0).toLocaleString('id-ID')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{new Date(doc.created_at).toLocaleDateString('id-ID')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${statusConfig[doc.status?.toLowerCase() as keyof typeof statusConfig]?.color || 'bg-gray-500'} text-white border-0 flex items-center gap-1 w-fit`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[doc.status?.toLowerCase() as keyof typeof statusConfig]?.label || doc.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300"
                          onClick={() => setSelectedDoc(doc)}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleDownloadPDF(doc)}
                          disabled={downloadingPdf === doc.id}
                          title="Download PDF"
                        >
                          {downloadingPdf === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(doc.id)}
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quotation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-6xl w-full my-8">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-xl text-gray-900">Buat Dokumen Baru</h2>
                <p className="text-sm text-gray-600 mt-1">Lengkapi form untuk membuat dokumen baru</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Customer Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <h3 className="text-base text-gray-900 mb-4">Informasi Customer</h3>
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
                  <h3 className="text-base text-gray-900">Detail Penawaran</h3>
                  <Button
                    size="sm"
                    onClick={addWindow}
                    className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Jendela/Pintu
                  </Button>
                </div>

                {windows.map((window, windowIndex) => (
                  <div key={window.id} className="border border-gray-200 rounded-xl overflow-hidden">
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
                          className="border-red-300 text-red-600"
                          onClick={() => removeWindow(window.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
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
                        <tbody>
                          {window.items.map((item, itemIndex) => (
                            <tr key={item.id} className="border-b border-gray-100">
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
                                  className="text-sm"
                                  max="100"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(window.id, item.id, 'quantity', parseInt(e.target.value) || 1)}
                                  placeholder="1"
                                  className="text-sm"
                                  min="1"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                Rp{calculateItemTotal(item).toLocaleString('id-ID')}
                              </td>
                              <td className="px-4 py-3">
                                <button
                                  onClick={() => removeItemFromWindow(window.id, item.id)}
                                  className="text-red-600 hover:text-red-700"
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
                    <div className="p-3 bg-gray-50 border-t border-gray-200 space-y-3">
                      {/* Product Picker */}
                      {showProductPicker === window.id ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                              type="text"
                              placeholder="Cari produk..."
                              value={productSearchTerm}
                              onChange={(e) => setProductSearchTerm(e.target.value)}
                              className="pl-10"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                            {filteredProducts.length > 0 ? (
                              filteredProducts.slice(0, 10).map((product) => (
                                <button
                                  key={product.id}
                                  onClick={() => addProductToWindow(window.id, product)}
                                  className="w-full px-3 py-2 text-left hover:bg-pink-50 border-b border-gray-100 last:border-b-0 transition-colors"
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
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setShowProductPicker(null); setProductSearchTerm(''); }}
                              className="w-full border-gray-300"
                            >
                              Batal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowProductPicker(window.id)}
                          className="w-full border-dashed border-[#EB216A] text-[#EB216A] hover:bg-pink-50"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Produk
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-5">
                <h3 className="text-base text-gray-900 mb-4">Ringkasan</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900">Rp{calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Diskon:</span>
                      <Input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                        className="w-20 h-8 text-sm"
                        max="100"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                    <span className="text-sm text-red-600">- Rp{calculateGrandDiscount().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="pt-3 border-t border-pink-300 flex justify-between">
                    <span className="text-base text-gray-900">Total Biaya:</span>
                    <span className="text-lg text-[#EB216A]">Rp{calculateGrandTotal().toLocaleString('id-ID')}</span>
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
                  <Label>Catatan Tambahan</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center rounded-b-2xl sticky bottom-0">
              <div className="text-sm text-gray-600">
                Total: <span className="text-lg text-[#EB216A]">Rp{calculateGrandTotal().toLocaleString('id-ID')}</span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="border-gray-300"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Buat Surat Penawaran
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDoc && (
        <DocumentDetailModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onRefresh={fetchDocuments}
        />
      )}
    </div>
  );
}