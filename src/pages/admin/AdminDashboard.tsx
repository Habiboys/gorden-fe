import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const stats = [
  {
    name: 'Total Revenue',
    value: 'Rp 45.2M',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'bg-green-500'
  },
  {
    name: 'Total Pesanan',
    value: '1,234',
    change: '+8.2%',
    trend: 'up',
    icon: ShoppingBag,
    color: 'bg-[#EB216A]'
  },
  {
    name: 'Total Produk',
    value: '456',
    change: '+2.4%',
    trend: 'up',
    icon: Package,
    color: 'bg-blue-500'
  },
  {
    name: 'Total Customer',
    value: '2,345',
    change: '-1.2%',
    trend: 'down',
    icon: Users,
    color: 'bg-purple-500'
  },
];

const salesData = [
  { month: 'Jan', revenue: 4000000, orders: 120 },
  { month: 'Feb', revenue: 3000000, orders: 98 },
  { month: 'Mar', revenue: 5000000, orders: 156 },
  { month: 'Apr', revenue: 4500000, orders: 142 },
  { month: 'May', revenue: 6000000, orders: 178 },
  { month: 'Jun', revenue: 5500000, orders: 165 },
];

const topProducts = [
  { name: 'Gorden Premium Silk', sales: 234, revenue: 'Rp 12.5M' },
  { name: 'Blind Modern Minimalist', sales: 198, revenue: 'Rp 8.9M' },
  { name: 'Gorden Blackout Elegant', sales: 176, revenue: 'Rp 7.2M' },
  { name: 'Vitrase Sheer Classic', sales: 145, revenue: 'Rp 5.8M' },
  { name: 'Roller Blind Office', sales: 123, revenue: 'Rp 4.6M' },
];

const recentOrders = [
  { id: '#ORD-001', customer: 'Budi Santoso', product: 'Gorden Premium', amount: 'Rp 2.5M', status: 'pending' },
  { id: '#ORD-002', customer: 'Siti Nurhaliza', product: 'Blind Modern', amount: 'Rp 1.8M', status: 'processing' },
  { id: '#ORD-003', customer: 'Ahmad Wijaya', product: 'Vitrase Classic', amount: 'Rp 980K', status: 'completed' },
  { id: '#ORD-004', customer: 'Rina Dewi', product: 'Gorden Blackout', amount: 'Rp 3.2M', status: 'completed' },
  { id: '#ORD-005', customer: 'Dedi Kurniawan', product: 'Roller Blind', amount: 'Rp 1.5M', status: 'pending' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Selamat datang kembali, Admin!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={stat.name} className="p-6 border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="w-4 h-4" />
                  <span>{stat.change}</span>
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">{stat.name}</h3>
              <p className="text-2xl text-gray-900">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="p-6 border-gray-200">
          <h3 className="text-lg text-gray-900 mb-6">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px'
                }} 
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#EB216A" 
                strokeWidth={2}
                dot={{ fill: '#EB216A', r: 4 }}
                name="Revenue (Rp)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Orders Chart */}
        <Card className="p-6 border-gray-200">
          <h3 className="text-lg text-gray-900 mb-6">Orders Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" />
              <YAxis stroke="#666" />
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
                fill="#EB216A" 
                radius={[8, 8, 0, 0]}
                name="Orders"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="p-6 border-gray-200">
          <h3 className="text-lg text-gray-900 mb-6">Top Products</h3>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#EB216A]/10 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-[#EB216A]">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sales} terjual</p>
                  </div>
                </div>
                <span className="text-sm text-gray-900">{product.revenue}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="p-6 border-gray-200">
          <h3 className="text-lg text-gray-900 mb-6">Recent Orders</h3>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm text-gray-900">{order.id}</p>
                  <p className="text-xs text-gray-500">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{order.amount}</p>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                    order.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : order.status === 'processing'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
