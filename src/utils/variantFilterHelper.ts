/**
 * Variant Filter Helper
 * 
 * Utility untuk filter varian berdasarkan dimensi input dan aturan filter.
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
    { value: 'gorden-smokering', label: 'Gorden Smokering', description: 'Sibak 1/2 + Tinggi ±30cm' },
    { value: 'rel-4-sizes', label: 'Rel (4 Ukuran)', description: '4 ukuran lebar: +0, +10, +20, +30' },
    { value: 'vitrase-kombinasi', label: 'Vitrase (Kombinasi)', description: 'Lebar +20~+80 × Tinggi +0~+30' },
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
 * Filter variants dengan aturan Gorden Smokering
 * 
 * Rules:
 * - Lebar < 90cm → Sibak = 1
 * - Lebar >= 90cm → Sibak = 2
 * - Lebar >= 90cm → Sibak = 2
 * - Tinggi filter: input, +10, +20, +30
 */
function filterGordenSmokering(variants: any[], input: DimensionInput): any[] {
    const targetSibak = input.width < 90 ? 1 : 2;
    const allowedHeights = [
        input.height,
        input.height + 10,
        input.height + 20,
        input.height + 30
    ];

    return variants.filter(v => {
        const attrs = parseAttributes(v.attributes);

        // Check Sibak - must match target
        const sibak = getNumericAttr(attrs, ['Sibak', 'sibak']);
        if (sibak !== null && sibak !== targetSibak) {
            return false;
        }



        // Check Tinggi (if present in variant) - must be in allowed range
        const tinggi = getNumericAttr(attrs, ['Tinggi', 'tinggi', 'Height', 'height', 'T']);
        if (tinggi !== null && !allowedHeights.includes(tinggi)) {
            return false;
        }

        return true;
    });
}

/**
 * Filter variants dengan aturan Rel (4 sizes)
 * 
 * Rules:
 * - Filter lebar: input, +10, +20, +30
 */
function filterRel4Sizes(variants: any[], input: DimensionInput): any[] {
    const allowedWidths = [
        input.width,
        input.width + 10,
        input.width + 20,
        input.width + 30
    ];

    return variants.filter(v => {
        const attrs = parseAttributes(v.attributes);
        const lebar = getNumericAttr(attrs, ['Lebar', 'lebar', 'Width', 'width', 'L']);

        // If variant has Lebar attribute, filter it
        if (lebar !== null) {
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
 * - Lebar: +20, +40, +60, +80 dari input (4 tingkatan)
 * - Tinggi: +0, +10, +20, +30 dari input (4 tingkatan)
 * Total: 16 kombinasi per produk
 */
function filterVitraseKombinasi(variants: any[], input: DimensionInput): any[] {
    // 1. Map variants to include parsed dimensions and filter by width >= input
    const validVariants = variants.map(v => {
        const attrs = parseAttributes(v.attributes);
        const w = getNumericAttr(attrs, ['Lebar', 'lebar', 'Width', 'width', 'L']);
        const h = getNumericAttr(attrs, ['Tinggi', 'tinggi', 'Height', 'height', 'T']);
        return { v, w, h };
    }).filter(item => item.w !== null && item.w >= input.width);

    // 2. Identify the next 4 unique width levels (sorted)
    const uniqueWidths = Array.from(new Set(validVariants.map(i => i.w!)))
        .sort((a, b) => a - b)
        .slice(0, 4);

    // 3. Define allowed heights (keep strict steps for now as per previous logic, or maybe should also be dynamic?)
    // User complaint was specifically about "nilai ganjil" (odd input) on width causing no show.
    // Existing height logic allows exact match + 3 steps up.
    const allowedHeights = [
        input.height,
        input.height + 10,
        input.height + 20,
        input.height + 30
    ];

    return validVariants.filter(item => {
        // Must match one of the 4 selected widths
        const widthMatch = uniqueWidths.includes(item.w!);

        // Height check: if variant has height, it must match one of the allowed heights
        // If variant has NO height attribute (null), we assume it's valid (generic variant)
        const heightMatch = item.h === null || allowedHeights.includes(item.h!);

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
