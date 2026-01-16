import {
    ArrowLeft,
    Check,
    Pencil,
    Plus,
    Save,
    Search,
    Trash2,
    X
} from 'lucide-react';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { useRouterBlocker } from '../../hooks/useRouterBlocker';
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
    hide_on_door?: boolean;
    show_gelombang?: boolean;
    price_follows_item_qty?: boolean;
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
    note?: string;
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

interface DocumentForm {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerAddress: string;
    validUntil: string;
    paymentTerms: string;
    notes: string;
}

// ================== HELPER FUNCTIONS ==================
/**
 * Format number as Rupiah currency (no decimals)
 * @param amount - The amount to format
 * @returns Formatted string like "1.234.567"
 */
const formatRupiah = (amount: number | null | undefined): string => {
    return (amount || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });
};

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
    const [selectedProductSubcategoryId, setSelectedProductSubcategoryId] = useState<number | null>(null);

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
    const [formData, setFormData] = useState<DocumentForm>({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        customerAddress: '',
        validUntil: getDefaultValidUntil(),
        paymentTerms: 'Bank BRI 0256 0106 3614 506 A.n Abdul Latif',
        notes: '',
        discount: 0 // Additional Discount (Rp)
    });

    const [searchParams] = useSearchParams();
    const isNewDraftParam = searchParams.get('isNewDraft') === 'true';
    const [isNewDraftState, setIsNewDraftState] = useState(isNewDraftParam);
    const [isSaved, setIsSaved] = useState(false); // State to track successful save

    // ================== ACTIONS ==================
    const handleCleanupDraft = useCallback(async () => {
        if (id && isNewDraftState) {
            try {
                // Delete the draft if user exits without saving
                await documentsApi.delete(id);
                toast.info('Draft kosong telah dihapus.');
            } catch (error) {
                console.error('Failed to cleanup draft:', error);
            }
        }
    }, [id, isNewDraftState]);

    // ================== LOAD DATA ==================
    // Unsaved Changes Guard (Browser Refresh/Close)
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if ((items.length > 0 || formData.customerName) && !isSaved) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [items.length, formData.customerName, isSaved]);

    // Unsaved Changes Guard (In-App Navigation)
    const isDirty = items.length > 0 || !!formData.customerName;
    const blockerMessage = isNewDraftState
        ? "Dokumen ini baru dibuat. Jika Anda keluar tanpa menyimpan, dokumen ini akan DIHAPUS PERMANEN. Lanjutkan?"
        : "Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?";

    useRouterBlocker(
        blockerMessage,
        (isDirty || isNewDraftState) && !isSaved, // Only block if NOT saved
        isNewDraftState ? handleCleanupDraft : undefined
    );

    // Handle navigation after save
    useEffect(() => {
        if (isSaved) {
            navigate('/admin/documents');
        }
    }, [isSaved, navigate]);

    useEffect(() => {
        if (isNewDraftParam) {
            setIsNewDraftState(true);
        }
    }, [isNewDraftParam]);

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
                    // referralCode: doc.referral_code || '', // Removed from formData
                    discount: parsedData.discount || 0, // Restore Global Discount Percentage
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
            const response = await productsApi.getAll({ limit: 1000 });
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

    // Get unique subcategories from products for current category (for Blind flow)
    const productSubcategories = useMemo(() => {
        if (!selectedCalcType?.category?.slug) return [];

        const subcats = new Map<number, { id: number; name: string }>();
        fabricProducts.forEach((p: any) => {
            const productCategory = p.category?.slug || p.Category?.slug || '';
            if (productCategory !== selectedCalcType?.category?.slug) return;

            const subcatId = p.subcategory_id || p.SubCategory?.id || p.subcategory?.id;
            const subcatName = p.SubCategory?.name || p.subcategory?.name || '';

            if (subcatId && subcatName && !subcats.has(subcatId)) {
                subcats.set(subcatId, { id: subcatId, name: subcatName });
            }
        });

        return Array.from(subcats.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedCalcType, fabricProducts]);

    // Open Add Item Modal (Create or Edit Size)
    // NOTE: This is mainly for SIZE editing. For Product Editing, we use handleEditItemProduct.
    const handleOpenItemModal = (product?: any) => {
        // Reset form
        setWidth('');
        setHeight('');
        setQuantity('1');
        setItemName('');
        setEditingItemId(null); // Ensure we are NOT in edit mode

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
                    setVariantSelectionMode('item'); // Ensure we're in 'item' mode for gorden/fabric
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
            // CRITICAL: Reset targetGroupId when selecting NEW product (not adding to existing group)
            setTargetGroupId(null);

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

    // Edit Item Size/Qty
    const handleEditItemSize = (item: CalculatorItem) => {
        setEditingItemId(item.id);
        setWidth(item.width?.toString() || '');
        setHeight(item.height?.toString() || '');
        setQuantity(item.quantity?.toString() || '1');
        setItemName(item.name || '');
        setItemType(item.itemType || 'jendela');
        setPackageType(item.packageType || 'gorden-lengkap');
        setItemModalTargetProduct(item.product);
        setShowItemModal(true);
    };

    // Add item
    const handleAddItem = async () => {
        if (!width || !height) {
            toast.error('Lengkapi lebar dan tinggi!');
            return;
        }

        const itemWidth = parseFloat(width);
        const itemHeight = parseFloat(height);

        if (editingItemId) {
            // EDIT MODE
            setItems(items.map(item => {
                if (item.id === editingItemId) {
                    // Recalculate panels
                    const newPanels = isBlindType() ? 0 : calculatePanels(itemWidth, selectedCalcType?.fabric_multiplier || 2.4, selectedFabric?.maxWidth || 280);

                    return {
                        ...item,
                        width: itemWidth,
                        height: itemHeight,
                        quantity: parseFloat(quantity),
                        itemType: selectedCalcType?.has_item_type ? itemType : 'jendela',
                        packageType: selectedCalcType?.has_package_type ? packageType : 'gorden-lengkap',
                        name: itemName || undefined,
                        panels: newPanels,
                        // Retain other properties
                    };
                }
                return item;
            }));
            setShowItemModal(false);
            setEditingItemId(null);
            return;
        }

        const groupId = targetGroupId
            ? targetGroupId
            : (isBlindType() ? Date.now().toString() + '-group' : undefined);

        // Determine Variant for Blind items (Group Level Consistency)
        // Determine Variant & Group Discount
        let itemSelectedVariant = undefined;
        let itemFabricDiscount = 0;
        let itemGroupDiscount = 0;

        // Group Discount Inheritance (For ALL types with grouping, e.g. Smokering & Blind)
        if (targetGroupId) {
            const existingGroupItem = items.find(i => i.groupId === targetGroupId);
            if (existingGroupItem) {
                itemGroupDiscount = existingGroupItem.groupDiscount || 0;
            }
        }

        if (isBlindType()) {
            if (targetGroupId) {
                // Adding to existing group -> Use Group's Variant
                const existingGroupItem = items.find(i => i.groupId === targetGroupId);
                if (existingGroupItem?.selectedVariant) {
                    itemSelectedVariant = existingGroupItem.selectedVariant;
                    itemFabricDiscount = existingGroupItem.fabricDiscount || 0;
                    // itemGroupDiscount handled above
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
            groupDiscount: itemGroupDiscount, // Use inherited variable directly
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

                    const isVitrase = selectedCalcType?.slug?.toLowerCase().includes('vitrase');
                    if (isVitrase) {
                        const dimensions = { width: itemWidth, height: itemHeight };
                        variants = filterVariantsByRule(variants, dimensions, 'vitrase-kombinasi');
                    }

                    // If no matching variants after filter, show all variants
                    const variantsToShow = variants.length > 0 ? variants : (variantsRes.data || []);

                    setVariantItemId(newItem.id);
                    setAvailableVariants(variantsToShow);
                    setVariantSelectionMode('item'); // Ensure we're in 'item' mode for gorden/fabric
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
                        name: variantData.name,
                        variantAttributes: variant.attributes
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
            // Use functional update to ensure we have latest items state (fixes race condition with new items)
            setItems(prevItems => prevItems.map(item => {
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

                // If filter returns empty, show all variants as fallback
                const variantsToShow = variants.length > 0 ? variants : (variantsRes.data || []);

                // Has variants: Open variant picker
                setItemModalTargetProduct(product);
                setAvailableVariants(variantsToShow);
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
        // Use price_net directly for accurate calculation (avoid rounding errors from discount %)
        const netPrice = (selection.product as any)?.price_net || selection.product.price || 0;

        // Calculate price - simplified (per_meter/per_unit deprecated)
        let totalPrice = netPrice * selection.qty;

        // Only multiply by item.quantity if price_follows_item_qty is enabled
        if (comp.price_follows_item_qty) {
            totalPrice *= item.quantity;
        }
        return totalPrice;
    };

    const calculateItemPrice = (item: CalculatorItem) => {
        const product = item.product || selectedFabric; // PRIORITIZE ITEM PRODUCT
        if (!product || !selectedCalcType) return { fabricPricePerMeter: 0, fabricPricePerMeterNet: 0, fabric: 0, fabricMeters: 0, components: 0, total: 0, totalAfterItemDiscount: 0, totalAfterGroupDiscount: 0 };

        const widthM = item.width / 100;
        const heightM = item.height / 100;

        // Use variant prices: GROSS for display, NET for calculation
        const variantPriceGross = item.selectedVariant ? (item.selectedVariant.price_gross || item.selectedVariant.price || 0) : 0;
        const variantPriceNet = item.selectedVariant ? (item.selectedVariant.price_net || variantPriceGross) : 0;
        const fabricPricePerMeter = variantPriceGross; // For display (Harga Satuan)
        const fabricPricePerMeterNet = variantPriceNet; // For calculation (Harga Net)
        const variantMultiplier = item.selectedVariant?.quantity_multiplier || 1;

        // Check if this is Blind flow (simpler pricing)
        const isBlind = selectedCalcType.slug?.toLowerCase().includes('blind') || selectedCalcType.has_item_type === false;

        // Check if variant has Sibak attribute (should use multiplier pricing, not area)
        const hasSibakAttribute = item.selectedVariant?.attributes && (() => {
            const attrs = safeJSONParse(item.selectedVariant?.attributes, {});
            return Object.keys(attrs).some(k => k.toLowerCase() === 'sibak');
        })();

        let fabricMeters = 0;
        let fabricPriceBeforeDiscount = 0;
        let fabricPrice = 0; // This is NET price (from database)

        if (isBlind) {
            // BLIND FLOW: Price × Volume × Qty (volume = width × height in meters)
            const volumeM2 = widthM * heightM;
            fabricPriceBeforeDiscount = fabricPricePerMeter * volumeM2 * item.quantity;
            fabricPrice = fabricPricePerMeterNet * volumeM2 * item.quantity; // Use NET price
            fabricMeters = volumeM2; // Display volume for blind
        } else if (hasSibakAttribute || variantMultiplier > 1) {
            // GORDEN FLOW with Multiplier: Price × Multiplier × Qty
            fabricPriceBeforeDiscount = fabricPricePerMeter * variantMultiplier * item.quantity;
            fabricPrice = fabricPricePerMeterNet * variantMultiplier * item.quantity; // Use NET price
            fabricMeters = 0; // Not calculated by area when using multiplier
        } else {
            // GORDEN FLOW standard: Area Calculation (for products without Sibak variant)
            fabricMeters = widthM * (selectedCalcType.fabric_multiplier || 2.4) * heightM;
            fabricPriceBeforeDiscount = fabricMeters * fabricPricePerMeter * item.quantity;
            fabricPrice = fabricMeters * fabricPricePerMeterNet * item.quantity; // Use NET price
        }

        // NOTE: fabricDiscount is now for DISPLAY ONLY, not for calculation
        // fabricPrice already uses price_net from database

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

        // NO ROUNDING HERE - rounding only at final display
        return {
            fabricPricePerMeter,
            fabricPricePerMeterNet,
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
        const total = items.reduce((sum, item) => sum + calculateItemPrice(item).totalAfterGroupDiscount, 0);
        return Math.max(0, total * (1 - (formData.discount || 0) / 100)); // Percentage Discount
    };

    const updateItemNote = (itemId: string, note: string) => {
        setItems(prevItems => prevItems.map(item =>
            item.id === itemId ? { ...item, note } : item
        ));
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

                // Get fabric prices (gross vs net)
                const fabricGross = item.selectedVariant?.price_gross ?? item.selectedVariant?.price ?? item.product?.price ?? selectedFabric?.price ?? 0;
                const fabricNet = item.selectedVariant?.price_net ?? fabricGross;
                const fabricDiscount = item.fabricDiscount || (fabricGross > 0 ? Math.round(((fabricGross - fabricNet) / fabricGross) * 100) : 0);
                // Calculate effective quantity including variant multiplier (sibak)
                const variantMultiplier = item.selectedVariant?.quantity_multiplier || 1;
                const effectiveQty = variantMultiplier * item.quantity;

                // Add fabric/product as first item
                windowItems.push({
                    id: `${item.id}-fabric`,
                    name: `${item.product?.name || selectedFabric?.name} ${item.selectedVariant?.name ? `(${item.selectedVariant.name})` : ''} (${prices.fabricMeters.toFixed(2)}m)`,
                    price: fabricNet, // Keep for backward compatibility
                    price_gross: fabricGross,
                    price_net: fabricNet,
                    discount: fabricDiscount,
                    quantity: effectiveQty, // Use effective qty including variant multiplier
                    totalPrice: prices.fabric
                });

                // Add component items if package lengkap
                if (item.packageType === 'gorden-lengkap' && selectedCalcType?.components) {
                    selectedCalcType.components.forEach(comp => {
                        const selection = item.components[comp.id];
                        if (selection) {
                            const compPrice = calculateComponentPrice(item, comp, selection);
                            const compGross = selection.product?.price_gross ?? selection.product?.price ?? 0;
                            const compNet = selection.product?.price_net ?? compGross;
                            const compDiscount = selection.discount || (compGross > 0 ? Math.round(((compGross - compNet) / compGross) * 100) : 0);
                            // Calculate displayed qty: multiply by item.quantity if price_follows_item_qty is enabled
                            const displayQty = comp.price_follows_item_qty ? selection.qty * item.quantity : selection.qty;

                            windowItems.push({
                                id: `${item.id}-comp-${comp.id}`,
                                name: `${comp.label}: ${selection.product.name}`,
                                price: compNet, // Keep for backward compatibility
                                price_gross: compGross,
                                price_net: compNet,
                                discount: compDiscount,
                                quantity: displayQty, // Use calculated display qty
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

            // Enrich items with displayQty and componentTotal for each component before saving
            const enrichedItems = items.map(item => {
                const enrichedComponents: any = Array.isArray(item.components) ? [] : {};

                if (item.components && selectedCalcType?.components) {
                    if (Array.isArray(item.components)) {
                        // Handle Array structure (from CalculatorPage)
                        (item.components as any[]).forEach((selection) => {
                            // Try to find component definition. If selection has componentId, use it.
                            // If selection is just the data, we might need to rely on matching product or index if synced?
                            // Actually CalculatorPage saves componentId in the object!
                            const compId = selection.componentId || selection.id;
                            const comp = selectedCalcType.components.find(c => c.id === parseInt(String(compId)));

                            if (comp) {
                                const netPrice = (selection.product as any)?.price_net || selection.product?.price || 0;
                                const displayQty = comp.price_follows_item_qty ? selection.qty * item.quantity : selection.qty;
                                const componentTotal = netPrice * displayQty;

                                (enrichedComponents as any[]).push({
                                    ...selection,
                                    displayQty,
                                    componentTotal
                                });
                            } else {
                                (enrichedComponents as any[]).push(selection);
                            }
                        });
                    } else {
                        // Handle Object structure (from AdminDocumentCreate local state)
                        Object.entries(item.components).forEach(([compId, selection]) => {
                            const comp = selectedCalcType.components.find(c => c.id === parseInt(compId));
                            if (comp && selection) {
                                const netPrice = (selection.product as any)?.price_net || selection.product?.price || 0;
                                const displayQty = comp.price_follows_item_qty ? selection.qty * item.quantity : selection.qty;
                                const componentTotal = netPrice * displayQty;

                                enrichedComponents[compId] = {
                                    ...selection,
                                    displayQty,
                                    componentTotal
                                };
                            } else {
                                enrichedComponents[compId] = selection;
                            }
                        });
                    }
                } else {
                    // If item.components or selectedCalcType?.components is missing,
                    // use the original components or an empty structure based on its original type.
                    // This ensures we don't lose existing component data if enrichment isn't possible.
                    return {
                        ...item,
                        components: item.components || (Array.isArray(item.components) ? [] : {})
                    };
                }

                return {
                    ...item,
                    components: enrichedComponents
                };
            });

            // Create quotation data structure
            const quotationData = {
                windows,
                raw_items: enrichedItems, // Store enriched items with displayQty and componentTotal
                calculatorType: selectedCalcType?.name,
                calculatorTypeSlug: selectedCalcType?.slug,
                baseFabric: {
                    id: selectedFabric?.id,
                    name: selectedFabric?.name,
                    price: selectedFabric?.price,
                    image: selectedFabric?.images?.[0] || selectedFabric?.image // Store image for reconstruction
                },
                discount: formData.discount, // Persist Global Discount Percentage
                paymentTerms: formData.paymentTerms || 'Bank BRI 0256 0106 3614 506 A.n Abdul Latif',
                notes: formData.notes || ''
            };

            const totalBeforeDisc = items.reduce((sum, item) => sum + calculateItemPrice(item).totalAfterGroupDiscount, 0);
            const discountAmount = Math.round(totalBeforeDisc * ((formData.discount || 0) / 100));

            const payload = {
                type: docType,
                customer_name: formData.customerName,
                customer_phone: formData.customerPhone,
                customer_email: formData.customerEmail || null,
                address: formData.customerAddress || null,  // Backend uses 'address' not 'customer_address'
                // referral_code: formData.referralCode || null, // Removed from formData
                discount_amount: discountAmount, // Send Calculated Discount Value (Rp)
                valid_until: formData.validUntil || null,
                data: quotationData,  // This is the quotation/invoice data
                total_amount: calculateTotal() // Backend uses 'total_amount'
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
                // Reset dirty state
                setIsNewDraftState(false); // No longer a new draft after save
                setIsSaved(true); // Trigger navigation
            } else {
                toast.error(response.message || 'Gagal menyimpan dokumen');
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
                                                        <div className="flex flex-col">
                                                            <p className="font-medium">{selectedFabric.name}</p>
                                                            <p className="text-sm text-[#EB216A] font-semibold">
                                                                {selectedFabric.minPrice ? (
                                                                    <>Mulai Rp {Number(selectedFabric.minPrice).toLocaleString('id-ID', { maximumFractionDigits: 0 })}/m</>
                                                                ) : (
                                                                    <>Pilih varian</>
                                                                )}
                                                            </p>
                                                            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                                                <p>Lebar {selectedFabric.variantMinWidth || 0} s/d {selectedFabric.variantMaxWidth || '-'} cm</p>
                                                                <p>Tinggi {selectedFabric.variantMinHeight || 0} s/d {selectedFabric.variantMaxHeight || '-'} cm</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-400">Belum dipilih...</p>
                                                )}
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setShowFabricPicker(true)} className="h-auto px-6">
                                                <Search className="w-4 h-4 mr-2" /> {selectedFabric ? 'Ganti' : 'Pilih'}
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
                                                            <div key={groupId} className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden mb-6">
                                                                {/* Product Header */}
                                                                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-start">
                                                                    <div className="flex items-center gap-3 lg:gap-4">
                                                                        <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white rounded-lg border border-gray-200 p-1 shrink-0">
                                                                            <img
                                                                                src={getProductImageUrl(groupProduct?.images || groupProduct?.image)}
                                                                                className="w-full h-full object-cover rounded"
                                                                            />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <h3 className="font-bold text-gray-900 text-sm lg:text-lg truncate">{groupProduct?.originalName || groupProduct?.name || 'Produk Custom'}</h3>
                                                                            <p className="text-[#EB216A] font-medium text-sm lg:text-base">
                                                                                {groupProduct?.minPrice ? (
                                                                                    <>Mulai Rp {Number(groupProduct.minPrice).toLocaleString('id-ID')}/m²</>
                                                                                ) : (
                                                                                    <>Pilih varian</>
                                                                                )}
                                                                            </p>
                                                                            {firstItem?.selectedVariant && (
                                                                                <p className="text-xs text-gray-500 truncate">
                                                                                    Varian: {Object.entries(safeJSONParse(firstItem.selectedVariant.attributes, {}) as Record<string, any>).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                                                </p>
                                                                            )}
                                                                            <p className="text-xs text-gray-500">{groupItems.length} Ukuran</p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleRemoveGroup(groupId)}
                                                                        className="text-red-500 hover:text-red-700 p-2"
                                                                        title="Hapus seluruh grup"
                                                                    >
                                                                        <Trash2 className="w-5 h-5" />
                                                                    </button>
                                                                </div>

                                                                {/* Items Table (Responsive Wrapper) */}
                                                                <div className="p-4">
                                                                    <div className="overflow-x-auto hidden lg:block">
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
                                                                                        <Fragment key={item.id}>
                                                                                            <tr className="hover:bg-gray-50/50">
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
                                                                                                    Rp {formatRupiah(prices.fabricPricePerMeter ?? 0)}
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
                                                                                                    Rp {formatRupiah(prices.fabricPricePerMeterNet ?? prices.fabricPricePerMeter)}
                                                                                                </td>
                                                                                                <td className="py-3 px-3 text-center font-medium">
                                                                                                    {item.quantity}
                                                                                                </td>
                                                                                                <td className="py-3 px-3 text-right font-bold text-gray-900">
                                                                                                    Rp {formatRupiah(prices.total)}
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
                                                                                            <tr>
                                                                                                <td colSpan={8} className="px-3 pb-3 pt-0 border-b border-gray-100">
                                                                                                    <div className="relative">
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            value={item.note || ''}
                                                                                                            onChange={(e) => updateItemNote(item.id, e.target.value)}
                                                                                                            placeholder="Catatan item (opsional)..."
                                                                                                            className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-gray-600 placeholder:text-gray-400 focus:outline-none focus:border-[#EB216A]/30 focus:bg-white transition-all"
                                                                                                        />
                                                                                                    </div>
                                                                                                </td>
                                                                                            </tr>
                                                                                        </Fragment>
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
                                                                                                    Rp {formatRupiah(groupTotal)}
                                                                                                </span>
                                                                                            )}
                                                                                            <span>
                                                                                                Rp {formatRupiah(groupTotal * (1 - (groupItems[0]?.groupDiscount || 0) / 100))}
                                                                                            </span>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td></td>
                                                                                </tr>
                                                                            </tfoot>
                                                                        </table>
                                                                    </div>

                                                                    {/* MOBILE VIEW: Cards List */}
                                                                    <div className="lg:hidden space-y-4">
                                                                        {groupItems.map((item) => {
                                                                            const prices = calculateItemPrice(item);
                                                                            const discountedPrice = prices.fabricPricePerMeter * (1 - (item.fabricDiscount || 0) / 100);

                                                                            return (
                                                                                <div key={item.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                                                                                    {/* Card Header: Label & Remove */}
                                                                                    <div className="flex justify-between items-start mb-2">
                                                                                        <div>
                                                                                            <span className="font-semibold text-sm text-gray-900 block">{item.name || '-'}</span>
                                                                                            <span className="text-xs text-gray-500">{item.width} x {item.height} cm • {prices.fabricMeters.toFixed(2)} m²</span>
                                                                                        </div>
                                                                                        <button
                                                                                            onClick={() => handleRemoveItem(item.id)}
                                                                                            className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50"
                                                                                        >
                                                                                            <X className="w-4 h-4" />
                                                                                        </button>
                                                                                    </div>

                                                                                    {/* Price Section */}
                                                                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                                                                        <div>
                                                                                            <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Harga/m²</span>
                                                                                            <div className="text-sm">Rp {prices.fabricPricePerMeter.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                                                                                        </div>
                                                                                        <div>
                                                                                            <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Harga Net</span>
                                                                                            <div className="text-sm font-medium">Rp {discountedPrice.toLocaleString('id-ID')}</div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Disc & Qty inputs */}
                                                                                    <div className="flex items-center gap-3 mb-3">
                                                                                        <div className="flex-1">
                                                                                            <span className="text-[10px] text-gray-500 block uppercase tracking-wider mb-1">Disc (%)</span>
                                                                                            <input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                max="100"
                                                                                                value={item.fabricDiscount || 0}
                                                                                                onChange={(e) => updateFabricDiscount(item.id, parseInt(e.target.value) || 0)}
                                                                                                className="w-full h-8 px-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                                            />
                                                                                        </div>
                                                                                        <div className="flex-1">
                                                                                            <span className="text-[10px] text-gray-500 block uppercase tracking-wider mb-1">Qty</span>
                                                                                            <div className="h-8 px-2 border border-gray-200 rounded text-sm bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                                                                                                {item.quantity}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Item Total */}
                                                                                    <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                                                                                        <span className="text-xs text-gray-500">Total Item</span>
                                                                                        <span className="text-sm font-bold text-gray-900">Rp {prices.total.toLocaleString('id-ID')}</span>
                                                                                    </div>

                                                                                    <div className="mt-3">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={item.note || ''}
                                                                                            onChange={(e) => updateItemNote(item.id, e.target.value)}
                                                                                            placeholder="Catatan item (opsional)..."
                                                                                            className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded text-gray-600 placeholder:text-gray-400 focus:outline-none focus:border-[#EB216A]/30 transition-all"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}

                                                                        {/* Group Footer Summary Card */}
                                                                        <div className="bg-[#EB216A]/5 rounded-xl p-4 border border-[#EB216A]/10">
                                                                            <div className="flex justify-between items-center mb-3">
                                                                                <span className="text-sm font-semibold text-gray-700">Diskon Group</span>
                                                                                <div className="flex items-center gap-1 w-20">
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max="100"
                                                                                        value={groupItems[0]?.groupDiscount || 0}
                                                                                        onChange={(e) => {
                                                                                            const newDisc = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                                                                            setItems(prevItems => prevItems.map(i =>
                                                                                                i.groupId === groupId ? { ...i, groupDiscount: newDisc } : i
                                                                                            ));
                                                                                        }}
                                                                                        className="w-full h-9 px-1 border border-[#EB216A]/20 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                                        placeholder="0"
                                                                                    />
                                                                                    <span className="text-gray-500 text-sm">%</span>
                                                                                </div>
                                                                            </div>

                                                                            <div className="border-t border-[#EB216A]/10 pt-3 flex justify-between items-end">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm text-gray-600">Total Group</span>
                                                                                    {(groupItems[0]?.groupDiscount || 0) > 0 && (
                                                                                        <span className="text-xs text-[#EB216A] font-medium">
                                                                                            Hemat Rp {formatRupiah(groupTotal * ((groupItems[0]?.groupDiscount || 0) / 100))}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    {(groupItems[0]?.groupDiscount || 0) > 0 && (
                                                                                        <span className="text-xs text-gray-400 line-through block">
                                                                                            Rp {formatRupiah(groupTotal)}
                                                                                        </span>
                                                                                    )}
                                                                                    <span className="text-lg font-bold text-[#EB216A]">
                                                                                        Rp {formatRupiah(groupTotal * (1 - (groupItems[0]?.groupDiscount || 0) / 100))}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
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
                                                        <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                                                            {/* ITEM HEADER */}
                                                            <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-100">
                                                                <div className="flex items-start justify-between gap-4">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-12 h-12 bg-[#EB216A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                                                            <span className="text-lg font-bold text-[#EB216A]">{item.quantity}</span>
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="text-lg font-semibold text-gray-900">
                                                                                {item.itemType === 'jendela' ? 'Jendela' : 'Pintu'}
                                                                                {item.packageType === 'gorden-lengkap' ? ' - Paket Lengkap' : ' - Gorden Saja'}
                                                                            </h3>
                                                                            <p className="text-sm text-gray-500">
                                                                                {item.width} cm × {item.height} cm • Jumlah: {item.quantity}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex">
                                                                        <button
                                                                            onClick={() => handleEditItemSize(item)}
                                                                            className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                                                                        >
                                                                            <Pencil className="w-5 h-5" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleRemoveItem(item.id)}
                                                                            className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                                                        >
                                                                            <Trash2 className="w-5 h-5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="mt-3">
                                                                    <input
                                                                        type="text"
                                                                        value={item.note || ''}
                                                                        onChange={(e) => updateItemNote(item.id, e.target.value)}
                                                                        placeholder="Tambahkan catatan khusus untuk item ini (opsional)..."
                                                                        className="w-full text-sm px-3 py-2 bg-white/50 border border-gray-200 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#EB216A] focus:ring-1 focus:ring-[#EB216A] transition-all"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* COMPONENT LIST (Card Style) */}
                                                            <div className="p-4 space-y-3">
                                                                {/* DESKTOP VIEW: Table Layout */}
                                                                <div className="hidden lg:block">
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
                                                                    <div className="flex items-center justify-between py-3 px-3 border-t border-gray-200 gap-4">
                                                                        <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                                                            <button
                                                                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                                                                                onClick={() => handleEditItemProduct(item)}
                                                                                title={item.product ? 'Ganti Produk' : 'Pilih Produk'}
                                                                            >
                                                                                <Pencil className="w-4 h-4 text-gray-500" />
                                                                            </button>

                                                                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                                                                <img
                                                                                    src={getProductImageUrl(item.product?.images || item.product?.image || selectedFabric?.images || selectedFabric?.image)}
                                                                                    className="w-full h-full object-cover"
                                                                                    alt=""
                                                                                />
                                                                            </div>

                                                                            <div className="flex flex-col leading-tight min-w-0">
                                                                                <span className="font-semibold text-gray-900 line-clamp-2" title={item.product?.name}>
                                                                                    {item.product?.name || `Gorden ${selectedCalcType?.name}`}
                                                                                </span>
                                                                                {item.selectedVariant && (
                                                                                    <div className="flex flex-col">
                                                                                        {(() => {
                                                                                            const attrs = safeJSONParse(item.selectedVariant.attributes, {});
                                                                                            const entries = Object.entries(attrs);
                                                                                            if (entries.length > 0) {
                                                                                                return (
                                                                                                    <span className="text-[10px] text-gray-500 truncate">
                                                                                                        {entries.map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                                                                    </span>
                                                                                                );
                                                                                            }
                                                                                            return item.selectedVariant.name ? (
                                                                                                <span className="text-[10px] text-gray-500 truncate">
                                                                                                    {item.selectedVariant.name}
                                                                                                </span>
                                                                                            ) : null;
                                                                                        })()}
                                                                                    </div>
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
                                                                                        Rp {gross.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
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
                                                                                        Rp {net.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                                                                    </div>
                                                                                </>
                                                                            );
                                                                        })()}

                                                                        {/* Qty */}
                                                                        <div className="w-16 flex justify-center">
                                                                            <span className="inline-flex items-center justify-center w-14 h-8 bg-gray-100 rounded text-sm text-gray-600">
                                                                                {(item.selectedVariant?.quantity_multiplier || 1) * item.quantity}
                                                                            </span>
                                                                        </div>

                                                                        {/* Total */}
                                                                        <div className="w-28 text-right text-sm font-bold text-[#EB216A]">
                                                                            Rp {prices.fabric.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                                                        </div>
                                                                    </div>

                                                                    {/* 2. Components Rows */}
                                                                    {selectedCalcType?.components
                                                                        ?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
                                                                        ?.filter(comp => {
                                                                            if (item.packageType === 'gorden-saja') return false; // Hide components for Gorden Saja
                                                                            if (comp.hide_on_door && item.itemType === 'pintu') {
                                                                                return false;
                                                                            }
                                                                            return true;
                                                                        })
                                                                        .map(comp => {
                                                                            const selection = item.components[comp.id];

                                                                            // Calculate display values with effective discount from gross/net
                                                                            const compGross = (selection?.product as any)?.price_gross || selection?.product?.price || 0;
                                                                            const compNetActual = (selection?.product as any)?.price_net || compGross;
                                                                            const effectiveCompDisc = selection?.discount || (compGross > 0 ? Math.round(((compGross - compNetActual) / compGross) * 100) : 0);

                                                                            const rowTotal = selection ? calculateComponentPrice(item, comp, selection) : 0;

                                                                            return (
                                                                                <div key={comp.id} className="flex items-center justify-between py-3 px-3 border-t border-gray-200 gap-4">
                                                                                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                                                                        <button
                                                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                                                                                            onClick={() => openComponentPicker(item.id, comp.id)}
                                                                                            title={selection ? 'Ganti Produk' : 'Pilih Produk'}
                                                                                        >
                                                                                            <Pencil className="w-4 h-4 text-gray-500" />
                                                                                        </button>
                                                                                        <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                                                                            <img
                                                                                                src={getProductImageUrl(selection?.product?.images || selection?.product?.image)}
                                                                                                className="w-full h-full object-cover"
                                                                                                alt=""
                                                                                            />
                                                                                        </div>
                                                                                        <div className="flex flex-col leading-tight min-w-0">
                                                                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{comp.label}</span>
                                                                                            {(() => {
                                                                                                // Parse product name to extract variant info from parentheses
                                                                                                const fullName = selection?.product?.name || '';
                                                                                                const match = fullName.match(/^(.+?)\s*\(([^)]+)\)$/);
                                                                                                const baseName = match ? match[1].trim() : fullName;
                                                                                                const embeddedVariant = match ? match[2] : null;

                                                                                                // Check multiple sources for variant attributes
                                                                                                const attrSource = selection?.product?.variantAttributes
                                                                                                    || selection?.product?.attributes
                                                                                                    || selection?.variantAttributes
                                                                                                    || selection?.selectedVariant?.attributes;
                                                                                                const attrs = attrSource ? safeJSONParse(attrSource, {}) : {};
                                                                                                const hasExternalAttrs = Object.keys(attrs).length > 0;

                                                                                                return (
                                                                                                    <>
                                                                                                        <span className="text-sm font-medium text-gray-900 line-clamp-2" title={fullName}>
                                                                                                            {baseName || '-'}
                                                                                                        </span>
                                                                                                        {/* Show variant info: prefer embedded in name, fallback to external attrs */}
                                                                                                        {embeddedVariant && (
                                                                                                            <span className="text-[10px] text-gray-500">
                                                                                                                {embeddedVariant}
                                                                                                            </span>
                                                                                                        )}
                                                                                                        {!embeddedVariant && hasExternalAttrs && (
                                                                                                            <span className="text-[10px] text-gray-500 truncate">
                                                                                                                {Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </>
                                                                                                );
                                                                                            })()}
                                                                                        </div>
                                                                                    </div>

                                                                                    {selection ? (
                                                                                        <>
                                                                                            <div className="w-28 text-right text-sm text-gray-600">
                                                                                                Rp {compGross.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
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
                                                                                                Rp {Math.round(compNetActual).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                                                                            </div>

                                                                                            <div className="w-16 flex justify-center">
                                                                                                {/* Show read-only multiplied qty or editable input based on price_follows_item_qty */}
                                                                                                {comp.price_follows_item_qty ? (
                                                                                                    <span className="inline-flex items-center justify-center w-14 h-8 bg-gray-100 rounded text-sm text-gray-600" title={`${selection.qty} × ${item.quantity} jendela`}>
                                                                                                        {selection.qty * item.quantity}
                                                                                                    </span>
                                                                                                ) : (
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
                                                                                                )}
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
                                                                </div>

                                                                {/* MOBILE VIEW: Cards Layout */}
                                                                <div className="lg:hidden space-y-4">
                                                                    {/* FABRIC CARD */}
                                                                    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <span className="font-semibold text-sm text-gray-700">Produk Utama</span>
                                                                            <button
                                                                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                                                                                onClick={() => handleEditItemProduct(item)}
                                                                                title={item.product ? 'Ganti Produk' : 'Pilih Produk'}
                                                                            >
                                                                                <Pencil className="w-4 h-4 text-gray-500" />
                                                                            </button>
                                                                        </div>
                                                                        <div className="flex gap-3">
                                                                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                                                <img
                                                                                    src={getProductImageUrl(item.product?.images || item.product?.image || selectedFabric?.images || selectedFabric?.image)}
                                                                                    className="w-full h-full object-cover"
                                                                                    alt=""
                                                                                />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                                                                    {item.product?.name || `Gorden ${selectedCalcType?.name}`}
                                                                                </h4>
                                                                                {item.selectedVariant && (
                                                                                    <div className="text-xs text-gray-500 mt-1 truncate">
                                                                                        {(() => {
                                                                                            const attrs = safeJSONParse(item.selectedVariant.attributes, {});
                                                                                            const entries = Object.entries(attrs);
                                                                                            return entries.length > 0
                                                                                                ? entries.map(([k, v]) => `${k}: ${v}`).join(', ')
                                                                                                : item.selectedVariant.name || '';
                                                                                        })()}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-2 px-0">
                                                                            <input
                                                                                type="text"
                                                                                value={item.note || ''}
                                                                                onChange={(e) => updateItemNote(item.id, e.target.value)}
                                                                                placeholder="Catatan item..."
                                                                                className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#EB216A] focus:ring-1 focus:ring-[#EB216A] transition-all"
                                                                            />
                                                                        </div>
                                                                        <div className="mt-3 text-sm border-t border-gray-100 pt-2 space-y-3">
                                                                            {/* Price Details Grid */}
                                                                            <div className="grid grid-cols-2 gap-3">
                                                                                <div>
                                                                                    <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Harga Gross</span>
                                                                                    {(() => {
                                                                                        const gross = Number(item.selectedVariant?.price_gross) || Number(item.selectedVariant?.price) || Number(item.product?.price) || 0;
                                                                                        return <span className="font-medium">Rp {gross.toLocaleString('id-ID')}</span>;
                                                                                    })()}
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Harga Net</span>
                                                                                    {(() => {
                                                                                        const gross = Number(item.selectedVariant?.price_gross) || Number(item.selectedVariant?.price) || Number(item.product?.price) || 0;
                                                                                        const net = Number(item.selectedVariant?.price_net) || gross;
                                                                                        return <span className="font-medium">Rp {net.toLocaleString('id-ID')}</span>;
                                                                                    })()}
                                                                                </div>
                                                                            </div>

                                                                            {/* Input Grid: Disc & Total */}
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-20">
                                                                                    <span className="text-[10px] text-gray-500 block uppercase tracking-wider mb-1">Disc (%)</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        max="100"
                                                                                        value={(() => {
                                                                                            const gross = Number(item.selectedVariant?.price_gross) || Number(item.selectedVariant?.price) || Number(item.product?.price) || 0;
                                                                                            const net = Number(item.selectedVariant?.price_net) || gross;
                                                                                            return item.fabricDiscount || (gross > 0 ? Math.round(((gross - net) / gross) * 100) : 0);
                                                                                        })()}
                                                                                        onChange={(e) => updateFabricDiscount(item.id, parseInt(e.target.value) || 0)}
                                                                                        className="w-full h-8 px-2 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
                                                                                    />
                                                                                </div>
                                                                                <div className="w-20">
                                                                                    <span className="text-[10px] text-gray-500 block uppercase tracking-wider mb-1">Qty</span>
                                                                                    <div className="h-8 px-2 border border-gray-200 rounded text-sm bg-gray-50 flex items-center justify-center font-medium">
                                                                                        {(item.selectedVariant?.quantity_multiplier || 1) * item.quantity}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-1 text-right">
                                                                                    <span className="text-xs text-gray-500 block">Total</span>
                                                                                    <span className="font-bold text-[#EB216A] text-lg">Rp {prices.fabric.toLocaleString('id-ID')}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* COMPONENT CARDS */}
                                                                    {selectedCalcType?.components
                                                                        ?.filter(comp => {
                                                                            if (item.packageType === 'gorden-saja') return false;
                                                                            if (comp.hide_on_door && item.itemType === 'pintu') return false;
                                                                            return true;
                                                                        })
                                                                        .map(comp => {
                                                                            const selection = item.components[comp.id];
                                                                            return (
                                                                                <div key={comp.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                                                                                    <div className="flex justify-between items-center mb-2">
                                                                                        <span className="font-semibold text-sm text-gray-700">{comp.label}</span>
                                                                                        <button
                                                                                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                                                                                            onClick={() => openComponentPicker(item.id, comp.id)}
                                                                                            title={selection ? 'Ganti Produk' : 'Pilih Produk'}
                                                                                        >
                                                                                            <Pencil className="w-4 h-4 text-gray-500" />
                                                                                        </button>
                                                                                    </div>
                                                                                    {selection ? (
                                                                                        <>
                                                                                            <div className="flex gap-3">
                                                                                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                                                                    <img
                                                                                                        src={getProductImageUrl(selection.product.images || selection.product.image)}
                                                                                                        className="w-full h-full object-cover"
                                                                                                        alt={selection.product.name}
                                                                                                    />
                                                                                                </div>
                                                                                                <div className="flex-1 min-w-0">
                                                                                                    {(() => {
                                                                                                        // Parse product name to extract variant info from parentheses
                                                                                                        const fullName = selection.product.name || '';
                                                                                                        const match = fullName.match(/^(.+?)\s*\(([^)]+)\)$/);
                                                                                                        const baseName = match ? match[1].trim() : fullName;
                                                                                                        const embeddedVariant = match ? match[2] : null;

                                                                                                        // Check multiple sources for variant attributes
                                                                                                        const attrSource = selection.product.variantAttributes
                                                                                                            || selection.product.attributes
                                                                                                            || selection.variantAttributes
                                                                                                            || selection.selectedVariant?.attributes;
                                                                                                        const attrs = attrSource ? safeJSONParse(attrSource, {}) : {};
                                                                                                        const hasExternalAttrs = Object.keys(attrs).length > 0;

                                                                                                        return (
                                                                                                            <>
                                                                                                                <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                                                                                                    {baseName}
                                                                                                                </h4>
                                                                                                                {/* Show variant info: prefer embedded in name, fallback to external attrs */}
                                                                                                                {embeddedVariant && (
                                                                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                                                                        {embeddedVariant}
                                                                                                                    </div>
                                                                                                                )}
                                                                                                                {!embeddedVariant && hasExternalAttrs && (
                                                                                                                    <div className="text-xs text-gray-500 mt-1 truncate">
                                                                                                                        {Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            </>
                                                                                                        );
                                                                                                    })()}
                                                                                                </div>
                                                                                            </div>
                                                                                            <div className="mt-3 text-sm border-t border-gray-100 pt-2 space-y-3">
                                                                                                {/* Price Details */}
                                                                                                <div className="grid grid-cols-2 gap-3">
                                                                                                    <div>
                                                                                                        <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Harga Gross</span>
                                                                                                        <span className="font-medium">Rp {(selection.product.price_gross || selection.product.price).toLocaleString('id-ID')}</span>
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Harga Net</span>
                                                                                                        <span className="font-medium">Rp {(selection.product.price_net || selection.product.price).toLocaleString('id-ID')}</span>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="flex items-center gap-3 mt-3 border-t border-gray-50 pt-3">
                                                                                                    {/* Disc Input */}
                                                                                                    <div className="w-20">
                                                                                                        <span className="text-[10px] text-gray-500 block uppercase tracking-wider mb-1">Disc (%)</span>
                                                                                                        <input
                                                                                                            type="number"
                                                                                                            min="0"
                                                                                                            max="100"
                                                                                                            value={selection.discount || (() => {
                                                                                                                const g = (selection.product.price_gross || selection.product.price || 0);
                                                                                                                const n = (selection.product.price_net || selection.product.price || 0);
                                                                                                                return g > 0 ? Math.round(((g - n) / g) * 100) : 0;
                                                                                                            })()}
                                                                                                            className="w-full h-8 px-2 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
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

                                                                                                    {/* Qty Input */}
                                                                                                    <div className="w-20">
                                                                                                        <span className="text-[10px] text-gray-500 block uppercase tracking-wider mb-1">Qty</span>
                                                                                                        {/* Show read-only multiplied qty or editable input based on price_follows_item_qty */}
                                                                                                        {comp.price_follows_item_qty ? (
                                                                                                            <span className="inline-flex items-center justify-center w-full h-8 bg-gray-100 rounded text-sm text-gray-600" title={`${selection.qty} × ${item.quantity} jendela`}>
                                                                                                                {selection.qty * item.quantity}
                                                                                                            </span>
                                                                                                        ) : (
                                                                                                            <input
                                                                                                                type="number"
                                                                                                                min="1"
                                                                                                                value={selection.qty}
                                                                                                                className="w-full h-8 px-2 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] outline-none"
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
                                                                                                            />
                                                                                                        )}
                                                                                                    </div>

                                                                                                    {/* Total */}
                                                                                                    <div className="flex-1 text-right">
                                                                                                        <span className="text-xs text-gray-500 block">Total</span>
                                                                                                        <span className="font-bold text-[#EB216A] text-lg">Rp {calculateComponentPrice(item, comp, selection).toLocaleString('id-ID')}</span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </>
                                                                                    ) : (
                                                                                        <div className="text-center py-4 text-gray-400 text-sm italic">
                                                                                            Belum ada produk dipilih
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    {selectedCalcType?.components
                                                                        ?.filter(comp => {
                                                                            if (item.packageType === 'gorden-saja') return false;
                                                                            if (comp.hide_on_door && item.itemType === 'pintu') return false;
                                                                            return true;
                                                                        })
                                                                        .length === 0 && (
                                                                            <div className="text-center py-4 text-gray-400 text-sm italic">
                                                                                Tidak ada komponen tambahan
                                                                            </div>
                                                                        )
                                                                    }
                                                                </div>



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
                                                <span className="text-lg font-bold text-[#EB216A]">Rp {formatRupiah(calculateTotal())}</span>
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
                            <Input type="number" min="0" max="100" value={formData.discount} onChange={e => setFormData({ ...formData, discount: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })} placeholder="0" />
                        </div>

                        {/* Summary Display */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm border border-gray-100">
                            <div className="flex justify-between text-gray-600">
                                <span>Total Item</span>
                                <span>Rp {formatRupiah(items.reduce((sum, item) => sum + calculateItemPrice(item).totalAfterGroupDiscount, 0))}</span>
                            </div>
                            {formData.discount > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Diskon ({formData.discount}%)</span>
                                    <span>-Rp {formatRupiah(items.reduce((sum, item) => sum + calculateItemPrice(item).totalAfterGroupDiscount, 0) * (formData.discount / 100))}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 text-[#EB216A]">
                                <span>Total Akhir</span>
                                <span>Rp {formatRupiah(calculateTotal())}</span>
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
                                <h3 className="text-lg font-semibold">{isBlindType() ? 'Pilih Jenis Blind' : 'Pilih Bahan Kain'}</h3>
                                <Button size="sm" variant="ghost" onClick={() => {
                                    setShowFabricPicker(false);
                                    setSelectedProductSubcategoryId(null);
                                    setSearchQuery('');
                                }}><X className="w-4 h-4" /></Button>
                            </div>

                            {/* Subcategory Tabs for Blind */}
                            {isBlindType() && productSubcategories.length > 0 && (
                                <div className="p-4 border-b">
                                    <p className="text-sm text-gray-600 mb-2">Pilih Tipe Blind:</p>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setSelectedProductSubcategoryId(null)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedProductSubcategoryId === null
                                                ? 'bg-[#EB216A] text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            Semua
                                        </button>
                                        {productSubcategories.map(subcat => (
                                            <button
                                                key={subcat.id}
                                                onClick={() => setSelectedProductSubcategoryId(subcat.id)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedProductSubcategoryId === subcat.id
                                                    ? 'bg-[#EB216A] text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {subcat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 border-b">
                                <Input placeholder="Cari produk..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {fabricProducts.filter((p: any) => {
                                    if (!p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

                                    // Category Filter
                                    if (selectedCalcType?.category?.slug) {
                                        const productCategory = p.category?.slug || p.Category?.slug || ''; // Handle potential case variance
                                        if (productCategory !== selectedCalcType.category.slug) return false;
                                    }

                                    // Subcategory Filter for Blind
                                    if (isBlindType() && selectedProductSubcategoryId) {
                                        const productSubcategoryId = p.subcategory_id || p.SubCategory?.id || p.subcategory?.id;
                                        if (productSubcategoryId !== selectedProductSubcategoryId) return false;
                                    }

                                    return true;
                                }).slice(0, 20).map((product: any) => (
                                    <div key={product.id} className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-[#EB216A]" onClick={() => handleSelectFabric(product)}>
                                        <div className="flex items-center gap-3">
                                            <img src={getProductImageUrl(product.images || product.image)} alt="" className="w-12 h-12 rounded object-cover bg-gray-100" />
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                {!isBlindType() && (
                                                    <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                                                        {product.minPrice > 0 && (
                                                            <p className="font-medium text-[#EB216A]">Mulai Rp {Number(product.minPrice).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                                                        )}
                                                        <p className="text-xs">Lebar {product.variantMinWidth || 0} s/d {product.variantMaxWidth || '-'} cm</p>
                                                        <p className="text-xs">Tinggi {product.variantMinHeight || 0} s/d {product.variantMaxHeight || '-'} cm</p>
                                                    </div>
                                                )}
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
                        <div
                            className="bg-white rounded-xl mx-4 max-h-[80vh] overflow-hidden flex flex-col"
                            style={{ width: 'clamp(320px, 95vw, 1200px)', maxWidth: '1600px' }}
                        >
                            <div className="p-4 border-b flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">Pilih Varian</h3>
                                    {variantSelectionMode === 'component' && editingComponentId !== null && (() => {
                                        const comp = selectedCalcType?.components?.find(c => c.id === editingComponentId);
                                        return comp ? <p className="text-sm text-gray-500 mt-0.5">{comp.label}</p> : null;
                                    })()}
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => { setShowVariantPicker(false); setVariantItemId(null); }}><X className="w-4 h-4" /></Button>
                            </div>

                            {/* General Recommendation Banner */}
                            {(() => {
                                // Use editingItemId for component variant selection, variantItemId for fabric
                                const itemId = variantSelectionMode === 'component' ? editingItemId : variantItemId;
                                const item = items.find(i => i.id === itemId);
                                const w = item ? item.width : width;
                                const h = item ? item.height : height;

                                if (w && h) {
                                    return (
                                        <div className="mx-4 mt-4 p-3 bg-pink-50 border border-pink-200 rounded-lg text-sm text-pink-900 leading-relaxed">
                                            <p className="font-semibold">
                                                Rekomendasi Umum: Cocok Untuk Pintu/Jendela Lebar {w} cm × Tinggi {h} cm
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <div className="p-4 border-b">
                                <Input placeholder="Cari varian (sibak, gelombang, tinggi, harga)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                            </div>
                            <div className="flex-1 overflow-y-auto p-4">
                                {(() => {
                                    // Build column keys (excluding Gelombang if present)
                                    const allAttrKeys = new Set<string>();
                                    availableVariants.forEach((v: any) => {
                                        const attrs = safeJSONParse(v.attributes, {});
                                        Object.keys(attrs).forEach(k => {
                                            if (!['gelombang', 'gel'].includes(k.toLowerCase())) {
                                                allAttrKeys.add(k);
                                            }
                                        });
                                    });

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

                                    // Helper to get numeric value
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

                                    // Sort by Lebar, Tinggi, Sibak (ascending)
                                    const sorted = [...filtered].sort((a, b) => {
                                        const attrsA = safeJSONParse(a.attributes, {}) as Record<string, any>;
                                        const attrsB = safeJSONParse(b.attributes, {}) as Record<string, any>;

                                        // 1. Lebar
                                        const lebarA = getNum(attrsA, ['lebar', 'width', 'l']);
                                        const lebarB = getNum(attrsB, ['lebar', 'width', 'l']);
                                        if (lebarA !== lebarB) return lebarA - lebarB;

                                        // 2. Tinggi
                                        const tinggiA = getNum(attrsA, ['tinggi', 'height', 't']);
                                        const tinggiB = getNum(attrsB, ['tinggi', 'height', 't']);
                                        if (tinggiA !== tinggiB) return tinggiA - tinggiB;

                                        // 3. Sibak
                                        const sibakA = getNum(attrsA, ['sibak']);
                                        const sibakB = getNum(attrsB, ['sibak']);
                                        return sibakA - sibakB;
                                    });

                                    if (sorted.length === 0) {
                                        return <p className="text-center py-8 text-gray-500">Tidak ada varian yang cocok.</p>;
                                    }

                                    // Determine columns
                                    const hasLebar = Array.from(allAttrKeys).some(k => ['lebar', 'width', 'l'].includes(k.toLowerCase()));
                                    let columnKeys = Array.from(allAttrKeys);

                                    // Check component config for Gelombang visibility
                                    let showGelombang = true;
                                    if (variantSelectionMode === 'component' && editingComponentId) {
                                        const comp = selectedCalcType?.components?.find((c: any) => c.id === editingComponentId);
                                        if (comp) showGelombang = !!comp.show_gelombang;
                                    }

                                    // Add dynamic Gelombang if Lebar exists AND allowed
                                    if (hasLebar && showGelombang && !columnKeys.some(k => ['gelombang', 'gel'].includes(k.toLowerCase()))) {
                                        columnKeys.push('Gelombang');
                                    }

                                    // Sort columns: Lebar -> Gelombang -> Tinggi -> Sibak -> Others
                                    const colOrder = ['lebar', 'width', 'l', 'gelombang', 'gel', 'tinggi', 'height', 't', 'sibak'];
                                    columnKeys.sort((a, b) => {
                                        const ia = colOrder.findIndex(o => a.toLowerCase() === o || a.toLowerCase().startsWith(o));
                                        const ib = colOrder.findIndex(o => b.toLowerCase() === o || b.toLowerCase().startsWith(o));
                                        if (ia !== -1 && ib !== -1) return ia - ib;
                                        if (ia !== -1) return -1;
                                        if (ib !== -1) return 1;
                                        return a.localeCompare(b);
                                    });

                                    return (
                                        <>
                                            <div className="hidden lg:block overflow-x-auto border border-gray-200 rounded-lg">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-gray-50 border-b border-gray-200">
                                                        <tr>
                                                            {columnKeys.map(key => (
                                                                <th key={key} className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                                                                    {key}
                                                                </th>
                                                            ))}
                                                            {!isBlindType() && (
                                                                <th className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                                                                    Cocok Untuk Pintu/Jendela
                                                                </th>
                                                            )}
                                                            <th className="px-3 py-2 text-right font-semibold text-gray-700 whitespace-nowrap">
                                                                Harga
                                                            </th>
                                                            <th className="px-3 py-2 text-center font-semibold text-gray-700 whitespace-nowrap">
                                                                Pilih
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {sorted.map((v: any, index: number) => {
                                                            const attrs = safeJSONParse(v.attributes, {}) as Record<string, any>;
                                                            const priceNet = Number(v.price_net) || 0;
                                                            const priceGross = Number(v.price_gross) || 0;
                                                            const displayPrice = priceNet || priceGross;

                                                            // Styling Logic
                                                            let rowBgClass = '';
                                                            const hasGelombangCol = columnKeys.includes('Gelombang') || columnKeys.some(k => ['gelombang', 'gel'].includes(k.toLowerCase()));

                                                            if (hasGelombangCol) {
                                                                // Extract Gelombang Value
                                                                let gelombangVal = 0;
                                                                if (columnKeys.includes('Gelombang')) {
                                                                    const lebar = getNum(attrs, ['lebar', 'width', 'l']);
                                                                    gelombangVal = lebar !== 999999 ? Math.round(lebar / 10) : 0;
                                                                } else {
                                                                    gelombangVal = getNum(attrs, ['gelombang', 'gel']);
                                                                }

                                                                // Assign Color based on Gelombang Value (Cycle through pastel colors)
                                                                // Use a hash or modulo to pick color. 
                                                                // Colors: Pink, Blue, Green, Yellow, Purple (Light variants)
                                                                const colors = [
                                                                    'bg-red-50 hover:bg-red-100',
                                                                    'bg-blue-50 hover:bg-blue-100',
                                                                    'bg-green-50 hover:bg-green-100',
                                                                    'bg-yellow-50 hover:bg-yellow-100',
                                                                    'bg-purple-50 hover:bg-purple-100'
                                                                ];

                                                                // If gelombangVal is valid, pick color. Else fallback.
                                                                if (gelombangVal > 0 && gelombangVal !== 999999) {
                                                                    // offset to align 4 -> index 0, 5 -> index 1 etc if possible, or just modulo
                                                                    const colorIndex = (gelombangVal) % colors.length;
                                                                    rowBgClass = colors[colorIndex];
                                                                } else {
                                                                    rowBgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                                                                }
                                                            } else {
                                                                // Zebra Striping for Non-Gelombang (Components, Blind, etc)
                                                                rowBgClass = index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100';
                                                            }

                                                            return (
                                                                <tr
                                                                    key={v.id}
                                                                    className={`${rowBgClass} cursor-pointer transition-colors border-b border-gray-100`}
                                                                    onClick={() => handleSelectVariant(v)}
                                                                >
                                                                    {columnKeys.map(key => {
                                                                        // Dynamic Gelombang Logic
                                                                        if (key === 'Gelombang') {
                                                                            const lebar = getNum(attrs, ['lebar', 'width', 'l']);
                                                                            const val = lebar !== 999999 ? Math.round(lebar / 10) : '-';
                                                                            return (
                                                                                <td key={key} className="px-3 py-3 text-gray-800 whitespace-nowrap font-medium">
                                                                                    {val}
                                                                                </td>
                                                                            );
                                                                        }
                                                                        const matchKey = Object.keys(attrs).find(k => k.toLowerCase() === key.toLowerCase());
                                                                        const val = matchKey ? attrs[matchKey] : '-';
                                                                        return (
                                                                            <td key={key} className="px-3 py-3 text-gray-800 whitespace-nowrap">
                                                                                {val}
                                                                            </td>
                                                                        );
                                                                    })}
                                                                    {/* Cocok Untuk Pintu/Jendela Cell */}
                                                                    {!isBlindType() && (
                                                                        <td className="px-3 py-3 text-gray-800 text-xs">
                                                                            {(() => {
                                                                                const lebar = getNum(attrs, ['lebar', 'width', 'l']);
                                                                                const tinggi = getNum(attrs, ['tinggi', 'height', 't']);
                                                                                const sibak = getNum(attrs, ['sibak']);
                                                                                const calculatedLebar = lebar !== 999999 ? (sibak !== 999999 ? lebar * sibak : lebar) : null;
                                                                                const calculatedTinggi = tinggi !== 999999 ? tinggi : null;

                                                                                if (calculatedLebar || calculatedTinggi) {
                                                                                    return (
                                                                                        <span>
                                                                                            Lebar +/- {calculatedLebar || '-'}cm<br />
                                                                                            Tinggi {calculatedTinggi || '-'}cm
                                                                                        </span>
                                                                                    );
                                                                                }
                                                                                return '-';
                                                                            })()}
                                                                        </td>
                                                                    )}
                                                                    <td className="px-3 py-3 text-right whitespace-nowrap">
                                                                        <span className="font-semibold text-[#EB216A]">
                                                                            Rp {displayPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
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

                                            {/* MOBILE: Card View */}
                                            <div className="lg:hidden space-y-3">
                                                {sorted.map((v: any, index: number) => {
                                                    const attrs = safeJSONParse(v.attributes, {}) as Record<string, any>;
                                                    const priceNet = Number(v.price_net) || 0;
                                                    const priceGross = Number(v.price_gross) || 0;
                                                    const displayPrice = priceNet || priceGross;

                                                    // Styling Logic (Duplicated for Mobile to ensure same logic)
                                                    let rowBgClass = '';
                                                    const hasGelombangCol = columnKeys.includes('Gelombang') || columnKeys.some(k => ['gelombang', 'gel'].includes(k.toLowerCase()));

                                                    if (hasGelombangCol) {
                                                        let gelombangVal = 0;
                                                        if (columnKeys.includes('Gelombang')) {
                                                            const lebar = getNum(attrs, ['lebar', 'width', 'l']);
                                                            gelombangVal = lebar !== 999999 ? Math.round(lebar / 10) : 0;
                                                        } else {
                                                            gelombangVal = getNum(attrs, ['gelombang', 'gel']);
                                                        }

                                                        const colors = [
                                                            'bg-red-50 border-red-100',
                                                            'bg-blue-50 border-blue-100',
                                                            'bg-green-50 border-green-100',
                                                            'bg-yellow-50 border-yellow-100',
                                                            'bg-purple-50 border-purple-100'
                                                        ];

                                                        if (gelombangVal > 0 && gelombangVal !== 999999) {
                                                            const colorIndex = (gelombangVal) % colors.length;
                                                            rowBgClass = colors[colorIndex];
                                                        } else {
                                                            rowBgClass = index % 2 === 0 ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200';
                                                        }
                                                    } else {
                                                        rowBgClass = index % 2 === 0 ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200';
                                                    }

                                                    return (
                                                        <div
                                                            key={v.id}
                                                            className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between gap-4 ${rowBgClass}`}
                                                            onClick={() => handleSelectVariant(v)}
                                                        >
                                                            {/* Left Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap text-sm text-gray-700 mb-2">
                                                                    {columnKeys.map(key => {
                                                                        let val: any;
                                                                        if (key === 'Gelombang') {
                                                                            const lebar = getNum(attrs, ['lebar', 'width', 'l']);
                                                                            val = lebar !== 999999 ? Math.round(lebar / 10) : '-';
                                                                        } else {
                                                                            const matchKey = Object.keys(attrs).find(k => k.toLowerCase() === key.toLowerCase());
                                                                            val = matchKey ? attrs[matchKey] : '-';
                                                                        }

                                                                        return (
                                                                            <span key={key} style={{ marginRight: '24px', marginBottom: '8px', whiteSpace: 'nowrap', display: 'inline-block', lineHeight: '1.6' }}>
                                                                                <span className="text-gray-500 text-xs">{key}:</span> <span className="font-semibold text-gray-900 ml-1">{val}</span>
                                                                            </span>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {/* Cocok Untuk - Mobile */}
                                                                {!isBlindType() && (() => {
                                                                    const lebar = getNum(attrs, ['lebar', 'width', 'l']);
                                                                    const tinggi = getNum(attrs, ['tinggi', 'height', 't']);
                                                                    const sibak = getNum(attrs, ['sibak']);
                                                                    const calculatedLebar = lebar !== 999999 ? (sibak !== 999999 ? lebar * sibak : lebar) : null;
                                                                    const calculatedTinggi = tinggi !== 999999 ? tinggi : null;

                                                                    if (calculatedLebar || calculatedTinggi) {
                                                                        return (
                                                                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded inline-block">
                                                                                Cocok untuk: Lebar {calculatedLebar || '-'}cm × Tinggi {calculatedTinggi || '-'}cm
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return null;
                                                                })()}
                                                            </div>

                                                            {/* Right Info */}
                                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                                <span className="font-bold text-[#EB216A] text-lg">
                                                                    Rp {displayPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                                                                </span>
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-[#EB216A] hover:bg-[#d11d5e] text-white text-xs px-3 py-1 w-full"
                                                                >
                                                                    Pilih
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div >
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
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto overflow-x-hidden">
                    <DialogHeader>
                        <DialogTitle className={isBlindType() ? 'hidden lg:block' : ''}>
                            {editingItemId ? 'Edit Item' : (isBlindType() ? `Tambah: ${itemModalTargetProduct?.name || 'Blind'}` : 'Tambah Item Baru')}
                        </DialogTitle>
                        <DialogDescription>Masukkan detail ukuran dan kebutuhan</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">

                        {/* Show Product Image for Blind Flow */}
                        {isBlindType() && itemModalTargetProduct && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl overflow-hidden">
                                <img src={getProductImageUrl(itemModalTargetProduct.images || itemModalTargetProduct.image)} className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm lg:text-base font-medium text-gray-900 break-words">{itemModalTargetProduct.originalName || itemModalTargetProduct.name}</p>
                                    <p className="text-xs lg:text-sm text-[#EB216A] font-bold">
                                        {itemModalTargetProduct.minPrice && itemModalTargetProduct.minPrice > 0
                                            ? `Mulai Rp ${Number(itemModalTargetProduct.minPrice).toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
                                            : itemModalTargetProduct.price > 0
                                                ? `Rp ${Number(itemModalTargetProduct.price).toLocaleString('id-ID', { maximumFractionDigits: 0 })}/m²`
                                                : 'Lihat Varian'}
                                    </p>
                                    {itemModalTargetProduct.selectedVariant && (
                                        <p className="text-xs text-gray-500 mt-0.5 break-words">
                                            Varian: {Object.entries(safeJSONParse(itemModalTargetProduct.selectedVariant.attributes, {}) as Record<string, any>).map(([k, v]) => `${k}: ${v}`).join(', ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Item Name (Blind Flow) */}
                        {isBlindType() && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Jendela / Identitas</label>
                                <input
                                    type="text"
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EB216A] focus:border-[#EB216A] outline-none"
                                    placeholder="Contoh: Jendela Depan, Jendela Kamar"
                                />
                            </div>
                        )}

                        {/* Item Type & Package Type (Non-Blind Flow) */}
                        {!isBlindType() && (
                            <div className="grid grid-cols-2 gap-4">
                                {selectedCalcType?.has_item_type && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Item</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setItemType('jendela')}
                                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${itemType === 'jendela'
                                                    ? 'bg-[#EB216A] text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                Jendela
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setItemType('pintu')}
                                                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${itemType === 'pintu'
                                                    ? 'bg-[#EB216A] text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                Pintu
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {selectedCalcType?.has_package_type && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Paket</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPackageType('gorden-lengkap')}
                                                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${packageType === 'gorden-lengkap'
                                                    ? 'bg-[#EB216A] text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                Lengkap
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPackageType('gorden-saja')}
                                                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${packageType === 'gorden-saja'
                                                    ? 'bg-[#EB216A] text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                Gorden Saja
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Dimensions */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lebar (cm)</label>
                                <input
                                    type="number"
                                    value={width}
                                    onChange={e => setWidth(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EB216A] focus:border-[#EB216A] outline-none"
                                    placeholder="200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tinggi (cm)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={e => setHeight(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EB216A] focus:border-[#EB216A] outline-none"
                                    placeholder="250"
                                />
                            </div>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Unit (Set)</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EB216A] focus:border-[#EB216A] outline-none"
                                placeholder="1"
                            />
                        </div>

                        {!isBlindType() && (
                            <p className="text-xs text-gray-400 italic">
                                * Jumlah panel dihitung otomatis.
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
