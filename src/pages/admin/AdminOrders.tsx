import { useState } from 'react';
import { 
  Search, 
  Filter,
  Eye,
  Download,
  MoreVertical
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Separator } from '../../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const mockOrders = [
  {
    id: '#ORD-001',
    date: '2024-12-08',
    customer: 'Budi Santoso',
    email: 'budi@email.com',
    phone: '081234567890',
    products: [
      { name: 'Gorden Premium Silk', qty: 2, price: 1250000 }
    ],
    total: 2500000,
    status: 'pending',
    payment: 'pending',
    address: 'Jl. Sudirman No. 123, Jakarta Selatan'
  },
  {
    id: '#ORD-002',
    date: '2024-12-07',
    customer: 'Siti Nurhaliza',
    email: 'siti@email.com',
    phone: '081234567891',
    products: [
      { name: 'Blind Modern Minimalist', qty: 1, price: 1800000 }
    ],
    total: 1800000,
    status: 'processing',
    payment: 'paid',
    address: 'Jl. Gatot Subroto No. 45, Jakarta Pusat'
  },
  {
    id: '#ORD-003',
    date: '2024-12-06',
    customer: 'Ahmad Wijaya',
    email: 'ahmad@email.com',
    phone: '081234567892',
    products: [
      { name: 'Vitrase Sheer Classic', qty: 3, price: 326667 }
    ],
    total: 980000,
    status: 'completed',
    payment: 'paid',
    address: 'Jl. Thamrin No. 78, Jakarta Pusat'
  },
  {
    id: '#ORD-004',
    date: '2024-12-05',
    customer: 'Rina Dewi',
    email: 'rina@email.com',
    phone: '081234567893',
    products: [
      { name: 'Gorden Blackout Elegant', qty: 2, price: 1600000 }
    ],
    total: 3200000,
    status: 'completed',
    payment: 'paid',
    address: 'Jl. Kuningan No. 90, Jakarta Selatan'
  },
  {
    id: '#ORD-005',
    date: '2024-12-04',
    customer: 'Dedi Kurniawan',
    email: 'dedi@email.com',
    phone: '081234567894',
    products: [
      { name: 'Roller Blind Office', qty: 1, price: 1500000 }
    ],
    total: 1500000,
    status: 'cancelled',
    payment: 'refunded',
    address: 'Jl. Rasuna Said No. 12, Jakarta Selatan'
  },
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const paymentColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  refunded: 'bg-gray-100 text-gray-700',
};

export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleViewDetail = (order: any) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    console.log('Update status:', orderId, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-gray-900">Pesanan</h1>
          <p className="text-gray-600 mt-1">Kelola semua pesanan customer</p>
        </div>
        <Button variant="outline" className="border-gray-300">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl text-yellow-600">12</p>
        </Card>
        <Card className="p-4 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Processing</p>
          <p className="text-2xl text-blue-600">8</p>
        </Card>
        <Card className="p-4 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-2xl text-green-600">156</p>
        </Card>
        <Card className="p-4 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Cancelled</p>
          <p className="text-2xl text-red-600">5</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari pesanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" className="border-gray-300">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Order ID</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Tanggal</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Customer</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Total</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Status</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Payment</th>
                <th className="text-right px-6 py-4 text-sm text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#EB216A]">{order.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{order.date}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900">{order.customer}</p>
                      <p className="text-xs text-gray-500">{order.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      Rp {order.total.toLocaleString('id-ID')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${statusColors[order.status as keyof typeof statusColors]} border-0`}>
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${paymentColors[order.payment as keyof typeof paymentColors]} border-0`}>
                      {order.payment}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetail(order)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="w-4 h-4 mr-2" />
                          Download Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pesanan {selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              Informasi lengkap pesanan customer
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm text-gray-600 mb-3">Informasi Customer</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nama:</span>
                    <span className="text-sm text-gray-900">{selectedOrder.customer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Email:</span>
                    <span className="text-sm text-gray-900">{selectedOrder.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Phone:</span>
                    <span className="text-sm text-gray-900">{selectedOrder.phone}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600">Alamat:</span>
                    <span className="text-sm text-gray-900 text-right max-w-xs">
                      {selectedOrder.address}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Products */}
              <div>
                <h3 className="text-sm text-gray-600 mb-3">Produk</h3>
                <div className="space-y-3">
                  {selectedOrder.products.map((product: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {product.qty}</p>
                      </div>
                      <span className="text-sm text-gray-900">
                        Rp {(product.price * product.qty).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Total */}
              <div className="bg-[#EB216A]/5 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-base text-gray-900">Total</span>
                  <span className="text-xl text-[#EB216A]">
                    Rp {selectedOrder.total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Update Status */}
              <div>
                <h3 className="text-sm text-gray-600 mb-3">Update Status</h3>
                <Select 
                  defaultValue={selectedOrder.status}
                  onValueChange={(value) => handleUpdateStatus(selectedOrder.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
