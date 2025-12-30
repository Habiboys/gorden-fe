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
  subcategory?: { id: number; name: string; slug: string };
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  maxWidth?: number;
  sibak?: number;
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
    width: number;
    height: number;
    sibak: number;
    price: number;
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
      product: isBlindFlow && tempSelectedProduct ? tempSelectedProduct : undefined
    };

    setItems([...items, newItem]);
    resetForm();
    setIsAddItemModalOpen(false);

    // Check if selected fabric has variants - show picker based on dimensions
    if (selectedFabric?.id) {
      try {
        const variantsRes = await productVariantsApi.getByProduct(selectedFabric.id);
        const variants = variantsRes.data || [];

        if (variants.length > 0) {
          // Filter variants that match the item dimensions (using recommended ranges)
          const matchingVariants = variants.filter((v: any) => {
            // If variant has recommended ranges, use those
            if (v.recommended_min_width && v.recommended_max_width) {
              return itemWidth >= v.recommended_min_width && itemWidth <= v.recommended_max_width;
            }
            // Otherwise show all variants
            return true;
          });

          // If no matching variants, show all variants
          const variantsToShow = matchingVariants.length > 0 ? matchingVariants : variants;

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

  // Select fabric product - no variant check here, variants picked after adding item
  const handleSelectFabric = (product: any) => {
    if (isBlindFlow) {
      // Blind Flow: Select product then open Add Item Modal
      setTempSelectedProduct(product);
      setIsProductModalOpen(false);
      setIsAddItemModalOpen(true);
      // Pre-fill name if empty
      if (!itemName) setItemName(product.name);
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
      const variants = variantsRes.data || [];

      if (variants.length > 0) {
        // Product has variants - show variant picker
        setPendingProductForVariant(product);
        setAvailableVariants(variants);
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

    if (variantSelectionMode === 'fabric') {
      // Store variant in the specific item
      if (!editingVariantItemId) return;

      const variantData = {
        id: variant.id,
        width: variant.width,
        height: variant.height,
        sibak: variant.sibak,
        price: variant.price,
        name: `${pendingProductForVariant.name} (${variant.width}x${variant.height}cm, Sibak ${variant.sibak})`,
      };

      setItems(items.map(item => {
        if (item.id === editingVariantItemId) {
          return { ...item, selectedVariant: variantData };
        }
        return item;
      }));

      setEditingVariantItemId(null);
    } else {
      // Setting component product
      if (!editingItemId || editingComponentId === null) return;

      const productWithVariant = {
        ...pendingProductForVariant,
        price: variant.price,
        sibak: variant.sibak,
        name: `${pendingProductForVariant.name} (${variant.width}x${variant.height}cm, Sibak ${variant.sibak})`,
      };

      setItems(items.map(item => {
        if (item.id === editingItemId) {
          return {
            ...item,
            components: {
              ...item.components,
              [editingComponentId]: {
                product: productWithVariant as ProductOption,
                qty: variant.sibak || 1
              }
            }
          };
        }
        return item;
      }));
    }

    setIsVariantModalOpen(false);
    setPendingProductForVariant(null);
    setAvailableVariants([]);
  };

  // Calculate component price based on price_calculation type
  const calculateComponentPrice = (item: CalculatorItem, comp: ComponentFromDB, selection: ComponentSelection) => {
    const widthM = item.width / 100;
    const basePrice = (() => {
      switch (comp.price_calculation) {
        case 'per_meter':
          // Min 1 meter rule: usage < 1m counts as 1m
          return Math.max(1, widthM) * selection.product.price * item.quantity;
        case 'per_unit':
          return selection.product.price * item.quantity;
        case 'per_10_per_meter':
          return Math.ceil(widthM * 10) * selection.product.price * item.quantity;
        default:
          return 0;
      }
    })();
    // Multiply by component quantity
    return basePrice * selection.qty;
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

    // Fabric calculation with multiplier
    const fabricMeters = widthM * currentType.fabric_multiplier * heightM;
    const fabricPrice = fabricMeters * fabricPricePerMeter * item.quantity;

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
            price: selectedFabric.price
          } : null,
          items: items.map(item => {
            const prices = calculateItemPrice(item);
            return {
              id: item.id,
              itemType: item.itemType,
              packageType: item.packageType,
              dimensions: {
                width: item.width,
                height: item.height,
                panels: item.panels
              },
              quantity: item.quantity,
              // Include variant info per item
              selectedVariant: item.selectedVariant ? {
                id: item.selectedVariant.id,
                name: item.selectedVariant.name,
                width: item.selectedVariant.width,
                height: item.selectedVariant.height,
                sibak: item.selectedVariant.sibak,
                price: item.selectedVariant.price
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
                  productPrice: selection.product.price,
                  qty: selection.qty,
                  priceCalculation: comp?.price_calculation || 'per_unit'
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">


          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-gray-900 mb-6 font-bold">
            Kalkulator Biaya Gorden
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Hitung kebutuhan dan estimasi biaya secara otomatis dengan komponen yang dapat disesuaikan.
          </p>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl text-gray-900 mb-3 font-semibold">Cara Menggunakan Kalkulator</h2>
            <p className="text-gray-600">Ikuti 4 langkah mudah untuk menghitung biaya gorden Anda</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <Calculator className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg text-gray-900 mb-2 font-medium">Pilih Jenis</h3>
              <p className="text-sm text-gray-600">Smokering, Kupu-kupu, atau Blind</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <Package className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg text-gray-900 mb-2 font-medium">Pilih Kain</h3>
              <p className="text-sm text-gray-600">Pilih dari berbagai pilihan kain</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <Ruler className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg text-gray-900 mb-2 font-medium">Input Ukuran</h3>
              <p className="text-sm text-gray-600">Masukkan lebar dan tinggi</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg text-gray-900 mb-2 font-medium">Pilih Komponen</h3>
              <p className="text-sm text-gray-600">Tambahkan rel, hook, tassel, dll</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Calculator Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Step 1: Calculator Type */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#EB216A] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-xl text-white font-bold">1</span>
              </div>
              <h2 className="text-xl sm:text-2xl text-gray-900 font-semibold">Pilih Jenis Kalkulator</h2>
            </div>

            <div className="w-full overflow-x-auto">
              <div className="inline-flex bg-white rounded-2xl p-1.5 gap-1.5 border border-gray-200 shadow-md min-w-full sm:min-w-0">
                {calculatorTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeChange(type.slug)}
                    className={`flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base whitespace-nowrap font-medium ${selectedTypeSlug === type.slug
                      ? 'bg-[#EB216A] text-white shadow-lg'
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
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#EB216A] rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white font-bold">2</span>
                </div>
                <h2 className="text-xl sm:text-2xl text-gray-900 font-semibold">Pilih Produk Gorden</h2>
              </div>

              {selectedFabric ? (
                <div className="bg-white rounded-2xl p-4 sm:p-6 border-2 border-[#EB216A] shadow-lg">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={getProductImageUrl(selectedFabric.images || selectedFabric.image)}
                          alt={selectedFabric.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge className="bg-[#EB216A]/10 text-[#EB216A] border-0 mb-1">
                          {selectedFabric.category || 'Kain Gorden'}
                        </Badge>
                        <h3 className="text-lg sm:text-xl text-gray-900 font-medium truncate">{selectedFabric.name}</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xl sm:text-2xl text-[#EB216A] font-bold">
                            Rp {selectedFabric.price?.toLocaleString('id-ID') || '0'}
                          </span>
                          <span className="text-sm text-gray-500">/meter</span>
                        </div>
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
                  className="bg-[#EB216A] hover:bg-[#d11d5e] text-white px-8 py-6 rounded-xl text-lg"
                >
                  <Package className="w-5 h-5 mr-2" /> Pilih Produk Gorden
                </Button>
              )}
            </div>
          )}

          {/* Step 3: Add Items */}
          <div className="mb-10">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EB216A] rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white font-bold">{isBlindFlow ? '2' : '3'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl text-gray-900 font-semibold">Daftar Item ({items.length})</h2>
              </div>
              <Button
                onClick={() => {
                  if (isBlindFlow) {
                    setIsProductModalOpen(true); // Open Product Picker for Blinds
                  } else {
                    setIsAddItemModalOpen(true); // Open Dimensions for Curtain
                  }
                }}
                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
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
                  className="bg-[#EB216A] hover:bg-[#d11d5e] text-white px-8"
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
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 p-1">
                                  <img src={getProductImageUrl(product.images || product.image)} className="w-full h-full object-cover rounded" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                                  <p className="text-[#EB216A] font-medium">Rp {product.price?.toLocaleString('id-ID')}/m</p>
                                  <p className="text-xs text-gray-500 mt-1">{groupItems.length} Ukuran</p>
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

                            {/* Table of Items */}
                            <div className="overflow-x-auto">
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
                                          Rp {(prices.fabric / item.quantity).toLocaleString('id-ID')}
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
                                    <span className="text-lg font-bold text-[#EB216A]">{idx + 1}</span>
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {isBlindFlow ? (item.name || `Jendela ${idx + 1}`) : (item.itemType === 'jendela' ? 'Jendela' : 'Pintu')}
                                      {!isBlindFlow && (item.packageType === 'gorden-lengkap' ? ' - Paket Lengkap' : ' - Gorden Saja')}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      {item.width} cm × {item.height} cm • Jumlah: {item.quantity}x
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>

                            {/* Item Details */}
                            <div className="p-4 sm:p-6 space-y-3">
                              <h4 className="text-xs text-gray-500 uppercase tracking-wide font-medium">Rincian Komponen</h4>

                              {/* Fabric / Main Product */}
                              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {/* Product Image for Blind Flow */}
                                    {isBlindFlow && item.product && (
                                      <img src={getProductImageUrl(item.product.images || item.product.image)} className="w-8 h-8 rounded object-cover" />
                                    )}
                                    <p className="text-gray-900 font-medium">{(prices as any).fabricName || item.product?.name || selectedFabric?.name}</p>
                                    {selectedFabric && !isBlindFlow && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-6 px-2 text-xs border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white"
                                        onClick={async () => {
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
                                        {item.selectedVariant ? 'Ganti Varian' : 'Pilih Varian'}
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {(prices as any).fabricMeters?.toFixed(2) || 0}m × Rp {((prices as any).fabricPricePerMeter || 0).toLocaleString('id-ID')} × {item.quantity}
                                  </p>
                                </div>
                                <p className="text-lg font-semibold text-gray-900">
                                  Rp {prices.fabric.toLocaleString('id-ID')}
                                </p>
                              </div>

                              {/* Dynamic Components */}
                              {item.packageType === 'gorden-lengkap' && currentType?.components?.map(comp => {
                                const selection = item.components[comp.id];
                                const products = componentProducts[comp.subcategory_id] || [];
                                const compPrice = selection ? calculateComponentPrice(item, comp, selection) : 0;

                                return (
                                  <div key={comp.id} className={`flex justify-between items-center py-3 border-b border-gray-100 ${!selection ? 'opacity-60' : ''}`}>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-gray-900 font-medium">
                                          {selection ? selection.product.name : comp.label}
                                        </p>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-6 px-2 text-xs border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white"
                                          onClick={() => openComponentModal(item.id, comp.id)}
                                          disabled={products.length === 0}
                                        >
                                          {selection ? 'Ganti' : 'Pilih'}
                                        </Button>
                                      </div>
                                      {selection ? (
                                        <div className="flex items-center gap-3">
                                          <p className="text-sm text-gray-500">
                                            {comp.price_calculation === 'per_meter' && `${(item.width / 100).toFixed(2)}m × Rp ${selection.product.price.toLocaleString('id-ID')}`}
                                            {comp.price_calculation === 'per_unit' && `Rp ${selection.product.price.toLocaleString('id-ID')} × ${item.quantity}`}
                                            {comp.price_calculation === 'per_10_per_meter' && `${Math.ceil((item.width / 100) * 10)} pcs × Rp ${selection.product.price.toLocaleString('id-ID')}`}
                                          </p>
                                          <div className="flex items-center gap-1">
                                            <span className="text-xs text-gray-500">×</span>
                                            <input
                                              type="number"
                                              min="1"
                                              value={selection.qty}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                const newQty = Math.max(1, parseInt(e.target.value) || 1);
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
                                              className="w-14 h-7 px-2 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-[#EB216A] focus:border-[#EB216A] outline-none"
                                            />
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-400">
                                          {products.length === 0 ? 'Tidak ada produk tersedia' : `Pilih ${comp.label.toLowerCase()}`}
                                        </p>
                                      )}
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900">
                                      Rp {compPrice.toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                );
                              })}

                              {/* Subtotal */}
                              <div className="flex justify-between items-center pt-3">
                                <p className="text-gray-600 font-medium">Subtotal</p>
                                <p className="text-xl font-bold text-[#EB216A]">
                                  Rp {prices.total.toLocaleString('id-ID')}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            )} {/* Grand Total & WhatsApp */}
            {items.length > 0 && (
              <div className="space-y-4">
                {/* Grand Total - Transparent Background */}
                <div className="bg-transparent p-6 sm:p-8 text-[#EB216A] border-2 border-[#EB216A] rounded-2xl shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-gray-800 font-semibold">Total Keseluruhan</p>
                      <p className="text-sm text-gray-500">Untuk {items.length} item ({items.reduce((s, i) => s + i.quantity, 0)} unit)</p>
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold">
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
      </section>

      {/* Add Item Modal */}
      <Dialog open={isAddItemModalOpen} onOpenChange={setIsAddItemModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isBlindFlow ? `Tambah: ${tempSelectedProduct?.name || 'Blind'}` : 'Tambah Item Baru'}
            </DialogTitle>
            <DialogDescription>Masukkan detail ukuran dan kebutuhan</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">

            {/* Show Product Image for Blind Flow */}
            {isBlindFlow && tempSelectedProduct && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <img src={getProductImageUrl(tempSelectedProduct.images || tempSelectedProduct.image)} className="w-16 h-16 rounded-lg object-cover" />
                <div>
                  <p className="font-medium text-gray-900">{tempSelectedProduct.name}</p>
                  <p className="text-[#EB216A] font-bold">Rp {tempSelectedProduct.price?.toLocaleString('id-ID')}/m</p>
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
            <Button variant="outline" onClick={() => setIsAddItemModalOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button onClick={handleAddItem} className="flex-1 bg-[#EB216A] hover:bg-[#d11d5e] text-white">
              <Plus className="w-4 h-4 mr-2" /> Tambah Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Selection Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
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
                  <p className="text-[#EB216A] font-bold">Rp {product.price?.toLocaleString('id-ID')}/m</p>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Component Selection Modal */}
      <Dialog open={isComponentModalOpen} onOpenChange={setIsComponentModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Pilih Komponen</DialogTitle>
            <DialogDescription>
              {editingComponentId !== null && currentType?.components?.find(c => c.id === editingComponentId)?.label}
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
                    <p className="text-[#EB216A] font-bold">Rp {product.price?.toLocaleString('id-ID')}</p>
                  </div>
                ));
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variant Picker Modal */}
      <Dialog open={isVariantModalOpen} onOpenChange={(open: boolean) => { setIsVariantModalOpen(open); if (!open) setVariantSearchQuery(''); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Pilih Varian - {pendingProductForVariant?.name}</DialogTitle>
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
              <div className="text-center py-8">
                <p className="text-gray-600">Memuat varian...</p>
              </div>
            ) : availableVariants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Tidak ada varian tersedia.</p>
              </div>
            ) : (() => {
              const filtered = availableVariants.filter((v: any) => {
                if (!variantSearchQuery) return true;
                const q = variantSearchQuery.toLowerCase();
                return (
                  String(v.width).includes(q) ||
                  String(v.height).includes(q) ||
                  String(v.sibak).includes(q) ||
                  String(v.price).includes(q)
                );
              });

              if (filtered.length === 0) {
                return <p className="text-center py-8 text-gray-600">Tidak ada varian yang cocok.</p>;
              }

              return (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">Lebar</th>
                      <th className="px-4 py-3 text-left">Tinggi</th>
                      <th className="px-4 py-3 text-left">Sibak</th>
                      <th className="px-4 py-3 text-left">Harga</th>
                      <th className="px-4 py-3 text-left">Cocok Untuk</th>
                      <th className="px-4 py-3 text-right">Pilih</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((v: any) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{v.width}cm</td>
                        <td className="px-4 py-3">{v.height}cm</td>
                        <td className="px-4 py-3">{v.sibak}</td>
                        <td className="px-4 py-3 font-medium text-[#EB216A]">
                          Rp {Number(v.price).toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {v.recommended_min_width && v.recommended_max_width ? (
                            `Lebar ${v.recommended_min_width}-${v.recommended_max_width}cm`
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                            onClick={() => handleSelectVariant(v)}
                          >
                            Pilih
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
      {/* Confirmation Modal */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
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
      </Dialog>
    </div >
  );
}
