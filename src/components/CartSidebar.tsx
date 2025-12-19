import { MessageCircle, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { getProductImageUrl } from '../utils/imageHelper';
import { Button } from './ui/button';

export function CartSidebar() {
    const { items, isCartOpen, closeCart, removeFromCart, updateQuantity, getTotal, getItemCount } = useCart();
    const navigate = useNavigate();

    if (!isCartOpen) return null;

    // Use Portal to render outside of parent DOM hierarchy
    return createPortal(
        <div className="cart-sidebar-portal">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                style={{ zIndex: 9998 }}
                onClick={closeCart}
            />

            {/* Sidebar - from RIGHT */}
            <div
                className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl flex flex-col"
                style={{ zIndex: 9999 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <ShoppingCart className="w-6 h-6 text-[#EB216A]" />
                        <h2 className="text-xl font-semibold text-gray-900">Keranjang</h2>
                        <span className="bg-[#EB216A] text-white text-sm px-2.5 py-0.5 rounded-full">
                            {getItemCount()}
                        </span>
                    </div>
                    <button
                        onClick={closeCart}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Cart Items - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                            <p className="text-gray-500 mb-2">Keranjang Anda kosong</p>
                            <p className="text-sm text-gray-400">Mulai belanja dan tambahkan produk ke keranjang</p>
                            <Button
                                className="mt-6 bg-[#EB216A] hover:bg-[#d11d5e] text-white"
                                onClick={() => {
                                    closeCart();
                                    navigate('/products');
                                }}
                            >
                                Mulai Belanja
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 p-4 bg-gray-50 rounded-xl"
                                >
                                    {/* Product Image */}
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                        <img
                                            src={getProductImageUrl(item.image)}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                                            {item.name}
                                        </h3>
                                        {item.packageType && (
                                            <p className="text-xs text-gray-500 mb-2">{item.packageType}</p>
                                        )}
                                        <p className="text-[#EB216A] font-semibold">
                                            Rp {item.price.toLocaleString('id-ID')}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-l-lg transition-colors"
                                                >
                                                    <Minus className="w-4 h-4 text-gray-600" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1.5 hover:bg-gray-100 rounded-r-lg transition-colors"
                                                >
                                                    <Plus className="w-4 h-4 text-gray-600" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer - Fixed at bottom */}
                {items.length > 0 && (
                    <div className="p-6 bg-white border-t border-gray-100 flex-shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-600">Total</span>
                            <span className="text-xl font-bold text-[#EB216A]">
                                Rp {getTotal().toLocaleString('id-ID')}
                            </span>
                        </div>
                        <Button
                            className="w-full bg-green-500 hover:bg-green-600 text-white py-6 text-lg rounded-xl"
                            onClick={() => {
                                // Open WhatsApp chat with admin
                                const message = encodeURIComponent(`Halo, saya ingin bertanya tentang pesanan saya dengan ${getItemCount()} item senilai Rp ${getTotal().toLocaleString('id-ID')}`);
                                window.open(`https://wa.me/6285142247464?text=${message}`, '_blank');
                            }}
                        >
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Chat Admin
                        </Button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
