import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { wishlistApi } from '../utils/api';
import { useAuth } from './AuthContext';

interface WishlistProduct {
    id: string;
    name: string;
    price: number;
    images?: string | string[];
    category_id?: string;
}

interface WishlistContextType {
    wishlistItems: string[];
    wishlistProducts: WishlistProduct[];
    wishlistCount: number;
    isInWishlist: (productId: string) => boolean;
    addToWishlist: (productId: string) => Promise<void>;
    removeFromWishlist: (productId: string) => Promise<void>;
    toggleWishlist: (productId: string) => Promise<void>;
    refreshWishlist: () => Promise<void>;
    loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

interface WishlistProviderProps {
    children: ReactNode;
}

export const WishlistProvider: React.FC<WishlistProviderProps> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [wishlistItems, setWishlistItems] = useState<string[]>([]);
    const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const refreshWishlist = useCallback(async () => {
        if (!isAuthenticated) {
            // Load from localStorage for guest
            try {
                const savedWishlist = localStorage.getItem('gorden_wishlist_items');
                if (savedWishlist) {
                    const productIds = JSON.parse(savedWishlist);
                    setWishlistItems(productIds);
                    setWishlistCount(productIds.length);
                    // Note: We can't easily get full product details without API call here
                    // For now we just store IDs locally
                } else {
                    setWishlistItems([]);
                    setWishlistCount(0);
                }
            } catch (e) {
                console.error('Error loading local wishlist:', e);
            }
            return;
        }

        try {
            setLoading(true);
            const response = await wishlistApi.getAll();
            if (response.success && response.data) {
                const products = response.data as WishlistProduct[];
                const productIds = products.map((item) => item.id);
                setWishlistItems(productIds);
                setWishlistProducts(products);
                setWishlistCount(productIds.length);
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        refreshWishlist();
    }, [refreshWishlist]);

    const isInWishlist = useCallback((productId: string) => {
        return wishlistItems.includes(productId);
    }, [wishlistItems]);

    const addToWishlist = useCallback(async (productId: string) => {
        if (!isAuthenticated) {
            // Guest mode - LocalStorage
            try {
                const currentItems = [...wishlistItems];
                if (!currentItems.includes(productId)) {
                    const newItems = [...currentItems, productId];
                    localStorage.setItem('gorden_wishlist_items', JSON.stringify(newItems));
                    setWishlistItems(newItems);
                    setWishlistCount(newItems.length);
                    toast.success('Ditambahkan ke wishlist');
                }
            } catch (e) {
                console.error('Error saving local wishlist:', e);
            }
            return;
        }

        try {
            const response = await wishlistApi.add(productId);
            if (response.success) {
                setWishlistItems(prev => [...prev, productId]);
                setWishlistCount(prev => prev + 1);
                toast.success('Ditambahkan ke wishlist');
                // Refresh to get updated product data
                refreshWishlist();
            } else {
                toast.error(response.message || 'Gagal menambahkan ke wishlist');
            }
        } catch (error: any) {
            toast.error(error.message || 'Gagal menambahkan ke wishlist');
        }
    }, [isAuthenticated, refreshWishlist, wishlistItems]);

    const removeFromWishlist = useCallback(async (productId: string) => {
        if (!isAuthenticated) {
            // Guest mode - LocalStorage
            try {
                const newItems = wishlistItems.filter(id => id !== productId);
                localStorage.setItem('gorden_wishlist_items', JSON.stringify(newItems));
                setWishlistItems(newItems);
                setWishlistCount(newItems.length);
                toast.success('Dihapus dari wishlist');
            } catch (e) {
                console.error('Error updating local wishlist:', e);
            }
            return;
        }

        try {
            const response = await wishlistApi.remove(productId);
            if (response.success) {
                setWishlistItems(prev => prev.filter(id => id !== productId));
                setWishlistProducts(prev => prev.filter(p => p.id !== productId));
                setWishlistCount(prev => Math.max(0, prev - 1));
                toast.success('Dihapus dari wishlist');
            } else {
                toast.error(response.message || 'Gagal menghapus dari wishlist');
            }
        } catch (error: any) {
            toast.error(error.message || 'Gagal menghapus dari wishlist');
        }
    }, [isAuthenticated, wishlistItems]);

    const toggleWishlist = useCallback(async (productId: string) => {
        if (isInWishlist(productId)) {
            await removeFromWishlist(productId);
        } else {
            await addToWishlist(productId);
        }
    }, [isInWishlist, addToWishlist, removeFromWishlist]);

    return (
        <WishlistContext.Provider
            value={{
                wishlistItems,
                wishlistProducts,
                wishlistCount,
                isInWishlist,
                addToWishlist,
                removeFromWishlist,
                toggleWishlist,
                refreshWishlist,
                loading,
            }}
        >
            {children}
        </WishlistContext.Provider>
    );
};
