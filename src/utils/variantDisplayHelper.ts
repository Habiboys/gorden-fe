/**
 * Variant Display Helper
 * 
 * Handles formatting of variant attribute values:
 * - Database stores: numbers only (100, 200, 2)
 * - Display shows: with prefix (L 100, T 200, 2)
 * - Handles legacy data that may already have prefixes
 */

// Prefix mapping based on attribute name
const ATTR_PREFIX_MAP: Record<string, string> = {
    'lebar': 'L',
    'width': 'L',
    'l': 'L',
    'tinggi': 'T',
    'height': 'T',
    't': 'T',
};

/**
 * Normalize attribute value by stripping any existing prefix
 * Used for comparison and deduplication
 * Examples:
 *   "L 100" → "100"
 *   "T 200" → "200"
 *   "100" → "100"
 *   "2" → "2"
 */
export const normalizeAttrValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();
    // Remove L/T prefix (with or without space) if present at start
    return str.replace(/^[LT]\s*/i, '');
};

/**
 * Format attribute value for display with appropriate prefix
 * Examples:
 *   ("Lebar", "100") → "L 100"
 *   ("Tinggi", "200") → "T 200"
 *   ("Sibak", "2") → "2"
 *   ("Lebar", "L 100") → "L 100" (already has prefix)
 */
export const formatAttrValue = (attrName: string, value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();

    // Check if already has the correct prefix
    const prefix = ATTR_PREFIX_MAP[attrName.toLowerCase()];
    if (!prefix) return str;

    // Already has prefix? Return as-is
    if (str.toUpperCase().startsWith(prefix + ' ') || str.toUpperCase().startsWith(prefix)) {
        // Normalize format to "L 100" (with space)
        const normalized = normalizeAttrValue(str);
        return `${prefix} ${normalized}`;
    }

    // Add prefix
    return `${prefix} ${str}`;
};

/**
 * Check if an attribute name should have a prefix
 */
export const shouldHavePrefix = (attrName: string): boolean => {
    return attrName.toLowerCase() in ATTR_PREFIX_MAP;
};

/**
 * Format all attributes in an object for display
 */
export const formatAttrsForDisplay = (attrs: Record<string, any>): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(attrs)) {
        result[key] = formatAttrValue(key, value);
    }
    return result;
};

/**
 * Normalize all attributes in an object for comparison
 */
export const normalizeAttrsForComparison = (attrs: Record<string, any>): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(attrs)) {
        result[key] = normalizeAttrValue(value);
    }
    return result;
};

/**
 * Safely parse JSON, returns default value if parsing fails
 */
const safeJSONParse = (data: any, defaultValue: any = {}): any => {
    if (!data) return defaultValue;
    if (typeof data === 'object') return data;
    try {
        return JSON.parse(data);
    } catch {
        return defaultValue;
    }
};

/**
 * Deduplicate variants based on attributes and price
 * Normalizes attribute values (strips L/T prefixes) for comparison
 */
export const deduplicateVariants = (variants: any[]): any[] => {
    const uniqueMap = new Map();
    return variants.filter(v => {
        const attrs = safeJSONParse(v.attributes, {});
        const sortedAttrs = Object.keys(attrs).sort().reduce((obj: Record<string, string>, key) => {
            obj[key] = normalizeAttrValue(attrs[key]);
            return obj;
        }, {} as Record<string, string>);

        const key = JSON.stringify(sortedAttrs) +
            `-${v.price_net || v.price_gross || v.price}-` +
            `${v.quantity_multiplier || 1}`;

        if (uniqueMap.has(key)) {
            return false;
        }
        uniqueMap.set(key, true);
        return true;
    });
};
