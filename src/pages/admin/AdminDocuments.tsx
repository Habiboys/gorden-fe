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
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DocumentDetailModal } from '../../components/DocumentDetailModal';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useConfirm } from '../../context/ConfirmContext';
import { documentsApi } from '../../utils/api';

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



export default function AdminDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  const { confirm } = useConfirm();

  // Fetch documents from API
  useEffect(() => {
    fetchDocuments();
  }, []);



  const fetchDocuments = async () => {
    try {

      const response = await documentsApi.getAll();
      if (response.success) {
        setDocuments(response.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast.error('Gagal memuat dokumen');
    }

  };



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
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const dateVal = doc.created_at || doc.createdAt;
                          if (!dateVal) return '-';
                          const date = new Date(dateVal);
                          return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID');
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