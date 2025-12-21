import {
  Calculator,
  Check,
  ChevronDown,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { CustomerInfoDialog } from '../components/CustomerInfoDialog';
import { SingleComponentModal } from '../components/SingleComponentModal';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { calculatorComponentsApi, calculatorLeadsApi } from '../utils/api';
import { getProductImageUrl } from '../utils/imageHelper';

type CalculatorType = 'smokering' | 'kupu-kupu' | 'blind';
type ItemType = 'pintu' | 'jendela';
type PackageType = 'gorden-saja' | 'gorden-lengkap';

interface ComponentOption {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  maxWidth?: number;
}

interface ComponentSelections {
  relGorden?: ComponentOption;
  tassel?: ComponentOption;
  hook?: ComponentOption;
  kainVitrase?: ComponentOption;
  relVitrase?: ComponentOption;
}

interface WindowItem {
  id: string;
  type: ItemType;
  packageType: PackageType;
  width: number;
  height: number;
  panels: number;
  quantity: number;
  components?: ComponentSelections;
}

export default function CalculatorPage() {
  // Customer info state - Start with dialog open by default
  const [isCustomerInfoDialogOpen, setIsCustomerInfoDialogOpen] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<{ name: string; phone: string } | null>(null);

  // Components loading state
  const [componentsLoading, setComponentsLoading] = useState(true);
  const [componentsLoaded, setComponentsLoaded] = useState(false);

  // Component data from database (empty by default, no fallback)
  const [products, setProducts] = useState<any[]>([]);
  const [relGordenOptions, setRelGordenOptions] = useState<ComponentOption[]>([]);
  const [tasselOptions, setTasselOptions] = useState<ComponentOption[]>([]);
  const [hookOptions, setHookOptions] = useState<ComponentOption[]>([]);
  const [kainVitraseOptions, setKainVitraseOptions] = useState<ComponentOption[]>([]);
  const [relVitraseOptions, setRelVitraseOptions] = useState<ComponentOption[]>([]);

  const [calculatorType, setCalculatorType] = useState<CalculatorType>('smokering');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [items, setItems] = useState<WindowItem[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [itemType, setItemType] = useState<ItemType>('jendela');
  const [packageType, setPackageType] = useState<PackageType>('gorden-saja');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [panels, setPanels] = useState('2');
  const [quantity, setQuantity] = useState('1');

  // Component selection modal states
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingComponentType, setEditingComponentType] = useState<'relGorden' | 'tassel' | 'hook' | 'kainVitrase' | 'relVitrase' | null>(null);

  // Add item modal state
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [editingFormItemId, setEditingFormItemId] = useState<string | null>(null);

  // Load components from backend on mount
  useEffect(() => {
    const loadComponents = async () => {
      try {
        setComponentsLoading(true);
        console.log('🔄 Loading calculator components from backend...');
        const response = await calculatorComponentsApi.getGrouped();
        console.log('Components loaded:', response);

        if (response.success && response.data) {
          // Update component state with data from API
          if (response.data.products && response.data.products.length > 0) {
            setProducts(response.data.products);
            setSelectedProduct(response.data.products[0]);
          }
          if (response.data.relGorden && response.data.relGorden.length > 0) {
            setRelGordenOptions(response.data.relGorden);
          }
          if (response.data.tassel && response.data.tassel.length > 0) {
            setTasselOptions(response.data.tassel);
          }
          if (response.data.hook && response.data.hook.length > 0) {
            setHookOptions(response.data.hook);
          }
          if (response.data.kainVitrase && response.data.kainVitrase.length > 0) {
            setKainVitraseOptions(response.data.kainVitrase);
          }
          if (response.data.relVitrase && response.data.relVitrase.length > 0) {
            setRelVitraseOptions(response.data.relVitrase);
          }

          console.log('✅ Components state updated from API');
          setComponentsLoaded(true);
        } else {
          // No data from API, keep using fallback
          console.log('⚠️ No data from API, using fallback');
          if (products.length > 0) {
            setSelectedProduct(products[0]);
          }
        }
      } catch (error) {
        console.error('❌ Error loading components:', error);
        // Keep using fallback data
        console.log('⚠️ Using fallback hardcoded data');
        if (products.length > 0) {
          setSelectedProduct(products[0]);
        }
      } finally {
        setComponentsLoading(false);
      }
    };

    loadComponents();
  }, []);

  // Check if customer info exists in localStorage on mount
  useEffect(() => {
    const savedCustomerInfo = localStorage.getItem('amagriya_calculator_access_v2');
    console.log('🔍 Checking localStorage:', savedCustomerInfo ? 'Data found' : 'No data');
    if (savedCustomerInfo) {
      setCustomerInfo(JSON.parse(savedCustomerInfo));
      setIsCustomerInfoDialogOpen(false); // Close dialog if data exists
      console.log('✅ Customer info loaded, dialog closed');
    } else {
      console.log('⚠️ No customer info, dialog should be open');
    }
    // If no saved info, dialog stays open (already set to true in initial state)
  }, []);

  // Handle customer info submission
  const handleCustomerInfoSubmit = (name: string, phone: string) => {
    const info = { name, phone };
    setCustomerInfo(info);
    localStorage.setItem('amagriya_calculator_access_v2', JSON.stringify(info));
    setIsCustomerInfoDialogOpen(false);
  };

  const handleChangeCalculatorType = (newType: CalculatorType) => {
    if (items.length > 0) {
      // Jika ada items, tampilkan konfirmasi
      const confirm = window.confirm(
        'Mengganti jenis kalkulator akan menghapus semua item yang sudah ditambahkan. Lanjutkan?'
      );
      if (confirm) {
        setItems([]);
        setCalculatorType(newType);
      }
    } else {
      setCalculatorType(newType);
    }
  };

  const handleAddItem = () => {
    // Validasi berbeda untuk blind vs gorden
    if (calculatorType === 'blind') {
      if (!width || !height || !quantity) {
        alert('Mohon lengkapi semua field');
        return;
      }
    } else {
      if (!width || !height || !panels || !quantity) {
        alert('Mohon lengkapi semua field');
        return;
      }
    }

    if (editingFormItemId) {
      // Mode edit: update existing item
      setItems(items.map(item => {
        if (item.id === editingFormItemId) {
          return {
            ...item,
            type: calculatorType === 'blind' ? 'jendela' : itemType,
            packageType: calculatorType === 'blind' ? 'gorden-saja' : packageType,
            width: parseFloat(width),
            height: parseFloat(height),
            panels: calculatorType === 'blind' ? 1 : parseInt(panels),
            quantity: parseInt(quantity),
          };
        }
        return item;
      }));
    } else {
      // Mode add: create new item
      const newItem: WindowItem = {
        id: Date.now().toString(),
        type: calculatorType === 'blind' ? 'jendela' : itemType,
        packageType: calculatorType === 'blind' ? 'gorden-saja' : packageType,
        width: parseFloat(width),
        height: parseFloat(height),
        panels: calculatorType === 'blind' ? 1 : parseInt(panels),
        quantity: parseInt(quantity),
      };

      setItems([...items, newItem]);
    }

    // Reset form
    setWidth('');
    setHeight('');
    if (calculatorType !== 'blind') {
      setPanels('2');
    }
    setQuantity('1');
    setEditingFormItemId(null);

    // Close modal
    setIsAddItemModalOpen(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleEditItem = (item: WindowItem) => {
    // Populate form with item data
    setItemType(item.type);
    setPackageType(item.packageType);
    setWidth(item.width.toString());
    setHeight(item.height.toString());
    setPanels(item.panels.toString());
    setQuantity(item.quantity.toString());
    setEditingFormItemId(item.id);
    setIsAddItemModalOpen(true);
  };

  const handleSelectProduct = (product: typeof products[0]) => {
    setSelectedProduct(product);
    setIsProductModalOpen(false);
  };

  const handleOpenComponentModal = (itemId: string, componentType: 'relGorden' | 'tassel' | 'hook' | 'kainVitrase' | 'relVitrase') => {
    setEditingItemId(itemId);
    setEditingComponentType(componentType);
    setIsComponentModalOpen(true);
  };

  const handleSelectComponent = (
    type: 'relGorden' | 'tassel' | 'hook' | 'kainVitrase' | 'relVitrase',
    component: any
  ) => {
    if (!editingItemId) return;

    setItems(items.map(item => {
      if (item.id === editingItemId) {
        return {
          ...item,
          components: {
            ...item.components,
            [type]: component,
          },
        };
      }
      return item;
    }));
  };

  // Get filtered options based on item width
  const getFilteredRelOptions = (widthInCm: number) => {
    return relGordenOptions.filter(rel => rel.maxWidth >= widthInCm);
  };

  const getFilteredRelVitraseOptions = (widthInCm: number) => {
    return relVitraseOptions.filter(rel => rel.maxWidth >= widthInCm);
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  // Kalkulasi per item
  const calculateItemDetails = (item: WindowItem) => {
    const widthInMeters = item.width / 100;
    const heightInMeters = item.height / 100;

    let fabricMeters = 0;

    if (calculatorType === 'blind') {
      // Blind: lebar x tinggi saja (no multiplier)
      fabricMeters = widthInMeters * heightInMeters;
    } else if (calculatorType === 'smokering') {
      // Smokering: lebar x 2.5 (lipit) x tinggi
      fabricMeters = widthInMeters * 2.5 * heightInMeters;
    } else {
      // Kupu-kupu: (lebar / jumlah panel) x 2 x tinggi x jumlah panel
      fabricMeters = ((widthInMeters / item.panels) * 2) * heightInMeters * item.panels;
    }

    // Harga kain gorden - check if selectedProduct exists
    const gordenPrice = selectedProduct ? fabricMeters * selectedProduct.price * item.quantity : 0;

    // Komponen tambahan untuk paket lengkap (gunakan harga dari pilihan user atau 0)
    let relPrice = 0;
    let tasselPrice = 0;
    let hookPrice = 0;
    let vitraseKainPrice = 0;
    let vitraseRelPrice = 0;
    let hookQuantity = 0;
    let vitraseKainMeters = 0;

    if (item.packageType === 'gorden-lengkap') {
      // Rel Gorden
      if (item.components?.relGorden) {
        relPrice = widthInMeters * item.components.relGorden.price * item.quantity;
      }

      // Tassel
      if (item.components?.tassel) {
        tasselPrice = item.components.tassel.price * item.quantity;
      }

      // Hook (10 pcs per meter)
      if (item.components?.hook) {
        hookQuantity = Math.ceil(widthInMeters * 10);
        hookPrice = hookQuantity * item.components.hook.price * item.quantity;
      }

      // Kain Vitrase
      if (item.components?.kainVitrase) {
        vitraseKainMeters = widthInMeters * 2.5 * heightInMeters;
        vitraseKainPrice = vitraseKainMeters * item.components.kainVitrase.price * item.quantity;
      }

      // Rel Vitrase
      if (item.components?.relVitrase) {
        vitraseRelPrice = widthInMeters * item.components.relVitrase.price * item.quantity;
      }
    }

    const totalItem = gordenPrice + relPrice + tasselPrice + hookPrice + vitraseKainPrice + vitraseRelPrice;

    return {
      fabricMeters,
      gordenPrice,
      relPrice,
      tasselPrice,
      hookPrice,
      hookQuantity,
      vitraseKainPrice,
      vitraseKainMeters,
      vitraseRelPrice,
      totalItem,
    };
  };

  // Total keseluruhan
  const calculateGrandTotal = () => {
    return items.reduce((total, item) => {
      const details = calculateItemDetails(item);
      return total + details.totalItem;
    }, 0);
  };

  const grandTotal = calculateGrandTotal();

  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    const adminPhone = '6285142247464'; // Ganti dengan nomor admin yang sebenarnya

    let message = `*ESTIMASI BIAYA GORDEN*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Jenis Kalkulator
    message += `📋 *Jenis Kalkulator:* ${calculatorType === 'smokering' ? 'Smokering' : calculatorType === 'kupu-kupu' ? 'Kupu-kupu' : 'Blind'}\n`;
    message += `🎨 *Produk Gorden:* ${selectedProduct.name}\n`;
    message += `💰 *Harga Kain:* Rp ${selectedProduct.price.toLocaleString('id-ID')}/meter\n\n`;

    // Detail setiap item
    message += `📦 *DETAIL PESANAN*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    items.forEach((item, index) => {
      const details = calculateItemDetails(item);

      message += `*Item ${index + 1}: ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}*\n`;
      message += `• Ukuran: ${item.width} cm × ${item.height} cm\n`;
      if (calculatorType === 'kupu-kupu') {
        message += `• Panel: ${item.panels} panel\n`;
      }
      message += `• Jumlah: ${item.quantity}x\n`;
      message += `• Paket: ${item.packageType === 'gorden-lengkap' ? 'Lengkap' : 'Gorden Saja'}\n\n`;

      message += `  *Rincian Biaya:*\n`;
      message += `  - Kain Gorden: Rp ${details.gordenPrice.toLocaleString('id-ID')}\n`;

      if (item.packageType === 'gorden-lengkap') {
        if (item.components?.relGorden) {
          message += `  - ${item.components.relGorden.name}: Rp ${details.relPrice.toLocaleString('id-ID')}\n`;
        }
        if (item.components?.tassel) {
          message += `  - ${item.components.tassel.name}: Rp ${details.tasselPrice.toLocaleString('id-ID')}\n`;
        }
        if (item.components?.hook) {
          message += `  - ${item.components.hook.name}: Rp ${details.hookPrice.toLocaleString('id-ID')}\n`;
        }
        if (item.components?.kainVitrase) {
          message += `  - ${item.components.kainVitrase.name}: Rp ${details.vitraseKainPrice.toLocaleString('id-ID')}\n`;
        }
        if (item.components?.relVitrase) {
          message += `  - ${item.components.relVitrase.name}: Rp ${details.vitraseRelPrice.toLocaleString('id-ID')}\n`;
        }
      }

      message += `  *Subtotal: Rp ${details.totalItem.toLocaleString('id-ID')}*\n\n`;
    });

    // Grand Total
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `💎 *TOTAL KESELURUHAN*\n`;
    message += `*Rp ${grandTotal.toLocaleString('id-ID')}*\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    message += `📝 Total: ${items.length} item (${items.reduce((sum, item) => sum + item.quantity, 0)} unit)\n\n`;
    message += `_Estimasi berdasarkan kalkulasi ${calculatorType}. Harga final dapat berbeda tergantung detail pemesanan dan instalasi._\n\n`;
    message += `Mohon konfirmasi untuk pemesanan. Terima kasih! 🙏`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${adminPhone}?text=${encodedMessage}`;
  };

  const handleSendToWhatsApp = async () => {
    if (items.length === 0) {
      alert('Mohon tambahkan minimal 1 item terlebih dahulu');
      return;
    }

    // Prepare lead data
    const leadData = {
      customerName: customerInfo?.name || 'Unknown',
      customerPhone: customerInfo?.phone || 'Unknown',
      calculatorType,
      productName: selectedProduct.name,
      productPrice: selectedProduct.price,
      items: items.map(item => {
        const details = calculateItemDetails(item);
        return {
          width: item.width,
          height: item.height,
          quantity: item.quantity,
          relGorden: item.relGorden,
          tassel: item.tassel,
          hook: item.hook,
          kainVitrase: item.kainVitrase,
          relVitrase: item.relVitrase,
          totalPrice: details.totalItem,
        };
      }),
      grandTotal,
      totalItems: items.length,
      totalUnits: items.reduce((sum, item) => sum + item.quantity, 0),
    };

    try {
      console.log('💾 Saving calculator lead to backend...', leadData);

      // Save to backend
      const response = await calculatorLeadsApi.submit(leadData);
      console.log('✅ Calculator lead saved:', response);

      // Open WhatsApp after successful save
      const whatsappUrl = generateWhatsAppMessage();
      window.open(whatsappUrl, '_blank');

      // Show success message
      alert('✅ Data berhasil disimpan! Anda akan diarahkan ke WhatsApp.');

    } catch (error: any) {
      console.error('❌ Error saving calculator lead:', error);

      // Still open WhatsApp even if save failed
      const confirm = window.confirm(
        'Gagal menyimpan data ke sistem. Lanjutkan ke WhatsApp?\n\n' +
        'Error: ' + error.message
      );

      if (confirm) {
        const whatsappUrl = generateWhatsAppMessage();
        window.open(whatsappUrl, '_blank');
      }
    }
  };

  // Show loading state while components are loading
  if (componentsLoading) {
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

  // If dialog is open or no customer info, only show the dialog
  if (isCustomerInfoDialogOpen || !customerInfo) {
    console.log('🚫 BLOCKING CALCULATOR ACCESS - Dialog open:', isCustomerInfoDialogOpen, 'Customer info:', customerInfo);
    return (
      <div className="bg-gradient-to-br from-pink-50 via-white to-pink-50 min-h-screen">
        <CustomerInfoDialog
          isOpen={isCustomerInfoDialogOpen}
          onSubmit={handleCustomerInfoSubmit}
        />
      </div>
    );
  }

  console.log('✅ SHOWING CALCULATOR - Customer info exists, Components loaded:', componentsLoaded);

  // Show full calculator content only after form is submitted
  return (
    <div className="bg-white">
      {/* Header Section */}
      <section className="relative bg-gradient-to-br from-pink-50 via-white to-pink-50 pt-32 pb-16 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#EB216A]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#EB216A]/10 text-[#EB216A] px-4 py-2 rounded-full mb-6">
            <Calculator className="w-4 h-4" />
            <span className="text-sm">Hitung Otomatis</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-gray-900 mb-6">
            Kalkulator Biaya Gorden
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Hitung kebutuhan dan estimasi biaya secara otomatis.
          </p>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl text-gray-900 mb-3">Cara Menggunakan Kalkulator</h2>
            <p className="text-gray-600">Ikuti 4 langkah mudah untuk menghitung biaya gorden Anda</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">1</span>
              </div>
              <h3 className="text-lg text-gray-900 mb-2">Pilih Jenis Kalkulator</h3>
              <p className="text-sm text-gray-600">Smokering atau Kupu-kupu sesuai kebutuhan</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">2</span>
              </div>
              <h3 className="text-lg text-gray-900 mb-2">Pilih Produk Gorden</h3>
              <p className="text-sm text-gray-600">Klik tombol pilih untuk memilih dari katalog</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">3</span>
              </div>
              <h3 className="text-lg text-gray-900 mb-2">Input Ukuran</h3>
              <p className="text-sm text-gray-600">Masukkan lebar dan tinggi jendela/pintu</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl text-white">4</span>
              </div>
              <h3 className="text-lg text-gray-900 mb-2">Lihat Hasil</h3>
              <p className="text-sm text-gray-600">Estimasi biaya akan muncul otomatis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Step 1: Calculator Type Selector */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#EB216A] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-xl text-white">1</span>
              </div>
              <h2 className="text-xl sm:text-2xl text-gray-900">Pilih Jenis Kalkulator</h2>
            </div>

            <div className="w-full overflow-x-auto">
              <div className="inline-flex bg-white rounded-2xl p-1.5 gap-1.5 border border-gray-200 shadow-md min-w-full sm:min-w-0">
                <button
                  onClick={() => handleChangeCalculatorType('smokering')}
                  className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base whitespace-nowrap ${calculatorType === 'smokering'
                    ? 'bg-[#EB216A] text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <span className="hidden sm:inline">Kalkulator Smokering</span>
                  <span className="sm:hidden">Smokering</span>
                </button>
                <button
                  onClick={() => handleChangeCalculatorType('kupu-kupu')}
                  className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base whitespace-nowrap ${calculatorType === 'kupu-kupu'
                    ? 'bg-[#EB216A] text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <span className="hidden sm:inline">Kalkulator Kupu-kupu</span>
                  <span className="sm:hidden">Kupu-kupu</span>
                </button>
                <button
                  onClick={() => handleChangeCalculatorType('blind')}
                  className={`flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 rounded-xl transition-all duration-300 text-sm sm:text-base whitespace-nowrap ${calculatorType === 'blind'
                    ? 'bg-[#EB216A] text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <span className="hidden sm:inline">Kalkulator Blind</span>
                  <span className="sm:hidden">Blind</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Product Selection */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#EB216A] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-xl text-white">2</span>
              </div>
              <h2 className="text-xl sm:text-2xl text-gray-900">Pilih Produk Gorden</h2>
            </div>

            {/* Selected Product Display */}
            {selectedProduct && (
              <div className="bg-white rounded-xl p-3 sm:p-4 border-2 border-[#EB216A] shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={getProductImageUrl(selectedProduct.images || selectedProduct.image)}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Badge className="bg-[#EB216A]/10 text-[#EB216A] border-0 mb-1 text-xs">
                        {selectedProduct.category}
                      </Badge>
                      <h3 className="text-base sm:text-lg text-gray-900 mb-0.5 truncate">{selectedProduct.name}</h3>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl text-[#EB216A]">
                          Rp {selectedProduct.price?.toLocaleString('id-ID') || '0'}
                        </span>
                        <span className="text-xs text-gray-500">/ meter</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsProductModalOpen(true)}
                    variant="outline"
                    className="border-2 border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white rounded-lg px-4 py-4 w-full sm:w-auto text-sm"
                  >
                    <Package className="w-4 h-4 mr-1.5" />
                    Ganti Produk
                  </Button>
                </div>
              </div>
            )}
          </div>
          {/* Step 3: Add Items */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#EB216A] rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white">3</span>
                </div>
                <h2 className="text-xl sm:text-2xl text-gray-900">Item yang Ditambahkan ({items.length})</h2>
              </div>

              <Button
                onClick={() => setIsAddItemModalOpen(true)}
                className="bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-lg px-3 sm:px-4 py-4 shadow-lg hover:shadow-xl transition-all text-sm"
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tambah Item Baru</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
            </div>

            {/* Items List */}
            {items.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-gray-300 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Calculator className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-base text-gray-500 mb-1">Belum ada item yang ditambahkan</p>
                <p className="text-xs sm:text-sm text-gray-400 mb-4">Klik tombol "Tambah Item Baru" untuk memulai</p>
                <Button
                  onClick={() => setIsAddItemModalOpen(true)}
                  variant="outline"
                  className="border-2 border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white rounded-lg px-5 py-4 text-sm"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Tambah Item Baru
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-[#EB216A]/50 transition-all shadow-md"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                          <span className="text-white text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm sm:text-base text-gray-900 capitalize">{item.type}</p>
                          <Badge className="bg-[#EB216A]/10 text-[#EB216A] border-0 text-xs mt-0.5">
                            {item.packageType === 'gorden-lengkap' ? 'Paket Lengkap' : 'Gorden Saja'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditItem(item)}
                          className="text-gray-400 hover:text-[#EB216A] transition-colors p-1"
                          title="Edit item"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Hapus item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ukuran:</span>
                        <span className="text-gray-900">{item.width} × {item.height} cm</span>
                      </div>
                      {calculatorType === 'kupu-kupu' && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Panel:</span>
                          <span className="text-gray-900">{item.panels} panel</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Jumlah:</span>
                        <span className="text-gray-900">{item.quantity}x</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>



          {/* Step 4: Results */}
          {items.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#EB216A] rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl text-white">4</span>
                </div>
                <h2 className="text-2xl text-gray-900">Rincian Biaya per Item</h2>
              </div>

              {/* Item Cards */}
              <div className="space-y-4 mb-6">
                {items.map((item, index) => {
                  const details = calculateItemDetails(item);

                  return (
                    <div key={item.id} className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-gray-200 shadow-lg">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-lg text-white">{index + 1}</span>
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl text-gray-900 capitalize mb-0.5">
                              {item.type} - {item.packageType === 'gorden-lengkap' ? 'Paket Lengkap' : 'Gorden Saja'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                              <span>{item.width} cm × {item.height} cm</span>
                              {calculatorType === 'kupu-kupu' && <span>• {item.panels} panel</span>}
                              <span>• Jumlah: {item.quantity}x</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Rincian Komponen */}
                      <div className="space-y-2">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-3">Rincian Komponen</h4>

                        {/* Kain Gorden */}
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div>
                            <p className="text-sm sm:text-base text-gray-900">{selectedProduct.name}</p>
                            <p className="text-xs text-gray-500">
                              {details.fabricMeters.toFixed(2)}m × Rp {selectedProduct.price.toLocaleString('id-ID')} × {item.quantity}
                            </p>
                          </div>
                          <p className="text-base sm:text-lg text-gray-900">
                            Rp {details.gordenPrice.toLocaleString('id-ID')}
                          </p>
                        </div>

                        {/* Komponen Lengkap */}
                        {item.packageType === 'gorden-lengkap' && (
                          <>
                            {/* Rel Gorden */}
                            <div className={`flex justify-between items-center py-2 border-b border-gray-100 ${!item.components?.relGorden ? 'opacity-50' : ''}`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm sm:text-base text-gray-900">
                                    {item.components?.relGorden ? item.components.relGorden.name : 'Rel Gorden'}
                                  </p>
                                  <Button
                                    onClick={() => handleOpenComponentModal(item.id, 'relGorden')}
                                    variant="outline"
                                    size="sm"
                                    className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white rounded-lg px-2 py-0.5 h-auto text-xs"
                                  >
                                    {item.components?.relGorden ? 'Ganti' : 'Pilih'}
                                  </Button>
                                </div>
                                {item.components?.relGorden ? (
                                  <p className="text-xs text-gray-500">
                                    {(item.width / 100).toFixed(2)}m × Rp {item.components.relGorden.price.toLocaleString('id-ID')} × {item.quantity}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400">
                                    Pilih varian rel gorden
                                  </p>
                                )}
                              </div>
                              <p className="text-base sm:text-lg text-gray-900">
                                Rp {details.relPrice.toLocaleString('id-ID')}
                              </p>
                            </div>

                            {/* Tassel */}
                            <div className={`flex justify-between items-center py-2 border-b border-gray-100 ${!item.components?.tassel ? 'opacity-50' : ''}`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm sm:text-base text-gray-900">
                                    {item.components?.tassel ? item.components.tassel.name : 'Tassel'}
                                  </p>
                                  <Button
                                    onClick={() => handleOpenComponentModal(item.id, 'tassel')}
                                    variant="outline"
                                    size="sm"
                                    className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white rounded-lg px-2 py-0.5 h-auto text-xs"
                                  >
                                    {item.components?.tassel ? 'Ganti' : 'Pilih'}
                                  </Button>
                                </div>
                                {item.components?.tassel ? (
                                  <p className="text-xs text-gray-500">
                                    Rp {item.components.tassel.price.toLocaleString('id-ID')} × {item.quantity}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400">
                                    Pilih varian tassel
                                  </p>
                                )}
                              </div>
                              <p className="text-base sm:text-lg text-gray-900">
                                Rp {details.tasselPrice.toLocaleString('id-ID')}
                              </p>
                            </div>

                            {/* Hook */}
                            <div className={`flex justify-between items-center py-2 border-b border-gray-100 ${!item.components?.hook ? 'opacity-50' : ''}`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm sm:text-base text-gray-900">
                                    {item.components?.hook ? item.components.hook.name : 'Hook'}
                                  </p>
                                  <Button
                                    onClick={() => handleOpenComponentModal(item.id, 'hook')}
                                    variant="outline"
                                    size="sm"
                                    className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white rounded-lg px-2 py-0.5 h-auto text-xs"
                                  >
                                    {item.components?.hook ? 'Ganti' : 'Pilih'}
                                  </Button>
                                </div>
                                {item.components?.hook ? (
                                  <p className="text-xs text-gray-500">
                                    {details.hookQuantity} pcs × Rp {item.components.hook.price.toLocaleString('id-ID')} × {item.quantity}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400">
                                    Pilih jenis hook
                                  </p>
                                )}
                              </div>
                              <p className="text-base sm:text-lg text-gray-900">
                                Rp {details.hookPrice.toLocaleString('id-ID')}
                              </p>
                            </div>

                            {/* Kain Vitrase */}
                            <div className={`flex justify-between items-center py-2 border-b border-gray-100 ${!item.components?.kainVitrase ? 'opacity-50' : ''}`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm sm:text-base text-gray-900">
                                    {item.components?.kainVitrase ? item.components.kainVitrase.name : 'Kain Vitrase'}
                                  </p>
                                  <Button
                                    onClick={() => handleOpenComponentModal(item.id, 'kainVitrase')}
                                    variant="outline"
                                    size="sm"
                                    className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white rounded-lg px-2 py-0.5 h-auto text-xs"
                                  >
                                    {item.components?.kainVitrase ? 'Ganti' : 'Pilih'}
                                  </Button>
                                </div>
                                {item.components?.kainVitrase ? (
                                  <p className="text-xs text-gray-500">
                                    {details.vitraseKainMeters.toFixed(2)}m × Rp {item.components.kainVitrase.price.toLocaleString('id-ID')} × {item.quantity}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400">
                                    Pilih jenis kain vitrase
                                  </p>
                                )}
                              </div>
                              <p className="text-base sm:text-lg text-gray-900">
                                Rp {details.vitraseKainPrice.toLocaleString('id-ID')}
                              </p>
                            </div>

                            {/* Rel Vitrase */}
                            <div className={`flex justify-between items-center py-2 border-b border-gray-100 ${!item.components?.relVitrase ? 'opacity-50' : ''}`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm sm:text-base text-gray-900">
                                    {item.components?.relVitrase ? item.components.relVitrase.name : 'Rel Vitrase'}
                                  </p>
                                  <Button
                                    onClick={() => handleOpenComponentModal(item.id, 'relVitrase')}
                                    variant="outline"
                                    size="sm"
                                    className="border-[#EB216A] text-[#EB216A] hover:bg-[#EB216A] hover:text-white rounded-lg px-2 py-0.5 h-auto text-xs"
                                  >
                                    {item.components?.relVitrase ? 'Ganti' : 'Pilih'}
                                  </Button>
                                </div>
                                {item.components?.relVitrase ? (
                                  <p className="text-xs text-gray-500">
                                    {(item.width / 100).toFixed(2)}m × Rp {item.components.relVitrase.price.toLocaleString('id-ID')} × {item.quantity}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400">
                                    Pilih varian rel vitrase
                                  </p>
                                )}
                              </div>
                              <p className="text-base sm:text-lg text-gray-900">
                                Rp {details.vitraseRelPrice.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Total Item */}
                        <div className="flex justify-between items-center pt-3 mt-1">
                          <p className="text-base sm:text-lg text-gray-900">Subtotal</p>
                          <p className="text-xl sm:text-2xl text-[#EB216A]">
                            Rp {details.totalItem.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grand Total */}
              <div className="bg-gradient-to-br from-[#EB216A] to-[#d11d5e] rounded-2xl p-6 sm:p-8 text-white shadow-2xl">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl mb-1">Total Keseluruhan</h3>
                    <p className="text-sm text-white/90">Untuk {items.length} item ({items.reduce((sum, item) => sum + item.quantity, 0)} unit)</p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-3xl sm:text-4xl lg:text-5xl">
                      Rp {grandTotal.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 mt-4">
                  <p className="text-xs sm:text-sm text-white/90 text-center">
                    ℹ️ Harga di atas adalah estimasi berdasarkan kalkulasi {calculatorType}.
                    Harga final dapat berbeda tergantung detail pemesanan dan instalasi.
                  </p>
                </div>

                {/* WhatsApp Button */}
                <div className="mt-6">
                  <Button
                    onClick={handleSendToWhatsApp}
                    className="w-full bg-white hover:bg-white/90 text-[#EB216A] rounded-xl py-6 shadow-xl hover:shadow-2xl transition-all group"
                    size="lg"
                  >
                    <MessageCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    <span className="text-base sm:text-lg">Kirim ke WhatsApp Admin</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Product Selection Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl">Pilih Produk Gorden</DialogTitle>
            <DialogDescription>
              Pilih produk gorden yang ingin Anda gunakan untuk kalkulasi
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#EB216A] focus:ring-2 focus:ring-[#EB216A]/20 transition-all"
            />
          </div>

          {/* Products Grid */}
          <div className="overflow-y-auto max-h-[50vh] pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className={`group relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${selectedProduct.id === product.id
                    ? 'border-[#EB216A] shadow-lg'
                    : 'border-gray-200 hover:border-[#EB216A]/50 shadow-sm hover:shadow-md'
                    }`}
                >
                  {/* Selected Badge */}
                  {selectedProduct.id === product.id && (
                    <div className="absolute top-2 right-2 z-10 w-7 h-7 bg-[#EB216A] rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Image */}
                  <div className="relative h-32 overflow-hidden bg-gray-100">
                    <img
                      src={getProductImageUrl(product.images || product.image)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <Badge className="absolute top-2 left-2 bg-[#EB216A] text-white border-0 shadow-md text-xs">
                      {product.category}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="p-3 bg-white">
                    <h3 className="text-sm text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg text-[#EB216A]">
                        {(product.price / 1000).toFixed(0)}k
                      </span>
                      <span className="text-xs text-gray-500">/ m</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Produk tidak ditemukan</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Modal */}
      <Dialog open={isAddItemModalOpen} onOpenChange={(open) => {
        setIsAddItemModalOpen(open);
        if (!open) {
          setEditingFormItemId(null);
          setWidth('');
          setHeight('');
          setPanels('2');
          setQuantity('1');
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingFormItemId ? 'Edit Item' : 'Tambah Item Baru'}</DialogTitle>
            <DialogDescription className="text-sm">
              {editingFormItemId ? 'Ubah ukuran dan detail item' : 'Masukkan ukuran dan detail item yang ingin Anda hitung'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Jenis - Hidden untuk blind */}
            {calculatorType !== 'blind' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Jenis</label>
                <div className="relative">
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as ItemType)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:border-[#EB216A] focus:ring-2 focus:ring-[#EB216A]/20 transition-all text-sm"
                  >
                    <option value="jendela">Jendela</option>
                    <option value="pintu">Pintu</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Lebar */}
            <div>
              <label className="block text-sm text-gray-700 mb-1.5">Lebar (cm)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="Contoh: 150"
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A] focus:ring-2 focus:ring-[#EB216A]/20 transition-all text-sm"
              />
            </div>

            {/* Tinggi */}
            <div>
              <label className="block text-sm text-gray-700 mb-1.5">Tinggi (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Contoh: 200"
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A] focus:ring-2 focus:ring-[#EB216A]/20 transition-all text-sm"
              />
            </div>

            {/* Jumlah Panel (hanya untuk kupu-kupu) */}
            {calculatorType === 'kupu-kupu' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Jumlah Panel</label>
                <input
                  type="number"
                  value={panels}
                  onChange={(e) => setPanels(e.target.value)}
                  placeholder="Contoh: 2"
                  min="1"
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A] focus:ring-2 focus:ring-[#EB216A]/20 transition-all text-sm"
                />
              </div>
            )}

            {/* Jumlah */}
            <div>
              <label className="block text-sm text-gray-700 mb-1.5">Jumlah</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Contoh: 1"
                min="1"
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-[#EB216A] focus:ring-2 focus:ring-[#EB216A]/20 transition-all text-sm"
              />
            </div>

            {/* Jenis Paket - Hidden untuk blind */}
            {calculatorType !== 'blind' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Jenis Paket</label>
                <div className="relative">
                  <select
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value as PackageType)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:border-[#EB216A] focus:ring-2 focus:ring-[#EB216A]/20 transition-all text-sm"
                  >
                    <option value="gorden-saja">Gorden Saja</option>
                    <option value="gorden-lengkap">Gorden Lengkap</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Button Tambah/Update */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  setIsAddItemModalOpen(false);
                  setEditingFormItemId(null);
                }}
                variant="outline"
                className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg py-5 text-sm"
              >
                Batal
              </Button>
              <Button
                onClick={handleAddItem}
                className="flex-1 bg-[#EB216A] hover:bg-[#d11d5e] text-white rounded-lg py-5 shadow-lg hover:shadow-xl transition-all text-sm"
              >
                {editingFormItemId ? (
                  <>
                    <Pencil className="w-4 h-4 mr-1.5" />
                    Update
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1.5" />
                    Tambah
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Component Selection Modal */}
      {editingItemId && editingComponentType && (
        <SingleComponentModal
          isOpen={isComponentModalOpen}
          onClose={() => {
            setIsComponentModalOpen(false);
            setEditingItemId(null);
            setEditingComponentType(null);
          }}
          title={
            editingComponentType === 'relGorden' ? 'Pilih Rel Gorden' :
              editingComponentType === 'tassel' ? 'Pilih Tassel' :
                editingComponentType === 'hook' ? 'Pilih Hook' :
                  editingComponentType === 'kainVitrase' ? 'Pilih Kain Vitrase' :
                    'Pilih Rel Vitrase'
          }
          description={
            editingComponentType === 'relGorden' ? 'Pilih jenis rel gorden yang sesuai dengan kebutuhan Anda' :
              editingComponentType === 'tassel' ? 'Pilih tassel untuk mempercantik gorden Anda' :
                editingComponentType === 'hook' ? 'Pilih jenis hook untuk gantungan gorden' :
                  editingComponentType === 'kainVitrase' ? 'Pilih kain vitrase untuk layer tipis' :
                    'Pilih rel vitrase untuk kain vitrase'
          }
          options={
            editingComponentType === 'relGorden'
              ? getFilteredRelOptions(items.find(item => item.id === editingItemId)?.width || 0)
              : editingComponentType === 'tassel'
                ? tasselOptions
                : editingComponentType === 'hook'
                  ? hookOptions
                  : editingComponentType === 'kainVitrase'
                    ? kainVitraseOptions
                    : getFilteredRelVitraseOptions(items.find(item => item.id === editingItemId)?.width || 0)
          }
          currentSelection={items.find(item => item.id === editingItemId)?.components?.[editingComponentType]}
          onSelect={(component) => {
            handleSelectComponent(editingComponentType, component);
          }}
        />
      )}
    </div>
  );
}