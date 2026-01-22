
/**
 * Transforms HTML content to ensure all image src attributes have valid full URLs.
 * It searches for img tags with relative paths (starting with /uploads) and prepends the API base URL.
 * 
 * @param htmlContent The raw HTML content from the rich text editor
 * @returns Processed HTML string with valid image URLs
 */
export const processHtmlContentCallbacks = (htmlContent: string): string => {
    if (!htmlContent) return '';

    // Create a temporary element to parse HTML
    const div = document.createElement('div');
    div.innerHTML = htmlContent;

    // Process all images
    const images = div.getElementsByTagName('img');
    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const src = img.getAttribute('src');

        if (src) {
            // Check if it's a relative path starting with /uploads
            if (src.startsWith('/uploads/')) {
                // Use the existing helper to transform it
                // getProductImageUrl expects an array or string, we pass string
                // But getProductImageUrl returns ONE string url.
                // We can reuse getProductImageUrl logic but we need to bypass the array check/json parse check 
                // because we know it's a raw URL string here.

                // Let's rely on the environment var logic used in imageHelper directly for simplicity/performance
                // or import the helper if robust.

                // Better: Reuse imageHelper logic
                // But imageHelper.getImageUrl is not exported directly usually, let's check.
                // It seems getProductImageUrl is the main export.

                // Let's manually implement the base URL prepend logic to be safe and avoid circular dependencies or complex imports if not needed.
                const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://apigorden.oblixpilates.com/api/v1';
                const baseUrl = API_BASE_URL.replace('/api/v1', '');

                img.setAttribute('src', `${baseUrl}${src}`);
            }
        }
    }

    return div.innerHTML;
};
