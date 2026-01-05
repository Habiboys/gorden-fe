import {
    Calculator,
    ChevronDown,
    ChevronUp,
    Edit,
    Layers,
    Plus,
    Settings,
    Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { useConfirm } from '../../context/ConfirmContext';
import { calculatorTypesApi, categoriesApi, subcategoriesApi } from '../../utils/api';

interface CalculatorType {
    id: number;
    name: string;
    slug: string;
    description: string;
    has_item_type: boolean;
    has_package_type: boolean;
    fabric_multiplier: number;
    is_active: boolean;
    display_order: number;
    category_id?: number | null;
    category?: {
        id: number;
        name: string;
        slug: string;
    };
    components: CalculatorTypeComponent[];
}

interface CalculatorTypeComponent {
    id: number;
    calculator_type_id: number;
    subcategory_id: number;
    label: string;
    is_required: boolean;
    price_calculation: 'per_meter' | 'per_unit' | 'per_10_per_meter';
    display_order: number;
    multiply_with_variant: boolean;
    variant_filter_rule: string;
    hide_on_door: boolean;
    show_gelombang?: boolean;
    subcategory?: {
        id: number;
        name: string;
        slug: string;
    };
}

interface SubCategory {
    id: number;
    name: string;
    slug: string;
    category_id: number;
}

export default function AdminCalculatorTypes() {
    const [calculatorTypes, setCalculatorTypes] = useState<CalculatorType[]>([]);
    const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
    const [categories, setCategories] = useState<any[]>([]); // For calculator type linkage
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { confirm } = useConfirm();

    // Dialog states
    const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
    const [isComponentDialogOpen, setIsComponentDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<CalculatorType | null>(null);
    const [editingComponent, setEditingComponent] = useState<CalculatorTypeComponent | null>(null);
    const [currentTypeId, setCurrentTypeId] = useState<number | null>(null);

    // Expanded cards
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

    // Type form
    const [typeForm, setTypeForm] = useState({
        name: '',
        slug: '',
        description: '',
        has_item_type: true,
        has_package_type: true,
        fabric_multiplier: '2.5',
        is_active: true,
        display_order: '0',
        category_id: '' as string,
    });

    // Component form
    const [componentForm, setComponentForm] = useState({
        subcategory_id: '',
        label: '',
        is_required: false,
        price_calculation: 'per_meter' as 'per_meter' | 'per_unit' | 'per_10_per_meter',
        display_order: '0',
        multiply_with_variant: false,
        variant_filter_rule: 'none',
        hide_on_door: false,
        show_gelombang: false,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [typesResponse, subcatsResponse, catsResponse] = await Promise.all([
                calculatorTypesApi.getAllTypes(),
                subcategoriesApi.getAll(),
                categoriesApi.getAll()
            ]);

            if (typesResponse.success) {
                setCalculatorTypes(typesResponse.data);
            }
            if (subcatsResponse.success) {
                setSubcategories(subcatsResponse.data || []);
            }
            if (catsResponse.success) {
                setCategories(catsResponse.data || []);
            }
        } catch (error: any) {
            console.error('Error loading data:', error);
            toast.error('Gagal memuat data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedCards);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedCards(newExpanded);
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    };

    // ========== TYPE CRUD ==========

    const handleAddType = () => {
        setEditingType(null);
        setTypeForm({
            name: '',
            slug: '',
            description: '',
            has_item_type: true,
            has_package_type: true,
            fabric_multiplier: '2.5',
            is_active: true,
            display_order: '0',
            category_id: '',
        });
        setIsTypeDialogOpen(true);
    };

    const handleEditType = (type: CalculatorType) => {
        setEditingType(type);
        setTypeForm({
            name: type.name,
            slug: type.slug,
            description: type.description || '',
            has_item_type: type.has_item_type,
            has_package_type: type.has_package_type,
            fabric_multiplier: type.fabric_multiplier.toString(),
            is_active: type.is_active,
            display_order: type.display_order.toString(),
            category_id: type.category_id?.toString() || '',
        });
        setIsTypeDialogOpen(true);
    };

    const handleSaveType = async () => {
        if (!typeForm.name) {
            toast.error('Nama harus diisi!');
            return;
        }

        setSaving(true);
        try {
            const data = {
                name: typeForm.name,
                slug: typeForm.slug || generateSlug(typeForm.name),
                description: typeForm.description,
                has_item_type: typeForm.has_item_type,
                has_package_type: typeForm.has_package_type,
                fabric_multiplier: parseFloat(typeForm.fabric_multiplier) || 2.5,
                is_active: typeForm.is_active,
                display_order: parseInt(typeForm.display_order) || 0,
                category_id: typeForm.category_id ? parseInt(typeForm.category_id) : null,
            };

            if (editingType) {
                await calculatorTypesApi.updateType(editingType.id, data);
                toast.success('Jenis kalkulator berhasil diupdate!');
            } else {
                await calculatorTypesApi.createType(data);
                toast.success('Jenis kalkulator berhasil ditambahkan!');
            }

            setIsTypeDialogOpen(false);
            loadData();
        } catch (error: any) {
            toast.error('Gagal menyimpan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteType = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'Hapus Jenis Kalkulator',
            description: 'Yakin ingin menghapus jenis kalkulator ini? Semua komponen terkait akan ikut terhapus.',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            variant: 'destructive',
        });

        if (isConfirmed) {
            try {
                await calculatorTypesApi.deleteType(id);
                toast.success('Jenis kalkulator berhasil dihapus!');
                loadData();
            } catch (error: any) {
                toast.error('Gagal menghapus: ' + error.message);
            }
        }
    };

    // ========== COMPONENT CRUD ==========

    const handleAddComponent = (typeId: number) => {
        setCurrentTypeId(typeId);
        setEditingComponent(null);
        setComponentForm({
            subcategory_id: '',
            label: '',
            is_required: false,
            price_calculation: 'per_meter',
            display_order: '0',
            multiply_with_variant: false,
            variant_filter_rule: 'none',
            hide_on_door: false,
            show_gelombang: false,
        });
        setIsComponentDialogOpen(true);
    };

    const handleEditComponent = (component: CalculatorTypeComponent) => {
        setCurrentTypeId(component.calculator_type_id);
        setEditingComponent(component);
        setComponentForm({
            subcategory_id: component.subcategory_id.toString(),
            label: component.label,
            is_required: component.is_required,
            price_calculation: component.price_calculation,
            display_order: component.display_order.toString(),
            multiply_with_variant: component.multiply_with_variant,
            variant_filter_rule: component.variant_filter_rule || 'none',
            hide_on_door: component.hide_on_door || false,
            show_gelombang: component.show_gelombang || false
        });
        setIsComponentDialogOpen(true);
    };

    const handleSaveComponent = async () => {
        if (!componentForm.subcategory_id || !componentForm.label) {
            toast.error('Sub Kategori dan Label harus diisi!');
            return;
        }

        setSaving(true);
        try {
            const data = {
                calculator_type_id: currentTypeId,
                subcategory_id: parseInt(componentForm.subcategory_id),
                label: componentForm.label,
                is_required: componentForm.is_required,
                price_calculation: componentForm.price_calculation,
                display_order: parseInt(componentForm.display_order) || 0,
                multiply_with_variant: componentForm.multiply_with_variant,
                variant_filter_rule: componentForm.variant_filter_rule,
                hide_on_door: componentForm.hide_on_door,
                show_gelombang: componentForm.show_gelombang,
            };

            if (editingComponent) {
                await calculatorTypesApi.updateComponent(editingComponent.id, data);
                toast.success('Komponen berhasil diupdate!');
            } else {
                await calculatorTypesApi.addComponent(data);
                toast.success('Komponen berhasil ditambahkan!');
            }

            setIsComponentDialogOpen(false);
            loadData();
        } catch (error: any) {
            toast.error('Gagal menyimpan komponen: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteComponent = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'Hapus Komponen',
            description: 'Yakin ingin menghapus komponen ini?',
            confirmText: 'Ya, Hapus',
            cancelText: 'Batal',
            variant: 'destructive',
        });

        if (isConfirmed) {
            try {
                await calculatorTypesApi.deleteComponent(id);
                toast.success('Komponen berhasil dihapus!');
                loadData();
            } catch (error: any) {
                toast.error('Gagal menghapus komponen: ' + error.message);
            }
        }
    };

    const getPriceCalcLabel = (calc: string) => {
        switch (calc) {
            case 'per_meter': return 'Per Meter';
            case 'per_unit': return 'Per Unit';
            case 'per_10_per_meter': return 'Per 10/Meter';
            default: return calc;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#EB216A] mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl text-gray-900">Jenis Kalkulator</h1>
                    <p className="text-gray-600 mt-1">Kelola jenis kalkulator dan komponen-komponennya</p>
                </div>
                <Button
                    className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                    onClick={handleAddType}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Jenis Kalkulator
                </Button>
            </div>

            {/* Info Card */}
            <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex gap-3">
                    <Settings className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Cara Kerja:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                            <li>Buat <strong>Jenis Kalkulator</strong> (mis: Smokering, Kupu-kupu, Blind)</li>
                            <li>Tambahkan <strong>Komponen</strong> dengan memilih <strong>Sub Kategori</strong></li>
                            <li>Di kalkulator user, produk dari sub kategori tersebut akan muncul sebagai pilihan</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Calculator Types List */}
            {calculatorTypes.length === 0 ? (
                <Card className="p-12 text-center border-gray-200">
                    <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Belum ada jenis kalkulator</p>
                    <Button
                        className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                        onClick={handleAddType}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Jenis Kalkulator
                    </Button>
                </Card>
            ) : (
                <div className="space-y-4">
                    {calculatorTypes.map((type) => (
                        <Card key={type.id} className="border-gray-200 overflow-hidden">
                            {/* Type Header */}
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleExpand(type.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#EB216A]/10 rounded-xl flex items-center justify-center">
                                        <Calculator className="w-6 h-6 text-[#EB216A]" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-medium text-gray-900">{type.name}</h3>
                                            {!type.is_active && (
                                                <Badge className="bg-gray-100 text-gray-600 border-0">Nonaktif</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <span>Multiplier: {type.fabric_multiplier}x</span>
                                            <span>•</span>
                                            <span>Multiplier: {type.fabric_multiplier}x</span>
                                            {type.category && (
                                                <>
                                                    <span>•</span>
                                                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                        Kategori: {type.category.name}
                                                    </Badge>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>{type.components?.length || 0} komponen</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleEditType(type); }}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDeleteType(type.id); }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    {expandedCards.has(type.id) ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Type Details (Expanded) */}
                            {expandedCards.has(type.id) && (
                                <div className="border-t border-gray-100 p-4 bg-gray-50">
                                    {/* Type Settings */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-gray-500">Pilihan Jendela/Pintu</p>
                                            <p className="font-medium">{type.has_item_type ? 'Ya' : 'Tidak'}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-gray-500">Pilihan Paket</p>
                                            <p className="font-medium">{type.has_package_type ? 'Ya' : 'Tidak'}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-gray-500">Pengali Kain</p>
                                            <p className="font-medium">{type.fabric_multiplier}x</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-gray-500">Urutan</p>
                                            <p className="font-medium">{type.display_order}</p>
                                        </div>
                                    </div>

                                    {/* Components Section */}
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                                <Layers className="w-4 h-4" />
                                                Komponen ({type.components?.length || 0})
                                            </h4>
                                            <Button
                                                size="sm"
                                                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                                                onClick={() => handleAddComponent(type.id)}
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Tambah Komponen
                                            </Button>
                                        </div>

                                        {type.components && type.components.length > 0 ? (
                                            <div className="space-y-2">
                                                {type.components.map((comp) => (
                                                    <div
                                                        key={comp.id}
                                                        className="bg-white p-3 rounded-lg flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm text-gray-600">
                                                                {comp.display_order + 1}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{comp.label}</p>
                                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                    <span>Sub Kategori: {comp.subcategory?.name || 'N/A'}</span>
                                                                    <span>•</span>
                                                                    <Badge className="bg-gray-100 text-gray-600 border-0 text-xs">
                                                                        {getPriceCalcLabel(comp.price_calculation)}
                                                                    </Badge>
                                                                    {comp.is_required && (
                                                                        <Badge className="bg-red-100 text-red-700 border-0 text-xs">Wajib</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditComponent(comp)}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => handleDeleteComponent(comp.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white p-6 rounded-lg text-center text-gray-500">
                                                <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                <p>Belum ada komponen</p>
                                                <p className="text-sm">Tambahkan komponen untuk kalkulator ini</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Type Dialog */}
            <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingType ? 'Edit Jenis Kalkulator' : 'Tambah Jenis Kalkulator'}</DialogTitle>
                        <DialogDescription>
                            {editingType ? 'Update informasi jenis kalkulator' : 'Buat jenis kalkulator baru'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Nama *</Label>
                            <Input
                                value={typeForm.name}
                                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value, slug: generateSlug(e.target.value) })}
                                placeholder="Contoh: Smokering"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Slug</Label>
                            <Input
                                value={typeForm.slug}
                                onChange={(e) => setTypeForm({ ...typeForm, slug: e.target.value })}
                                placeholder="smokering"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Deskripsi</Label>
                            <Textarea
                                value={typeForm.description}
                                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                                placeholder="Deskripsi singkat..."
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Pengali Kain</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={typeForm.fabric_multiplier}
                                    onChange={(e) => setTypeForm({ ...typeForm, fabric_multiplier: e.target.value })}
                                />
                                <p className="text-xs text-gray-500">2.5 untuk smokering, 2 untuk kupu-kupu, 1 untuk blind</p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Kategori Produk Utama</Label>
                                <Select
                                    value={typeForm.category_id || "no_category"}
                                    onValueChange={(value: string) => setTypeForm({ ...typeForm, category_id: value === "no_category" ? "" : value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kategori terkait" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="no_category">- Tidak ada filter kategori -</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id.toString()}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">Hanya tampilkan produk dari kategori ini saat membuat dokumen</p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Urutan Tampil</Label>
                                <Input
                                    type="number"
                                    value={typeForm.display_order}
                                    onChange={(e) => setTypeForm({ ...typeForm, display_order: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <Label>Tampilkan Pilihan Jendela/Pintu</Label>
                                <p className="text-xs text-gray-500">User bisa pilih jenis item</p>
                            </div>
                            <Switch
                                checked={typeForm.has_item_type}
                                onCheckedChange={(checked: boolean) => setTypeForm({ ...typeForm, has_item_type: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <Label>Tampilkan Pilihan Paket</Label>
                                <p className="text-xs text-gray-500">Gorden Saja / Gorden Lengkap</p>
                            </div>
                            <Switch
                                checked={typeForm.has_package_type}
                                onCheckedChange={(checked: boolean) => setTypeForm({ ...typeForm, has_package_type: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <Label>Aktif</Label>
                                <p className="text-xs text-gray-500">Tampilkan di halaman kalkulator user</p>
                            </div>
                            <Switch
                                checked={typeForm.is_active}
                                onCheckedChange={(checked: boolean) => setTypeForm({ ...typeForm, is_active: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsTypeDialogOpen(false)} disabled={saving}>
                            Batal
                        </Button>
                        <Button
                            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                            onClick={handleSaveType}
                            disabled={saving}
                        >
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Component Dialog */}
            <Dialog open={isComponentDialogOpen} onOpenChange={setIsComponentDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editingComponent ? 'Edit Komponen' : 'Tambah Komponen'}</DialogTitle>
                        <DialogDescription>
                            Pilih sub kategori untuk komponen ini. Produk dari sub kategori akan muncul di kalkulator.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Sub Kategori *</Label>
                            <Select
                                value={componentForm.subcategory_id}
                                onValueChange={(value: string) => {
                                    const subcat = subcategories.find(s => s.id.toString() === value);
                                    setComponentForm({
                                        ...componentForm,
                                        subcategory_id: value,
                                        label: componentForm.label || `Pilih ${subcat?.name || ''}`
                                    });
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih sub kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subcategories.map((sub) => (
                                        <SelectItem key={sub.id} value={sub.id.toString()}>
                                            {sub.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Produk dari sub kategori ini akan muncul sebagai pilihan</p>
                        </div>

                        <div className="grid gap-2">
                            <Label>Label *</Label>
                            <Input
                                value={componentForm.label}
                                onChange={(e) => setComponentForm({ ...componentForm, label: e.target.value })}
                                placeholder="Contoh: Pilih Rel Gorden"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Aturan Filter Varian Komponen</Label>
                            <Select
                                value={componentForm.variant_filter_rule}
                                onValueChange={(value: string) =>
                                    setComponentForm({ ...componentForm, variant_filter_rule: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Tanpa Filter (Tasel, Hook)</SelectItem>
                                    <SelectItem value="rel-4-sizes">Rel (4 ukuran lebar: +0, +10, +20, +30)</SelectItem>
                                    <SelectItem value="vitrase-kombinasi">Vitrase (Lebar +20~+80 × Tinggi +0~+30)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Filter varian komponen berdasarkan dimensi. Bahan gorden difilter otomatis.</p>
                        </div>

                        <div className="grid gap-2">
                            <Label>Urutan Tampil</Label>
                            <Input
                                type="number"
                                value={componentForm.display_order}
                                onChange={(e) => setComponentForm({ ...componentForm, display_order: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <Label>Wajib Dipilih</Label>
                                <p className="text-xs text-gray-500">User harus memilih komponen ini</p>
                            </div>
                            <Switch
                                checked={componentForm.is_required}
                                onCheckedChange={(checked: boolean) => setComponentForm({ ...componentForm, is_required: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <Label>Ikuti Multiplier Varian?</Label>
                                <p className="text-xs text-gray-500">
                                    Jika ON, jumlah komponen dikali dengan multiplier varian (e.g. 2 Sibak)
                                </p>
                            </div>
                            <Switch
                                checked={componentForm.multiply_with_variant}
                                onCheckedChange={(checked: boolean) => setComponentForm({ ...componentForm, multiply_with_variant: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <Label>Sembunyikan di Pintu</Label>
                                <p className="text-xs text-gray-500">Komponen tidak muncul jika item = Pintu</p>
                            </div>
                            <Switch
                                checked={componentForm.hide_on_door}
                                onCheckedChange={(checked: boolean) => setComponentForm({ ...componentForm, hide_on_door: checked })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <Label>Tampilkan Kolom Gelombang</Label>
                                <p className="text-xs text-gray-500">Tampilkan kolom gelombang saat pilih varian</p>
                            </div>
                            <Switch
                                checked={componentForm.show_gelombang}
                                onCheckedChange={(checked: boolean) => setComponentForm({ ...componentForm, show_gelombang: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsComponentDialogOpen(false)} disabled={saving}>
                            Batal
                        </Button>
                        <Button
                            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                            onClick={handleSaveComponent}
                            disabled={saving}
                        >
                            {saving ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
