import {
  Calculator,
  Check,
  ChevronRight,
  Layers,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  Ruler,
  Search,
  Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { CustomerInfoDialog } from '../components/CustomerInfoDialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { calculatorLeadsApi, calculatorTypesApi, productsApi, productVariantsApi } from '../utils/api';
import { getProductImageUrl } from '../utils/imageHelper';
import { safeJSONParse } from '../utils/jsonHelper';
import type { VariantFilterRule } from '../utils/variantFilterHelper';
import { filterVariantsByRule } from '../utils/variantFilterHelper';
import { chatAdminFromCalculator } from '../utils/whatsappHelper';

// Types
interface CalculatorTypeFromDB {
  id: number;
  name: string;
  slug: string;
  description: string;
  has_item_type: boolean;
  has_package_type: boolean;
  fabric_multiplier: number;
  is_active: boolean;
  display_order: number;
  components: ComponentFromDB[];
  category?: { id: number; name: string; slug: string };
}

interface ComponentFromDB {
  id: number;
  calculator_type_id: number;
  subcategory_id: number;
  label: string;
  is_required: boolean;
  price_calculation: 'per_meter' | 'per_unit' | 'per_10_per_meter';
  display_order: number;
  multiply_with_variant: boolean;
  variant_filter_rule?: string;
  hide_on_door?: boolean;
  show_gelombang?: boolean;
  price_follows_item_qty?: boolean;
  subcategory?: { id: number; name: string; slug: string };
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  images?: string[];
  maxWidth?: number;
  sibak?: number;
  minPrice?: number;
  maxPrice?: number;
  variantAttributes?: any;
  category?: any;
  Category?: any; // Capital C sometimes from backend
  variantMinWidth?: number;
  variantMaxWidth?: number;
  variantMinHeight?: number;
  variantMaxHeight?: number;
}

interface ComponentSelection {
  product: ProductOption;
  qty: number;  // quantity for this component
}

interface SelectedComponents {
  [componentId: number]: ComponentSelection;
}

interface CalculatorItem {
  id: string;
  groupId?: string; // Group items by product (Block logic)
  name?: string; // Optional name for the item (e.g. "Jendela Depan")
  itemType: 'jendela' | 'pintu';
  packageType: 'gorden-saja' | 'gorden-lengkap';
  width: number;
  height: number;
  panels: number;
  quantity: number;
  components: SelectedComponents;
  product?: ProductOption; // Specific product for this item (Blind flow)
  selectedVariant?: {
    id: string;
    attributes?: Record<string, any>;
    price: number;
    price_gross?: number;
    price_net?: number;
    quantity_multiplier?: number;
    name: string;
  };
}

export default function CalculatorPageV2() {
  // Customer info
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<{ name: string; phone: string } | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);

  // Calculator types from backend
  const [calculatorTypes, setCalculatorTypes] = useState<CalculatorTypeFromDB[]>([]);
  const [selectedTypeSlug, setSelectedTypeSlug] = useState<string>('');

  // Products
  const [fabricProducts, setFabricProducts] = useState<any[]>([]);
  const [selectedFabric, setSelectedFabric] = useState<any>(null);
  const [componentProducts, setComponentProducts] = useState<{ [subcategoryId: number]: ProductOption[] }>({});

  // Items
  const [items, setItems] = useState<CalculatorItem[]>([]);

  // Form state
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<'jendela' | 'pintu'>('jendela');
  const [packageType, setPackageType] = useState<'gorden-saja' | 'gorden-lengkap'>('gorden-lengkap');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [panels, setPanels] = useState('1'); // Default 1
  const [quantity, setQuantity] = useState('1');

  // Flow Helper
  const isBlindFlow = selectedTypeSlug.toLowerCase().includes('blind');

  // Temporary state for Blind flow (product selected before dimensions)
  const [tempSelectedProduct, setTempSelectedProduct] = useState<ProductOption | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingComponentId, setEditingComponentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Variant state
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [pendingProductForVariant, setPendingProductForVariant] = useState<ProductOption | null>(null);
  const [availableVariants, setAvailableVariants] = useState<any[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantSelectionMode, setVariantSelectionMode] = useState<'fabric' | 'component'>('component');
  const [variantSearchQuery, setVariantSearchQuery] = useState('');
  const [editingVariantItemId, setEditingVariantItemId] = useState<string | null>(null);

  // Load customer info from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('amagriya_calculator_access_v2');
    if (saved) {
      setCustomerInfo(JSON.parse(saved));
      setIsCustomerDialogOpen(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [typesRes, productsRes] = await Promise.all([
          calculatorTypesApi.getTypes(),
          productsApi.getAll()
        ]);

        if (typesRes.success && typesRes.data?.length > 0) {
          setCalculatorTypes(typesRes.data);
          setSelectedTypeSlug(typesRes.data[0].slug);
        }

        if (productsRes.success && productsRes.data?.length > 0) {
          setFabricProducts(productsRes.data);

          // Initial selection handling moved to the new useEffect
          // setSelectedFabric(productsRes.data[0]); 
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load component products when type changes
  useEffect(() => {
    const loadComponentProducts = async () => {
      const currentType = calculatorTypes.find(t => t.slug === selectedTypeSlug);
      if (!currentType?.components?.length) return;

      const results: { [key: number]: ProductOption[] } = {};

      for (const comp of currentType.components) {
        try {
          const res = await calculatorTypesApi.getProductsBySubcategory(comp.subcategory_id);
          if (res.success && res.data) {
            results[comp.subcategory_id] = res.data.map((p: any) => ({
              id: p.id.toString(),
              name: p.name,
              price: p.price,
              description: p.description,
              image: p.images?.[0] || p.image,
              maxWidth: p.max_length,
              sibak: p.sibak
            }));
          }
        } catch (error) {
          console.error('Error loading products for subcategory:', comp.subcategory_id);
        }
      }

      setComponentProducts(results);
    };

    if (calculatorTypes.length > 0 && selectedTypeSlug) {
      loadComponentProducts();
    }
  }, [selectedTypeSlug, calculatorTypes]);

  // Update selected fabric when type changes if current one is invalid
  useEffect(() => {
    if (!currentType) return;

    // Check if current selected fabric matches the new type's category
    const isCompatible = (() => {
      if (!selectedFabric) return false;
      if (!currentType.category?.slug) return true; // No category restriction
      return (selectedFabric.category?.slug || selectedFabric.Category?.slug || '') === currentType.category.slug;
    })();

    if (!isCompatible) {
      // Find first compatible product
      const compatibleProduct = fabricProducts.find(p => {
        if (!currentType.category?.slug) return true;
        return (p.category?.slug || p.Category?.slug || '') === currentType.category.slug;
      });

      if (compatibleProduct) {
        setSelectedFabric(compatibleProduct);
      } else {
        setSelectedFabric(null); // Clear if no compatible product found
      }
    }
  }, [selectedTypeSlug, calculatorTypes, fabricProducts, selectedFabric]);

  // Get current calculator type
  const currentType = calculatorTypes.find(t => t.slug === selectedTypeSlug);

  // Handle customer info submit
  const handleCustomerInfoSubmit = (name: string, phone: string) => {
    const info = { name, phone };
    setCustomerInfo(info);
    localStorage.setItem('amagriya_calculator_access_v2', JSON.stringify(info));
    setIsCustomerDialogOpen(false);
  };

  // Confirmation Dialog State
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingTypeSlug, setPendingTypeSlug] = useState<string | null>(null);

  // Handle type change request
  const handleTypeChange = (slug: string) => {
    if (items.length > 0) {
      // Show custom confirmation dialog
      setPendingTypeSlug(slug);
      setIsConfirmDialogOpen(true);
    } else {
      setSelectedTypeSlug(slug);
    }
  };

  // Execute type change after confirmation
  const confirmTypeChange = () => {
    if (pendingTypeSlug) {
      setItems([]);
      setSelectedTypeSlug(pendingTypeSlug);
      setPendingTypeSlug(null);
      setIsConfirmDialogOpen(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setItemName('');
    setWidth('');
    setHeight('');
    setPanels('1');
    setQuantity('1');
    setItemType('jendela');
    setPackageType('gorden-lengkap');
    setTempSelectedProduct(null);
    setTargetGroupId(null);
    setEditingItemId(null);
  };

  // Add item - then check for variants based on dimensions
  const handleAddItem = async () => {
    if (!width || !height || !quantity) {
      alert('Lengkapi semua field!');
      return;
    }

    const itemWidth = parseFloat(width);
    const itemHeight = parseFloat(height);

    // Group ID Logic:
    // If targetGroupId is set, use it.
    // Else if Blind Flow, generate a new one.
    // Else undefined (Curtain flow doesn't use grouping yet, or uses global group).
    const groupId = targetGroupId
      ? targetGroupId
      : (isBlindFlow ? Date.now().toString() + '-group' : undefined);

    // For Blind flow with existing group, inherit variant from first item in group
    let inheritedVariant = undefined;
    if (isBlindFlow && targetGroupId) {
      const existingGroupItem = items.find(item => item.groupId === targetGroupId);
      if (existingGroupItem?.selectedVariant) {
        inheritedVariant = existingGroupItem.selectedVariant;
      }
    }
    // If tempSelectedProduct has variant data (from Blind product selection), use that
    if (isBlindFlow && tempSelectedProduct && (tempSelectedProduct as any).price_net) {
      inheritedVariant = {
        id: (tempSelectedProduct as any).id,
        price: (tempSelectedProduct as any).price || (tempSelectedProduct as any).price_net,
        price_net: (tempSelectedProduct as any).price_net,
        price_gross: (tempSelectedProduct as any).price_gross,
        name: tempSelectedProduct.name,
        attributes: (tempSelectedProduct as any).attributes,
        quantity_multiplier: 1 // Blind flow doesn't use multiplier
      };
    }

    // If editing, update existing item
    if (editingItemId) {
      setItems(items.map(item => {
        if (item.id === editingItemId) {
          return {
            ...item,
            name: itemName,
            itemType,
            packageType,
            width: itemWidth,
            height: itemHeight,
            panels: parseInt(panels) || 1,
            quantity: parseInt(quantity),
            // Preserve components and variant (unless product changed?)
            // For now, assume variants/components distinct from dimensions (except validation)
            // If dimensions change, we might need to re-validate variant filter?
            // Existing logic below checks variant for NEW item.
            // For UPDATE, we might should re-check?
            // User requested basic edit.
          };
        }
        return item;
      }));
      resetForm();
      setIsAddItemModalOpen(false);
      return;
    }

    const newItem: CalculatorItem = {
      id: Date.now().toString(),
      groupId,
      name: itemName,
      itemType,
      packageType,
      width: itemWidth,
      height: itemHeight,
      panels: parseInt(panels) || 1,
      quantity: parseInt(quantity),
      components: {},
      product: isBlindFlow && tempSelectedProduct ? tempSelectedProduct : undefined,
      selectedVariant: inheritedVariant
    };

    setItems([...items, newItem]);
    resetForm();
    setIsAddItemModalOpen(false);

    // Check if selected fabric has variants - show picker based on dimensions
    // SKIP for Blind flow (variant already selected upfront or inherited)
    if (selectedFabric?.id && !isBlindFlow) {
      try {
        const variantsRes = await productVariantsApi.getByProduct(selectedFabric.id);
        let variants = variantsRes.data || [];

        if (variants.length > 0) {
          // Apply gorden-smokering filter for fabric if calculator type is smokering-related
          const isSmokering = currentType?.slug?.toLowerCase().includes('smokering') ||
            currentType?.slug?.toLowerCase().includes('kupu');

          if (isSmokering) {
            const dimensions = { width: itemWidth, height: itemHeight };
            variants = filterVariantsByRule(variants, dimensions, 'gorden-smokering');
          }

          // If no matching variants after filter, show all variants
          const variantsToShow = variants.length > 0 ? variants : (variantsRes.data || []);

          setEditingVariantItemId(newItem.id);
          setPendingProductForVariant(selectedFabric);
          setAvailableVariants(variantsToShow);
          setVariantSelectionMode('fabric');
          setIsVariantModalOpen(true);
        }
      } catch (error) {
        console.error('Error checking variants:', error);
      }
    }
  };

  // Remove item
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Edit item
  const handleEditItem = (item: CalculatorItem) => {
    setEditingItemId(item.id);
    setItemName(item.name || '');
    setItemType(item.itemType);
    setPackageType(item.packageType);
    setWidth(item.width.toString());
    setHeight(item.height.toString());
    setPanels(item.panels.toString());
    setQuantity(item.quantity.toString());
    setIsAddItemModalOpen(true);
  };

  // Open component modal
  const openComponentModal = (itemId: string, componentId: number) => {
    setEditingItemId(itemId);
    setEditingComponentId(componentId);
    setIsComponentModalOpen(true);
  };

  // Add Item to existing Group (Blind Flow)
  const handleAddSizeToGroup = (groupId: string, product: ProductOption) => {
    setTargetGroupId(groupId);
    setTempSelectedProduct(product);
    setItemName(''); // Reset name for new size
    setIsAddItemModalOpen(true);
  };

  // Remove entire group
  const handleRemoveGroup = (groupId: string) => {
    if (confirm('Hapus seluruh grup item ini?')) {
      setItems(items.filter(i => i.groupId !== groupId));
    }
  };

  // Select fabric product - no variant check here, variants picked after adding item (except for Blind flow)
  const handleSelectFabric = async (product: any) => {
    if (isBlindFlow) {
      // Blind Flow: Check if product has variants
      setLoadingVariants(true);
      try {
        const variantsRes = await productVariantsApi.getByProduct(product.id);
        const variants = variantsRes.data || [];

        if (variants.length > 0) {
          // Has variants: Open variant selection modal
          setPendingProductForVariant(product);
          setAvailableVariants(variants);
          setVariantSelectionMode('fabric'); // Global variant selection
          setIsProductModalOpen(false);
          setIsVariantModalOpen(true);
          return;
        }
      } catch (error) {
        console.error('Error fetching variants for blind:', error);
      } finally {
        setLoadingVariants(false);
      }

      // No variants: Just select product and open Add Item Modal
      setTempSelectedProduct(product);
      setIsProductModalOpen(false);
      setIsAddItemModalOpen(true);
      // Do NOT pre-fill name - user requested it stays empty
    } else {
      // Curtain Flow: Global selection
      setSelectedFabric(product);
      setIsProductModalOpen(false);
    }
    setSearchQuery('');
  };

  // Select component product - now checks for variants first
  const handleSelectComponent = async (product: ProductOption) => {
    if (!editingItemId || editingComponentId === null) return;

    // Check if product has variants
    setLoadingVariants(true);
    try {
      const variantsRes = await productVariantsApi.getByProduct(product.id);
      let variants = variantsRes.data || [];

      if (variants.length > 0) {
        // Get the component config to check for filter rule
        const componentConfig = currentType?.components?.find(c => c.id === editingComponentId);
        const filterRule = (componentConfig?.variant_filter_rule || 'none') as VariantFilterRule;

        // Get the item being edited for dimensions
        const editingItem = items.find(item => item.id === editingItemId);

        // Apply filter based on rule and item dimensions
        if (filterRule !== 'none' && editingItem) {
          const dimensions = { width: editingItem.width, height: editingItem.height };
          variants = filterVariantsByRule(variants, dimensions, filterRule);
        }

        // Product has variants - show variant picker
        setPendingProductForVariant(product);
        setAvailableVariants(variants);
        setVariantSelectionMode('component');
        setIsComponentModalOpen(false);
        setIsVariantModalOpen(true);
        return;
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoadingVariants(false);
    }

    // No variants - proceed with normal selection
    const sibakValue = product.sibak || 0;
    const defaultQty = sibakValue > 0 ? sibakValue : 1;

    setItems(items.map(item => {
      if (item.id === editingItemId) {
        const existingSelection = item.components[editingComponentId];
        return {
          ...item,
          components: {
            ...item.components,
            [editingComponentId]: {
              product,
              qty: existingSelection?.qty && existingSelection.product.id === product.id
                ? existingSelection.qty
                : defaultQty
            }
          }
        };
      }
      return item;
    }));

    setIsComponentModalOpen(false);
  };

  // Select variant for component or fabric (per-item)
  const handleSelectVariant = (variant: any) => {
    if (!pendingProductForVariant) return;

    // Parse JSON attributes for variant name
    const attrs = safeJSONParse(variant.attributes, {}) as Record<string, any>;
    const attrDisplay = Object.entries(attrs).length > 0
      ? Object.entries(attrs).map(([k, v]) => `${k}: ${v}`).join(', ')
      : (variant.attribute_value || variant.name || `Varian ${variant.id}`);

    // Use Net price as primary (discounted), Gross as fallback
    const variantPrice = Number(variant.price_net) || Number(variant.price_gross) || 0;

    if (variantSelectionMode === 'fabric') {
      const variantData = {
        id: variant.id,
        attributes: attrs,
        price: variantPrice,
        price_gross: Number(variant.price_gross) || 0,
        price_net: Number(variant.price_net) || 0,
        name: `${pendingProductForVariant.name} (${attrDisplay})`,
        originalName: pendingProductForVariant.name,
        selectedVariantName: attrDisplay,
      };

      // If Blind Flow and no editing item ID, this is the initial product selection
      if (isBlindFlow && !editingVariantItemId) {
        setTempSelectedProduct({
          ...pendingProductForVariant,
          ...variantData
        });
        // Do NOT auto-fill itemName - user requested it stays empty
        setIsVariantModalOpen(false);
        setIsAddItemModalOpen(true);
        setPendingProductForVariant(null);
        return;
      }

      // Store variant in the specific item
      if (!editingVariantItemId) return;

      setItems(items.map(item => {
        if (item.id === editingVariantItemId) {
          const newMultiplier = Number(variant.quantity_multiplier) || 1;
          const updatedComponents = { ...item.components };

          // Sync components that should multiply with variant
          if (currentType && currentType.components && newMultiplier > 1) {
            currentType.components.forEach(comp => {
              if (comp.multiply_with_variant && updatedComponents[comp.id]) {
                updatedComponents[comp.id] = {
                  ...updatedComponents[comp.id],
                  qty: newMultiplier
                };
              }
            });
          }

          const variantDataWithMultiplier = {
            ...variantData,
            quantity_multiplier: newMultiplier
          };

          return {
            ...item,
            selectedVariant: variantDataWithMultiplier,
            components: updatedComponents
          };
        }
        return item;
      }));

      setEditingVariantItemId(null);
    } else {
      // Setting component product
      if (!editingItemId || editingComponentId === null) return;

      const productWithVariant = {
        ...pendingProductForVariant,
        price: variantPrice, // Net price for calculations
        price_gross: Number(variant.price_gross) || variantPrice,
        price_net: Number(variant.price_net) || variantPrice,
        quantity_multiplier: Number(variant.quantity_multiplier) || 1,
        name: `${pendingProductForVariant.name} (${attrDisplay})`,
        variantAttributes: variant.attributes,
      };

      setItems(items.map(item => {
        if (item.id === editingItemId) {
          // Check if this component should multiply with variant
          const componentConfig = currentType?.components?.find(c => c.id === editingComponentId);
          const shouldMultiply = componentConfig?.multiply_with_variant === true;
          const variantMultiplier = item.selectedVariant?.quantity_multiplier || 1;
          const initialQty = shouldMultiply ? variantMultiplier : 1;

          return {
            ...item,
            components: {
              ...item.components,
              [editingComponentId]: {
                product: productWithVariant as ProductOption,
                qty: initialQty
              }
            }
          };
        }
        return item;
      }));
    }

    // Auto-update quantity from multiplier if present
    if (variant.quantity_multiplier && variant.quantity_multiplier > 1) {
      setQuantity(variant.quantity_multiplier.toString());
    }

    setIsVariantModalOpen(false);
    setPendingProductForVariant(null);
    setAvailableVariants([]);
  };

  // Calculate component price - simplified (per_meter/per_unit deprecated)
  const calculateComponentPrice = (item: CalculatorItem, comp: ComponentFromDB, selection: ComponentSelection) => {
    // Calculate: base price × quantity
    let totalPrice = selection.product.price * selection.qty;

    // If price_follows_item_qty is enabled, multiply by item quantity (jendela count)
    if (comp.price_follows_item_qty) {
      totalPrice *= item.quantity;
    }

    return totalPrice;
  };

  // Calculate item price
  const calculateItemPrice = (item: CalculatorItem) => {
    // Determine the product to use (Item specific OR Global selected)
    const productToUse = item.product || selectedFabric;

    if (!productToUse || !currentType) return { fabric: 0, fabricMeters: 0, components: 0, total: 0 };

    const widthM = item.width / 100;
    const heightM = item.height / 100;

    // Use item's variant price if available, otherwise use base product price
    const fabricPricePerMeter = item.selectedVariant?.price ?? productToUse.price;
    const fabricName = item.selectedVariant?.name ?? productToUse.name;

    // Fabric calculation
    let fabricPrice = 0;
    let fabricMeters = 0;
    const variantMultiplier = item.selectedVariant?.quantity_multiplier || 1;

    // Check if this is Blind flow (simpler pricing)
    const isBlindType = currentType.slug?.toLowerCase().includes('blind') || currentType.has_item_type === false;

    // Check if variant has Sibak attribute (should use multiplier pricing, not area)
    const hasSibakAttribute = item.selectedVariant?.attributes && (() => {
      const attrs = safeJSONParse(item.selectedVariant?.attributes, {});
      return Object.keys(attrs).some(k => k.toLowerCase() === 'sibak');
    })();

    if (isBlindType) {
      // BLIND FLOW: Price × Volume × Qty (volume = width × height in meters)
      const volumeM2 = widthM * heightM;
      fabricPrice = fabricPricePerMeter * volumeM2 * item.quantity;
      fabricMeters = 0;
    } else if (hasSibakAttribute || variantMultiplier > 1) {
      // GORDEN FLOW with Multiplier: Price × Multiplier × Qty Jendela
      // (Sibak 1 = multiplier 1, still uses this formula instead of area)
      fabricPrice = fabricPricePerMeter * variantMultiplier * item.quantity;
      fabricMeters = 0; // Not calculated by area when using multiplier
    } else {
      // GORDEN FLOW standard: Area Calculation (for products without Sibak variant)
      fabricMeters = widthM * currentType.fabric_multiplier * heightM;
      fabricPrice = fabricMeters * fabricPricePerMeter;
    }

    // Components calculation
    let componentsPrice = 0;
    if (item.packageType === 'gorden-lengkap' && currentType.components) {
      currentType.components.forEach(comp => {
        const selection = item.components[comp.id];
        if (selection) {
          componentsPrice += calculateComponentPrice(item, comp, selection);
        }
      });
    }

    return {
      fabric: fabricPrice,
      fabricMeters,
      fabricPricePerMeter,
      fabricName,
      components: componentsPrice,
      total: fabricPrice + componentsPrice
    };
  };

  // Calculate grand total
  const grandTotal = items.reduce((sum, item) => sum + calculateItemPrice(item).total, 0);

  // Send to WhatsApp
  const handleSendWhatsApp = async () => {
    if (!customerInfo || !selectedFabric || !currentType) return;

    chatAdminFromCalculator({
      customerInfo,
      currentType,
      selectedFabric,
      items,
      grandTotal,
      baseUrl: window.location.origin,
      calculateItemPrice,
      calculateComponentPrice
    });


    // Save lead with complete calculation data
    if (customerInfo && currentType) {
      try {
        // Build detailed calculation data for admin view
        const calculationData = {
          calculatorType: {
            id: currentType.id,
            name: currentType.name,
            slug: currentType.slug
          },
          fabric: selectedFabric ? {
            id: selectedFabric.id,
            name: selectedFabric.name,
            price: selectedFabric.price,
            image: selectedFabric.image,
            images: selectedFabric.images
          } : null,
          items: items.map(item => {
            const prices = calculateItemPrice(item);
            return {
              id: item.id,
              groupId: item.groupId,           // Preserve group for blind multi-product flow
              name: item.name,                 // Preserve custom item name
              itemType: item.itemType,
              packageType: item.packageType,
              // Include product info for blind flow (per-item products)
              product: item.product ? {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
                image: item.product.image,
                images: item.product.images // Include images array
              } : null,
              dimensions: {
                width: item.width,
                height: item.height,
                panels: item.panels
              },
              quantity: item.quantity,
              // Include variant info per item (new JSON attributes format)
              selectedVariant: item.selectedVariant ? {
                id: item.selectedVariant.id,
                name: item.selectedVariant.name,
                attributes: item.selectedVariant.attributes,
                price: item.selectedVariant.price,
                price_gross: item.selectedVariant.price_gross,
                price_net: item.selectedVariant.price_net,
                quantity_multiplier: item.selectedVariant.quantity_multiplier,
                image: item.selectedVariant.image,
                images: item.selectedVariant.images
              } : null,
              fabricName: (prices as any).fabricName || selectedFabric?.name,
              fabricPricePerMeter: (prices as any).fabricPricePerMeter || selectedFabric?.price,
              fabricMeters: (prices as any).fabricMeters || 0,
              fabricPrice: prices.fabric,
              components: Object.entries(item.components).map(([compId, selection]) => {
                const comp = currentType.components?.find((c: any) => c.id === parseInt(compId));
                return {
                  componentId: compId,
                  label: comp?.label || 'Unknown',
                  productId: selection.product.id,
                  productName: selection.product.name,
                  productImage: selection.product.image,
                  productImages: selection.product.images, // Include images for component products
                  productPrice: selection.product.price,
                  productPriceGross: (selection.product as any).price_gross || selection.product.price,
                  productPriceNet: (selection.product as any).price_net || selection.product.price,
                  qty: selection.qty,
                  discount: selection.discount || 0,
                  priceCalculation: comp?.price_calculation || 'per_unit',
                  // Calculate component total with discount
                  componentTotal: (() => {
                    const price = (selection.product as any).price_net || selection.product.price;
                    const disc = selection.discount || 0;
                    return price * selection.qty * ((100 - disc) / 100);
                  })()
                };
              }),
              componentsPrice: prices.components,
              subtotal: prices.total
            };
          }),
          grandTotal
        };

        const leadData = {
          name: customerInfo.name,
          phone: customerInfo.phone,
          calculator_type: currentType.name,
          estimated_price: grandTotal,
          calculation_data: calculationData
        };

        console.log('📤 Submitting lead data:', JSON.stringify(leadData, null, 2));

        await calculatorLeadsApi.submit(leadData);
        console.log('✅ Lead saved successfully');
      } catch (error) {
        console.error('Error saving lead:', error);
      }
    }
  };

  // Filtered fabric products
  const filteredProducts = fabricProducts.filter(p => {
    // Search filter
    if (!p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // Category filter based on calculator type
    if (currentType?.category?.slug) {
      // Handle potential case variance (category vs Category)
      const productCategory = p.category?.slug || p.Category?.slug || '';
      return productCategory === currentType.category.slug;
    }

    return true;
  });

  // Loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-pink-50 via-white to-pink-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#EB216A] mb-4"></div>
          <p className="text-lg text-gray-900 mb-2">Memuat Kalkulator...</p>
          <p className="text-sm text-gray-600">Mengambil data komponen dan harga terbaru</p>
        </div>
      </div>
    );
  }

  // Dialog blocking
  if (isCustomerDialogOpen || !customerInfo) {
    return (
      <div className="bg-gradient-to-br from-pink-50 via-white to-pink-50 min-h-screen">
        <CustomerInfoDialog
          isOpen={isCustomerDialogOpen}
          onSubmit={handleCustomerInfoSubmit}
        />
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-pink-50 pt-32 pb-16 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#EB216A]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#EB216A]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">


          <h1 className="text-2xl sm:text-3xl lg:text-4xl text-gray-900 mb-4 font-bold">
            Kalkulator Biaya Gorden
          </h1>

          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Hitung kebutuhan dan estimasi biaya secara otomatis dengan komponen yang dapat disesuaikan.
          </p>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl text-gray-900 mb-2 font-semibold">Cara Menggunakan Kalkulator</h2>
            <p className="text-sm text-gray-600">Ikuti 4 langkah mudah untuk menghitung biaya gorden Anda</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-105 transition-transform">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm text-gray-900 mb-1 font-medium">Pilih Jenis</h3>
              <p className="text-xs text-gray-600">Smokering, Kupu-kupu, atau Blind</p>
            </div>

            <div className="text-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm text-gray-900 mb-1 font-medium">Pilih Kain</h3>
              <p className="text-xs text-gray-600">Pilih dari berbagai pilihan kain</p>
            </div>

            <div className="text-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-105 transition-transform">
                <Ruler className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm text-gray-900 mb-1 font-medium">Input Ukuran</h3>
              <p className="text-xs text-gray-600">Masukkan lebar dan tinggi</p>
            </div>

            <div className="text-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-xl flex items-center justify-center mx-auto mb-2 shadow-md group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm text-gray-900 mb-1 font-medium">Pilih Komponen</h3>
              <p className="text-xs text-gray-600">Tambahkan rel, hook, tassel, dll</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Calculator Section */}
      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Step 1: Calculator Type */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#EB216A] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-base text-white font-bold">1</span>
              </div>
              <h2 className="text-lg sm:text-xl text-gray-900 font-semibold">Pilih Jenis Kalkulator</h2>
            </div>

            <div className="w-full overflow-x-auto">
              <div className="inline-flex bg-white rounded-xl p-1 gap-1 border border-gray-200 shadow-sm min-w-full sm:min-w-0">
                {calculatorTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeChange(type.slug)}
                    className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-all duration-300 text-xs sm:text-sm whitespace-nowrap font-medium ${selectedTypeSlug === type.slug
                      ? 'bg-[#EB216A] text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                  >
                    <span className="hidden sm:inline">Kalkulator {type.name}</span>
                    <span className="sm:hidden">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: Fabric Selection (Only for Curtain Types) */}
          {!isBlindFlow && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-[#EB216A] rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-base text-white font-bold">2</span>
                </div>
                <h2 className="text-lg sm:text-xl text-gray-900 font-semibold">Pilih Produk Gorden</h2>
              </div>

              {selectedFabric ? (
                <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-[#EB216A] shadow-md">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={getProductImageUrl(selectedFabric.images || selectedFabric.image)}
                          alt={selectedFabric.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge className="bg-[#EB216A]/10 text-[#EB216A] border-0 mb-1 text-xs">
                          {selectedFabric.category || 'Kain Gorden'}
                        </Badge>
                        <h3 className="text-base sm:text-lg text-gray-900 font-medium truncate">{selectedFabric.name}</h3>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-[#EB216A] font-bold text-sm sm:text-base">
                            {selectedFabric.minPrice && selectedFabric.minPrice > 0
                              ? `Mulai Rp ${selectedFabric.minPrice.toLocaleString('id-ID')}`
                              : selectedFabric.price > 0
                                ? `Rp ${selectedFabric.price.toLocaleString('id-ID')}/m`
                                : 'Harga ditentukan oleh varian'}
                          </span>
                        </div>
                        {(selectedFabric.variantMinWidth || selectedFabric.variantMaxWidth) && (
                          <p className="text-xs text-gray-500 mt-1">
                            Lebar Mulai {selectedFabric.variantMinWidth ?? 0} s/d {selectedFabric.variantMaxWidth ?? '...'}
                          </p>
                        )}
                        {(selectedFabric.variantMinHeight || selectedFabric.variantMaxHeight) && (
                          <p className="text-xs text-gray-500">
                            Tinggi Mulai {selectedFabric.variantMinHeight ?? 0} s/d {selectedFabric.variantMaxHeight ?? '...'}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => setIsProductModalOpen(true)}
                      variant="outline"
                      className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white w-full sm:w-auto"
                    >
                      <Pencil className="w-4 h-4 mr-2" /> Ganti Produk
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setIsProductModalOpen(true)}
                  className="bg-[#EB216A] hover:bg-[#d11d5e] text-white hover:text-white px-5 py-4 rounded-lg text-sm"
                >
                  <Package className="w-4 h-4 mr-2" /> Pilih Produk Gorden
                </Button>
              )}
            </div>
          )}

          {/* Step 3: Add Items */}
          <div className="mb-10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#EB216A] rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-base text-white font-bold">{isBlindFlow ? '2' : '3'}</span>
                </div>
                <h2 className="text-lg sm:text-xl text-gray-900 font-semibold">Daftar Item ({items.length})</h2>
              </div>
              <Button
                onClick={() => {
                  if (isBlindFlow) {
                    setIsProductModalOpen(true); // Open Product Picker for Blinds
                  } else {
                    setIsAddItemModalOpen(true); // Open Dimensions for Curtain
                  }
                }}
                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white hover:text-white"
              >
                <Plus className="w-4 h-4 mr-2" /> {isBlindFlow ? 'Tambah Produk' : 'Tambah Item'}
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calculator className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl text-gray-900 font-medium mb-2">Belum Ada Item</h3>
                <p className="text-gray-500 mb-6">Tambahkan item untuk mulai menghitung estimasi biaya</p>
                <Button
                  onClick={() => {
                    if (isBlindFlow) {
                      setIsProductModalOpen(true);
                    } else {
                      setIsAddItemModalOpen(true);
                    }
                  }}
                  className="bg-[#EB216A] hover:bg-[#d11d5e] text-white hover:text-white px-8"
                >
                  <Plus className="w-4 h-4 mr-2" /> {isBlindFlow ? 'Pilih Produk Pertama' : 'Tambah Item Pertama'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group Logic Rendering */}
                {(() => {
                  // Group Items
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

                  // Render Grouped Items (Blind Flow Style)
                  return (
                    <>
                      {Object.entries(groupedItems).map(([groupId, groupItems]) => {
                        const firstItem = groupItems[0];
                        const product = firstItem.product;
                        if (!product) return null; // Should not happen in Blind flow

                        // Calculate Group Total
                        const groupTotal = groupItems.reduce((sum, item) => sum + calculateItemPrice(item).total, 0);

                        return (
                          <div key={groupId} className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden mb-6">
                            {/* Group Header: Product Info */}
                            <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-start">
                              <div className="flex items-center gap-3 lg:gap-4">
                                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white rounded-lg border border-gray-200 p-1 shrink-0">
                                  <img src={getProductImageUrl(product.images || product.image)} className="w-full h-full object-cover rounded" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-gray-900 text-sm lg:text-lg truncate">{product.originalName || product.name}</h3>
                                  <p className="text-[#EB216A] font-medium text-sm lg:text-base">Rp {product.price?.toLocaleString('id-ID')}/m²</p>
                                  {firstItem.selectedVariant && (
                                    <p className="text-xs text-gray-500 truncate">
                                      Varian: {Object.entries(firstItem.selectedVariant.attributes || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}
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

                            {/* MOBILE VIEW: Card List */}
                            <div className="lg:hidden space-y-4 mb-4">
                              {groupItems.map((item) => {
                                const prices = calculateItemPrice(item);
                                const vol = (item.width * item.height) / 10000;

                                return (
                                  <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 relative">
                                    <button
                                      onClick={() => handleRemoveItem(item.id)}
                                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-1"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>

                                    <div className="pr-8">
                                      <h4 className="font-medium text-gray-900 mb-3 text-sm">{item.name || '-'}</h4>

                                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mb-3">
                                        <div>
                                          <span className="text-gray-500 text-xs block mb-0.5">Ukuran</span>
                                          <span className="font-medium text-gray-900">{item.width} x {item.height} cm</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 text-xs block mb-0.5">Volume</span>
                                          <span className="font-medium text-gray-900">{vol.toFixed(2)} m²</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 text-xs block mb-0.5">Harga</span>
                                          <span className="font-medium text-gray-900">Rp {((prices as any).fabricPricePerMeter || 0).toLocaleString('id-ID')}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500 text-xs block mb-0.5">Qty</span>
                                          <span className="font-medium text-gray-900">{item.quantity}</span>
                                        </div>
                                      </div>

                                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-gray-600 font-medium text-sm">Total</span>
                                        <span className="text-lg font-bold text-[#EB216A]">Rp {prices.total.toLocaleString('id-ID')}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                              <div className="flex justify-between items-center py-6 mt-4 px-4 bg-gray-50/80 rounded-xl border border-gray-100 border-dashed">
                                <span className="font-bold text-gray-900 text-lg">Subtotal Group</span>
                                <span className="font-bold text-[#EB216A] text-xl">Rp {groupTotal.toLocaleString('id-ID')}</span>
                              </div>
                            </div>

                            {/* DESKTOP VIEW: Table */}
                            <div className="hidden lg:block overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                                  <tr>
                                    <th className="py-3 px-4 text-left">Nama</th>
                                    <th className="py-3 px-4 text-center">L (cm)</th>
                                    <th className="py-3 px-4 text-center">T (cm)</th>
                                    <th className="py-3 px-4 text-center">Vol (m²)</th>
                                    <th className="py-3 px-4 text-right">Harga</th>
                                    <th className="py-3 px-4 text-center">Qty</th>
                                    <th className="py-3 px-4 text-right">Total</th>
                                    <th className="py-3 px-4 text-center">Aksi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {groupItems.map((item) => {
                                    const prices = calculateItemPrice(item);
                                    const vol = (item.width * item.height) / 10000;

                                    return (
                                      <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-4 font-medium text-gray-900">{item.name || '-'}</td>
                                        <td className="py-3 px-4 text-center">{item.width}</td>
                                        <td className="py-3 px-4 text-center">{item.height}</td>
                                        <td className="py-3 px-4 text-center">{vol.toFixed(2)}</td>
                                        <td className="py-3 px-4 text-right text-gray-500">
                                          Rp {((prices as any).fabricPricePerMeter || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3 px-4 text-center">{item.quantity}</td>
                                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                                          Rp {prices.total.toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                          <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-gray-400 hover:text-red-500"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot className="bg-gray-50 font-semibold text-gray-900 border-t border-gray-100">
                                  <tr>
                                    <td colSpan={6} className="py-3 px-4 text-right">Subtotal Group</td>
                                    <td className="py-3 px-4 text-right text-[#EB216A]">
                                      Rp {groupTotal.toLocaleString('id-ID')}
                                    </td>
                                    <td></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>

                            {/* Group Footer Action */}
                            <div className="p-3 border-t border-gray-100 bg-white">
                              <Button
                                variant="outline"
                                onClick={() => handleAddSizeToGroup(groupId, product)}
                                className="w-full border-dashed border-gray-300 hover:border-[#EB216A] hover:text-[#EB216A]"
                              >
                                <Plus className="w-4 h-4 mr-2" /> Tambah Ukuran (Produk Sama)
                              </Button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Ungrouped Items (Curtain Flow / Internal Legacy) */}
                      {ungroupedItems.map((item, idx) => {
                        const prices = calculateItemPrice(item);
                        return (
                          <div key={item.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Item Header */}
                            <div className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-6 border-b border-gray-100">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-[#EB216A]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg font-bold text-[#EB216A]">{item.quantity}</span>
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {isBlindFlow ? (item.name || `Jendela ${idx + 1}`) : (item.itemType === 'jendela' ? 'Jendela' : 'Pintu')}
                                      {!isBlindFlow && (item.packageType === 'gorden-lengkap' ? ' - Paket Lengkap' : ' - Gorden Saja')}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      {item.width} cm × {item.height} cm • Jumlah: {item.quantity}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex">
                                  <button
                                    onClick={() => handleEditItem(item)}
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
                            </div>

                            {/* Item Details */}
                            <div className="px-2 py-4 sm:p-6 space-y-3">
                              {/* Dynamic Components - Table Layout */}
                              {/* Dynamic Components - Table Layout */}
                              {(item.packageType === 'gorden-lengkap' || item.packageType === 'gorden-saja') && (
                                <>
                                  {/* DESKTOP VIEW: Table - only show on large screens */}
                                  <div className="hidden lg:block border rounded-lg overflow-hidden bg-white">
                                    <table className="w-full text-sm">
                                      <tbody className="divide-y divide-gray-100">
                                        {/* Main Fabric Row */}
                                        <tr className="hover:bg-gray-50">
                                          <td className="px-3 py-2.5 w-24">
                                            <button
                                              className="h-7 px-2 text-xs w-full rounded transition-all border"
                                              style={{
                                                borderColor: '#EB216A',
                                                color: '#EB216A',
                                                backgroundColor: 'transparent'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#EB216A';
                                                e.currentTarget.style.color = 'white';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.color = '#EB216A';
                                              }}
                                              onClick={async () => {
                                                if (!selectedFabric || isBlindFlow) return;
                                                try {
                                                  const variantsRes = await productVariantsApi.getByProduct(selectedFabric.id);
                                                  const variants = variantsRes.data || [];
                                                  if (variants.length > 0) {
                                                    setEditingVariantItemId(item.id);
                                                    setPendingProductForVariant(selectedFabric);
                                                    setAvailableVariants(variants);
                                                    setVariantSelectionMode('fabric');
                                                    setIsVariantModalOpen(true);
                                                  }
                                                } catch (error) {
                                                  console.error('Error loading variants:', error);
                                                }
                                              }}
                                            >
                                              {item.selectedVariant ? 'Ganti' : 'Pilih'}
                                            </button>
                                          </td>
                                          <td className="px-3 py-2.5 font-medium text-gray-700">
                                            {isBlindFlow ? 'Produk' : 'Gorden'}
                                          </td>
                                          <td className="px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                              <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                                <img
                                                  src={getProductImageUrl(
                                                    isBlindFlow && item.product
                                                      ? (item.product.images || item.product.image)
                                                      : (selectedFabric?.images || selectedFabric?.image)
                                                  )}
                                                  className="w-full h-full object-cover"
                                                  alt=""
                                                />
                                              </div>
                                              <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium text-gray-900 line-clamp-2">
                                                  {(prices as any).fabricName || item.product?.name || selectedFabric?.name || '-'}
                                                </span>
                                                {(() => {
                                                  if (item.selectedVariant && item.selectedVariant.attributes) {
                                                    const attrs = safeJSONParse(item.selectedVariant.attributes, {});
                                                    const entries = Object.entries(attrs);
                                                    if (entries.length > 0) {
                                                      return (
                                                        <span className="text-xs text-gray-500 truncate">
                                                          {entries.map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                        </span>
                                                      );
                                                    }
                                                  }
                                                  return null;
                                                })()}
                                              </div>
                                            </div>
                                          </td>
                                          <td className="px-3 py-2.5 text-right text-gray-600">
                                            Rp{((prices as any).fabricPricePerMeter || 0).toLocaleString('id-ID')}
                                          </td>
                                          <td className="px-3 py-2.5 text-center w-20">
                                            <span className="inline-flex items-center justify-center w-14 h-7 bg-gray-100 rounded text-sm text-gray-600">
                                              {(item.selectedVariant?.quantity_multiplier || 1) * item.quantity}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                                            Rp{prices.fabric.toLocaleString('id-ID')}
                                          </td>
                                        </tr>

                                        {/* Component Rows */}
                                        {currentType?.components
                                          ?.filter(comp => {
                                            if (item.packageType === 'gorden-saja') return false; // Hide components for Gorden Saja
                                            if (comp.hide_on_door && item.itemType === 'pintu') {
                                              return false;
                                            }
                                            return true;
                                          })
                                          .map(comp => {
                                            const selection = item.components[comp.id];
                                            const products = componentProducts[comp.subcategory_id] || [];
                                            const compPrice = selection ? calculateComponentPrice(item, comp, selection) : 0;

                                            return (
                                              <tr key={comp.id} className={`hover:bg-gray-50 ${!selection ? 'opacity-60' : ''}`}>
                                                <td className="px-3 py-2.5 w-24">
                                                  <button
                                                    className="h-7 px-2 text-xs w-full rounded transition-all border"
                                                    style={{
                                                      borderColor: selection ? '#d1d5db' : '#EB216A',
                                                      color: selection ? '#4b5563' : '#EB216A',
                                                      backgroundColor: selection ? 'transparent' : 'rgba(235, 33, 106, 0.1)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                      if (!selection) {
                                                        e.currentTarget.style.backgroundColor = '#EB216A';
                                                        e.currentTarget.style.color = 'white';
                                                      } else {
                                                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                                                      }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                      if (!selection) {
                                                        e.currentTarget.style.backgroundColor = 'rgba(235, 33, 106, 0.1)';
                                                        e.currentTarget.style.color = '#EB216A';
                                                      } else {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                      }
                                                    }}
                                                    onClick={() => openComponentModal(item.id, comp.id)}
                                                    disabled={products.length === 0}
                                                  >
                                                    {selection ? 'Ganti' : 'Pilih'}
                                                  </button>
                                                </td>
                                                <td className="px-3 py-2.5 font-medium text-gray-700">
                                                  {comp.label}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                                      <img
                                                        src={getProductImageUrl(selection?.product?.images || selection?.product?.image)}
                                                        className="w-full h-full object-cover"
                                                        alt={selection?.product?.name || ''}
                                                      />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                      <span className="text-sm font-medium text-gray-900 line-clamp-2">
                                                        {selection?.product?.name || '-'}
                                                      </span>
                                                      {(() => {
                                                        const attrs = selection?.product?.variantAttributes
                                                          ? safeJSONParse(selection.product.variantAttributes, {})
                                                          : {};
                                                        const entries = Object.entries(attrs);
                                                        if (entries.length > 0) {
                                                          return (
                                                            <span className="text-xs text-gray-500 truncate">
                                                              {entries.map(([k, v]) => `${k}: ${v}`).join(', ')}
                                                            </span>
                                                          );
                                                        }
                                                        return null;
                                                      })()}
                                                    </div>
                                                  </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-right text-gray-600">
                                                  {selection ? `Rp${selection.product.price.toLocaleString('id-ID')}` : 'Rp.0'}
                                                </td>
                                                <td className="px-3 py-2.5 text-center w-20">
                                                  {selection ? (
                                                    comp.price_follows_item_qty ? (
                                                      <span className="inline-flex items-center justify-center w-14 h-7 bg-gray-100 rounded text-sm text-gray-600">
                                                        {selection.qty * item.quantity}
                                                      </span>
                                                    ) : (
                                                      <input
                                                        type="number"
                                                        min="0"
                                                        value={selection.qty}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => {
                                                          const newQty = Math.max(0, parseInt(e.target.value) || 0);
                                                          setItems(items.map(i => {
                                                            if (i.id === item.id) {
                                                              return {
                                                                ...i,
                                                                components: {
                                                                  ...i.components,
                                                                  [comp.id]: { ...selection, qty: newQty }
                                                                }
                                                              };
                                                            }
                                                            return i;
                                                          }));
                                                        }}
                                                        className="w-14 h-7 px-1 border border-gray-300 rounded text-center text-sm focus:ring-1 focus:ring-[#EB216A] focus:border-[#EB216A] outline-none"
                                                      />
                                                    )
                                                  ) : (
                                                    <span className="text-gray-400">0</span>
                                                  )}
                                                </td>
                                                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                                                  Rp{compPrice.toLocaleString('id-ID')}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* MOBILE VIEW: Cards - only show on small screens */}
                                  <div className="lg:hidden space-y-4">
                                    {/* FABRIC CARD */}
                                    <div className="border-t border-gray-200 pt-3">
                                      {/* Header */}
                                      <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-sm text-gray-700">{isBlindFlow ? 'Produk' : 'Gorden'}</span>
                                        </div>
                                        <button
                                          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                                          onClick={async () => {
                                            if (!selectedFabric || isBlindFlow) return;
                                            try {
                                              const variantsRes = await productVariantsApi.getByProduct(selectedFabric.id);
                                              const variants = variantsRes.data || [];
                                              if (variants.length > 0) {
                                                setEditingVariantItemId(item.id);
                                                setPendingProductForVariant(selectedFabric);
                                                setAvailableVariants(variants);
                                                setVariantSelectionMode('fabric');
                                                setIsVariantModalOpen(true);
                                              }
                                            } catch (error) {
                                              console.error('Error loading variants:', error);
                                            }
                                          }}
                                          title={item.selectedVariant ? 'Ganti Varian' : 'Pilih Varian'}
                                        >
                                          <Pencil className="w-4 h-4 text-gray-500" />
                                        </button>
                                      </div>

                                      {/* Body */}
                                      <div className="p-3">
                                        <div className="flex gap-3">
                                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            <img
                                              src={getProductImageUrl(
                                                isBlindFlow && item.product
                                                  ? (item.product.images || item.product.image)
                                                  : (selectedFabric?.images || selectedFabric?.image)
                                              )}
                                              className="w-full h-full object-cover"
                                              alt="Fabric"
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                              {(prices as any).fabricName || item.product?.name || selectedFabric?.name || '-'}
                                            </h4>
                                            <div className="text-xs text-gray-500 mt-1 truncate">
                                              {(() => {
                                                if (item.selectedVariant && item.selectedVariant.attributes) {
                                                  const attrs = safeJSONParse(item.selectedVariant.attributes, {});
                                                  const entries = Object.entries(attrs);
                                                  return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
                                                }
                                                return null;
                                              })()}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-3 grid grid-cols-3 gap-2 items-center text-sm border-t border-gray-100 pt-3">
                                          <div>
                                            <span className="text-xs text-gray-500 block">Harga</span>
                                            <span className="font-medium">Rp{((prices as any).fabricPricePerMeter || 0).toLocaleString('id-ID')}</span>
                                          </div>
                                          <div className="flex justify-center">
                                            <span className="inline-flex items-center justify-center w-12 h-8 bg-gray-100 rounded text-gray-600 font-medium">
                                              {(item.selectedVariant?.quantity_multiplier || 1) * item.quantity}
                                            </span>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-xs text-gray-500 block">Total</span>
                                            <span className="font-bold text-[#EB216A]">Rp{prices.fabric.toLocaleString('id-ID')}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* COMPONENT CARDS */}
                                    {currentType?.components
                                      ?.filter(comp => {
                                        if (item.packageType === 'gorden-saja') return false; // Hide components for Gorden Saja
                                        if (comp.hide_on_door && item.itemType === 'pintu') {
                                          return false;
                                        }
                                        return true;
                                      })
                                      .map(comp => {
                                        const selection = item.components[comp.id];
                                        const products = componentProducts[comp.subcategory_id] || [];
                                        const compPrice = selection ? calculateComponentPrice(item, comp, selection) : 0;

                                        return (
                                          <div key={comp.id} className="border-t border-gray-200 pt-3">
                                            {/* Header */}
                                            <div className="flex justify-between items-center mb-2">
                                              <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm text-gray-700">{comp.label}</span>
                                              </div>
                                              <button
                                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
                                                onClick={() => openComponentModal(item.id, comp.id)}
                                                disabled={products.length === 0}
                                                title={selection ? 'Ganti Produk' : 'Pilih Produk'}
                                              >
                                                <Pencil className="w-4 h-4 text-gray-500" />
                                              </button>
                                            </div>

                                            {/* Body */}
                                            <div className="p-3">
                                              {selection ? (
                                                <div className="flex gap-3">
                                                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    <img
                                                      src={getProductImageUrl(selection.product.images || selection.product.image)}
                                                      className="w-full h-full object-cover"
                                                      alt={selection.product.name}
                                                    />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                                      {selection.product.name}
                                                    </h4>
                                                    <div className="text-xs text-gray-500 mt-1 truncate">
                                                      {(() => {
                                                        const attrs = selection.product.variantAttributes
                                                          ? safeJSONParse(selection.product.variantAttributes, {})
                                                          : {};
                                                        const entries = Object.entries(attrs);
                                                        return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
                                                      })()}
                                                    </div>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="text-center py-4 text-gray-400 text-sm italic border-2 border-dashed border-gray-100 rounded-lg">
                                                  {products.length === 0 ? 'Tidak ada produk' : 'Belum memilih produk'}
                                                </div>
                                              )}

                                              {/* Footer */}
                                              <div className="mt-3 grid grid-cols-3 gap-2 items-center text-sm border-t border-gray-100 pt-3">
                                                <div>
                                                  <span className="text-xs text-gray-500 block">Harga</span>
                                                  <span className="font-medium">
                                                    {selection ? `Rp${selection.product.price.toLocaleString('id-ID')}` : '-'}
                                                  </span>
                                                </div>
                                                <div className="flex justify-center">
                                                  {selection && (
                                                    comp.price_follows_item_qty ? (
                                                      <span className="inline-flex items-center justify-center w-12 h-8 bg-gray-100 rounded text-gray-600 font-medium">
                                                        {selection.qty * item.quantity}
                                                      </span>
                                                    ) : (
                                                      <input
                                                        type="number"
                                                        min="0"
                                                        value={selection.qty}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => {
                                                          const newQty = Math.max(0, parseInt(e.target.value) || 0);
                                                          setItems(items.map(i => {
                                                            if (i.id === item.id) {
                                                              return {
                                                                ...i,
                                                                components: {
                                                                  ...i.components,
                                                                  [comp.id]: { ...selection, qty: newQty }
                                                                }
                                                              };
                                                            }
                                                            return i;
                                                          }));
                                                        }}
                                                        className="w-12 h-8 text-center border border-gray-300 rounded focus:ring-1 focus:ring-[#EB216A] text-gray-900"
                                                      />
                                                    )
                                                  )}
                                                </div>
                                                <div className="text-right">
                                                  <span className="text-xs text-gray-500 block">Total</span>
                                                  <span className="font-bold text-[#EB216A]">Rp{compPrice.toLocaleString('id-ID')}</span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      })}
                                  </div>
                                </>
                              )}

                              {/* Subtotal */}
                              <div className="flex justify-between items-center pt-3">
                                <p className="text-gray-600 font-medium">Subtotal</p>
                                <p className="text-xl font-bold text-[#EB216A]">
                                  Rp {prices.total.toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>
                          </div >
                        );
                      })}
                    </>
                  );
                })()}
              </div >
            )} {/* Grand Total & WhatsApp */}
            {items.length > 0 && (
              <div className="space-y-4">
                {/* Grand Total - Compact */}
                <div className="bg-transparent p-4 text-[#EB216A] border-2 border-[#EB216A] rounded-xl shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-800 font-medium text-sm">Total Keseluruhan</p>
                      <p className="text-xs text-gray-500">Untuk {items.length} item ({items.reduce((s, i) => s + i.quantity, 0)} unit)</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                {/* Info Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  <p>Harga di atas adalah estimasi berdasarkan kalkulasi {currentType?.name}. Harga final dapat berbeda tergantung detail pemesanan dan instalasi.</p>
                </div>

                {/* WhatsApp Button */}
                <Button
                  onClick={handleSendWhatsApp}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-6 text-lg rounded-2xl shadow-lg group"
                >
                  <MessageCircle className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                  Kirim ke WhatsApp Admin
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section >

      {/* Add Item Modal */}
      < Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen} >
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className={isBlindFlow ? 'hidden lg:block' : ''}>
              {isBlindFlow ? `Tambah: ${tempSelectedProduct?.name || 'Blind'}` : 'Tambah Item Baru'}
            </DialogTitle>
            <DialogDescription>Masukkan detail ukuran dan kebutuhan</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">

            {/* Show Product Image for Blind Flow */}
            {isBlindFlow && tempSelectedProduct && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl overflow-hidden">
                <img src={getProductImageUrl(tempSelectedProduct.images || tempSelectedProduct.image)} className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm lg:text-base font-medium text-gray-900 break-words">{tempSelectedProduct.name}</p>
                  <p className="text-xs lg:text-sm text-[#EB216A] font-bold">
                    {tempSelectedProduct.minPrice && tempSelectedProduct.minPrice > 0
                      ? `Mulai Rp ${tempSelectedProduct.minPrice.toLocaleString('id-ID')}`
                      : tempSelectedProduct.price > 0
                        ? `Rp ${tempSelectedProduct.price.toLocaleString('id-ID')}/m²`
                        : 'Lihat Varian'}
                  </p>
                  {tempSelectedProduct.selectedVariantName && (
                    <p className="text-xs text-gray-500 mt-0.5 break-words">Varian: {tempSelectedProduct.selectedVariantName}</p>
                  )}
                </div>
              </div>
            )}

            {/* Item Name (Blind Flow) */}
            {isBlindFlow && (
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

            {/* Item Type (Curtain Only) */}
            {!isBlindFlow && currentType?.has_item_type && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Item</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setItemType('jendela')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${itemType === 'jendela'
                      ? 'bg-[#EB216A] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Jendela
                  </button>
                  <button
                    onClick={() => setItemType('pintu')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${itemType === 'pintu'
                      ? 'bg-[#EB216A] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Pintu
                  </button>
                </div>
              </div>
            )}

            {/* Package Type (Curtain Only) */}
            {!isBlindFlow && currentType?.has_package_type && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Paket</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPackageType('gorden-saja')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${packageType === 'gorden-saja'
                      ? 'bg-[#EB216A] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Gorden Saja
                  </button>
                  <button
                    onClick={() => setPackageType('gorden-lengkap')}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${packageType === 'gorden-lengkap'
                      ? 'bg-[#EB216A] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Paket Lengkap
                  </button>
                </div>
              </div>
            )}

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lebar (cm)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EB216A] focus:border-[#EB216A] outline-none"
                  placeholder="200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tinggi (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EB216A] focus:border-[#EB216A] outline-none"
                  placeholder="250"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">

              {/* Panels (Blind Only - as requested) */}


              {/* Quantity (Both) */}
              <div className={isBlindFlow ? '' : 'col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Unit (Set)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EB216A] focus:border-[#EB216A] outline-none"
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { resetForm(); setIsAddItemModalOpen(false); }} className="flex-1">
              Batal
            </Button>
            <Button onClick={handleAddItem} className="flex-1 bg-[#EB216A] hover:bg-[#d11d5e] text-white hover:text-white">
              <Plus className="w-4 h-4 mr-2" /> Tambah Item
            </Button>
          </div>
        </DialogContent>
      </Dialog >

      {/* Product Selection Modal */}
      < Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen} >
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Pilih Kain Gorden</DialogTitle>
            <DialogDescription>Pilih jenis kain untuk gorden Anda</DialogDescription>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kain..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EB216A] focus:border-[#EB216A] outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => handleSelectFabric(product)}
                  className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${selectedFabric?.id === product.id
                    ? 'border-[#EB216A] bg-[#EB216A]/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  {selectedFabric?.id === product.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#EB216A] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <img
                    src={getProductImageUrl(product.images || product.image)}
                    alt={product.name}
                    className="w-full aspect-square object-cover rounded-lg mb-2"
                  />
                  <h4 className="font-medium text-gray-900 text-sm truncate">{product.name}</h4>
                  <p className="text-[#EB216A] font-bold">
                    {product.minPrice && product.minPrice > 0
                      ? `Mulai Rp ${product.minPrice.toLocaleString('id-ID')}`
                      : product.price > 0
                        ? `Rp ${product.price.toLocaleString('id-ID')}/m`
                        : 'Lihat Varian'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog >

      {/* Component Selection Modal */}
      < Dialog open={isComponentModalOpen} onOpenChange={setIsComponentModalOpen} >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Pilih Komponen</DialogTitle>
            <DialogDescription>
              {editingComponentId !== null && (() => {
                const comp = currentType?.components?.find(c => c.id === editingComponentId);
                const item = items.find(i => i.id === editingItemId);
                if (!comp) return null;

                return (
                  <div className="space-y-2 mt-1">
                    <span className="font-medium text-gray-900 block">{comp.label}</span>
                    {item && (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 leading-relaxed text-left">
                        <p>
                          Berikut adalah beberapa jenis <strong>{comp.label}</strong> yang bisa anda pilih sesuai dengan kebutuhan dan budget.
                          Cocok untuk Ukuran Lebar <strong>{item.width} cm</strong> x Tinggi <strong>{item.height} cm</strong> sesuai sama pintu/jendela anda.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {editingComponentId !== null && (() => {
                const comp = currentType?.components?.find(c => c.id === editingComponentId);
                const products = comp ? componentProducts[comp.subcategory_id] || [] : [];
                const currentItem = items.find(i => i.id === editingItemId);
                const currentSelection = currentItem?.components[editingComponentId];

                if (products.length === 0) {
                  return (
                    <div className="col-span-2 text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">Tidak ada produk tersedia untuk komponen ini</p>
                    </div>
                  );
                }

                return products.map(product => (
                  <div
                    key={product.id}
                    onClick={() => handleSelectComponent(product)}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${currentSelection?.product.id === product.id
                      ? 'border-[#EB216A] bg-[#EB216A]/5 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    {currentSelection?.product.id === product.id && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-[#EB216A] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {product.image && (
                      <img
                        src={getProductImageUrl(product.image)}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-500 italic">Lihat Varian</p>
                  </div>
                ));
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog >


      {/* Variant Picker Modal */}
      < Dialog open={isVariantModalOpen} onOpenChange={(open: boolean) => { setIsVariantModalOpen(open); if (!open) setVariantSearchQuery(''); }
      }>
        <DialogContent
          className="max-h-[80vh] overflow-hidden flex flex-col"
          style={{ width: 'clamp(320px, 95vw, 1200px)', maxWidth: '1600px' }}
        >
          <DialogHeader>
            <DialogTitle>Pilih Varian - {pendingProductForVariant?.name}</DialogTitle>
            <DialogDescription>
              {/* General Recommendation Banner */}
              {(() => {
                const item = variantSelectionMode === 'fabric'
                  ? items.find(i => i.id === editingVariantItemId)
                  : items.find(i => i.id === editingItemId);

                if (item) {
                  return (
                    <div className="hidden lg:block p-3 bg-pink-50 border border-pink-200 rounded-lg text-sm text-pink-900 leading-relaxed text-left mt-2 mb-2">
                      <p className="font-semibold">
                        Rekomendasi Umum: Cocok Untuk Pintu/Jendela Lebar {item.width} cm × Tinggi {item.height} cm
                      </p>
                    </div>
                  );
                }
                return null;
              })()}

              {variantSelectionMode === 'component' && editingComponentId !== null && (() => {
                const comp = currentType?.components?.find(c => c.id === editingComponentId);
                const item = items.find(i => i.id === editingItemId);
                if (!comp || !item) return null;
                return (
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 leading-relaxed text-left mt-2">
                    <p>
                      Berikut adalah beberapa varian <strong>{comp.label}</strong> yang bisa anda pilih sesuai dengan kebutuhan dan budget.
                      Cocok untuk Ukuran Lebar <strong>{item.width} cm</strong> x Tinggi <strong>{item.height} cm</strong> sesuai sama pintu/jendela anda.
                    </p>
                  </div>
                );
              })()}
            </DialogDescription>
          </DialogHeader>

          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={variantSearchQuery}
              onChange={(e) => setVariantSearchQuery(e.target.value)}
              placeholder="Cari varian (lebar, tinggi, harga)..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#EB216A] focus:border-[#EB216A] outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingVariants ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-[#EB216A] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 font-medium">Memuat varian...</p>
                <p className="text-sm text-gray-400 mt-1">Mohon tunggu sebentar</p>
              </div>
            ) : availableVariants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Tidak ada varian tersedia.</p>
              </div>
            ) : (() => {
              // Build search index and keys
              const allAttrKeys = new Set<string>();
              availableVariants.forEach((v: any) => {
                const attrs = safeJSONParse(v.attributes, {});
                Object.keys(attrs).forEach(k => {
                  if (!['gelombang', 'gel'].includes(k.toLowerCase())) {
                    allAttrKeys.add(k);
                  }
                });
              });

              // Filter by search query
              const filtered = availableVariants.filter((v: any) => {
                if (!variantSearchQuery) return true;
                const q = variantSearchQuery.toLowerCase();
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
                return 999999; // Fallback for sorting
              };

              // Sort by Lebar, then Tinggi, then Sibak (ASC)
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
                return <p className="text-center py-8 text-gray-600">Tidak ada varian yang cocok.</p>;
              }

              // Determine columns
              const hasLebar = Array.from(allAttrKeys).some(k => ['lebar', 'width', 'l'].includes(k.toLowerCase()));
              let columnKeys = Array.from(allAttrKeys);

              // Check component config for Gelombang visibility
              let showGelombang = true;
              if (variantSelectionMode === 'component' && editingComponentId) {
                const comp = currentType?.components?.find((c: any) => c.id === editingComponentId);
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
                  {/* DESKTOP: Table View */}
                  <div className="hidden lg:block overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {columnKeys.map(key => (
                            <th key={key} className="px-3 py-2 text-left font-semibold text-gray-700 whitespace-nowrap">
                              {key}
                            </th>
                          ))}
                          {!currentType.slug?.toLowerCase().includes('blind') && (
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
                                // Dynamic Gelombang Logic
                                if (key === 'Gelombang') {
                                  const lebar = getNum(attrs, ['lebar', 'width', 'l']);
                                  // If lebar is valid (not 999999), calculate gelombang
                                  const val = lebar !== 999999 ? Math.round(lebar / 10) : '-';
                                  return (
                                    <td key={key} className="px-3 py-3 text-gray-800 whitespace-nowrap">
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
                              {!currentType.slug?.toLowerCase().includes('blind') && (
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
                                  Rp {displayPrice.toLocaleString('id-ID')}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <button
                                  className="px-3 py-1 text-xs rounded transition-all"
                                  style={{
                                    backgroundColor: '#EB216A',
                                    color: 'white'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#d11d5e';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = '#EB216A';
                                  }}
                                >
                                  Pilih
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE: Card View */}
                  <div className="lg:hidden space-y-3">
                    {sorted.map((v: any) => {
                      const attrs = safeJSONParse(v.attributes, {}) as Record<string, any>;
                      const priceNet = Number(v.price_net) || 0;
                      const priceGross = Number(v.price_gross) || 0;
                      const displayPrice = priceNet || priceGross;

                      return (
                        <div
                          key={v.id}
                          className="border border-gray-200 rounded-xl p-4 hover:border-[#EB216A] hover:bg-pink-50 cursor-pointer transition-all flex items-center justify-between gap-4"
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
                                  <span key={key} style={{ marginRight: '16px', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                                    <span className="text-gray-500 text-xs">{key}:</span> <span className="font-semibold text-gray-900">{val}</span>
                                  </span>
                                );
                              })}
                            </div>

                            {/* Suitable For Info */}
                            {!currentType.slug?.toLowerCase().includes('blind') && (() => {
                              const lebar = getNum(attrs, ['lebar', 'width', 'l']);
                              const tinggi = getNum(attrs, ['tinggi', 'height', 't']);
                              const sibak = getNum(attrs, ['sibak']);
                              const calculatedLebar = lebar !== 999999 ? (sibak !== 999999 ? lebar * sibak : lebar) : null;
                              const calculatedTinggi = tinggi !== 999999 ? tinggi : null;

                              if (calculatedLebar || calculatedTinggi) {
                                return (
                                  <p className="text-xs text-blue-600 mt-2 mb-2 truncate">
                                    Cocok: L +/-{calculatedLebar || '-'}cm × T {calculatedTinggi || '-'}cm
                                  </p>
                                );
                              }
                              return null;
                            })()}

                            <div className="font-bold text-[#EB216A] mt-2">
                              Rp {displayPrice.toLocaleString('id-ID')}
                            </div>
                          </div>

                          {/* Right Button */}
                          <div className="shrink-0">
                            <button
                              className="bg-[#EB216A] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#d11d5e] transition-colors shadow-sm"
                            >
                              Pilih
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog >
      {/* Confirmation Modal */}
      < Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen} >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ganti Jenis Kalkulator?</DialogTitle>
            <DialogDescription>
              Mengganti jenis kalkulator akan menghapus semua item yang sudah ditambahkan. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmTypeChange}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Ya, Ganti & Hapus Item
            </Button>
          </div>
        </DialogContent>
      </Dialog >
    </div >
  );
}
