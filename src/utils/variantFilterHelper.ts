/**
 * Variant Filter Helper
 * 
 * Utility untuk filter varian berdasarkan dimensi input dan aturan filter.
 * 
 * UPDATED: Uses dynamic range-based matching instead of exact-match.
 * This allows odd dimensions (e.g., 115cm, 227cm) to correctly find
 * the next available variant sizes.
 */

export interface DimensionInput {
    width: number;  // dalam cm
    height: number; // dalam cm
}

export type VariantFilterRule =
    | 'none'
    | 'gorden-smokering'
    | 'rel-4-sizes'
    | 'vitrase-kombinasi';

/**
 * Filter rules label untuk display
 */
export const VARIANT_FILTER_RULES: { value: VariantFilterRule; label: string; description: string }[] = [
    { value: 'none', label: 'Tanpa Filter', description: 'Tampilkan semua varian' },
    { value: 'gorden-smokering', label: 'Gorden Smokering', description: 'Sibak 1/2 + 4 tinggi terdekat' },
    { value: 'rel-4-sizes', label: 'Rel (4 Ukuran)', description: '4 ukuran lebar terdekat' },
    { value: 'vitrase-kombinasi', label: 'Vitrase (Kombinasi)', description: '4 lebar × 4 tinggi terdekat' },
];

/**
 * Parse JSON attributes safely
 */
function parseAttributes(attrs: any): Record<string, any> {
    if (!attrs) return {};
    if (typeof attrs === 'string') {
        try {
            return JSON.parse(attrs);
        } catch {
            return {};
        }
    }
    return attrs;
}

/**
 * Get numeric value from attribute (handles string numbers)
 */
function getNumericAttr(attrs: Record<string, any>, keys: string[]): number | null {
    for (const key of keys) {
        const val = attrs[key];
        if (val !== undefined && val !== null) {
            const num = typeof val === 'string' ? parseInt(val.replace(/[^\d]/g, '')) : Number(val);
            if (!isNaN(num)) return num;
        }
    }
    return null;
}

/**
 * Get unique sorted attribute values from all variants
 */
function getUniqueAttrValues(variants: any[], attrKeys: string[]): number[] {
    const values = new Set<number>();
    variants.forEach(v => {
        const attrs = parseAttributes(v.attributes);
        const val = getNumericAttr(attrs, attrKeys);
        if (val !== null) values.add(val);
    });
    return Array.from(values).sort((a, b) => a - b);
}

/**
 * Find the next N values >= minValue from a sorted array
 * This enables dynamic matching for odd dimensions
 */
function getNextNValues(sortedValues: number[], minValue: number, count: number): number[] {
    const filtered = sortedValues.filter(v => v >= minValue);
    return filtered.slice(0, count);
}

/**
 * Filter variants dengan aturan Gorden Smokering
 * 
 * Rules:
 * - Lebar < 90cm → Sibak = 1
 * - Lebar >= 90cm → Sibak = 2
 * - Tinggi: Find 4 levels starting from the first available height >= input
 *   (Dynamic matching - works with any input value)
 */
function filterGordenSmokering(variants: any[], input: DimensionInput): any[] {
    const targetSibak = input.width < 90 ? 1 : 2;

    // Get all unique heights from variants
    const allHeights = getUniqueAttrValues(variants, ['Tinggi', 'tinggi', 'Height', 'height', 'T']);

    // Find the next 4 heights starting from input height
    const allowedHeights = getNextNValues(allHeights, input.height, 4);

    return variants.filter(v => {
        const attrs = parseAttributes(v.attributes);

        // Check Sibak - must match target
        const sibak = getNumericAttr(attrs, ['Sibak', 'sibak']);
        if (sibak !== null && sibak !== targetSibak) {
            return false;
        }

        // Check Tinggi (if present in variant) - must be in allowed range
        const tinggi = getNumericAttr(attrs, ['Tinggi', 'tinggi', 'Height', 'height', 'T']);
        if (tinggi !== null && allowedHeights.length > 0 && !allowedHeights.includes(tinggi)) {
            return false;
        }

        return true;
    });
}

/**
 * Filter variants dengan aturan Rel (4 sizes)
 * 
 * Rules:
 * - Find 4 width levels starting from the first available width >= input
 *   (Dynamic matching - works with any input value)
 */
function filterRel4Sizes(variants: any[], input: DimensionInput): any[] {
    // Get all unique widths from variants
    const allWidths = getUniqueAttrValues(variants, ['Lebar', 'lebar', 'Width', 'width', 'L']);

    // Find the next 4 widths starting from input width
    const allowedWidths = getNextNValues(allWidths, input.width, 4);

    return variants.filter(v => {
        const attrs = parseAttributes(v.attributes);
        const lebar = getNumericAttr(attrs, ['Lebar', 'lebar', 'Width', 'width', 'L']);

        // If variant has Lebar attribute, filter it
        if (lebar !== null && allowedWidths.length > 0) {
            return allowedWidths.includes(lebar);
        }

        // If no Lebar attribute, include variant
        return true;
    });
}

/**
 * Filter variants dengan aturan Vitrase (kombinasi)
 * 
 * Rules:
 * - Lebar: Find 4 width levels starting from the first available width >= input
 * - Tinggi: Find 4 height levels starting from the first available height >= input
 *   (Dynamic matching for both dimensions)
 */
function filterVitraseKombinasi(variants: any[], input: DimensionInput): any[] {
    // 1. Map variants to include parsed dimensions
    const parsedVariants = variants.map(v => {
        const attrs = parseAttributes(v.attributes);
        const w = getNumericAttr(attrs, ['Lebar', 'lebar', 'Width', 'width', 'L']);
        const h = getNumericAttr(attrs, ['Tinggi', 'tinggi', 'Height', 'height', 'T']);
        return { v, w, h };
    });

    // 2. Get unique widths and heights from all variants
    const allWidths = getUniqueAttrValues(variants, ['Lebar', 'lebar', 'Width', 'width', 'L']);
    const allHeights = getUniqueAttrValues(variants, ['Tinggi', 'tinggi', 'Height', 'height', 'T']);

    // 3. Find the next 4 widths and heights starting from input
    const allowedWidths = getNextNValues(allWidths, input.width, 4);
    const allowedHeights = getNextNValues(allHeights, input.height, 4);

    return parsedVariants.filter(item => {
        // Width check: if variant has width, it must match one of the allowed widths
        const widthMatch = item.w === null || allowedWidths.length === 0 || allowedWidths.includes(item.w);

        // Height check: if variant has height, it must match one of the allowed heights
        const heightMatch = item.h === null || allowedHeights.length === 0 || allowedHeights.includes(item.h);

        return widthMatch && heightMatch;
    }).map(item => item.v);
}

/**
 * Main filter function
 * 
 * Filter variants berdasarkan rule yang dipilih
 */
export function filterVariantsByRule(
    variants: any[],
    input: DimensionInput,
    rule: VariantFilterRule
): any[] {
    if (!variants || variants.length === 0) return [];

    switch (rule) {
        case 'gorden-smokering':
            return filterGordenSmokering(variants, input);

        case 'rel-4-sizes':
            return filterRel4Sizes(variants, input);

        case 'vitrase-kombinasi':
            return filterVitraseKombinasi(variants, input);

        case 'none':
        default:
            return variants;
    }
}

/**
 * Get filter rule label
 */
export function getFilterRuleLabel(rule: string): string {
    const found = VARIANT_FILTER_RULES.find(r => r.value === rule);
    return found?.label || 'Tanpa Filter';
}
