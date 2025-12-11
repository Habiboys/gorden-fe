import { useState } from 'react';
import { 
  Search, 
  Filter,
  Eye,
  MoreVertical,
  Mail,
  Phone
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

const mockCustomers = [
  {
    id: '1',
    name: 'Budi Santoso',
    email: 'budi@email.com',
    phone: '081234567890',
    joinDate: '2024-01-15',
    totalOrders: 12,
    totalSpent: 15600000,
    lastOrder: '2024-12-08',
    status: 'active',
    address: 'Jl. Sudirman No. 123, Jakarta Selatan'
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    email: 'siti@email.com',
    phone: '081234567891',
    joinDate: '2024-02-20',
    totalOrders: 8,
    totalSpent: 9800000,
    lastOrder: '2024-12-07',
    status: 'active',
    address: 'Jl. Gatot Subroto No. 45, Jakarta Pusat'
  },
  {
    id: '3',
    name: 'Ahmad Wijaya',
    email: 'ahmad@email.com',
    phone: '081234567892',
    joinDate: '2024-03-10',
    totalOrders: 15,
    totalSpent: 21300000,
    lastOrder: '2024-12-06',
    status: 'active',
    address: 'Jl. Thamrin No. 78, Jakarta Pusat'
  },
  {
    id: '4',
    name: 'Rina Dewi',
    email: 'rina@email.com',
    phone: '081234567893',
    joinDate: '2024-04-05',
    totalOrders: 5,
    totalSpent: 7200000,
    lastOrder: '2024-12-05',
    status: 'active',
    address: 'Jl. Kuningan No. 90, Jakarta Selatan'
  },
  {
    id: '5',
    name: 'Dedi Kurniawan',
    email: 'dedi@email.com',
    phone: '081234567894',
    joinDate: '2024-05-12',
    totalOrders: 3,
    totalSpent: 4500000,
    lastOrder: '2024-11-20',
    status: 'inactive',
    address: 'Jl. Rasuna Said No. 12, Jakarta Selatan'
  },
];

export default function AdminCustomers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleViewDetail = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-gray-900">Customer</h1>
        <p className="text-gray-600 mt-1">Kelola data customer Amagriya Gorden</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Customer</p>
          <p className="text-2xl text-gray-900">2,345</p>
        </Card>
        <Card className="p-4 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Active</p>
          <p className="text-2xl text-green-600">2,156</p>
        </Card>
        <Card className="p-4 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Inactive</p>
          <p className="text-2xl text-gray-600">189</p>
        </Card>
        <Card className="p-4 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">New (30 days)</p>
          <p className="text-2xl text-blue-600">45</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Cari customer..."
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

      {/* Customers Table */}
      <Card className="border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Customer</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Kontak</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Join Date</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Total Orders</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Total Spent</th>
                <th className="text-left px-6 py-4 text-sm text-gray-600">Status</th>
                <th className="text-right px-6 py-4 text-sm text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#EB216A]/10 rounded-full flex items-center justify-center">
                        <span className="text-sm text-[#EB216A]">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span className="text-sm text-gray-900">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">{customer.joinDate}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{customer.totalOrders}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      Rp {(customer.totalSpent / 1000000).toFixed(1)}M
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={
                      customer.status === 'active'
                        ? 'bg-green-100 text-green-700 border-0'
                        : 'bg-gray-100 text-gray-700 border-0'
                    }>
                      {customer.status}
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
                        <DropdownMenuItem onClick={() => handleViewDetail(customer)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="w-4 h-4 mr-2" />
                          Kirim Email
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

      {/* Customer Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Customer</DialogTitle>
            <DialogDescription>
              Informasi lengkap customer
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6 py-4">
              {/* Customer Info */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-[#EB216A]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl text-[#EB216A]">
                    {selectedCustomer.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl text-gray-900 mb-2">{selectedCustomer.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail className="w-4 h-4" />
                      {selectedCustomer.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="w-4 h-4" />
                      {selectedCustomer.phone}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                  <p className="text-2xl text-gray-900">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                  <p className="text-2xl text-[#EB216A]">
                    Rp {(selectedCustomer.totalSpent / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>

              <Separator />

              {/* Additional Info */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Join Date:</span>
                  <span className="text-sm text-gray-900">{selectedCustomer.joinDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Order:</span>
                  <span className="text-sm text-gray-900">{selectedCustomer.lastOrder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={
                    selectedCustomer.status === 'active'
                      ? 'bg-green-100 text-green-700 border-0'
                      : 'bg-gray-100 text-gray-700 border-0'
                  }>
                    {selectedCustomer.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-600">Address:</span>
                  <span className="text-sm text-gray-900 text-right max-w-xs">
                    {selectedCustomer.address}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
