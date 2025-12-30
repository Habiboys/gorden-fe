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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";
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
    category?: {
        id: number;
        name: string;
        slug: string;
    };
    category_id?: number;
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
    groupId?: string; // Group items by product (Block logic)
    itemType: 'jendela' | 'pintu';
    packageType: 'gorden-saja' | 'gorden-lengkap';
    name?: string; // Custom name for the item (e.g. "Jendela Depan")
    product?: any; // Specific product for this item (overrides global selectedFabric)
    width: number;
    height: number;
    panels: number;
    quantity: number;
    fabricDiscount: number;  // Discount percentage for fabric
    itemDiscount?: number;    // Discount percentage for entire item subtotal
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

    // Form state for adding item (Modal)
    const [showItemModal, setShowItemModal] = useState(false);
    const [itemModalTargetProduct, setItemModalTargetProduct] = useState<any>(null); // For Blind flow
    const [itemName, setItemName] = useState(''); // For Blind flow labels

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
    // Dedicated search for blind product list

    // Grouping State
    const [targetGroupId, setTargetGroupId] = useState<string | null>(null);

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

    const isBlindType = () => {
        return selectedCalcType?.slug.includes('blind') || selectedCalcType?.has_item_type === false;
    };

    // Open Add Item Modal
    const handleOpenItemModal = (product?: any) => {
        // Reset form
        setWidth('');
        setHeight('');
        setPanels('1');
        setQuantity('1');
        setItemName('');

        if (product) {
            setItemModalTargetProduct(product);
        } else {
            setItemModalTargetProduct(null);
        }
        setTargetGroupId(null); // Reset group target when opening fresh


        setShowItemModal(true);
    };

    // Add separate size to existing group
    const handleAddSizeToGroup = (groupId: string, product: any) => {
        setTargetGroupId(groupId);
        setItemModalTargetProduct(product);
        // Reset Item Dimensions
        setWidth('');
        setHeight('');
        setItemName('');
        setShowItemModal(true);
    };

    // Remove entire group
    const handleRemoveGroup = (groupId: string) => {
        if (confirm('Hapus seluruh grup item ini?')) {
            setItems(items.filter(i => i.groupId !== groupId));
        }
    };

    // Select fabric
    const handleSelectFabric = (product: any) => {
        if (isBlindType()) {
            // Check if we are adding a variant to a specific group
            // Actually, handleAddSizeToGroup passes product directly. 
            // If picking from "Pilih Produk Blind", we want to start a new Item with this product.
            handleOpenItemModal(product);
            setShowFabricPicker(false);
        } else {
            setSelectedFabric(product);
            setShowFabricPicker(false);
        }
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

        const groupId = targetGroupId
            ? targetGroupId
            : (isBlindType() ? Date.now().toString() + '-group' : undefined);

        const newItem: CalculatorItem = {
            id: Date.now().toString(),
            groupId,
            itemType: selectedCalcType?.has_item_type ? itemType : 'jendela',
            packageType: selectedCalcType?.has_package_type ? packageType : 'gorden-saja',
            name: itemName || undefined, // Set custom name
            product: itemModalTargetProduct || selectedFabric, // Set specific product if any (blind), else use global fabric
            width: itemWidth,
            height: itemHeight,
            panels: parseInt(panels) || (isBlindType() ? 1 : 2),
            quantity: parseInt(quantity) || 1,
            fabricDiscount: 0,
            components: {}
        };

        setItems([...items, newItem]);
        setShowItemModal(false); // Close Modal

        // Check for variants (Only for Global Fabric, not per-item product for now unless requested)
        // For Blind (per-item product), we might want to check variants but usually blind variants are different.
        // Let's stick to global fabric variant check for Smokaring/Kupu2 logic for now.
        const productToCheck = itemModalTargetProduct || selectedFabric;

        if (productToCheck?.id) {
            try {
                const variantsRes = await productVariantsApi.getByProduct(productToCheck.id);
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

    // Update fabric discount percentage
    const updateFabricDiscount = (itemId: string, discountPercent: number) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                return { ...item, fabricDiscount: Math.min(100, Math.max(0, discountPercent)) };
            }
            return item;
        }));
    };

    // Open component picker
    const openComponentPicker = (itemId: string, componentId: number) => {
        setEditingItemId(itemId);
        setEditingComponentId(componentId);
        setShowComponentPicker(true);
        setSearchQuery('');
    };

    // Select component product
    const handleSelectComponent = (product: any) => {
        if (!editingItemId || editingComponentId === null) return;

        setItems(items.map(item => {
            if (item.id === editingItemId) {
                const existingSelection = item.components[editingComponentId];
                return {
                    ...item,
                    components: {
                        ...item.components,
                        [editingComponentId]: {
                            product,
                            qty: existingSelection?.qty || 1,       // Default to 1 if new
                            discount: existingSelection?.discount || 0 // Default to 0 if new
                        }
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
        const product = item.product || selectedFabric; // PRIORITIZE ITEM PRODUCT
        if (!product || !selectedCalcType) return { fabric: 0, fabricMeters: 0, components: 0, total: 0, totalAfterItemDiscount: 0 };

        const widthM = item.width / 100;
        const heightM = item.height / 100;

        const fabricPricePerMeter = item.selectedVariant?.price ?? product.price;
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

        const subtotal = fabricPrice + componentsPrice;
        const totalAfterItemDiscount = subtotal * (1 - (item.itemDiscount || 0) / 100);  // Apply item discount

        return {
            fabricPricePerMeter, // ADD THIS
            fabric: fabricPrice,
            fabricBeforeDiscount: fabricPriceBeforeDiscount,
            fabricMeters,
            components: componentsPrice,
            total: subtotal,                      // Subtotal before item discount
            totalAfterItemDiscount               // Total after item discount
        };
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + calculateItemPrice(item).totalAfterItemDiscount, 0);
    };

    // ================== SUBMIT ==================

    const handleSubmit = async () => {
        if (!formData.customerName || !formData.customerPhone) {
            toast.error('Nama dan nomor telepon customer harus diisi');
            return;
        }

        if (!selectedCalcType || (!selectedFabric && !isBlindType()) || items.length === 0) {
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

                // Add fabric/product as first item
                windowItems.push({
                    id: `${item.id}-fabric`,
                    name: `${item.product?.name || selectedFabric?.name} ${item.selectedVariant?.name ? `(${item.selectedVariant.name})` : ''} (${prices.fabricMeters.toFixed(2)}m)`,
                    price: item.selectedVariant?.price ?? item.product?.price ?? selectedFabric?.price ?? 0,
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
                    title: `${idx + 1}. ${item.name || (item.itemType === 'jendela' ? 'Jendela' : 'Pintu')}`,
                    size: `Ukuran ${item.width}cm x ${item.height}cm`,
                    fabricType: item.packageType === 'gorden-lengkap' ? 'Gorden Lengkap' : 'Gorden Saja',
                    items: windowItems,
                    itemDiscount: item.itemDiscount || 0,
                    subtotal: prices.totalAfterItemDiscount
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

            if (selectedFabric) { // Only valid for Global Fabric flow, for Blinds we might not have a base baseFabric but items have products
                // We still send baseFabric in data for reconstruction if it exists
            }

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

                    {/* Step 2: Logic Split based on Calc Type */}
                    {selectedCalcType && (
                        <>
                            {/* ================= CONDITION 1: STANDARD (Smokring / Kupu-kupu) ================= */}
                            {!isBlindType() && (
                                <div className="space-y-6">
                                    {/* Step 2A: Select Global Fabric */}
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

                                    {/* Step 3: Add Item Button */}
                                    {selectedFabric && (
                                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-[#EB216A] text-white text-[10px] flex items-center justify-center">3</span>
                                                Tambah Item
                                            </h3>
                                            <Button
                                                onClick={() => handleOpenItemModal()}
                                                className="w-full h-12 border-dashed border-2 border-gray-300 bg-gray-50 text-gray-500 hover:bg-white hover:border-[#EB216A] hover:text-[#EB216A]"
                                                variant="outline"
                                            >
                                                <Plus className="w-5 h-5 mr-2" /> Tambah Jendela / Pintu
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ================= CONDITION 2: BLIND (Per-Item Product) ================= */}
                            {isBlindType() && (
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-[#EB216A] text-white text-[10px] flex items-center justify-center">2</span>
                                        Pilih Produk & Tambah Ukuran
                                    </h3>

                                    {/* Product Picker Button */}
                                    <div className="flex gap-3">
                                        <div className="flex-1 p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                            Tekan tombol di samping untuk memilih produk...
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setShowFabricPicker(true)} className="h-auto px-6">
                                            <Search className="w-4 h-4 mr-2" /> Pilih Produk Blind
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Items List (Shared) */}
                            {items.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 p-4 mt-6">
                                    <h3 className="text-sm font-semibold mb-3">Daftar Item ({items.length})</h3>
                                    <div className="space-y-6">
                                        {(() => {
                                            // Group Items Logic
                                            const groupedItems: { [key: string]: CalculatorItem[] } = {};
                                            const ungroupedItems: CalculatorItem[] = [];

                                            items.forEach(item => {
                                                if (item.groupId) {
                                                    if (!groupedItems[item.groupId]) groupedItems[item.groupId] = [];
                                                    groupedItems[item.groupId].push(item);
                                                } else {
                                                    ungroupedItems.push(item);
                                                }
                                            });

                                            return (
                                                <>
                                                    {/* Grouped Items (Blind Flow) */}
                                                    {Object.entries(groupedItems).map(([groupId, groupItems]) => {
                                                        const firstItem = groupItems[0];
                                                        const groupProduct = firstItem.product;

                                                        // Calculate Group Totals
                                                        const groupTotal = groupItems.reduce((sum, item) => sum + calculateItemPrice(item).total, 0);

                                                        return (
                                                            <div key={groupId} className="bg-white border rounded-xl shadow-sm overflow-hidden mb-6">
                                                                {/* Product Header */}
                                                                <div className="bg-gray-50 p-4 flex items-center justify-between border-b">
                                                                    <div className="flex items-center gap-4">
                                                                        <img
                                                                            src={getProductImageUrl(groupProduct?.images || groupProduct?.image)}
                                                                            className="w-16 h-16 rounded-lg object-cover bg-white border"
                                                                        />
                                                                        <div>
                                                                            <h3 className="font-bold text-lg text-gray-900">{groupProduct?.name || 'Produk Custom'}</h3>
                                                                            <p className="text-[#EB216A] font-medium">Rp {(groupProduct?.price ?? 0).toLocaleString('id-ID')}/m</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleRemoveGroup(groupId)}
                                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                        >
                                                                            <Trash2 className="w-4 h-4 mr-2" /> Hapus Grup
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Items Table */}
                                                                <div className="p-4">
                                                                    <div className="overflow-x-auto">
                                                                        <table className="w-full text-sm">
                                                                            <thead>
                                                                                <tr className="bg-gray-50 text-gray-600 border-b">
                                                                                    <th className="py-2 px-3 text-left font-medium">Label</th>
                                                                                    <th className="py-2 px-3 text-center font-medium">L x T (cm)</th>
                                                                                    <th className="py-2 px-3 text-center font-medium">Vol (m²)</th>
                                                                                    <th className="py-2 px-3 text-right font-medium">Harga Satuan</th>
                                                                                    <th className="py-2 px-3 text-center font-medium">Disc (%)</th>
                                                                                    <th className="py-2 px-3 text-right font-medium">Harga Net</th>
                                                                                    <th className="py-2 px-3 text-center font-medium">Qty</th>
                                                                                    <th className="py-2 px-3 text-right font-medium">Total</th>
                                                                                    <th className="py-2 px-3 text-center font-medium">Aksi</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-gray-100">
                                                                                {groupItems.map((item) => {
                                                                                    const prices = calculateItemPrice(item);
                                                                                    return (
                                                                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                                                                            <td className="py-3 px-3 relative">
                                                                                                <p className="font-medium text-gray-900">{item.name || '-'}</p>
                                                                                            </td>
                                                                                            <td className="py-3 px-3 text-center">
                                                                                                {item.width} x {item.height}
                                                                                            </td>
                                                                                            <td className="py-3 px-3 text-center text-gray-500">
                                                                                                {prices.fabricMeters.toFixed(2)}
                                                                                            </td>
                                                                                            <td className="py-3 px-3 text-right text-gray-600">
                                                                                                {/* Base Price + Discount Logic if needed */}
                                                                                                Rp {(prices.fabricPricePerMeter ?? 0).toLocaleString('id-ID')}
                                                                                            </td>
                                                                                            <td className="py-3 px-3 text-center">
                                                                                                <input
                                                                                                    type="number"
                                                                                                    min="0"
                                                                                                    max="100"
                                                                                                    value={item.fabricDiscount || 0}
                                                                                                    onChange={(e) => updateFabricDiscount(item.id, parseInt(e.target.value) || 0)}
                                                                                                    className="w-12 h-8 px-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                                                />
                                                                                            </td>
                                                                                            <td className="py-3 px-3 text-right text-gray-600 font-medium bg-gray-50/50">
                                                                                                Rp {(prices.fabricPricePerMeter * (1 - (item.fabricDiscount || 0) / 100)).toLocaleString('id-ID')}
                                                                                            </td>
                                                                                            <td className="py-3 px-3 text-center font-medium">
                                                                                                {item.quantity}
                                                                                            </td>
                                                                                            <td className="py-3 px-3 text-right font-bold text-gray-900">
                                                                                                Rp {prices.total.toLocaleString('id-ID')}
                                                                                            </td>
                                                                                            <td className="py-3 px-3 text-center">
                                                                                                <button
                                                                                                    onClick={() => handleRemoveItem(item.id)}
                                                                                                    className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                                                                                                >
                                                                                                    <X className="w-4 h-4" />
                                                                                                </button>
                                                                                            </td>
                                                                                        </tr>
                                                                                    );
                                                                                })}
                                                                            </tbody>
                                                                            {/* Footer Group */}
                                                                            <tfoot className="border-t border-gray-200">
                                                                                <tr>
                                                                                    <td colSpan={6} className="py-3 px-3 text-right font-semibold text-gray-600">Subtotal Grup</td>
                                                                                    <td className="py-3 px-3 text-right font-bold text-[#EB216A] text-lg">
                                                                                        Rp {groupTotal.toLocaleString('id-ID')}
                                                                                    </td>
                                                                                    <td></td>
                                                                                </tr>
                                                                            </tfoot>
                                                                        </table>
                                                                    </div>

                                                                    {/* Add Variant Button for Group */}
                                                                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                                                                        <Button
                                                                            onClick={() => handleAddSizeToGroup(groupId, groupProduct)}
                                                                            variant="outline"
                                                                            className="border-dashed border-gray-300 text-gray-600 hover:border-[#EB216A] hover:text-[#EB216A]"
                                                                        >
                                                                            <Plus className="w-4 h-4 mr-2" /> Tambah Ukuran (Produk Sama)
                                                                        </Button>
                                                                    </div>



                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </>
                                            );
                                        })()}

                                        {/* Ungrouped Items Table (Standard Flow) */}
                                        {items.some(i => !i.groupId) && (
                                            <div className="border rounded-xl overflow-hidden mt-6">
                                                {/* NEW ITEM BLOCK LAYOUT FOR STANDARD CALCULATOR */}
                                                {items.filter(i => !i.groupId).map((item, idx) => {
                                                    const prices = calculateItemPrice(item);

                                                    // Main Fabric Calculations
                                                    const fabricGross = prices.fabricBeforeDiscount || prices.total || 0;
                                                    const fabricNet = prices.fabric || 0;
                                                    const unitGross = fabricGross / (item.quantity || 1);
                                                    const unitNet = fabricNet / (item.quantity || 1);

                                                    return (
                                                        <div key={item.id} className="mb-8 border rounded-xl overflow-hidden shadow-sm bg-white">
                                                            {/* ITEM HEADER */}
                                                            <div className="bg-gray-50 border-b px-4 py-3 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-gray-800 text-lg">
                                                                        {item.quantity} {item.itemType === 'jendela' ? 'Jendela' : 'Pintu'}
                                                                    </span>
                                                                    <span className="text-gray-500 mx-2">|</span>
                                                                    <span className="font-medium text-gray-700">
                                                                        Ukuran {item.width}cm x {item.height}cm
                                                                    </span>
                                                                    <span className="text-gray-500 mx-2">|</span>
                                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                                        {item.packageType === 'gorden-lengkap' ? 'Gorden Lengkap' : 'Gorden Saja'}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button variant="ghost" size="sm" onClick={() => setShowItemModal(true)} className="text-gray-500 hover:text-blue-600">
                                                                        Edit Ukuran
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* COMPONENT LIST (Card Style) */}
                                                            <div className="p-4 space-y-3">
                                                                {/* Column Headers */}
                                                                <div className="flex items-center justify-between p-3 text-xs font-medium text-gray-500 border-b border-dashed mb-2">
                                                                    <div className="flex-1">Produk</div>
                                                                    <div className="flex items-center gap-6">
                                                                        <div className="w-24 text-right">Harga</div>
                                                                        <div className="w-16 text-center">Disc</div>
                                                                        <div className="w-16 text-center">Qty</div>
                                                                        <div className="w-28 text-right">Total</div>
                                                                    </div>
                                                                </div>

                                                                {/* 1. Main Fabric Row */}
                                                                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 bg-white shadow-sm">
                                                                    <div className="flex items-center gap-3 flex-1">
                                                                        <Button
                                                                            onClick={() => {/* Maybe specific fabric picker or just edit item */ }}
                                                                            className={`text-xs px-3 h-8 shadow-sm ${item.product ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-[#EB216A] hover:bg-[#D41B5B] text-white'}`}
                                                                        >
                                                                            {item.product ? 'Ganti' : 'Pilih'}
                                                                        </Button>

                                                                        {/* Name Display Logic: Show product name + variant if selected */}
                                                                        <div className="min-w-[120px]">
                                                                            {item.product ? (
                                                                                <div className="flex flex-col leading-tight">
                                                                                    <span className="font-semibold text-gray-900">
                                                                                        {item.selectedVariant ? item.selectedVariant.name : item.product.name}
                                                                                    </span>
                                                                                    {item.selectedVariant && (
                                                                                        <span className="text-[10px] text-gray-500">{item.product.name}</span>
                                                                                    )}
                                                                                </div>
                                                                            ) : (
                                                                                <span className="font-semibold text-gray-700">
                                                                                    Gorden {selectedCalcType?.name}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Selected Product Info (Image & Variant Details) */}
                                                                        {item.product ? (
                                                                            <div className="flex items-center gap-2 text-sm text-gray-600 border-l pl-3 ml-2">
                                                                                <img src={getProductImageUrl(item.product.image || item.product.images)} className="w-8 h-8 rounded object-cover border" />
                                                                                <div className="flex flex-col leading-tight">
                                                                                    <span className="text-[10px] text-gray-500">{item.selectedVariant ? `Varian: ${item.selectedVariant.name}` : 'Standard'}</span>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex items-center gap-2 text-sm text-gray-600 border-l pl-3 ml-2">
                                                                                <span className="text-gray-400 italic">Belum dipilih</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Price & Qty Section */}
                                                                    <div className="flex items-center gap-4">
                                                                        {/* Harga Gross */}
                                                                        <div className="w-24 text-right flex flex-col justify-center">
                                                                            <span className="text-sm font-medium text-gray-600">Rp {Math.round(unitGross).toLocaleString('id-ID')}</span>
                                                                            {item.fabricDiscount > 0 && (
                                                                                <span className="text-[10px] text-gray-400 line-through">Rp {Math.round(unitGross * (100 / (100 - item.fabricDiscount))).toLocaleString('id-ID')}</span>
                                                                            )}
                                                                        </div>

                                                                        {/* Disc */}
                                                                        <div className="w-16 flex justify-center">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max="100"
                                                                                value={item.fabricDiscount || 0}
                                                                                onChange={(e) => updateFabricDiscount(item.id, parseInt(e.target.value) || 0)}
                                                                                className="w-12 h-8 px-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                                placeholder="Disc%"
                                                                                title="Diskon %"
                                                                            />
                                                                        </div>

                                                                        {/* Qty */}
                                                                        <div className="w-16 flex justify-center">
                                                                            <input
                                                                                type="number"
                                                                                min="1"
                                                                                value={item.quantity || 1}
                                                                                onChange={(e) => {
                                                                                    const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                                                                    setItems(prevItems => prevItems.map(i =>
                                                                                        i.id === item.id ? { ...i, quantity: newQty } : i
                                                                                    ));
                                                                                }}
                                                                                className="w-12 h-8 px-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                                title="Quantity"
                                                                            />
                                                                        </div>

                                                                        {/* Total */}
                                                                        <div className="w-28 text-right font-bold text-gray-900">
                                                                            Rp {Math.round(fabricNet).toLocaleString('id-ID')}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* 2. Components Rows */}
                                                                {item.packageType === 'gorden-lengkap' && selectedCalcType.components && selectedCalcType.components.map(comp => {
                                                                    const selection = item.components[comp.id];

                                                                    // Default values for unselected component
                                                                    let compTotal = 0;
                                                                    let unitPriceGross = 0;
                                                                    let compDiscount = 0;
                                                                    let isSelected = false;

                                                                    if (selection && selection.product) {
                                                                        isSelected = true;
                                                                        compDiscount = selection.discount || 0;
                                                                        const compPrices = calculateComponentPrice(item, comp, selection);
                                                                        compTotal = compPrices;
                                                                        unitPriceGross = selection.product.price;
                                                                    }

                                                                    return (
                                                                        <div key={comp.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 bg-white shadow-sm">
                                                                            <div className="flex items-center gap-3 flex-1">
                                                                                <Button
                                                                                    onClick={() => openComponentPicker(item.id, comp.id)}
                                                                                    className={`text-xs px-3 h-8 shadow-sm ${isSelected ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-[#EB216A] hover:bg-[#D41B5B] text-white'}`}
                                                                                >
                                                                                    {isSelected ? 'Ganti' : 'Pilih'}
                                                                                </Button>
                                                                                <span className="font-semibold text-gray-700 min-w-[120px]">
                                                                                    {comp.label}
                                                                                </span>
                                                                                {/* Selected Component Info */}
                                                                                <div className="flex items-center gap-2 text-sm text-gray-600 border-l pl-3 ml-2">
                                                                                    {isSelected ? (
                                                                                        <>
                                                                                            <img src={getProductImageUrl(selection!.product.images || selection!.product.image)} className="w-8 h-8 rounded object-cover border" />
                                                                                            <div className="flex flex-col leading-tight">
                                                                                                <span className="font-medium text-gray-900 line-clamp-1">{selection!.product.name}</span>
                                                                                                <span className="text-[10px] text-gray-500">Qty: {selection!.qty}</span>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : (
                                                                                        <span className="text-gray-400 italic text-xs">Belum dipilih</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Price & Qty Section */}
                                                                            <div className="flex items-center gap-4">
                                                                                {/* Harga Gross */}
                                                                                <div className="w-24 text-right">
                                                                                    <span className="text-sm font-medium text-gray-600">Rp {Math.round(unitPriceGross).toLocaleString('id-ID')}</span>
                                                                                </div>

                                                                                {/* Disc */}
                                                                                <div className="w-16 flex justify-center">
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max="100"
                                                                                        disabled={!isSelected}
                                                                                        value={isSelected ? compDiscount : ''}
                                                                                        onChange={(e) => {
                                                                                            if (!isSelected || !selection) return;
                                                                                            const newDisc = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                                                            setItems(prevItems => prevItems.map(i => {
                                                                                                if (i.id === item.id) {
                                                                                                    const newComponents = { ...i.components };
                                                                                                    newComponents[comp.id] = { ...selection, discount: newDisc };
                                                                                                    return { ...i, components: newComponents };
                                                                                                }
                                                                                                return i;
                                                                                            }));
                                                                                        }}
                                                                                        className={`w-12 h-8 px-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none ${!isSelected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                                        placeholder="-"
                                                                                    />
                                                                                </div>

                                                                                {/* Qty */}
                                                                                <div className="w-16 flex justify-center">
                                                                                    <input
                                                                                        type="number"
                                                                                        min="1"
                                                                                        disabled={!isSelected}
                                                                                        value={isSelected ? selection!.qty : ''}
                                                                                        onChange={(e) => {
                                                                                            if (!isSelected || !selection) return;
                                                                                            const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                                                                            setItems(prevItems => prevItems.map(i => {
                                                                                                if (i.id === item.id) {
                                                                                                    const newComponents = { ...i.components };
                                                                                                    newComponents[comp.id] = { ...selection, qty: newQty };
                                                                                                    return { ...i, components: newComponents };
                                                                                                }
                                                                                                return i;
                                                                                            }));
                                                                                        }}
                                                                                        className={`w-12 h-8 px-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none ${!isSelected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                                        placeholder="-"
                                                                                    />
                                                                                </div>

                                                                                {/* Total */}
                                                                                <div className="w-28 text-right font-bold text-gray-900">
                                                                                    Rp {Math.round(compTotal).toLocaleString('id-ID')}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}

                                                                {/* FOOTER per Item */}
                                                                <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm text-gray-500">Diskon Item:</span>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            value={item.itemDiscount || 0}
                                                                            onChange={(e) => {
                                                                                const newDisc = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                                                setItems(prevItems => prevItems.map(i =>
                                                                                    i.id === item.id ? { ...i, itemDiscount: newDisc } : i
                                                                                ));
                                                                            }}
                                                                            className="w-14 h-8 px-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                            placeholder="0"
                                                                        />
                                                                        <span className="text-sm text-gray-500">%</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-gray-500 font-medium">Subtotal</span>
                                                                        <span className="text-[#EB216A] text-xl font-bold">
                                                                            Rp {Math.round(prices.total * (1 - (item.itemDiscount || 0) / 100)).toLocaleString('id-ID')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

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
                        </>
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
                                {fabricProducts.filter(p => {
                                    if (!p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

                                    // Category Filter
                                    if (selectedCalcType?.category?.slug) {
                                        const productCategory = p.category?.slug || p.Category?.slug || ''; // Handle potential case variance
                                        return productCategory === selectedCalcType.category.slug;
                                    }
                                    return true;
                                }).slice(0, 20).map((product: any) => (
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
            {/* Add/Edit Item Modal */}
            <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItemId ? 'Edit Item' : 'Tambah Item'}</DialogTitle>
                        <DialogDescription>
                            {isBlindType()
                                ? `Masukkan ukuran untuk produk: ${itemModalTargetProduct?.name || 'Blind'}`
                                : 'Masukkan detail ukuran jendela/pintu'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {isBlindType() ? (
                            <div className="grid gap-2">
                                <Label>Nama Jendela (Label)</Label>
                                <Input
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    placeholder="Contoh: Jendela Kamar Depan"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {selectedCalcType?.has_item_type && (
                                    <div>
                                        <Label>Jenis</Label>
                                        <select value={itemType} onChange={e => setItemType(e.target.value as any)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                                            <option value="jendela">Jendela</option>
                                            <option value="pintu">Pintu</option>
                                        </select>
                                    </div>
                                )}
                                {selectedCalcType?.has_package_type && (
                                    <div>
                                        <Label>Paket</Label>
                                        <select value={packageType} onChange={e => setPackageType(e.target.value as any)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                                            <option value="gorden-lengkap">Paket Lengkap</option>
                                            <option value="gorden-saja">Gorden Saja</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Lebar (cm)</Label>
                                <Input type="number" value={width} onChange={e => setWidth(e.target.value)} />
                            </div>
                            <div>
                                <Label>Tinggi (cm)</Label>
                                <Input type="number" value={height} onChange={e => setHeight(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Qty</Label>
                                <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
                            </div>


                        </div>

                        {!isBlindType() && (
                            <p className="text-xs text-gray-400 italic">
                                * Jumlah panel dihitung otomatis atau tidak diperlukan untuk model ini.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowItemModal(false)}>Batal</Button>
                        <Button onClick={handleAddItem} className="bg-[#EB216A] text-white hover:bg-[#d11d5e]">
                            {editingItemId ? 'Simpan Perubahan' : 'Tambah Item'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
