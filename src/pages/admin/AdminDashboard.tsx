import {
  Calculator,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Package
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Card } from '../../components/ui/card';
import { useSettings } from '../../context/SettingsContext';
import { dashboardApi } from '../../utils/api';

interface DashboardStats {
  totalProducts: number;
  totalGallery: number;
  totalCalculatorLeads: number;
  totalOrders: number;
  totalArticles: number;
  totalContacts: number;
  totalCategories: number;
  pendingLeads: number;
  pendingContacts: number;
  pendingInvoices?: number;
  totalRevenue: number;
  monthlyStats?: { month: string; revenue: number; orders: number }[];
}

interface Activity {
  action: string;
  item: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

export default function AdminDashboard() {
  const { settings } = useSettings();
  const brandColor = settings.brandColor || '#EB216A';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [error, setError] = useState('');

  const totalPages = Math.ceil(activities.length / itemsPerPage);
  const currentActivities = activities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ); useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getStats();
        if (response.success) {
          setStats(response.data.stats);
          setActivities(response.data.recentActivities || []);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard:', err);
        setError(err.message || 'Gagal memuat data dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Stats cards configuration
  const statsCards = stats ? [
    {
      name: 'Total Revenue',
      value: `Rp ${(stats.totalRevenue || 0).toLocaleString('id-ID')}`,
      icon: FileText,
      color: 'bg-green-600'
    },
    {
      name: 'Total Invoice',
      value: stats.totalOrders.toString(),
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      name: 'Total Produk',
      value: stats.totalProducts.toString(),
      icon: Package,
      color: 'bg-blue-500'
    },
    {
      name: 'Tagihan Pending',
      value: (stats.pendingInvoices || 0).toString(),
      subtext: 'Menunggu Pembayaran',
      icon: FileText,
      color: 'bg-yellow-500'
    },
    {
      name: 'Total Leads Kalkulator',
      value: stats.totalCalculatorLeads.toString(),
      subtext: stats.pendingLeads > 0 ? `${stats.pendingLeads} pending` : undefined,
      icon: Calculator,
      bgColor: brandColor
    },

  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: brandColor }} />
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Selamat datang kembali, Admin!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color || ''}`}
                  style={stat.bgColor ? { backgroundColor: stat.bgColor } : undefined}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">{stat.name}</h3>
              <p className="text-2xl text-gray-900">{stat.value}</p>
              {stat.subtext && (
                <p className="text-xs text-orange-600 mt-1">{stat.subtext}</p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="p-6 border-gray-200">
          <h3 className="text-lg text-gray-900 mb-6">Revenue Trend (6 Bulan Terakhir)</h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.monthlyStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} tickFormatter={(value) => `Rp${(value / 1000000).toFixed(0)}jt`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={brandColor}
                  strokeWidth={2}
                  dot={{ fill: brandColor, r: 4 }}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {(!stats?.monthlyStats || stats.monthlyStats.every(d => d.revenue === 0)) && (
            <p className="text-center text-gray-400 text-sm mt-4">Belum ada data revenue signifikan</p>
          )}
        </Card>

        {/* Orders Chart */}
        <Card className="p-6 border-gray-200">
          <h3 className="text-lg text-gray-900 mb-6">Invoice Created (6 Bulan Terakhir)</h3>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.monthlyStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar
                  dataKey="orders"
                  fill={brandColor}
                  radius={[4, 4, 0, 0]}
                  name="Invoices"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {(!stats?.monthlyStats || stats.monthlyStats.every(d => d.orders === 0)) && (
            <p className="text-center text-gray-400 text-sm mt-4">Belum ada data invoice</p>
          )}
        </Card>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-6 border-gray-200">
            <h3 className="text-lg text-gray-900 mb-4">Ringkasan Konten</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Kategori</span>
                <span className="text-gray-900 font-medium">{stats.totalCategories}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Produk</span>
                <span className="text-gray-900 font-medium">{stats.totalProducts}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Artikel</span>
                <span className="text-gray-900 font-medium">{stats.totalArticles}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Galeri</span>
                <span className="text-gray-900 font-medium">{stats.totalGallery}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-gray-200">
            <h3 className="text-lg text-gray-900 mb-4">Leads & Kontak</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Leads Kalkulator</span>
                <span className="text-gray-900 font-medium">{stats.totalCalculatorLeads}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Leads Pending</span>
                <span className="text-orange-600 font-medium">{stats.pendingLeads}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Kontak</span>
                <span className="text-gray-900 font-medium">{stats.totalContacts}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Kontak Pending</span>
                <span className="text-orange-600 font-medium">{stats.pendingContacts}</span>
              </div>
            </div>
          </Card>

          {/* Recent Activities */}
          <Card className="p-6 border-gray-200">
            <h3 className="text-lg text-gray-900 mb-4">Aktivitas Terbaru</h3>
            <div className="space-y-3">
              {currentActivities.length > 0 ? (
                <>
                  {currentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{activity.action}</p>
                        <p className="text-xs text-gray-500 truncate">{activity.item}</p>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <p className="text-xs text-gray-500">{activity.time}</p>
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${activity.type === 'success'
                          ? 'bg-green-100 text-green-700'
                          : activity.type === 'info'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                          }`}>
                          {activity.type}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Pagination Controls */}
                  {activities.length > itemsPerPage && (
                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Hal {currentPage} dari {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-sm">Belum ada aktivitas terbaru</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}