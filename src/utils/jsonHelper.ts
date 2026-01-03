/**
 * Safely parses a JSON string or returns the original value if it's already an object/array.
 * Handles cases where the database returns a stringified JSON (text) instead of a JSON object.
 * @param data The data to parse (string or object)
 * @param fallback The fallback value if parsing fails (default: [])
 */
export const safeJSONParse = <T>(data: any, fallback: T = [] as any): T => {
    if (!data) return fallback;

    // If it's already an object (and not null), return it
    if (typeof data === 'object') return data;

    // If it's a string, try to parse it
    if (typeof data === 'string') {
        try {
            // Check if it looks like a JSON object or array
            const trimmed = data.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error('Failed to parse JSON:', e);
            return fallback;
        }
    }

    return fallback;
};
