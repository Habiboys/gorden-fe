const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apigorden.oblixpilates.com/api/v1';

// Extract the base URL without /api/v1
const getBaseUrl = (): string => {
    return API_BASE_URL.replace('/api/v1', '');
};

/**
 * Transform image URL from localhost to production URL
 * Handles old data that was saved with localhost URLs
 */
export const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';

    // If it's already a relative path, prepend the base URL
    if (url.startsWith('/uploads/')) {
        return `${getBaseUrl()}${url}`;
    }

    // If it's a localhost URL, replace with production URL
    if (url.includes('localhost:3000')) {
        return url.replace(/http:\/\/localhost:3000/g, getBaseUrl());
    }

    // If it's already a full URL (https or production), return as-is
    return url;
};

const FALLBACK_IMAGE = 'https://placehold.co/400x400/f3f4f6/9ca3af?text=No+Image';

export const safelyParseImages = (urlData: any): string[] => {
    if (!urlData) return [];

    // If it's already an array, use it
    if (Array.isArray(urlData)) return urlData;

    // If it's a string, try to parse/clean it
    if (typeof urlData === 'string') {
        const trimmed = urlData.trim();
        if (trimmed.startsWith('[')) {
            try {
                // Replace single quotes with double quotes for valid JSON
                const validJson = trimmed.replace(/'/g, '"');
                const parsed = JSON.parse(validJson);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {
                // Fallback or ignore parse error
                console.error('Safe parse failed for:', urlData);
            }
        } else {
            // It's a simple single URL string
            return [urlData];
        }
    }

    return [];
};

/**
 * Get product image URL - parses JSON if needed, transforms localhost URLs, returns first image or fallback
 */
export const getProductImageUrl = (images: any, fallback: string = FALLBACK_IMAGE): string => {
    const parsedImages = safelyParseImages(images);

    if (parsedImages.length === 0) {
        return fallback;
    }

    // Get first valid image and transform URL
    const firstImage = parsedImages[0];
    return getImageUrl(firstImage) || fallback;
};

/**
 * Get all product images as array - parses JSON if needed, transforms all localhost URLs
 */
export const getProductImagesArray = (images: any): string[] => {
    const parsedImages = safelyParseImages(images);

    if (parsedImages.length === 0) {
        return [FALLBACK_IMAGE];
    }

    // Transform all URLs
    return parsedImages.map(img => getImageUrl(img) || FALLBACK_IMAGE);
};
