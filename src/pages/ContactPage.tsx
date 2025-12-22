import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { contactApi } from '../utils/api';

export default function ContactPage() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Backend doesn't have subject field, so prepend it to message
            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                message: `Subject: ${formData.subject}\n\n${formData.message}`,
                status: 'NEW'
            };

            await contactApi.create(payload);
            toast.success('Pesan berhasil dikirim! Kami akan menghubungi Anda segera.');
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: ''
            });
        } catch (error: any) {
            toast.error('Gagal mengirim pesan: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="bg-white">
            {/* Header */}
            <section className="relative bg-gradient-to-br from-pink-50 via-white to-pink-50 pt-32 pb-16 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-[#EB216A]/10 text-[#EB216A] px-4 py-2 rounded-full mb-6">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">Hubungi Kami</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl text-gray-900 mb-6">
                        Kami Siap Membantu
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Punya pertanyaan seputar produk atau ingin konsultasi gorden gratis? Jangan ragu untuk menghubungi kami.
                    </p>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
                        {/* Contact Info */}
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Informasi Kontak</h2>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-6 h-6 text-[#EB216A]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1">Alamat Showroom</h3>
                                            <p className="text-gray-600 leading-relaxed">
                                                Jl. Contoh Alamat No. 123<br />
                                                Jakarta Selatan, DKI Jakarta 12345
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-6 h-6 text-[#EB216A]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1">Telepon & WhatsApp</h3>
                                            <p className="text-gray-600 mb-1">Telepon: (021) 1234-5678</p>
                                            <p className="text-gray-600">WhatsApp: 0812-3456-7890</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-6 h-6 text-[#EB216A]" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                                            <p className="text-gray-600">info@amagriyagorden.com</p>
                                            <p className="text-gray-600">sales@amagriyagorden.com</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-8">
                                <h3 className="font-semibold text-gray-900 mb-2">Jam Operasional</h3>
                                <div className="space-y-2 text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Senin - Jumat</span>
                                        <span>08:00 - 17:00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Sabtu</span>
                                        <span>08:00 - 15:00</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Minggu</span>
                                        <span>Tutup</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Kirim Pesan</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nama Lengkap</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Nama Anda"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">No. Telepon</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="08xxxxxxxxxx"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="email@anda.com"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Subjek</Label>
                                    <Input
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="Judul pesan"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Pesan</Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Tulis pesan Anda di sini..."
                                        rows={5}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#EB216A] hover:bg-[#d11d5e] text-white py-6 text-lg"
                                >
                                    {loading ? 'Mengirim...' : 'Kirim Pesan'}
                                    {!loading && <Send className="w-5 h-5 ml-2" />}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
