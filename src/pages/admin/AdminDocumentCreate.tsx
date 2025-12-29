import {
    ArrowLeft,
    Check,
    Plus,
    Save,
    Search,
    Trash2,
    X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { calculatorTypesApi, documentsApi, productsApi, productVariantsApi } from '../../utils/api';
import { getProductImageUrl } from '../../utils/imageHelper';

// ================== TYPES (from CalculatorPage) ==================

interface ComponentFromDB {
    id: number;
    calculator_type_id: number;
    subcategory_id: number;
    label: string;
    is_required: boolean;
    price_calculation: 'per_meter' | 'per_unit' | 'per_10_per_meter';
    display_order: number;
}

interface CalculatorTypeFromDB {
    id: number;
    name: string;
    slug: string;
    description: string;
    has_item_type: boolean;
    has_package_type: boolean;
    fabric_multiplier: number;
    is_active: boolean;
    components: ComponentFromDB[];
}

interface ComponentSelection {
    product: any;
    qty: number;
    discount: number;  // Per-component discount percentage
}

interface SelectedComponents {
    [componentId: number]: ComponentSelection;
}

interface CalculatorItem {
    id: string;
    itemType: 'jendela' | 'pintu';
    packageType: 'gorden-saja' | 'gorden-lengkap';
    width: number;
    height: number;
    panels: number;
    quantity: number;
    fabricDiscount: number;  // Discount percentage for fabric
    components: SelectedComponents;
    selectedVariant?: {
        id: string;
        width: number;
        height: number;
        sibak: number;
        price: number;
        name: string;
    };
}

// ================== COMPONENT ==================

export default function AdminDocumentCreate() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID for edit mode
    const [loading, setLoading] = useState(false);

    // ================== CALCULATOR STATE ==================
    const [calculatorTypes, setCalculatorTypes] = useState<CalculatorTypeFromDB[]>([]);
    const [selectedCalcType, setSelectedCalcType] = useState<CalculatorTypeFromDB | null>(null);

    // Products
    const [fabricProducts, setFabricProducts] = useState<any[]>([]);
    const [selectedFabric, setSelectedFabric] = useState<any>(null);
    const [componentProducts, setComponentProducts] = useState<{ [subcategoryId: number]: any[] }>({});

    // Items (windows/doors)
    const [items, setItems] = useState<CalculatorItem[]>([]);

    // Form state for adding item
    const [itemType, setItemType] = useState<'jendela' | 'pintu'>('jendela');
    const [packageType, setPackageType] = useState<'gorden-saja' | 'gorden-lengkap'>('gorden-lengkap');
    const [width, setWidth] = useState('200');
    const [height, setHeight] = useState('250');
    const [panels, setPanels] = useState('2');
    const [quantity, setQuantity] = useState('1');

    // Modals
    const [showFabricPicker, setShowFabricPicker] = useState(false);
    const [showComponentPicker, setShowComponentPicker] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingComponentId, setEditingComponentId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Variant modal
    const [showVariantPicker, setShowVariantPicker] = useState(false);
    const [availableVariants, setAvailableVariants] = useState<any[]>([]);
    const [variantItemId, setVariantItemId] = useState<string | null>(null);

    // ================== DOCUMENT FORM STATE ==================
    const [docType, setDocType] = useState<'QUOTATION' | 'INVOICE'>('QUOTATION');
    const getDefaultValidUntil = () => {
        const date = new Date();
        date.setDate(date.getDate() + 14);
        return date.toISOString().split('T')[0];
    };
    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        referralCode: '',
        discount: 20,
        validUntil: getDefaultValidUntil(),
        paymentTerms: '',
        notes: ''
    });

    // ================== LOAD DATA ==================
    useEffect(() => {
        loadCalculatorTypes();
        loadFabricProducts();
    }, []);

    // Load document if ID exists (Edit Mode)
    useEffect(() => {
        if (id) {
            loadDocumentForEdit();
        }
    }, [id, calculatorTypes, fabricProducts]); // Depend on types/products to match selections

    const loadDocumentForEdit = async () => {
        if (calculatorTypes.length === 0 || fabricProducts.length === 0) return; // Wait for dependencies

        setLoading(true);
        try {
            const response = await documentsApi.getOne(id!);
            if (response.success && response.data) {
                const doc = response.data;
                const data = doc.data || doc.quotationData || {}; // Handle double serialization if any
                const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

                // Set Metadata
                setDocType(doc.type);
                setFormData({
                    customerName: doc.customer_name || '',
                    customerPhone: doc.customer_phone || '',
                    customerEmail: doc.customer_email || '',
                    customerAddress: doc.address || doc.customer_address || '',
                    referralCode: doc.referral_code || '',
                    discount: parsedData.discount || doc.discount_percentage || 0, // Load global discount
                    validUntil: doc.valid_until ? doc.valid_until.split('T')[0] : getDefaultValidUntil(),
                    paymentTerms: parsedData.paymentTerms || doc.payment_terms || '',
                    notes: parsedData.notes || doc.notes || ''
                });

                // Set Calculator Type
                if (parsedData.calculatorTypeSlug) {
                    const matchedType = calculatorTypes.find(t => t.slug === parsedData.calculatorTypeSlug);
                    if (matchedType) setSelectedCalcType(matchedType);
                }

                // Set Fabric
                if (parsedData.baseFabric && parsedData.baseFabric.id) {
                    const matchedFabric = fabricProducts.find(p => p.id === parsedData.baseFabric.id);
                    if (matchedFabric) setSelectedFabric(matchedFabric);
                }

                // Set Items (Raw)
                if (parsedData.raw_items) {
                    setItems(parsedData.raw_items);
                }
            }
        } catch (error) {
            console.error('Error loading document for edit:', error);
            toast.error('Gagal memuat dokumen');
        } finally {
            setLoading(false);
        }
    };

    const loadCalculatorTypes = async () => {
        try {
            const response = await calculatorTypesApi.getAllTypes();
            if (response.success) {
                setCalculatorTypes(response.data || []);
            }
        } catch (error) {
            console.error('Error loading calculator types:', error);
            toast.error('Gagal memuat jenis kalkulator');
        }
    };

    const loadFabricProducts = async () => {
        try {
            const response = await productsApi.getAll();
            if (response.success) {
                setFabricProducts(response.data || []);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const loadComponentProducts = async (calcType: CalculatorTypeFromDB) => {
        if (!calcType?.components) return;

        const newComponentProducts: { [subcategoryId: number]: any[] } = {};
        for (const comp of calcType.components) {
            try {
                const response = await calculatorTypesApi.getProductsBySubcategory(comp.subcategory_id);
                newComponentProducts[comp.subcategory_id] = response.data || [];
            } catch (error) {
                console.error('Error loading component products:', error);
            }
        }
        setComponentProducts(newComponentProducts);
    };

    // ================== HANDLERS ==================

    // Select calculator type
    const handleSelectCalcType = (calcType: CalculatorTypeFromDB) => {
        setSelectedCalcType(calcType);
        setSelectedFabric(null);
        setItems([]);
        loadComponentProducts(calcType);
    };

    // Select fabric
    const handleSelectFabric = (product: any) => {
        setSelectedFabric(product);
        setShowFabricPicker(false);
        setSearchQuery('');
    };

    // Add item
    const handleAddItem = async () => {
        if (!width || !height) {
            toast.error('Lengkapi lebar dan tinggi!');
            return;
        }

        const itemWidth = parseFloat(width);
        const itemHeight = parseFloat(height);

        const newItem: CalculatorItem = {
            id: Date.now().toString(),
            itemType: selectedCalcType?.has_item_type ? itemType : 'jendela',
            packageType: selectedCalcType?.has_package_type ? packageType : 'gorden-saja',
            width: itemWidth,
            height: itemHeight,
            panels: parseInt(panels) || 2,
            quantity: parseInt(quantity) || 1,
            fabricDiscount: 0,  // Discount percentage for fabric
            components: {}
        };

        setItems([...items, newItem]);

        // Check for variants
        if (selectedFabric?.id) {
            try {
                const variantsRes = await productVariantsApi.getByProduct(selectedFabric.id);
                const variants = variantsRes.data || [];
                if (variants.length > 0) {
                    setVariantItemId(newItem.id);
                    setAvailableVariants(variants);
                    setShowVariantPicker(true);
                }
            } catch (error) {
                console.error('Error checking variants:', error);
            }
        }
    };

    // Remove item
    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    // Select variant for item
    const handleSelectVariant = (variant: any) => {
        if (!variantItemId) return;
        setItems(items.map(item => {
            if (item.id === variantItemId) {
                return {
                    ...item,
                    selectedVariant: {
                        id: variant.id,
                        width: variant.width,
                        height: variant.height,
                        sibak: variant.sibak || 0,
                        price: variant.price,
                        name: variant.name || `${variant.width}x${variant.height}cm`
                    }
                };
            }
            return item;
        }));
        setShowVariantPicker(false);
        setVariantItemId(null);
    };

    // Open component picker
    const openComponentPicker = (itemId: string, componentId: number) => {
        setEditingItemId(itemId);
        setEditingComponentId(componentId);
        setShowComponentPicker(true);
        setSearchQuery('');
    };

    // Open variant picker for a specific item
    const openVariantPicker = async (itemId: string) => {
        if (!selectedFabric) return;
        try {
            const variantsRes = await productVariantsApi.getByProduct(selectedFabric.id);
            const variants = variantsRes.data || [];
            if (variants.length > 0) {
                setVariantItemId(itemId);
                setAvailableVariants(variants);
                setShowVariantPicker(true);
            } else {
                toast.info('Tidak ada varian tersedia untuk produk ini');
            }
        } catch (error) {
            console.error('Error loading variants:', error);
        }
    };

    // Update component quantity for an item
    const updateComponentQty = (itemId: string, componentId: number, newQty: number) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                const selection = item.components[componentId];
                if (selection) {
                    return {
                        ...item,
                        components: {
                            ...item.components,
                            [componentId]: { ...selection, qty: Math.max(1, newQty) }
                        }
                    };
                }
            }
            return item;
        }));
    };

    // Update fabric discount percentage
    const updateFabricDiscount = (itemId: string, discountPercent: number) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                return { ...item, fabricDiscount: Math.min(100, Math.max(0, discountPercent)) };
            }
            return item;
        }));
    };

    // Update component discount percentage
    const updateComponentDiscount = (itemId: string, componentId: number, discountPercent: number) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                const selection = item.components[componentId];
                if (selection) {
                    return {
                        ...item,
                        components: {
                            ...item.components,
                            [componentId]: { ...selection, discount: Math.min(100, Math.max(0, discountPercent)) }
                        }
                    };
                }
            }
            return item;
        }));
    };

    // Select component product
    const handleSelectComponent = (product: any) => {
        if (!editingItemId || editingComponentId === null) return;

        setItems(items.map(item => {
            if (item.id === editingItemId) {
                return {
                    ...item,
                    components: {
                        ...item.components,
                        [editingComponentId]: { product, qty: 1, discount: 0 }
                    }
                };
            }
            return item;
        }));
        setShowComponentPicker(false);
        setEditingItemId(null);
        setEditingComponentId(null);
    };

    // ================== CALCULATIONS ==================

    const calculateComponentPrice = (item: CalculatorItem, comp: ComponentFromDB, selection: ComponentSelection) => {
        const widthM = item.width / 100;
        const basePrice = (() => {
            switch (comp.price_calculation) {
                case 'per_meter':
                    return Math.max(1, widthM) * selection.product.price * item.quantity;
                case 'per_unit':
                    return selection.product.price * item.quantity;
                case 'per_10_per_meter':
                    return Math.ceil(widthM * 10) * selection.product.price * item.quantity;
                default:
                    return 0;
            }
        })();
        const priceBeforeDiscount = basePrice * selection.qty;
        return priceBeforeDiscount * (1 - (selection.discount || 0) / 100);  // Apply component discount
    };

    const calculateItemPrice = (item: CalculatorItem) => {
        if (!selectedFabric || !selectedCalcType) return { fabric: 0, fabricMeters: 0, components: 0, total: 0 };

        const widthM = item.width / 100;
        const heightM = item.height / 100;

        const fabricPricePerMeter = item.selectedVariant?.price ?? selectedFabric.price;
        const fabricMeters = widthM * (selectedCalcType.fabric_multiplier || 2.4) * heightM;
        const fabricPriceBeforeDiscount = fabricMeters * fabricPricePerMeter * item.quantity;
        const fabricPrice = fabricPriceBeforeDiscount * (1 - (item.fabricDiscount || 0) / 100);  // Apply fabric discount

        let componentsPrice = 0;
        if (item.packageType === 'gorden-lengkap' && selectedCalcType.components) {
            selectedCalcType.components.forEach(comp => {
                const selection = item.components[comp.id];
                if (selection) {
                    componentsPrice += calculateComponentPrice(item, comp, selection);
                }
            });
        }

        return {
            fabric: fabricPrice,
            fabricBeforeDiscount: fabricPriceBeforeDiscount,
            fabricMeters,
            components: componentsPrice,
            total: fabricPrice + componentsPrice
        };
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + calculateItemPrice(item).total, 0);
    };

    // ================== SUBMIT ==================

    const handleSubmit = async () => {
        if (!formData.customerName || !formData.customerPhone) {
            toast.error('Nama dan nomor telepon customer harus diisi');
            return;
        }

        if (!selectedCalcType || !selectedFabric || items.length === 0) {
            toast.error('Pilih kalkulator, bahan kain, dan minimal 1 item');
            return;
        }

        setLoading(true);
        try {
            // Build windows data in format expected by DocumentDetailModal
            const windows = items.map((item, idx) => {
                const prices = calculateItemPrice(item);

                // Build component items for this window
                const windowItems: any[] = [];

                // Add fabric as first item
                windowItems.push({
                    id: `${item.id}-fabric`,
                    name: `${item.selectedVariant?.name || selectedFabric?.name} (${prices.fabricMeters.toFixed(2)}m)`,
                    price: item.selectedVariant?.price ?? selectedFabric?.price ?? 0,
                    discount: item.fabricDiscount || 0,
                    quantity: item.quantity,
                    totalPrice: prices.fabric
                });

                // Add component items if package lengkap
                if (item.packageType === 'gorden-lengkap' && selectedCalcType?.components) {
                    selectedCalcType.components.forEach(comp => {
                        const selection = item.components[comp.id];
                        if (selection) {
                            const compPrice = calculateComponentPrice(item, comp, selection);
                            windowItems.push({
                                id: `${item.id}-comp-${comp.id}`,
                                name: `${comp.label}: ${selection.product.name}`,
                                price: selection.product.price,
                                discount: selection.discount || 0,
                                quantity: selection.qty,
                                totalPrice: compPrice
                            });
                        }
                    });
                }

                return {
                    id: item.id,
                    title: `${idx + 1} ${item.itemType === 'jendela' ? 'Jendela' : 'Pintu'}`,
                    size: `Ukuran ${item.width}cm x ${item.height}cm`,
                    fabricType: item.packageType === 'gorden-lengkap' ? 'Gorden Lengkap' : 'Gorden Saja',
                    items: windowItems,
                    subtotal: prices.total
                };
            });

            // Create quotation data structure
            const quotationData = {
                windows,
                raw_items: items, // Store raw calculator items for full fidelity reconstruction
                calculatorType: selectedCalcType?.name,
                calculatorTypeSlug: selectedCalcType?.slug,
                baseFabric: {
                    id: selectedFabric?.id,
                    name: selectedFabric?.name,
                    price: selectedFabric?.price,
                    image: selectedFabric?.images?.[0] || selectedFabric?.image // Store image for reconstruction
                },
                discount: formData.discount, // Persist Global Discount Percentage
                paymentTerms: formData.paymentTerms || 'Bank BRI 0763 0100 1160 564 a.n ABDUL RAHIM',
                notes: formData.notes || ''
            };

            const payload = {
                type: docType,
                customer_name: formData.customerName,
                customer_phone: formData.customerPhone,
                customer_email: formData.customerEmail || null,
                address: formData.customerAddress || null,  // Backend uses 'address' not 'customer_address'
                referral_code: formData.referralCode || null,
                discount_amount: calculateTotal() * (formData.discount || 0) / 100,  // Discount amount in rupiah
                valid_until: formData.validUntil || null,
                data: quotationData,  // This is the quotation/invoice data
                total_amount: calculateTotal() * (1 - (formData.discount || 0) / 100)  // Backend uses 'total_amount'
            };

            console.log('Saving document with payload:', payload);

            let response;
            if (id) {
                // Update existing
                response = await documentsApi.update(id, payload);
            } else {
                // Create new
                response = await documentsApi.create(payload);
            }

            if (response.success) {
                toast.success(id ? 'Dokumen berhasil diperbarui' : 'Dokumen berhasil dibuat');
                navigate('/admin/documents');
            } else {
                toast.error(id ? 'Gagal memperbarui dokumen' : 'Gagal membuat dokumen');
            }
        } catch (error: any) {
            console.error('Error creating document:', error);
            toast.error('Gagal membuat dokumen: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ================== RENDER ==================

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/documents')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Buat Dokumen Baru</h1>
                    <p className="text-sm text-gray-500">Invoice / Surat Penawaran berbasis Kalkulator</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Calculator Section */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Step 1: Select Calculator Type */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#EB216A] text-white text-[10px] flex items-center justify-center">1</span>
                            Pilih Jenis Kalkulator
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {calculatorTypes.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => handleSelectCalcType(type)}
                                    className={`p-3 rounded-lg border-2 text-left transition-all ${selectedCalcType?.id === type.id
                                        ? 'border-[#EB216A] bg-[#EB216A]/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <p className="font-medium text-sm">{type.name}</p>
                                    <p className="text-[10px] text-gray-500 mt-1">{type.description}</p>
                                    {selectedCalcType?.id === type.id && (
                                        <Check className="w-4 h-4 text-[#EB216A] mt-2" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Select Fabric (after calc type selected) */}
                    {selectedCalcType && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#EB216A] text-white text-[10px] flex items-center justify-center">2</span>
                                Pilih Bahan Kain
                            </h3>
                            <div className="flex gap-3">
                                <div className="flex-1 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                    {selectedFabric ? (
                                        <div className="flex items-center gap-3">
                                            <img src={getProductImageUrl(selectedFabric.images || selectedFabric.image)} alt="" className="w-12 h-12 rounded object-cover bg-gray-100" />
                                            <div>
                                                <p className="font-medium">{selectedFabric.name}</p>
                                                <p className="text-sm text-[#EB216A]">Rp {Number(selectedFabric.price).toLocaleString('id-ID')}/m</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-400">Belum dipilih...</p>
                                    )}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setShowFabricPicker(true)}>
                                    <Search className="w-4 h-4 mr-2" /> Pilih
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Add Items (after fabric selected) */}
                    {selectedCalcType && selectedFabric && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#EB216A] text-white text-[10px] flex items-center justify-center">3</span>
                                Tambah Item
                            </h3>

                            {/* Add Item Form */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                                    {selectedCalcType.has_item_type && (
                                        <div>
                                            <Label className="text-xs">Jenis</Label>
                                            <select value={itemType} onChange={e => setItemType(e.target.value as any)} className="w-full mt-1 px-2 py-1.5 border rounded text-sm">
                                                <option value="jendela">Jendela</option>
                                                <option value="pintu">Pintu</option>
                                            </select>
                                        </div>
                                    )}
                                    {selectedCalcType.has_package_type && (
                                        <div>
                                            <Label className="text-xs">Paket</Label>
                                            <select value={packageType} onChange={e => setPackageType(e.target.value as any)} className="w-full mt-1 px-2 py-1.5 border rounded text-sm">
                                                <option value="gorden-lengkap">Paket Lengkap</option>
                                                <option value="gorden-saja">Gorden Saja</option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <Label className="text-xs">Lebar (cm)</Label>
                                        <Input type="number" value={width} onChange={e => setWidth(e.target.value)} className="mt-1 h-8" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Tinggi (cm)</Label>
                                        <Input type="number" value={height} onChange={e => setHeight(e.target.value)} className="mt-1 h-8" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Panel</Label>
                                        <Input type="number" value={panels} onChange={e => setPanels(e.target.value)} className="mt-1 h-8" />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Qty</Label>
                                        <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="mt-1 h-8 text-sm" />
                                    </div>
                                </div>
                                <Button onClick={handleAddItem} className="mt-2 bg-[#EB216A] hover:bg-[#d11d5e] h-8 text-sm">
                                    <Plus className="w-4 h-4 mr-2" /> Tambah Item
                                </Button>
                            </div>

                            {/* Items List */}
                            <div className="space-y-3">
                                {items.map((item, idx) => {
                                    const prices = calculateItemPrice(item);
                                    return (
                                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                            {/* Item Header */}
                                            <div className="bg-gray-50 p-3 border-b border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 rounded-lg bg-[#EB216A]/10 text-[#EB216A] text-sm font-bold flex items-center justify-center">{idx + 1}</span>
                                                        <div>
                                                            <h4 className="font-semibold">{item.itemType === 'jendela' ? 'Jendela' : 'Pintu'} - {item.packageType === 'gorden-lengkap' ? 'Paket Lengkap' : 'Gorden Saja'}</h4>
                                                            <p className="text-sm text-gray-500">{item.width}cm × {item.height}cm • {item.panels} panel • {item.quantity} unit</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-500 p-2">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Item Details */}
                                            <div className="p-4 space-y-3">
                                                <h5 className="text-xs text-gray-500 uppercase font-medium">Rincian Komponen</h5>

                                                {/* Fabric Row */}
                                                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium">{item.selectedVariant?.name || selectedFabric?.name}</span>
                                                            <Button size="sm" variant="outline" className="h-6 px-2 text-xs border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white" onClick={() => openVariantPicker(item.id)}>
                                                                {item.selectedVariant ? 'Ganti Varian' : 'Pilih Varian'}
                                                            </Button>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <p className="text-sm text-gray-500">
                                                                {prices.fabricMeters.toFixed(2)}m × Rp {(item.selectedVariant?.price ?? selectedFabric?.price ?? 0).toLocaleString('id-ID')} × {item.quantity}
                                                            </p>
                                                            {/* Fabric Discount Input */}
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs text-gray-400">Disc:</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    value={item.fabricDiscount || 0}
                                                                    onChange={(e) => updateFabricDiscount(item.id, parseInt(e.target.value) || 0)}
                                                                    className="w-12 h-6 px-1 border border-gray-300 rounded text-center text-xs focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                />
                                                                <span className="text-xs text-gray-400">%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        {item.fabricDiscount && item.fabricDiscount > 0 ? (
                                                            <>
                                                                <span className="text-xs text-gray-400 line-through block">Rp {prices.fabricBeforeDiscount?.toLocaleString('id-ID')}</span>
                                                                <span className="text-lg font-semibold text-green-600">Rp {prices.fabric.toLocaleString('id-ID')}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-lg font-semibold">Rp {prices.fabric.toLocaleString('id-ID')}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Components (if package lengkap) */}
                                                {item.packageType === 'gorden-lengkap' && selectedCalcType?.components?.map(comp => {
                                                    const selection = item.components[comp.id];
                                                    const compPrice = selection ? calculateComponentPrice(item, comp, selection) : 0;

                                                    return (
                                                        <div key={comp.id} className={`flex justify-between items-start py-3 border-b border-gray-100 ${!selection ? 'opacity-60' : ''}`}>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-medium">{selection ? selection.product.name : comp.label}</span>
                                                                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white" onClick={() => openComponentPicker(item.id, comp.id)}>
                                                                        {selection ? 'Ganti' : 'Pilih'}
                                                                    </Button>
                                                                </div>
                                                                {selection ? (
                                                                    <div className="flex items-center gap-4 mt-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs text-gray-500">Qty:</span>
                                                                            <input
                                                                                type="number"
                                                                                min="1"
                                                                                value={selection.qty}
                                                                                onChange={(e) => updateComponentQty(item.id, comp.id, parseInt(e.target.value) || 1)}
                                                                                className="w-14 h-7 px-2 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-[#EB216A] focus:border-[#EB216A] outline-none"
                                                                            />
                                                                        </div>
                                                                        {/* Component Discount Input */}
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-xs text-gray-400">Disc:</span>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max="100"
                                                                                value={selection.discount || 0}
                                                                                onChange={(e) => updateComponentDiscount(item.id, comp.id, parseInt(e.target.value) || 0)}
                                                                                className="w-12 h-7 px-1 border border-gray-300 rounded text-center text-xs focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                            />
                                                                            <span className="text-xs text-gray-400">%</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-sm text-gray-400">Pilih {comp.label.toLowerCase()}</span>
                                                                )}
                                                            </div>
                                                            <div className="text-right mt-1">
                                                                {selection && selection.discount && selection.discount > 0 ? (
                                                                    <>
                                                                        <span className="text-xs text-gray-400 line-through block">Rp {(compPrice / (1 - selection.discount / 100)).toLocaleString('id-ID')}</span>
                                                                        <span className="text-lg font-semibold text-green-600">Rp {compPrice.toLocaleString('id-ID')}</span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-lg font-semibold">Rp {compPrice.toLocaleString('id-ID')}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Subtotal */}
                                                <div className="flex justify-between items-center pt-2">
                                                    <span className="font-medium text-sm">Subtotal</span>
                                                    <span className="text-lg font-bold text-[#EB216A]">Rp {prices.total.toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {items.length === 0 && (
                                    <p className="text-center text-gray-400 py-6">Belum ada item. Isi form di atas lalu klik "Tambah Item".</p>
                                )}
                            </div>

                            {/* Total */}
                            {items.length > 0 && (
                                <div className="mt-4 p-4 bg-[#EB216A]/5 border border-[#EB216A]/20 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-sm">Total Kalkulator</span>
                                        <span className="text-lg font-bold text-[#EB216A]">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Document Form */}
                <div className="space-y-6">
                    {/* Document Type */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="font-semibold text-sm mb-3">Jenis Dokumen</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setDocType('QUOTATION')} className={`flex-1 p-3 rounded-lg border-2 text-center ${docType === 'QUOTATION' ? 'border-[#EB216A] bg-[#EB216A]/5' : 'border-gray-200'}`}>
                                Surat Penawaran
                            </button>
                            <button onClick={() => setDocType('INVOICE')} className={`flex-1 p-3 rounded-lg border-2 text-center ${docType === 'INVOICE' ? 'border-[#EB216A] bg-[#EB216A]/5' : 'border-gray-200'}`}>
                                Invoice
                            </button>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                        <h3 className="font-semibold text-sm">Data Customer</h3>
                        <div>
                            <Label>Nama *</Label>
                            <Input value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} placeholder="Nama customer" />
                        </div>
                        <div>
                            <Label>No. Telepon *</Label>
                            <Input value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} placeholder="08xxxxxxxxxx" />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} placeholder="email@example.com" />
                        </div>
                        <div>
                            <Label>Alamat</Label>
                            <Textarea value={formData.customerAddress} onChange={e => setFormData({ ...formData, customerAddress: e.target.value })} rows={2} />
                        </div>
                    </div>

                    {/* Additional Options */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                        <h3 className="font-semibold text-sm">Opsi Tambahan</h3>
                        <div>
                            <Label>Kode Referral</Label>
                            <Input value={formData.referralCode} onChange={e => setFormData({ ...formData, referralCode: e.target.value })} placeholder="Kode referral (opsional)" />
                        </div>
                        <div>
                            <Label>Diskon Tambahan (%)</Label>
                            <Input type="number" value={formData.discount} onChange={e => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })} placeholder="0" />
                        </div>

                        {/* Summary Display */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm border border-gray-100">
                            <div className="flex justify-between text-gray-600">
                                <span>Total Item</span>
                                <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                            </div>
                            {formData.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Diskon ({formData.discount}%)</span>
                                    <span>-Rp {(calculateTotal() * formData.discount / 100).toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 text-[#EB216A]">
                                <span>Total Akhir</span>
                                <span>Rp {(calculateTotal() * (1 - (formData.discount || 0) / 100)).toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        <div>
                            <Label>Berlaku Sampai</Label>
                            <Input type="date" value={formData.validUntil} onChange={e => setFormData({ ...formData, validUntil: e.target.value })} />
                        </div>
                        <div>
                            <Label>Syarat Pembayaran</Label>
                            <Textarea value={formData.paymentTerms} onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })} rows={2} placeholder="DP 50%, pelunasan setelah pemasangan, dll..." />
                        </div>
                        <div>
                            <Label>Catatan</Label>
                            <Textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Catatan tambahan..." />
                        </div>
                    </div>

                    {/* Submit */}
                    <Button onClick={handleSubmit} disabled={loading} className="w-full bg-[#EB216A] hover:bg-[#d11d5e] py-2 text-base">
                        {loading ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-2" /> Simpan Dokumen</>}
                    </Button>
                </div>
            </div>

            {/* ================== MODALS ================== */}

            {/* Fabric Picker Modal */}
            {
                showFabricPicker && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Pilih Bahan Kain</h3>
                                <Button size="sm" variant="ghost" onClick={() => setShowFabricPicker(false)}><X className="w-4 h-4" /></Button>
                            </div>
                            <div className="p-4 border-b">
                                <Input placeholder="Cari produk..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {fabricProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 20).map(product => (
                                    <div key={product.id} className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-[#EB216A]" onClick={() => handleSelectFabric(product)}>
                                        <div className="flex items-center gap-3">
                                            <img src={getProductImageUrl(product.images || product.image)} alt="" className="w-12 h-12 rounded object-cover bg-gray-100" />
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-[#EB216A]">Rp {Number(product.price).toLocaleString('id-ID')}/m</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Variant Picker Modal */}
            {
                showVariantPicker && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl w-full max-w-md mx-4 max-h-[60vh] overflow-hidden flex flex-col">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Pilih Varian</h3>
                                <Button size="sm" variant="ghost" onClick={() => { setShowVariantPicker(false); setVariantItemId(null); }}><X className="w-4 h-4" /></Button>
                            </div>
                            <div className="p-4 border-b">
                                <Input placeholder="Cari varian..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                <div className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => { setShowVariantPicker(false); setVariantItemId(null); }}>
                                    <p className="font-medium">Harga Default</p>
                                    <p className="text-sm text-gray-500">Gunakan harga produk utama - Rp {Number(selectedFabric?.price || 0).toLocaleString('id-ID')}/m</p>
                                </div>
                                {availableVariants.filter(v => `${v.width}x${v.height}`.includes(searchQuery) || String(v.sibak || '').includes(searchQuery)).map(v => (
                                    <div key={v.id} className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-[#EB216A]" onClick={() => handleSelectVariant(v)}>
                                        <p className="font-medium">{v.width}x{v.height}cm {v.sibak ? `(sibak ${v.sibak}cm)` : ''}</p>
                                        <p className="text-sm text-[#EB216A]">Rp {Number(v.price).toLocaleString('id-ID')}/m</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Component Picker Modal */}
            {
                showComponentPicker && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Pilih Komponen</h3>
                                <Button size="sm" variant="ghost" onClick={() => setShowComponentPicker(false)}><X className="w-4 h-4" /></Button>
                            </div>
                            <div className="p-4 border-b">
                                <Input placeholder="Cari produk..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {editingComponentId !== null && (() => {
                                    const comp = selectedCalcType?.components?.find(c => c.id === editingComponentId);
                                    const products = comp ? (componentProducts[comp.subcategory_id] || []) : [];
                                    return products.filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product: any) => (
                                        <div key={product.id} className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-[#EB216A]" onClick={() => handleSelectComponent(product)}>
                                            <div className="flex items-center gap-3">
                                                <img src={getProductImageUrl(product.images || product.image)} alt="" className="w-10 h-10 rounded object-cover bg-gray-100" />
                                                <div>
                                                    <p className="font-medium">{product.name}</p>
                                                    <p className="text-sm text-[#EB216A]">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
