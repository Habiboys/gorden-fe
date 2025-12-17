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
