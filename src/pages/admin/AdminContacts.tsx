import { Eye, Filter, Mail, Phone, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { contactsApi } from '../../utils/api';

const statusOptions = [
  { value: 'all', label: 'Semua Status' },
  { value: 'new', label: 'Baru' },
  { value: 'replied', label: 'Sudah Dibalas' },
  { value: 'closed', label: 'Selesai' },
];

export default function AdminContacts() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadContacts();
  }, [statusFilter]);

  const loadContacts = async () => {
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await contactsApi.getAll(params);
      if (response.success) {
        setContacts(response.data);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Gagal memuat kontak');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (contact: any) => {
    setSelectedContact(contact);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = async (contactId: string, newStatus: string) => {
    try {
      const response = await contactsApi.updateStatus(contactId, newStatus);
      if (response.success) {
        toast.success('Status berhasil diupdate');
        loadContacts();
        if (selectedContact?.id === contactId) {
          setSelectedContact(response.data);
        }
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Gagal update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kontak ini?')) return;

    try {
      const response = await contactsApi.delete(id);
      if (response.success) {
        toast.success('Kontak berhasil dihapus');
        loadContacts();
        if (selectedContact?.id === id) {
          setIsDetailOpen(false);
          setSelectedContact(null);
        }
      }
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast.error(error.message || 'Gagal menghapus kontak');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500">Baru</Badge>;
      case 'replied':
        return <Badge className="bg-green-500">Dibalas</Badge>;
      case 'closed':
        return <Badge className="bg-gray-500">Selesai</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl text-gray-900">Kontak Masuk</h1>
          <p className="text-gray-600 mt-1">
            Kelola pesan dan pertanyaan dari pelanggan
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Email / Telepon</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {statusFilter === 'all'
                    ? 'Belum ada kontak masuk'
                    : `Tidak ada kontak dengan status "${statusOptions.find(o => o.value === statusFilter)?.label}"`}
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(contact.submittedAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>{contact.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="truncate max-w-[200px]">{contact.email}</span>
                      </div>
                      {contact.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {contact.subject}
                  </TableCell>
                  <TableCell>{getStatusBadge(contact.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetail(contact)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Kontak</DialogTitle>
          </DialogHeader>

          {selectedContact && (
            <div className="space-y-6 py-4">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl mb-2">{selectedContact.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <a
                        href={`mailto:${selectedContact.email}`}
                        className="text-[#EB216A] hover:underline"
                      >
                        {selectedContact.email}
                      </a>
                    </div>
                    {selectedContact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <a
                          href={`tel:${selectedContact.phone}`}
                          className="text-[#EB216A] hover:underline"
                        >
                          {selectedContact.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-2">{getStatusBadge(selectedContact.status)}</div>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedContact.submittedAt).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Subject */}
              <div>
                <Label className="text-sm text-gray-500 mb-1 block">Subject</Label>
                <p className="text-base">{selectedContact.subject}</p>
              </div>

              {/* Message */}
              <div>
                <Label className="text-sm text-gray-500 mb-1 block">Pesan</Label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="whitespace-pre-wrap">{selectedContact.message}</p>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <Label className="text-sm text-gray-500 mb-2 block">
                  Update Status
                </Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedContact.status === 'replied' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedContact.id, 'replied')}
                    className={selectedContact.status === 'replied' ? 'bg-green-500' : ''}
                  >
                    Sudah Dibalas
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedContact.status === 'closed' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedContact.id, 'closed')}
                    className={selectedContact.status === 'closed' ? 'bg-gray-500' : ''}
                  >
                    Selesai
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedContact.status === 'new' ? 'default' : 'outline'}
                    onClick={() => handleUpdateStatus(selectedContact.id, 'new')}
                    className={selectedContact.status === 'new' ? 'bg-blue-500' : ''}
                  >
                    Tandai Baru
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(selectedContact.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hapus Kontak
                </Button>
                <Button
                  onClick={() => setIsDetailOpen(false)}
                  className="bg-[#EB216A] hover:bg-[#d11d5e]"
                >
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, className = '', ...props }: any) {
  return (
    <label className={`block text-sm font-medium ${className}`} {...props}>
      {children}
    </label>
  );
}
