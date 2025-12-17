import {
  Award,
  CheckCircle,
  Copy,
  DollarSign,
  Download,
  Eye,
  Loader2,
  Search,
  TrendingUp,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { referralsApi } from '../../utils/api';

interface Referrer {
  id: string;
  referrerName: string;
  referrerCode: string;
  referrerEmail: string;
  totalReferrals: number;
  successfulReferrals: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
  joinedAt: string;
  status: string;
}

interface ReferredCustomer {
  id: string;
  referrerId: string;
  customerName: string;
  customerEmail?: string;
  orderValue: number;
  commission: number;
  status: string;
  orderedAt: string;
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-500' },
  inactive: { label: 'Inactive', color: 'bg-gray-500' },
  suspended: { label: 'Suspended', color: 'bg-red-500' }
};

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReferrer, setSelectedReferrer] = useState<any>(null);
  const [referrerDetail, setReferrerDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [payingCommission, setPayingCommission] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [stats, setStats] = useState({
    totalReferrers: 0,
    totalReferrals: 0,
    totalCommission: 0,
    pendingCommission: 0
  });

  // Fetch data on mount
  useEffect(() => {
    fetchReferrers();
    fetchStats();
  }, []);

  const fetchReferrers = async () => {
    try {
      setLoading(true);
      const response = await referralsApi.getAllReferrers(searchTerm || undefined);
      if (response.success) {
        setReferrals(response.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching referrers:', error);
      toast.error('Gagal memuat data referrer');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await referralsApi.getAdminStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchReferrerDetail = async (id: string) => {
    try {
      setLoadingDetail(true);
      const response = await referralsApi.getReferrerDetail(id);
      if (response.success) {
        setReferrerDetail(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching referrer detail:', error);
      toast.error('Gagal memuat detail referrer');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewDetail = (ref: Referrer) => {
    setSelectedReferrer(ref);
    fetchReferrerDetail(ref.id);
  };

  const handlePayAllCommissions = async () => {
    if (!selectedReferrer) return;

    try {
      setPayingCommission(true);
      const response = await referralsApi.payAllCommissions(selectedReferrer.id);
      if (response.success) {
        toast.success(response.message || 'Komisi berhasil dibayar');
        fetchReferrers();
        fetchStats();
        fetchReferrerDetail(selectedReferrer.id);
      }
    } catch (error: any) {
      console.error('Error paying commissions:', error);
      toast.error('Gagal membayar komisi');
    } finally {
      setPayingCommission(false);
    }
  };

  // Search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReferrers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredReferrals = referrals.filter(ref => {
    const matchSearch = ref.referrerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.referrerCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.referrerEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl text-gray-900">Program Referral</h1>
          <p className="text-gray-600 mt-1">Kelola program referral dan komisi</p>
        </div>
        <Button
          className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Referrer</p>
              <p className="text-2xl text-gray-900 mt-1">{stats.totalReferrers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Referrals</p>
              <p className="text-2xl text-gray-900 mt-1">{stats.totalReferrals}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Komisi</p>
              <p className="text-2xl text-gray-900 mt-1">
                Rp{(stats.totalCommission / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Komisi</p>
              <p className="text-2xl text-gray-900 mt-1">
                Rp{(stats.pendingCommission / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, kode referral, atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#EB216A]" />
            </div>
          ) : filteredReferrals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Tidak ada data referrer
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">Referrer</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">Kode</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">Total Referrals</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">Sukses</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">Total Komisi</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">Pending</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReferrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900">{ref.referrerName}</p>
                        <p className="text-xs text-gray-600">{ref.referrerEmail}</p>
                        <p className="text-xs text-gray-500">Bergabung: {formatDate(ref.joinedAt)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm text-gray-900">
                          {ref.referrerCode}
                        </code>
                        <button
                          onClick={() => handleCopyCode(ref.referrerCode)}
                          className="text-gray-400 hover:text-[#EB216A] transition-colors"
                        >
                          {copiedCode === ref.referrerCode ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{ref.totalReferrals}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-green-600">{ref.successfulReferrals}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        Rp{ref.totalCommission.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-gray-600">
                        Dibayar: Rp{ref.paidCommission.toLocaleString('id-ID')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-yellow-600">
                        Rp{ref.pendingCommission.toLocaleString('id-ID')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${statusConfig[ref.status as keyof typeof statusConfig]?.color || 'bg-gray-500'} text-white border-0`}>
                        {statusConfig[ref.status as keyof typeof statusConfig]?.label || ref.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300"
                        onClick={() => handleViewDetail(ref)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReferrer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl text-gray-900">Detail Referrer: {selectedReferrer.referrerName}</h2>
              <button
                onClick={() => {
                  setSelectedReferrer(null);
                  setReferrerDetail(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#EB216A]" />
                </div>
              ) : referrerDetail ? (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-600">Total Referrals</p>
                      <p className="text-2xl text-blue-900 mt-1">{referrerDetail.totalReferrals}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600">Sukses</p>
                      <p className="text-2xl text-green-900 mt-1">{referrerDetail.successfulReferrals}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600">Total Komisi</p>
                      <p className="text-lg text-purple-900 mt-1">
                        Rp{(referrerDetail.totalCommission / 1000).toLocaleString()}k
                      </p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-sm text-yellow-600">Pending</p>
                      <p className="text-lg text-yellow-900 mt-1">
                        Rp{(referrerDetail.pendingCommission / 1000).toLocaleString()}k
                      </p>
                    </div>
                  </div>

                  {/* Referred Customers */}
                  <div>
                    <h3 className="text-base text-gray-900 mb-4">Customer yang Direferensikan</h3>
                    <div className="space-y-3">
                      {referrerDetail.referredCustomers?.length > 0 ? (
                        referrerDetail.referredCustomers.map((customer: ReferredCustomer) => (
                          <div key={customer.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-900">{customer.customerName}</p>
                              <p className="text-xs text-gray-600">Order: Rp{customer.orderValue.toLocaleString('id-ID')}</p>
                              <p className="text-xs text-gray-600">{formatDate(customer.orderedAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-green-600">+Rp{customer.commission.toLocaleString('id-ID')}</p>
                              <Badge className={`${customer.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'} text-white border-0 mt-1`}>
                                {customer.status === 'completed' ? 'Paid' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">Belum ada customer yang direferensikan</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      onClick={handlePayAllCommissions}
                      disabled={payingCommission || referrerDetail.pendingCommission === 0}
                    >
                      {payingCommission ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <DollarSign className="w-4 h-4 mr-2" />
                      )}
                      Bayar Semua Komisi
                    </Button>
                    <Button
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700"
                      onClick={() => {
                        setSelectedReferrer(null);
                        setReferrerDetail(null);
                      }}
                    >
                      Tutup
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-4">Data tidak tersedia</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
