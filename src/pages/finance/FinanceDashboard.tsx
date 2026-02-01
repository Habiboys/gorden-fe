import { ArrowLeft, ArrowRight, ChevronDown, FileSpreadsheet, Plus, Store, Trash, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { financeApi, storesApi } from '../../utils/api';

const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
};

export default function FinanceDashboard() {

    const { user } = useAuth(); // Handled by AdminLayout
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStore, setSelectedStore] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [recap, setRecap] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Export Modal State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportPeriod, setExportPeriod] = useState<'weekly' | 'monthly' | 'all' | 'custom'>('monthly');
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [exporting, setExporting] = useState(false);

    // Filters
    const [dateFilter, setDateFilter] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('monthly');
    const [transactionFilter, setTransactionFilter] = useState<string>('');

    // Form State
    const [formData, setFormData] = useState({
        type: 'INCOME',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].slice(0, 5) // HH:MM
    });

    // Category State
    const [categories, setCategories] = useState<any[]>([]);

    // Pagination
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1
    });

    useEffect(() => {
        fetchStores();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedStore) {
            fetchTransactions();
        }
    }, [selectedStore, pagination.page, transactionFilter]);

    useEffect(() => {
        if (selectedStore) {
            fetchRecap();
        }
    }, [selectedStore, dateFilter]);

    // Refetch categories when type changes to filter (optional, if we want filtered dropdowns)
    // For now get all
    const fetchCategories = async () => {
        try {
            const response = await financeApi.getCategories();
            if (response.success) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchStores = async () => {
        try {
            setLoading(true);
            const response = await storesApi.getAll();
            if (response.success && response.data.length > 0) {
                // If FINANCE role, filter stores assigned to user?
                // Backend should handle filtering ideally, but for now we might see all if using getAll 
                // Wait, storeController.getAll returns ALL. 
                // We need to check if we are finance_user, we should mostly see assigned stores. 
                // But let's assume filtering happens or proper route implementation later. 
                // For MVP, user selects from list.

                // Filter client side for now if User Stores relation exists in User object
                // const userStores = user?.Stores || []; 

                // Fallback: if user is ADMIN seeing this page, show all. If FINANCE, limit.
                let availableStores = response.data;
                // if (user?.role === 'FINANCE' && userStores.length > 0) {
                //    availableStores = userStores;
                // }

                setStores(availableStores);
                setSelectedStore(availableStores[0]); // Default to first
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
            toast.error('Gagal memuat data toko');
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        if (!selectedStore) return;
        try {
            const params: any = {
                page: pagination.page,
                limit: pagination.limit
            };

            if (transactionFilter) {
                params.type = transactionFilter;
            }

            const response = await financeApi.getTransactions(selectedStore.id, params);
            if (response.success) {
                setTransactions(response.data);
                setPagination(prev => ({
                    ...prev,
                    total: response.pagination.total,
                    totalPages: response.pagination.totalPages
                }));
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const fetchRecap = async () => {
        if (!selectedStore) return;
        try {
            const params: any = {};
            if (dateFilter !== 'all') {
                params.period = dateFilter;
            }

            const response = await financeApi.getRecap(selectedStore.id, params);
            if (response.success) {
                setRecap(response.data);
            }
        } catch (error) {
            console.error('Error fetching recap:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah anda yakin ingin menghapus transaksi ini?')) return;
        if (!selectedStore) return;

        try {
            await financeApi.deleteTransaction(id);
            toast.success('Transaksi berhasil dihapus');

            // Refresh
            fetchTransactions();
            fetchRecap();
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error(error.message || 'Gagal menghapus transaksi');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStore) return;

        // Validate category
        if (!formData.category) {
            toast.error('Pilih kategori terlebih dahulu');
            return;
        }

        try {
            setSubmitting(true);

            // Combine Date and Time
            const dateTimeString = `${formData.date}T${formData.time}`;
            const dateObj = new Date(dateTimeString);

            await financeApi.createTransaction({
                store_id: selectedStore.id,
                ...formData,
                date: dateObj // Send full Date object or ISO string
            });

            toast.success('Transaksi berhasil dicatat');
            setShowModal(false);
            setFormData({
                type: 'INCOME',
                amount: '',
                category: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0].slice(0, 5)
            });

            // Refresh
            fetchRecap();

            // Reset to page 1 and fetch immediately to show new data
            setPagination(prev => ({ ...prev, page: 1 }));

            // Allow state to settle or force fetch with explicit page 1
            const response = await financeApi.getTransactions(selectedStore.id, {
                page: 1,
                limit: pagination.limit,
                ...(transactionFilter ? { type: transactionFilter } : {})
            });

            if (response.success) {
                setTransactions(response.data);
                setPagination(prev => ({
                    ...prev,
                    page: 1,
                    total: response.pagination.total,
                    totalPages: response.pagination.totalPages
                }));
            }
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyimpan transaksi');
        } finally {
            setSubmitting(false);
        }
    };



    if (loading && !selectedStore) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Header & Store Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-[#EB216A]" />
                        Finance Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm sm:text-base">Kelola keuangan toko anda disini</p>
                </div>

                <div className="relative">
                    <Store className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <select
                        value={selectedStore?.id || ''}
                        onChange={(e) => {
                            const store = stores.find(s => s.id === e.target.value);
                            setSelectedStore(store);
                            setPagination(prev => ({ ...prev, page: 1 }));
                        }}
                        className="pl-12 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EB216A] appearance-none cursor-pointer hover:bg-gray-100 transition-colors w-full sm:min-w-[300px]"
                    >
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
            </div>
            {/* Stats Cards */}
            <div className="space-y-4 sm:space-y-6">
                {/* Period Filter for Recap */}
                <div className="flex justify-end overflow-x-auto pb-2 sm:pb-0">
                    <div className="inline-flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                        {['daily', 'weekly', 'monthly', 'all'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setDateFilter(p as any)}
                                className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${dateFilter === p
                                    ? 'bg-[#EB216A] text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Current Balance - Soft Background */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-pink-100 p-2 rounded-lg">
                                <Wallet className="w-6 h-6 text-[#EB216A]" />
                            </div>
                            <span className="text-gray-500 text-sm font-medium">Current Balance</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{formatRupiah(recap?.current_balance || 0)}</h3>
                        <p className="text-[#EB216A] text-sm">Total Saldo Aktif</p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <span className="text-gray-500 text-sm font-medium">Total Income ({dateFilter})</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{formatRupiah(recap?.total_income || 0)}</h3>
                        <p className="text-green-600 text-sm flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 rotate-45" /> Pemasukan Periodik
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-red-100 p-2 rounded-lg">
                                <TrendingDown className="w-6 h-6 text-red-600" />
                            </div>
                            <span className="text-gray-500 text-sm font-medium">Total Expense ({dateFilter})</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{formatRupiah(recap?.total_expense || 0)}</h3>
                        <p className="text-red-600 text-sm flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 -rotate-45" /> Pengeluaran Periodik
                        </p>
                    </div>
                </div>
            </div>

            {/* Transactions Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-gray-900">Riwayat Transaksi</h2>
                        <p className="text-xs sm:text-sm text-gray-500">Daftar pemasukan dan pengeluaran toko</p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                        <Button
                            variant="outline"
                            className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A]/10"
                            onClick={() => setShowExportModal(true)}
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Export Excel
                        </Button>

                        {/* Type Filter */}
                        <select
                            value={transactionFilter}
                            onChange={(e) => {
                                setTransactionFilter(e.target.value);
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#EB216A] appearance-none cursor-pointer"
                        >
                            <option value="">Semua Tipe</option>
                            <option value="INCOME">Pemasukan</option>
                            <option value="EXPENSE">Pengeluaran</option>
                        </select>

                        <Button className="bg-[#EB216A] hover:bg-[#d11d5e] text-white flex-1 sm:flex-none" onClick={() => setShowModal(true)}>
                            <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Transaksi Baru</span>
                            <span className="sm:hidden">Baru</span>
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-medium text-gray-500">Waktu</th>
                                <th className="px-6 py-4 font-medium text-gray-500">Tipe</th>
                                <th className="px-6 py-4 font-medium text-gray-500">Kategori</th>
                                <th className="px-6 py-4 font-medium text-gray-500">Keterangan</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-right">Jumlah</th>
                                <th className="px-6 py-4 font-medium text-gray-500 text-right hidden sm:table-cell">Saldo Akhir</th>
                                <th className="px-6 py-4 font-medium text-gray-500 hidden lg:table-cell">PIC</th>
                                {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                                    <th className="px-6 py-4 font-medium text-gray-500 text-right">Aksi</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada transaksi
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((trx) => (
                                    <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                            {new Date(trx.transaction_date).toLocaleString('id-ID', {
                                                day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={trx.type === 'INCOME' ? 'bg-green-100 text-green-700 hover:bg-green-200 border-0 whitespace-nowrap' : 'bg-red-100 text-red-700 hover:bg-red-200 border-0 whitespace-nowrap'}>
                                                {trx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{trx.category}</td>
                                        <td className="px-6 py-4 text-gray-600 min-w-[200px] max-w-xs break-words">{trx.description || '-'}</td>
                                        <td className={`px-6 py-4 text-right font-medium whitespace-nowrap ${trx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                            {trx.type === 'INCOME' ? '+' : '-'} {formatRupiah(parseFloat(trx.amount))}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900 hidden sm:table-cell">
                                            {trx.balance_after ? formatRupiah(parseFloat(trx.balance_after)) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs hidden lg:table-cell">
                                            {trx.PIC?.name || 'Unknown'}
                                        </td>
                                        {(user?.role === 'ADMIN' || user?.role === 'SUPERADMIN') && (
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(trx.id)}
                                                >
                                                    <Trash className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        Hal {pagination.page} dari {pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page <= 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        >
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Add Transaction Modal */}
            {
                showModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Catat Transaksi</h2>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Transaksi</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                                            className={`p-3 rounded-xl border text-center transition-all ${formData.type === 'INCOME'
                                                ? 'bg-green-50 border-green-200 text-green-700 font-bold ring-2 ring-green-500 ring-offset-2'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            Pemasukan
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                            className={`p-3 rounded-xl border text-center transition-all ${formData.type === 'EXPENSE'
                                                ? 'bg-red-50 border-red-200 text-red-700 font-bold ring-2 ring-red-500 ring-offset-2'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            Pengeluaran
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A] focus:ring-1 focus:ring-[#EB216A]"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                                    {categories.filter(c => c.type === formData.type).length === 0 ? (
                                        <p className="text-sm text-red-500 p-2 bg-red-50 rounded-lg">
                                            Belum ada kategori untuk tipe ini. Hubungi Admin untuk menambahkan kategori.
                                        </p>
                                    ) : (
                                        <select
                                            required
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A] bg-white"
                                        >
                                            <option value="">Pilih Kategori</option>
                                            {categories
                                                .filter(c => c.type === formData.type)
                                                .map(c => (
                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                                        rows={3}
                                        placeholder="Detail transaksi..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal & Waktu</label>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full sm:w-2/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                                        />
                                        <input
                                            type="time"
                                            required
                                            value={formData.time}
                                            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                            className="w-full sm:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Menyimpan...' : 'Simpan'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Export Modal */}
            {showExportModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Export Laporan</h2>
                            <p className="text-sm text-gray-500 mt-1">Toko: {selectedStore?.name}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Periode</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'weekly', label: 'Minggu Ini' },
                                        { value: 'monthly', label: 'Bulan Ini' },
                                        { value: 'all', label: 'Semua' },
                                        { value: 'custom', label: 'Rentang Tanggal' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setExportPeriod(opt.value as any)}
                                            className={`p-3 rounded-xl border text-center text-sm transition-all ${exportPeriod === opt.value
                                                ? 'bg-[#EB216A]/10 border-[#EB216A] text-[#EB216A] font-bold'
                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {exportPeriod === 'custom' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
                                        <input
                                            type="date"
                                            value={exportStartDate}
                                            onChange={(e) => setExportStartDate(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
                                        <input
                                            type="date"
                                            value={exportEndDate}
                                            onChange={(e) => setExportEndDate(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A]"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowExportModal(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1 bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                                    disabled={exporting || (exportPeriod === 'custom' && (!exportStartDate || !exportEndDate))}
                                    onClick={async () => {
                                        if (!selectedStore) return;
                                        try {
                                            setExporting(true);
                                            toast.info('Downloading Excel...');

                                            const params: any = { type: transactionFilter };

                                            if (exportPeriod === 'custom') {
                                                params.startDate = exportStartDate;
                                                params.endDate = exportEndDate;
                                            } else if (exportPeriod !== 'all') {
                                                // Calculate date range based on period
                                                const now = new Date();
                                                const end = now.toISOString().split('T')[0];
                                                let start = '';

                                                if (exportPeriod === 'weekly') {
                                                    const weekAgo = new Date(now);
                                                    weekAgo.setDate(weekAgo.getDate() - 7);
                                                    start = weekAgo.toISOString().split('T')[0];
                                                } else if (exportPeriod === 'monthly') {
                                                    const monthAgo = new Date(now);
                                                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                                                    start = monthAgo.toISOString().split('T')[0];
                                                }

                                                params.startDate = start;
                                                params.endDate = end;
                                            }

                                            await financeApi.exportTransactions(selectedStore.id, params);
                                            toast.success('Download Berhasil!');
                                            setShowExportModal(false);
                                        } catch (e) {
                                            toast.error('Download Gagal!');
                                        } finally {
                                            setExporting(false);
                                        }
                                    }}
                                >
                                    {exporting ? 'Mengunduh...' : 'Download Excel'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
