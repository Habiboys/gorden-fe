import {
    Edit,
    Plus,
    Trash2
} from 'lucide-react';
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
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { faqsApi } from '../../utils/api';

export default function AdminFAQ() {
    const [faqs, setFaqs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<any>(null);
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'General'
    });

    const categories = ['General', 'Products', 'Services', 'Shipping', 'Warranty'];

    useEffect(() => {
        loadFaqs();
    }, []);

    const loadFaqs = async () => {
        try {
            setLoading(true);
            const response = await faqsApi.getAll();
            setFaqs(response.data || []);
        } catch (error) {
            console.error('Error loading FAQs:', error);
            toast.error('Gagal memuat FAQ');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (!formData.question || !formData.answer) {
                toast.error('Pertanyaan dan jawaban harus diisi');
                return;
            }

            if (editingFaq) {
                await faqsApi.update(editingFaq.id, formData);
                toast.success('FAQ berhasil diupdate');
            } else {
                await faqsApi.create(formData);
                toast.success('FAQ berhasil ditambahkan');
            }

            loadFaqs();
            handleCloseDialog();
        } catch (error: any) {
            console.error('Error saving FAQ:', error);
            toast.error('Gagal menyimpan FAQ');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Anda yakin ingin menghapus FAQ ini?')) return;

        try {
            await faqsApi.delete(id);
            toast.success('FAQ berhasil dihapus');
            loadFaqs();
        } catch (error: any) {
            console.error('Error deleting FAQ:', error);
            toast.error('Gagal menghapus FAQ');
        }
    };

    const handleEdit = (faq: any) => {
        setEditingFaq(faq);
        setFormData({
            question: faq.question,
            answer: faq.answer,
            category: faq.category || 'General'
        });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingFaq(null);
        setFormData({
            question: '',
            answer: '',
            category: 'General'
        });
    };

    if (loading) {
        return <div className="p-8 text-center">Loading FAQs...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">FAQ Management</h1>
                    <p className="text-gray-500">Kelola pertanyaan yang sering diajukan</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-[#EB216A] hover:bg-[#d11d5e]">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah FAQ
                </Button>
            </div>

            <div className="grid gap-4">
                {faqs.map((faq) => (
                    <div key={faq.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">{faq.category}</Badge>
                                    <h3 className="font-semibold text-lg">{faq.question}</h3>
                                </div>
                                <p className="text-gray-600 whitespace-pre-line">{faq.answer}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(faq)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(faq.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
                {faqs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        Belum ada FAQ.
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Tambah FAQ'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Kategori</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Pertanyaan</Label>
                            <Input
                                value={formData.question}
                                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                                placeholder="Contoh: Bagaimana cara pemesanan?"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Jawaban</Label>
                            <Textarea
                                value={formData.answer}
                                onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                                rows={5}
                                placeholder="Jelaskan jawabannya di sini..."
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={handleCloseDialog}>Batal</Button>
                            <Button onClick={handleSave} className="bg-[#EB216A] hover:bg-[#d11d5e]">Simpan</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
