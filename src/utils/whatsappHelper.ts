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
    calculateItemPrice
}: CalculatorMessageParams): string => {
    if (!customerInfo || !selectedFabric || !currentType) return '';

    const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    let message = `*ORDER GORDEN - ${currentType.name?.toUpperCase()}*\n`;
    message += `Tanggal: ${date}\n\n`;

    message += `*PELANGGAN*\n`;
    message += `Nama: ${customerInfo.name}\n`;
    message += `No. HP: ${customerInfo.phone}\n`;
    message += `------------------------------\n\n`;

    // Collections for consolidated links
    const productLinks = new Set<string>();

    // Group Items (Universal Grouping)
    const groups: { [key: string]: any[] } = {};
    items.forEach(item => {
        const groupKey = item.groupId || item.product?.id || 'default';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(item);

        // Collect Link: Prefer Product SKU -> Product ID
        const p = item.product || selectedFabric;
        const sku = p.sku || p.id;
        if (sku) {
            // Ensure we don't double slash if baseUrl has trailing slash, though window.origin usually doesn't
            productLinks.add(`${baseUrl}/product/${sku}`);
        }
    });

    Object.values(groups).forEach((groupItems) => {
        const firstItem = groupItems[0];
        const product = firstItem.product || selectedFabric;
        // Group Total
        const groupTotal = groupItems.reduce((sum, item) => sum + calculateItemPrice(item).total, 0);

        message += `*PRODUK: ${product.name}*\n`;
        message += `Harga: Rp ${(product.price || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}/m\n\n`;

        message += `*DAFTAR ITEM & UKURAN:*\n`;
        groupItems.forEach((item, idx) => {
            // const prices = calculateItemPrice(item);

            // Format dimensions
            const w = item.width || 0;
            const h = item.height || 0;
            const qty = item.quantity || 1;
            const type = item.itemType === 'pintu' ? 'Pintu' : 'Jendela';

            message += `${idx + 1}. ${type} ${w}cm x ${h}cm\n`;
            message += `   Jumlah: ${qty} unit\n`;

            // Variant info
            if (item.selectedVariant) {
                const vName = item.selectedVariant.name;
                const vPriceNet = item.selectedVariant.price_net || item.selectedVariant.price || 0;
                const vMultiplier = item.selectedVariant.quantity_multiplier || 1;
                const fabricQty = qty * vMultiplier;
                // const fabricTotal = vPriceNet * fabricQty;

                message += `   - Kain: ${vName}\n`;
                message += `     ${fabricQty}x @ Rp ${vPriceNet.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
                // message += ` = Rp ${fabricTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}\n`;
                message += `\n`;
            }

            // Components info
            if (item.packageType === 'gorden-lengkap' && currentType.components) {
                currentType.components.forEach((comp: any) => {
                    const selection = item.components?.[comp.id];
                    if (selection) {
                        const cProduct = selection.product;
                        const cQty = selection.qty; // Note: displayQty logic handled in UI, here we trust selection.qty or re-calc if needed?
                        // Actually component price func handles multiplication. 
                        // Visual format: 
                        message += `   + ${cProduct.name} (${cQty}x)\n`;

                        // Add component link
                        const cSku = cProduct.sku || cProduct.id;
                        if (cSku) {
                            productLinks.add(`${baseUrl}/product/${cSku}`);
                        }
                    }
                });
            }

            // Item Subtotal (Optional, keeping consistent with request "Total Items" or just Group Subtotal)
            // message += `   Subtotal: Rp ${prices.total.toLocaleString('id-ID')}\n`;
            message += `\n`;
        });

        message += `Subtotal Group: *Rp ${groupTotal.toLocaleString('id-ID')}*\n`;
        message += `------------------------------\n\n`;
    });

    // Grand Totals
    message += `Total = Rp ${grandTotal.toLocaleString('id-ID')}\n`;
    message += `*Total Biaya Rp ${grandTotal.toLocaleString('id-ID')}*\n`;

    // Consolidated Links Section
    if (productLinks.size > 0) {
        message += `\nBerikut Produk yang digunakan\n`;
        message += `Link\n`;
        productLinks.forEach(link => {
            message += `. ${link}\n`;
        });
    }

    message += `\nTerima kasih telah mempercayakan kebutuhan Gorden | Blind Anda kepada Amagriya`;

    return message;
};

export const chatAdminFromCalculator = (params: CalculatorMessageParams) => {
    const message = generateCalculatorMessage(params);
    openWhatsAppChat(message);
};
