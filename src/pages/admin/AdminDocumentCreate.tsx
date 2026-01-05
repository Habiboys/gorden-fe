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
import { safeJSONParse } from '../../utils/jsonHelper';
import type { VariantFilterRule } from '../../utils/variantFilterHelper';
import { filterVariantsByRule } from '../../utils/variantFilterHelper';

// ================== TYPES (from CalculatorPage) ==================

interface ComponentFromDB {
    id: number;
    calculator_type_id: number;
    subcategory_id: number;
    label: string;
    is_required: boolean;
    price_calculation: 'per_meter' | 'per_unit' | 'per_10_per_meter';
    display_order: number;
    multiply_with_variant?: boolean;
    variant_filter_rule?: string;
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
    groupDiscount?: number;  // Discount percentage for entire group (blind flow)
    components: SelectedComponents;
    selectedVariant?: {
        id: string;
        width: number;
        height: number;
        sibak: number;
        price: number;
        price_gross?: number;
        price_net?: number;
        name: string;
        attributes?: any; // JSON attributes
        quantity_multiplier?: number; // Multiplier for Smokering/Kupu-kupu
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
    const [tempGroupVariant, setTempGroupVariant] = useState<any | null>(null); // For Blind: Selected variant before creating item
    const [variantSelectionMode, setVariantSelectionMode] = useState<'item' | 'component'>('item'); // Track what we are selecting variants for

    // Price type selector removed

    // Grouping State
    const [targetGroupId, setTargetGroupId] = useState<string | null>(null);

    // Delete Confirmation Modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTargetGroupId, setDeleteTargetGroupId] = useState<string | null>(null);

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
                    if (matchedType) {
                        setSelectedCalcType(matchedType);
                        loadComponentProducts(matchedType); // Load components for this type
                    }
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

    // Open Add Item Modal (Create or Edit Size)
    // NOTE: This is mainly for SIZE editing. For Product Editing, we use handleEditItemProduct.
    const handleOpenItemModal = (product?: any) => {
        // Reset form
        setWidth('');
        setHeight('');
        setQuantity('1');
        setItemName('');

        if (product) {
            setItemModalTargetProduct(product);
            // Don't reset targetGroupId here - it might be set by handleAddSizeToGroup
        } else {
            setItemModalTargetProduct(null);
            setTargetGroupId(null); // Only reset group target when opening fresh (no product)
        }

        setShowItemModal(true);
    };

    // Handler to start editing an item's product/variant
    const handleEditItemProduct = async (item: CalculatorItem) => {
        setEditingItemId(item.id);
        setSearchQuery('');

        if (item.product) {
            try {
                const variantsRes = await productVariantsApi.getByProduct(item.product.id);
                if (variantsRes.data?.length > 0) {
                    setAvailableVariants(variantsRes.data);
                    setVariantItemId(item.id);
                    setItemModalTargetProduct(item.product);
                    setShowVariantPicker(true);
                    return;
                }
            } catch (e) {
                console.error(e);
            }
        }

        setShowFabricPicker(true);
    };

    // For Blind flow: Add another size for the same product group
    const handleAddSizeToGroup = (groupId: string, product: any) => {
        // setIsBlindFlow(true); // Assuming setIsBlindFlow is defined elsewhere if needed
        setItemModalTargetProduct(product);
        setEditingItemId(null); // New item

        // Find existing group to inherit variant and discount
        const existingGroupItem = items.find(i => i.groupId === groupId);
        if (existingGroupItem) {
            setTempGroupVariant({
                ...existingGroupItem.selectedVariant,
                fabricDiscount: existingGroupItem.fabricDiscount // Inherit item discount
            });
            setTargetGroupId(groupId); // Set target group to add to
            // groupDiscount is handled in handleAddItem by looking up targetGroupId if we don't pass it explicitly?
            // Actually handleAddItem creates new item. We should ideally pass it or set it.
            // But handleAddItem only reads from form state (width, height, etc).
            // We need to ensure the NEW item gets the GROUP discount.
            // We can do this by setting a temp state or finding group in handleAddItem.
        }

        handleOpenItemModal(product);
    };

    // Remove entire group
    const handleRemoveGroup = (groupId: string) => {
        setDeleteTargetGroupId(groupId);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteGroup = () => {
        if (deleteTargetGroupId) {
            setItems(items.filter(i => i.groupId !== deleteTargetGroupId));
        }
        setShowDeleteConfirm(false);
        setDeleteTargetGroupId(null);
    };

    // Select fabric
    const handleSelectFabric = async (product: any) => {
        // CASE: Editing existing item's product
        if (editingItemId) {
            try {
                // Check variants for the new product
                const variantsRes = await productVariantsApi.getByProduct(product.id);
                const variants = variantsRes.data || [];

                if (variants.length > 0) {
                    // Has variants: Open variant picker
                    setItemModalTargetProduct(product);
                    setAvailableVariants(variants);
                    setVariantItemId(editingItemId); // Set this so handleSelectVariant knows we are editing this item
                    setShowVariantPicker(true);
                    setShowFabricPicker(false);
                    return;
                }
            } catch (error) {
                console.error('Error checking variants:', error);
            }

            // No variants: Update item directly with new product
            setItems(items.map(i => i.id === editingItemId ? {
                ...i,
                product: product,
                selectedVariant: undefined, // Clear old variant
                name: product.name          // Reset name to product name
            } : i));

            setEditingItemId(null);
            setShowFabricPicker(false);
            return;
        }

        // CASE: New Item Selection
        if (isBlindType()) {
            // Check for variants FIRST
            try {
                const variantsRes = await productVariantsApi.getByProduct(product.id);
                const variants = variantsRes.data || [];

                if (variants.length > 0) {
                    // Show Variant Picker FIRST
                    setItemModalTargetProduct(product); // Set target product
                    setAvailableVariants(variants);
                    setTempGroupVariant(null); // Reset temp variant
                    setVariantSelectionMode('item'); // Ensure mode is 'item' for Blind flow
                    setShowVariantPicker(true);
                    setShowFabricPicker(false);
                    return; // Stop here, wait for variant selection
                }
            } catch (error) {
                console.error('Error checking variants:', error);
            }

            // If no variants, proceed to Item Modal directly
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

        // Determine Variant for Blind items (Group Level Consistency)
        let itemSelectedVariant = undefined;
        let itemFabricDiscount = 0;
        let itemGroupDiscount = 0;

        if (isBlindType()) {
            if (targetGroupId) {
                // Adding to existing group -> Use Group's Variant
                const existingGroupItem = items.find(i => i.groupId === targetGroupId);
                if (existingGroupItem?.selectedVariant) {
                    itemSelectedVariant = existingGroupItem.selectedVariant;
                    itemFabricDiscount = existingGroupItem.fabricDiscount || 0;
                    itemGroupDiscount = existingGroupItem.groupDiscount || 0; // Inherit group discount
                }
            } else if (tempGroupVariant) {
                // New Group -> Use Temp Variant selected in previous step
                itemSelectedVariant = tempGroupVariant;
                itemFabricDiscount = tempGroupVariant.fabricDiscount || 0;
                itemGroupDiscount = 0; // New group starts with 0 discount
            }
        }

        const newItem: CalculatorItem = {
            id: Date.now().toString(),
            groupId,
            itemType: selectedCalcType?.has_item_type ? itemType : 'jendela',
            packageType: selectedCalcType?.has_package_type ? packageType : 'gorden-saja',
            name: itemName || undefined, // Set custom name
            product: itemModalTargetProduct || selectedFabric, // Set specific product if any (blind), else use global fabric
            width: itemWidth,
            height: itemHeight,
            panels: isBlindType() ? 0 : calculatePanels(itemWidth, selectedCalcType?.fabric_multiplier || 2.4, selectedFabric?.maxWidth || 280),
            quantity: parseFloat(quantity),
            fabricDiscount: isBlindType() ? itemFabricDiscount : 0,
            groupDiscount: isBlindType() ? itemGroupDiscount : 0,
            selectedVariant: itemSelectedVariant, // Assign pre-selected variant
            components: isBlindType() ? {} : initializeComponents() // Initialize components for standard flow
        };

        setItems([...items, newItem]);
        setShowItemModal(false); // Close Modal

        // Check for variants (Only for Global Fabric, not per-item product for now unless requested)
        // For Blind (per-item product), we might want to check variants but usually blind variants are different.
        // Let's stick to global fabric variant check for Smokaring/Kupu2 logic for now.
        // Check for variants (Only if NOT already selected)
        const productToCheck = itemModalTargetProduct || selectedFabric;

        if (productToCheck?.id && !newItem.selectedVariant) { // Skip if variant already assigned (Blind Group Flow)
            try {
                const variantsRes = await productVariantsApi.getByProduct(productToCheck.id);
                let variants = variantsRes.data || [];

                if (variants.length > 0) {
                    // Apply gorden-smokering filter for fabric if calculator type is smokering-related
                    const isSmokering = selectedCalcType?.slug?.toLowerCase().includes('smokering') ||
                        selectedCalcType?.slug?.toLowerCase().includes('kupu');

                    if (isSmokering) {
                        const dimensions = { width: itemWidth, height: itemHeight };
                        variants = filterVariantsByRule(variants, dimensions, 'gorden-smokering');
                    }

                    // If no matching variants after filter, show all variants
                    const variantsToShow = variants.length > 0 ? variants : (variantsRes.data || []);

                    setVariantItemId(newItem.id);
                    setAvailableVariants(variantsToShow);
                    setShowVariantPicker(true);
                }
            } catch (error) {
                console.error('Error checking variants:', error);
            }
        } else if (tempGroupVariant) {
            // Clear temp variant after successful add
            setTempGroupVariant(null);
        }
    };

    // Remove item
    const handleRemoveItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    // Select variant for item
    const handleSelectVariant = (variant: any) => {
        // Prepare variant data object
        // Calculate discount from Gross vs Net
        const gross = Number(variant.price_gross) || Number(variant.price_net) || 0;
        const net = Number(variant.price_net) || gross;
        const discountPercent = gross > 0 ? Math.round(((gross - net) / gross) * 100) : 0;

        // Parse JSON attributes for variant display name
        const attrs = safeJSONParse(variant.attributes, {}) as Record<string, any>;
        const multiplier = Number(variant.quantity_multiplier) || 1;

        // Build display string from attributes, or fallback to multiplier/sibak info
        const attrDisplay = Object.entries(attrs).length > 0
            ? Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ')
            : (variant.attribute_value
                || variant.name
                || (multiplier > 1 ? `Sibak: ${multiplier}` : null)
                || (variant.sibak ? `Sibak: ${variant.sibak}` : null)
                || (variant.width ? `${variant.width}x${variant.height}cm` : null)
                || `ID: ${String(variant.id).slice(0, 8)}`);

        const variantData = {
            id: variant.id,
            width: variant.width,
            height: variant.height,
            sibak: variant.sibak || 0,
            price: gross, // Primary price is GROSS (before discount)
            price_gross: variant.price_gross,
            price_net: variant.price_net,
            attributes: attrs, // Save attributes
            quantity_multiplier: multiplier, // Extract multiplier
            name: itemModalTargetProduct?.name
                ? `${itemModalTargetProduct.name} (${attrDisplay})`
                : attrDisplay
        };

        // Case 0: Component Variant Selection
        if (variantSelectionMode === 'component') {
            if (!editingItemId || editingComponentId === null) return;

            // Calculate discount from Gross vs Net for component
            const compDiscountPercent = gross > 0 ? Math.round(((gross - net) / gross) * 100) : 0;

            setItems(items.map(item => {
                if (item.id === editingItemId) {
                    const existingSelection = item.components[editingComponentId];
                    const productWithVariant = {
                        ...itemModalTargetProduct,
                        price: net, // Use NET price as primary for calculations
                        price_gross: gross,
                        price_net: net,
                        name: variantData.name
                    };

                    // Check if this component should multiply with variant
                    const componentConfig = selectedCalcType?.components?.find(c => c.id === editingComponentId);
                    const shouldMultiply = componentConfig?.multiply_with_variant === true;
                    const variantMultiplier = item.selectedVariant?.quantity_multiplier || 1;
                    const initialQty = shouldMultiply ? variantMultiplier : 1;

                    return {
                        ...item,
                        components: {
                            ...item.components,
                            [editingComponentId]: {
                                product: productWithVariant,
                                qty: existingSelection?.qty || initialQty,
                                discount: compDiscountPercent // Auto-set discount from Gross/Net
                            }
                        }
                    };
                }
                return item;
            }));
            setShowVariantPicker(false);
            setItemModalTargetProduct(null);
            setVariantSelectionMode('item');
            return;
        }

        // Case 1: Selecting variant for specific item (Edit or Late Select)
        if (variantItemId) {
            const newMultiplier = Number(variant.quantity_multiplier) || 1;
            setItems(items.map(item => {
                if (item.id === variantItemId) {
                    // Sync components that should multiply with variant
                    const updatedComponents = { ...item.components };
                    if (selectedCalcType?.components && newMultiplier > 1) {
                        selectedCalcType.components.forEach(comp => {
                            if (comp.multiply_with_variant && updatedComponents[comp.id]) {
                                updatedComponents[comp.id] = {
                                    ...updatedComponents[comp.id],
                                    qty: newMultiplier
                                };
                            }
                        });
                    }
                    return {
                        ...item,
                        fabricDiscount: discountPercent, // Auto-set discount
                        selectedVariant: variantData,
                        components: updatedComponents
                    };
                }
                return item;
            }));
            setShowVariantPicker(false);
            setVariantItemId(null);
            return;
        }

        // Case 2: Initial Variant Selection for Blind Group (Before Item Creation)
        if (isBlindType() && itemModalTargetProduct) {
            setTempGroupVariant({ ...variantData, fabricDiscount: discountPercent });
            setShowVariantPicker(false);
            // Now open the Item Modal (Size Input)
            handleOpenItemModal(itemModalTargetProduct);
        }
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
    const handleSelectComponent = async (product: any) => {
        if (!editingItemId || editingComponentId === null) return;

        // Check variants
        try {
            // Basic fetch from productVariantsApi
            const variantsRes = await productVariantsApi.getByProduct(product.id);
            let variants = variantsRes.data || [];

            if (variants.length > 0) {
                // Get the component config to check for filter rule
                const componentConfig = selectedCalcType?.components?.find(c => c.id === editingComponentId);
                const filterRule = (componentConfig?.variant_filter_rule || 'none') as VariantFilterRule;

                // Get the item being edited for dimensions
                const editingItem = items.find(item => item.id === editingItemId);

                // Apply filter based on rule and item dimensions
                if (filterRule !== 'none' && editingItem) {
                    const dimensions = { width: editingItem.width, height: editingItem.height };
                    variants = filterVariantsByRule(variants, dimensions, filterRule);
                }

                // Has variants: Open variant picker
                setItemModalTargetProduct(product);
                setAvailableVariants(variants);
                setVariantSelectionMode('component');
                setShowComponentPicker(false);
                setShowVariantPicker(true);
                return;
            }
        } catch (e) {
            console.error(e);
        }

        // No variants: Set product directly
        setItems(items.map(item => {
            if (item.id === editingItemId) {
                const existingSelection = item.components[editingComponentId];
                // Check if this component should multiply with variant
                const componentConfig = selectedCalcType?.components?.find(c => c.id === editingComponentId);
                const shouldMultiply = componentConfig?.multiply_with_variant === true;
                const variantMultiplier = item.selectedVariant?.quantity_multiplier || 1;
                const initialQty = shouldMultiply ? variantMultiplier : 1;

                return {
                    ...item,
                    components: {
                        ...item.components,
                        [editingComponentId]: {
                            product,
                            qty: existingSelection?.qty || initialQty,
                            discount: existingSelection?.discount || 0
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


    // ================== HELPERS ==================

    const calculatePanels = (width: number, multiplier: number, maxWidth: number) => {
        const fabricWidth = width * (multiplier || 2.4);
        const panels = Math.ceil(fabricWidth / (maxWidth || 280));
        return Math.max(1, panels);
    };

    const initializeComponents = () => {
        const comps: SelectedComponents = {};
        if (selectedCalcType?.components) {
            selectedCalcType.components.forEach(c => {
                if (c.is_required) {
                    // Empty for now
                }
            });
        }
        return comps;
    };


    // ================== CALCULATIONS ==================

    const calculateComponentPrice = (item: CalculatorItem, comp: ComponentFromDB, selection: ComponentSelection) => {
        const widthM = item.width / 100;
        // Use price_gross if available (for variant products), otherwise use price
        const basePrice = (selection.product as any)?.price_gross || selection.product.price || 0;
        const netPrice = (selection.product as any)?.price_net || basePrice;

        // Calculate effective discount from gross/net ratio if selection.discount is 0
        const effectiveDiscount = selection.discount || (basePrice > 0 ? Math.round(((basePrice - netPrice) / basePrice) * 100) : 0);

        const basePricePerItem = (() => {
            switch (comp.price_calculation) {
                case 'per_meter':
                    return Math.max(1, widthM) * basePrice;
                case 'per_unit':
                    return basePrice;
                case 'per_10_per_meter':
                    return Math.ceil(widthM * 10) * basePrice;
                default:
                    return 0;
            }
        })();
        // Component qty should already include multiplier if set via handleSelectComponent
        const priceBeforeDiscount = basePricePerItem * selection.qty * item.quantity;
        return priceBeforeDiscount * (1 - effectiveDiscount / 100);  // Apply effective component discount
    };

    const calculateItemPrice = (item: CalculatorItem) => {
        const product = item.product || selectedFabric; // PRIORITIZE ITEM PRODUCT
        if (!product || !selectedCalcType) return { fabricPricePerMeter: 0, fabric: 0, fabricMeters: 0, components: 0, total: 0, totalAfterItemDiscount: 0, totalAfterGroupDiscount: 0 };

        const widthM = item.width / 100;
        const heightM = item.height / 100;

        // Use variant price (which is set to GROSS in handleSelectVariant), fallback to 0
        const variantPrice = item.selectedVariant ? (item.selectedVariant.price || 0) : 0;
        const fabricPricePerMeter = variantPrice;
        const variantMultiplier = item.selectedVariant?.quantity_multiplier || 1;

        // Check if this is Blind flow (simpler pricing)
        const isBlind = selectedCalcType.slug?.toLowerCase().includes('blind') || selectedCalcType.has_item_type === false;

        let fabricMeters = 0;
        let fabricPriceBeforeDiscount = 0;

        if (isBlind) {
            // BLIND FLOW: Simple Price × Qty (no area, no multiplier)
            fabricPriceBeforeDiscount = fabricPricePerMeter * item.quantity;
            fabricMeters = 0;
        } else if (variantMultiplier > 1) {
            // GORDEN FLOW with Multiplier: Price × Multiplier × Qty
            fabricPriceBeforeDiscount = fabricPricePerMeter * variantMultiplier * item.quantity;
            fabricMeters = 0; // Not calculated by area when using multiplier
        } else {
            // GORDEN FLOW standard: Area Calculation
            fabricMeters = widthM * (selectedCalcType.fabric_multiplier || 2.4) * heightM;
            fabricPriceBeforeDiscount = fabricMeters * fabricPricePerMeter * item.quantity;
        }

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
        const totalAfterGroupDiscount = totalAfterItemDiscount * (1 - (item.groupDiscount || 0) / 100); // Apply group discount

        return {
            fabricPricePerMeter,
            variantMultiplier,
            fabric: fabricPrice,
            fabricBeforeDiscount: fabricPriceBeforeDiscount,
            fabricMeters,
            components: componentsPrice,
            total: subtotal,
            totalAfterItemDiscount,
            totalAfterGroupDiscount
        };
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + calculateItemPrice(item).totalAfterGroupDiscount, 0);
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
                    subtotal: prices.totalAfterGroupDiscount // Use final discounted price
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
                                                            <p className="text-sm text-[#EB216A]">
                                                                {selectedFabric.minPrice ? (
                                                                    <>Mulai Rp {Number(selectedFabric.minPrice).toLocaleString('id-ID')}/m</>
                                                                ) : (
                                                                    <>Pilih varian</>
                                                                )}
                                                            </p>
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
                                                                            <p className="text-[#EB216A] font-medium">
                                                                                {groupProduct?.minPrice ? (
                                                                                    <>Mulai Rp {Number(groupProduct.minPrice).toLocaleString('id-ID')}/m</>
                                                                                ) : (
                                                                                    <>Pilih varian</>
                                                                                )}
                                                                            </p>
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
                                                                                    <td colSpan={5} className="py-3 px-3 text-right font-semibold text-gray-600">Diskon Grup</td>
                                                                                    <td className="py-3 px-3 text-center">
                                                                                        <div className="flex items-center justify-center gap-1">
                                                                                            <input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                max="100"
                                                                                                value={groupItems[0]?.groupDiscount || 0}
                                                                                                onChange={(e) => {
                                                                                                    const newDisc = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                                                                    // Bulk update all items in this group
                                                                                                    setItems(prevItems => prevItems.map(i =>
                                                                                                        i.groupId === groupId ? { ...i, groupDiscount: newDisc } : i
                                                                                                    ));
                                                                                                }}
                                                                                                className="w-14 h-9 px-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                                                placeholder="0"
                                                                                            />
                                                                                            <span className="text-gray-500 text-sm">%</span>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="py-3 px-3 text-right font-semibold text-gray-600">
                                                                                        <div className="flex flex-col">
                                                                                            <span>Subtotal Grup</span>
                                                                                            {(groupItems[0]?.groupDiscount || 0) > 0 && (
                                                                                                <span className="text-xs text-green-600 font-normal">
                                                                                                    (Disc {groupItems[0].groupDiscount}%)
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="py-3 px-3 text-right font-bold text-[#EB216A] text-lg">
                                                                                        <div className="flex flex-col items-end">
                                                                                            {(groupItems[0]?.groupDiscount || 0) > 0 && (
                                                                                                <span className="text-xs text-gray-400 line-through font-normal">
                                                                                                    Rp {groupTotal.toLocaleString('id-ID')}
                                                                                                </span>
                                                                                            )}
                                                                                            <span>
                                                                                                Rp {(groupTotal * (1 - (groupItems[0]?.groupDiscount || 0) / 100)).toLocaleString('id-ID')}
                                                                                            </span>
                                                                                        </div>
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
                                                {items.filter(i => !i.groupId).map((item) => {
                                                    const prices = calculateItemPrice(item);

                                                    // Main Fabric Calculations
                                                    // (Calculations moved inline to layout)

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
                                                                <div className="flex items-center justify-between p-3 text-xs font-medium text-gray-500 border-b border-dashed mb-2 gap-4">
                                                                    <div className="flex-1">Produk</div>
                                                                    <div className="w-28 text-right">Harga</div>
                                                                    <div className="w-16 text-center">Disc(%)</div>
                                                                    <div className="w-28 text-right">Harga Net</div>
                                                                    <div className="w-16 text-center">Qty</div>
                                                                    <div className="w-28 text-right">Total</div>
                                                                </div>

                                                                {/* 1. Main Fabric Row */}
                                                                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 bg-white shadow-sm gap-4">
                                                                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                                                        <Button
                                                                            onClick={() => handleEditItemProduct(item)}
                                                                            className={`text-xs px-3 h-8 shadow-sm flex-shrink-0 ${item.product ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-[#EB216A] hover:bg-[#D41B5B] text-white'}`}
                                                                        >
                                                                            {item.product ? 'Ganti' : 'Pilih'}
                                                                        </Button>

                                                                        <div className="flex flex-col leading-tight min-w-0">
                                                                            <span className="font-semibold text-gray-900 truncate" title={item.product?.name}>
                                                                                {item.product?.name || `Gorden ${selectedCalcType?.name}`}
                                                                            </span>
                                                                            {item.selectedVariant && (
                                                                                <span className="text-[10px] text-gray-500 truncate">
                                                                                    {item.selectedVariant.name || 'Standard'}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Pricing Columns */}
                                                                    {(() => {
                                                                        // Calculate effective discount from price_gross/price_net if fabricDiscount is 0
                                                                        const gross = Number(item.selectedVariant?.price_gross) || Number(item.selectedVariant?.price) || Number(item.product?.price) || 0;
                                                                        const net = Number(item.selectedVariant?.price_net) || gross;
                                                                        const effectiveDiscount = item.fabricDiscount || (gross > 0 ? Math.round(((gross - net) / gross) * 100) : 0);

                                                                        return (
                                                                            <>
                                                                                {/* Harga Gross */}
                                                                                <div className="w-28 text-right text-sm text-gray-600">
                                                                                    Rp {gross.toLocaleString('id-ID')}
                                                                                </div>

                                                                                {/* Disc */}
                                                                                <div className="w-16 flex justify-center">
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max="100"
                                                                                        value={effectiveDiscount}
                                                                                        onChange={(e) => updateFabricDiscount(item.id, parseInt(e.target.value) || 0)}
                                                                                        className="w-12 h-8 px-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                                    />
                                                                                </div>

                                                                                {/* Harga Net */}
                                                                                <div className="w-28 text-right text-sm font-medium text-gray-800">
                                                                                    Rp {net.toLocaleString('id-ID')}
                                                                                </div>
                                                                            </>
                                                                        );
                                                                    })()}

                                                                    {/* Qty */}
                                                                    <div className="w-16 flex justify-center">
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            step="0.1"
                                                                            value={item.selectedVariant?.quantity_multiplier || 1}
                                                                            onChange={(e) => {
                                                                                const newTotal = parseFloat(e.target.value) || 0;
                                                                                if (item.selectedVariant) {
                                                                                    const newMultiplier = newTotal / (item.quantity || 1);
                                                                                    setItems(items.map(i => {
                                                                                        if (i.id === item.id && i.selectedVariant) {
                                                                                            // Sync Components
                                                                                            const updatedComponents = { ...i.components };
                                                                                            if (selectedCalcType?.components) {
                                                                                                selectedCalcType.components.forEach(comp => {
                                                                                                    if (comp.multiply_with_variant && updatedComponents[comp.id]) {
                                                                                                        updatedComponents[comp.id] = {
                                                                                                            ...updatedComponents[comp.id],
                                                                                                            qty: newMultiplier
                                                                                                        };
                                                                                                    }
                                                                                                });
                                                                                            }
                                                                                            return {
                                                                                                ...i,
                                                                                                selectedVariant: { ...i.selectedVariant, quantity_multiplier: newMultiplier },
                                                                                                components: updatedComponents
                                                                                            };
                                                                                        }
                                                                                        return i;
                                                                                    }));
                                                                                } else {
                                                                                    setItems(items.map(i => {
                                                                                        if (i.id === item.id) {
                                                                                            return { ...i, quantity: newTotal };
                                                                                        }
                                                                                        return i;
                                                                                    }));
                                                                                }
                                                                            }}
                                                                            className="w-14 h-8 px-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                        />
                                                                    </div>

                                                                    {/* Total */}
                                                                    <div className="w-28 text-right text-sm font-bold text-[#EB216A]">
                                                                        Rp {prices.fabric.toLocaleString('id-ID')}
                                                                    </div>
                                                                </div>

                                                                {/* 2. Components Rows */}
                                                                {selectedCalcType?.components?.map(comp => {
                                                                    const selection = item.components[comp.id];

                                                                    // Calculate display values with effective discount from gross/net
                                                                    const compGross = (selection?.product as any)?.price_gross || selection?.product?.price || 0;
                                                                    const compNetActual = (selection?.product as any)?.price_net || compGross;
                                                                    const effectiveCompDisc = selection?.discount || (compGross > 0 ? Math.round(((compGross - compNetActual) / compGross) * 100) : 0);

                                                                    const rowTotal = selection ? calculateComponentPrice(item, comp, selection) : 0;

                                                                    return (
                                                                        <div key={comp.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 bg-white gap-4">
                                                                            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => openComponentPicker(item.id, comp.id)}
                                                                                    className={`text-xs px-3 h-8 w-16 flex-shrink-0 ${selection ? 'bg-white' : 'border-dashed text-gray-400'}`}
                                                                                >
                                                                                    {selection ? 'Ganti' : 'Pilih'}
                                                                                </Button>
                                                                                <div className="flex flex-col leading-tight min-w-0">
                                                                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{comp.label}</span>
                                                                                    <span className="text-sm font-medium text-gray-900 truncate" title={selection?.product?.name}>
                                                                                        {selection?.product?.name || '-'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>

                                                                            {selection ? (
                                                                                <>
                                                                                    <div className="w-28 text-right text-sm text-gray-600">
                                                                                        Rp {compGross.toLocaleString('id-ID')}
                                                                                    </div>

                                                                                    <div className="w-16 flex justify-center">
                                                                                        <input
                                                                                            type="number"
                                                                                            min="0"
                                                                                            max="100"
                                                                                            value={effectiveCompDisc}
                                                                                            className="w-12 h-8 px-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                                            onChange={(e) => {
                                                                                                const newDisc = parseInt(e.target.value) || 0;
                                                                                                setItems(items.map(i => i.id === item.id ? {
                                                                                                    ...i,
                                                                                                    components: {
                                                                                                        ...i.components,
                                                                                                        [comp.id]: { ...selection, discount: newDisc }
                                                                                                    }
                                                                                                } : i));
                                                                                            }}
                                                                                        />
                                                                                    </div>

                                                                                    <div className="w-28 text-right text-sm font-medium text-gray-800">
                                                                                        Rp {Math.round(compNetActual).toLocaleString('id-ID')}
                                                                                    </div>

                                                                                    <div className="w-16 flex justify-center">
                                                                                        <input
                                                                                            type="number"
                                                                                            min="1"
                                                                                            value={selection.qty}
                                                                                            className="w-12 h-8 px-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                                            onChange={(e) => {
                                                                                                const newQty = parseInt(e.target.value) || 1;
                                                                                                setItems(items.map(i => i.id === item.id ? {
                                                                                                    ...i,
                                                                                                    components: {
                                                                                                        ...i.components,
                                                                                                        [comp.id]: { ...selection, qty: newQty }
                                                                                                    }
                                                                                                } : i));
                                                                                            }}
                                                                                            title="Qty Per Window"
                                                                                        />
                                                                                    </div>

                                                                                    <div className="w-28 text-right text-sm font-bold text-[#EB216A]">
                                                                                        Rp {Math.round(rowTotal).toLocaleString('id-ID')}
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <div className="flex-1 text-right text-gray-300 text-xs italic pr-4">
                                                                                    Belum dipilih
                                                                                </div>
                                                                            )}
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

                    {/* Price Type Selector removed */}

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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Hapus Grup?</h3>
                        </div>
                        <p className="text-gray-600 mb-6">Seluruh item dalam grup ini akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => { setShowDeleteConfirm(false); setDeleteTargetGroupId(null); }}
                            >
                                Batal
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                onClick={confirmDeleteGroup}
                            >
                                Hapus
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
                                                {/* Price removed as per request - handled by variants */}
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
                        <div className="bg-white rounded-xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Pilih Varian</h3>
                                <Button size="sm" variant="ghost" onClick={() => { setShowVariantPicker(false); setVariantItemId(null); }}><X className="w-4 h-4" /></Button>
                            </div>
                            <div className="p-4 border-b">
                                <Input placeholder="Cari varian (sibak, gelombang, tinggi, harga)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {(() => {
                                    // Build column keys from all variants
                                    const allAttrKeys = new Set<string>();
                                    availableVariants.forEach((v: any) => {
                                        const attrs = safeJSONParse(v.attributes, {});
                                        Object.keys(attrs).forEach(k => allAttrKeys.add(k));
                                    });
                                    const columnKeys = Array.from(allAttrKeys);

                                    // Filter by search
                                    const filtered = availableVariants.filter((v: any) => {
                                        if (!searchQuery) return true;
                                        const q = searchQuery.toLowerCase();
                                        const attrs = safeJSONParse(v.attributes, {});
                                        const attrMatch = Object.values(attrs).some((val: any) =>
                                            String(val).toLowerCase().includes(q)
                                        );
                                        const priceMatch = String(v.price_net).includes(q) || String(v.price_gross).includes(q);
                                        return attrMatch || priceMatch;
                                    });

                                    // Sort by Sibak, Gelombang, Tinggi, Lebar (ascending)
                                    const sorted = [...filtered].sort((a, b) => {
                                        const attrsA = safeJSONParse(a.attributes, {}) as Record<string, any>;
                                        const attrsB = safeJSONParse(b.attributes, {}) as Record<string, any>;

                                        const getNum = (attrs: Record<string, any>, keys: string[]) => {
                                            for (const key of keys) {
                                                const matchKey = Object.keys(attrs).find(k => k.toLowerCase() === key.toLowerCase());
                                                if (matchKey) {
                                                    const val = parseFloat(String(attrs[matchKey]).replace(/[^\d.-]/g, ''));
                                                    if (!isNaN(val)) return val;
                                                }
                                            }
                                            return 999999;
                                        };

                                        // Sort order: Lebar, Tinggi, Sibak
                                        const lebarA = getNum(attrsA, ['lebar', 'width', 'l']);
                                        const lebarB = getNum(attrsB, ['lebar', 'width', 'l']);
                                        if (lebarA !== lebarB) return lebarA - lebarB;

                                        const tinggiA = getNum(attrsA, ['tinggi', 'height', 't']);
                                        const tinggiB = getNum(attrsB, ['tinggi', 'height', 't']);
                                        if (tinggiA !== tinggiB) return tinggiA - tinggiB;

                                        const sibakA = getNum(attrsA, ['sibak']);
                                        const sibakB = getNum(attrsB, ['sibak']);
                                        return sibakA - sibakB;
                                    });

                                    if (sorted.length === 0) {
                                        return <p className="text-center py-8 text-gray-500">Tidak ada varian yang cocok.</p>;
                                    }

                                    return (
                                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        {columnKeys.map(key => (
                                                            <th key={key} className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                                                                {key}
                                                            </th>
                                                        ))}
                                                        <th className="px-3 py-2 text-right font-semibold text-gray-700 whitespace-nowrap">
                                                            Harga
                                                        </th>
                                                        <th className="px-3 py-2 text-center font-semibold text-gray-700 whitespace-nowrap">
                                                            Pilih
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {sorted.map((v: any) => {
                                                        const attrs = safeJSONParse(v.attributes, {}) as Record<string, any>;
                                                        const priceNet = Number(v.price_net) || 0;
                                                        const priceGross = Number(v.price_gross) || 0;
                                                        const displayPrice = priceNet || priceGross;

                                                        return (
                                                            <tr
                                                                key={v.id}
                                                                className="hover:bg-pink-50 cursor-pointer transition-colors"
                                                                onClick={() => handleSelectVariant(v)}
                                                            >
                                                                {columnKeys.map(key => {
                                                                    const matchKey = Object.keys(attrs).find(k => k.toLowerCase() === key.toLowerCase());
                                                                    const val = matchKey ? attrs[matchKey] : '-';
                                                                    return (
                                                                        <td key={key} className="px-3 py-3 text-gray-800 whitespace-nowrap">
                                                                            {val}
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                                                    <span className="font-semibold text-[#EB216A]">
                                                                        Rp {displayPrice.toLocaleString('id-ID')}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-3 text-center">
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-[#EB216A] hover:bg-[#d11d5e] text-white text-xs px-3 py-1"
                                                                    >
                                                                        Pilih
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })()}
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
                                                    {/* Price removed */}
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
