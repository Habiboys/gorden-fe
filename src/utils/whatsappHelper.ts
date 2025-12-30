// WhatsApp Chat Admin Utility
// Ubah nomor dan template pesan di sini untuk semua tombol "Chat Admin"

// Nomor WhatsApp Admin (format: 62xxxxxxxxxx tanpa + atau spasi)
export const ADMIN_WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '6285142247464';

// Template pesan
export const whatsappTemplates = {
    // Pesan dari CartSidebar
    cartInquiry: (itemCount: number, total: string) =>
        `Halo kak, saya ingin bertanya tentang pesanan saya dengan ${itemCount} item senilai ${total}`,

    // Pesan dari ProfilePage (dengan detail produk)
    orderFromProfile: (userName: string, productList: string, total: string) =>
        `Halo kak, saya ${userName} ingin memesan:\n\n${productList}\n\nTotal: ${total}`,

    // Pesan dari ProductDetail
    productInquiry: (productName: string, price: string) =>
        `Halo kak, saya tertarik dengan produk "${productName}" seharga ${price}. Boleh minta info lebih lanjut?`,

    // Pesan umum
    general: () =>
        `Halo kak, saya ingin bertanya mengenai produk Amagriya Gorden`,

    // Pesan dari Floating Button
    floatButton: () =>
        `Hallo kak, bisa di bantu informasi mengenai gordennya?`,
};

// Function untuk generate WhatsApp URL
export const generateWhatsAppUrl = (message: string, customNumber?: string): string => {
    const phoneNumber = customNumber || ADMIN_WHATSAPP_NUMBER;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
};

// Function untuk membuka WhatsApp chat
export const openWhatsAppChat = (message: string, customNumber?: string): void => {
    const url = generateWhatsAppUrl(message, customNumber);
    window.open(url, '_blank');
};

// Helper functions untuk penggunaan langsung
export const chatAdminFromCart = (itemCount: number, total: string): void => {
    const message = whatsappTemplates.cartInquiry(itemCount, total);
    openWhatsAppChat(message);
};

export const chatAdminFromProfile = (userName: string, productList: string, total: string): void => {
    const message = whatsappTemplates.orderFromProfile(userName, productList, total);
    openWhatsAppChat(message);
};

export const chatAdminAboutProduct = (productName: string, price: string): void => {
    const message = whatsappTemplates.productInquiry(productName, price);
    openWhatsAppChat(message);
};

export const chatAdminGeneral = (): void => {
    const message = whatsappTemplates.general();
    openWhatsAppChat(message);
};

export const chatAdminFromFloatingButton = (): void => {
    const message = whatsappTemplates.floatButton();
    openWhatsAppChat(message);
};

// Types needed for calculator message
export interface CalculatorMessageParams {
    customerInfo: { name: string; phone: string };
    currentType: { name: string; components?: any[] };
    selectedFabric: { id: string; name: string; price: number };
    items: any[];
    grandTotal: number;
    baseUrl: string;
    calculateItemPrice: (item: any) => { fabric: number; fabricMeters: number; components: number; total: number };
    calculateComponentPrice: (item: any, comp: any, selection: any) => number;
}

export const generateCalculatorMessage = ({
    customerInfo,
    currentType,
    selectedFabric,
    items,
    grandTotal,
    baseUrl,
    calculateItemPrice,
    calculateComponentPrice
}: CalculatorMessageParams): string => {
    if (!customerInfo || !selectedFabric || !currentType) return '';

    const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let message = `*ESTIMASI ORDER GORDEN*\n`;
    message += `Tanggal: ${date}\n`;
    message += `Jenis: ${currentType.name}\n\n`;

    message += `*DATA PEMESAN*\n`;
    message += `Nama: ${customerInfo.name}\n`;
    message += `No. HP: ${customerInfo.phone}\n`;
    message += `------------------------------\n\n`;

    // Group Items (Universal Grouping)
    const groups: { [key: string]: any[] } = {};
    items.forEach(item => {
        const groupKey = item.groupId || item.product?.id || 'default';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(item);
    });

    Object.values(groups).forEach((groupItems) => {
        const firstItem = groupItems[0];
        const product = firstItem.product || selectedFabric;
        const groupTotal = groupItems.reduce((sum, item) => sum + calculateItemPrice(item).total, 0);

        message += `*PRODUK: ${product.name}*\n`;
        message += `Link: ${baseUrl}/product/${product.id}\n`;
        message += `Harga: Rp ${product.price?.toLocaleString('id-ID')}/m\n\n`;

        message += `*DAFTAR ITEM & UKURAN:*\n`;
        groupItems.forEach((item, idx) => {
            const prices = calculateItemPrice(item);

            // Item Header
            message += `${idx + 1}. ${item.itemType === 'pintu' ? 'Pintu' : 'Jendela'} ${item.width}cm x ${item.height}cm\n`;
            message += `   Jumlah: ${item.quantity} unit\n`;

            // Variant
            if (item.selectedVariant) {
                message += `   - Varian: ${item.selectedVariant.name}\n`;
            }

            // Components
            if (item.packageType === 'gorden-lengkap' && currentType.components) {
                const activeComponents: string[] = [];
                currentType.components.forEach((comp: any) => {
                    const selection = item.components?.[comp.id];
                    if (selection) {
                        activeComponents.push(`${comp.label}: ${selection.product.name} (x${selection.qty})`);
                    }
                });

                if (activeComponents.length > 0) {
                    activeComponents.forEach(compInfo => {
                        message += `   - ${compInfo}\n`;
                    });
                }
            }

            // Item Total
            message += `   Total: Rp ${prices.total.toLocaleString('id-ID')}\n\n`;
        });

        message += `Subtotal Group: *Rp ${groupTotal.toLocaleString('id-ID')}*\n`;
        message += `------------------------------\n\n`;
    });

    message += `*TOTAL ESTIMASI: Rp ${grandTotal.toLocaleString('id-ID')}*\n\n`;
    message += `_Catatan: Harga diatas adalah estimasi awal. Harga final dapat menyesuaikan dengan hasil pengukuran ulang di lokasi._\n\n`;
    message += `Terima kasih telah mempercayakan kebutuhan gorden Anda kepada *Amagriya Gorden*`;

    return message;
};

export const chatAdminFromCalculator = (params: CalculatorMessageParams) => {
    const message = generateCalculatorMessage(params);
    openWhatsAppChat(message);
};
