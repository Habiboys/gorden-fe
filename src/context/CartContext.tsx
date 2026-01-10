import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CartItem {
    id: string;
    name: string;
    sku?: string;
    price: number;
    quantity: number;
    image: string;
    packageType?: string;
    notes?: string;
}

interface CartContextType {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => boolean;
    removeFromCart: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'gorden_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);
            if (savedCart) {
                setItems(JSON.parse(savedCart));
            }
        } catch (error) {
            console.error('Error loading cart from storage:', error);
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addToCart = (item: Omit<CartItem, 'quantity'>, quantity: number = 1): boolean => {
        // Allow guest to add to cart (stored in localStorage)

        setItems(prevItems => {
            const existingItem = prevItems.find(i => i.id === item.id);

            if (existingItem) {
                // Update quantity if item already exists
                return prevItems.map(i =>
                    i.id === item.id
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                );
            } else {
                // Add new item
                return [...prevItems, { ...item, quantity }];
            }
        });

        // Open cart sidebar after adding
        setIsCartOpen(true);
        return true;
    };

    const removeFromCart = (id: string) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }

        setItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
        localStorage.removeItem(CART_STORAGE_KEY);
    };

    const getTotal = (): number => {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getItemCount = (): number => {
        return items.reduce((count, item) => count + item.quantity, 0);
    };

    const openCart = () => setIsCartOpen(true);
    const closeCart = () => setIsCartOpen(false);

    return (
        <CartContext.Provider
            value={{
                items,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                getTotal,
                getItemCount,
                isCartOpen,
                openCart,
                closeCart
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
