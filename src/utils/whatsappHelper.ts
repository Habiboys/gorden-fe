// WhatsApp Chat Admin Utility
// Ubah nomor dan template pesan di sini untuk semua tombol "Chat Admin"

// Nomor WhatsApp Admin (format: 62xxxxxxxxxx tanpa + atau spasi)
export const ADMIN_WHATSAPP_NUMBER = '6285142247464';

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
