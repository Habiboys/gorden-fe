import {
  CheckCircle,
  Clock,
  Download,
  Edit3,
  Eye,
  FileText,
  Gift,
  Loader2,
  Plus,
  Search,
  Send,
  Trash2,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useConfirm } from '../../context/ConfirmContext';
import { documentsApi } from '../../utils/api';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
  sent: { label: 'Terkirim', color: 'bg-blue-500', icon: Send },
  opened: { label: 'Dibuka', color: 'bg-green-500', icon: CheckCircle },
  paid: { label: 'Lunas', color: 'bg-purple-500', icon: CheckCircle },
  pending: { label: 'Belum Bayar', color: 'bg-yellow-500', icon: Clock },
  accepted: { label: 'Disetujui', color: 'bg-green-600', icon: CheckCircle },
  rejected: { label: 'Ditolak', color: 'bg-red-500', icon: XCircle },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-500', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-red-500', icon: XCircle }
};

const typeConfig = {
  quotation: { label: 'Penawaran', color: 'bg-blue-100 text-blue-700' },
  invoice: { label: 'Invoice', color: 'bg-green-100 text-green-700' }
};


// Helper to get document total - calculates from data if total_amount is null
const getDocumentTotal = (doc: any): number => {
  // First try total_amount or total fields
  if (doc.total_amount && parseFloat(doc.total_amount) > 0) {
    return parseFloat(doc.total_amount);
  }
  if (doc.total && parseFloat(doc.total) > 0) {
    return parseFloat(doc.total);
  }

  // Fallback: calculate from data.windows
  try {
    let data = doc.data;
    if (!data) return 0;

    // Parse if string (may be double-serialized)
    while (typeof data === 'string') {
      data = JSON.parse(data);
    }

    if (data.windows && Array.isArray(data.windows)) {
      return data.windows.reduce((sum: number, win: any) => {
        if (win.subtotal) return sum + win.subtotal;
        if (win.items && Array.isArray(win.items)) {
          return sum + win.items.reduce((itemSum: number, item: any) => {
            return itemSum + (item.totalPrice || (item.price * item.quantity) || 0);
          }, 0);
        }
        return sum;
      }, 0);
    }
  } catch (e) {
    console.error('Error calculating total from data:', e);
  }

  return 0;
};

// Helper to get calculator type from document data
const getCalculatorType = (doc: any): string | null => {
  try {
    let data = doc.data;
    if (!data) return null;
    while (typeof data === 'string') {
      data = JSON.parse(data);
    }
    return data.calculatorType || null;
  } catch (e) {
    return null;
  }
};

// Helper to get discount info from document data
const getDiscountInfo = (doc: any): { discount: number; discountAmount: number } | null => {
  try {
    let data = doc.data;
    if (!data) return null;
    while (typeof data === 'string') {
      data = JSON.parse(data);
    }
    const discount = data.discount || 0;
    if (discount > 0) {
      const discountAmount = doc.discount_amount || 0;
      return { discount, discountAmount };
    }
    return null;
  } catch (e) {
    return null;
  }
};

export default function AdminDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  const { confirm } = useConfirm();

  // Fetch documents from API when filters or page changes
  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchDocuments(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, filterType, filterStatus]);

  const fetchDocuments = async (page = 1) => {
    try {
      const response = await documentsApi.getAll({
        page,
        limit: pagination.itemsPerPage,
        type: filterType !== 'all' ? filterType : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchTerm
      });

      console.log('Documents API response:', response);
      if (response.success) {
        setDocuments(response.data || []);

        const paginationData = response.pagination || {
          page: 1,
          totalPages: 1,
          total: (response.data || []).length,
          limit: 10
        };

        setPagination({
          currentPage: paginationData.page,
          totalPages: paginationData.totalPages,
          totalItems: paginationData.total,
          itemsPerPage: paginationData.limit
        });
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Gagal memuat dokumen');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchDocuments(newPage);
    }
  };

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



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl text-gray-900">Dokumen</h1>
          <p className="text-gray-600 mt-1">Kelola penawaran dan invoice</p>
        </div>
        <Button
          onClick={() => navigate('/admin/documents/new')}
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
                Rp{documents.reduce((sum, d) => sum + getDocumentTotal(d), 0).toLocaleString('id-ID')}
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
                <th className="px-6 py-4 text-left text-sm text-gray-600">Kalkulator</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Customer</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Nilai</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Tanggal</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => {
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
                      {(() => {
                        const calcType = getCalculatorType(doc);
                        return calcType ? (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{calcType}</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900">{doc.customer_name}</p>
                        <p className="text-xs text-gray-600">{doc.customer_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const total = getDocumentTotal(doc);
                        const discountInfo = getDiscountInfo(doc);
                        if (discountInfo && discountInfo.discount > 0) {
                          return (
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium text-[#EB216A]">Rp{total.toLocaleString('id-ID')}</p>
                              <p className="text-xs text-green-600">Disc: {discountInfo.discount}%</p>
                            </div>
                          );
                        }
                        return <p className="text-sm text-gray-900">Rp{total.toLocaleString('id-ID')}</p>;
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const dateVal = doc.created_at || doc.createdAt;
                          if (!dateVal) return '-';
                          const date = new Date(dateVal);
                          return isNaN(date.getTime()) ? '-' : date.toLocaleString('id-ID', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                        })()}
                      </p>
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
                          onClick={() => navigate(`/admin/documents/${doc.id}`)}
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                          onClick={() => navigate(`/admin/documents/edit/${doc.id}`)}
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
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

        {/* Pagination Controls */}
        {documents.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Menampilkan {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} dari {pagination.totalItems} dokumen
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


    </div>
  );
}