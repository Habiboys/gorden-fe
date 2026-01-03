import { ChevronLeft, ChevronRight, Layers, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface UnifiedVariantManagerProps {
    variants: any[];
    variantOptions: any[];
    onVariantsChange: (variants: any[], options: any[]) => void;
}

import { safeJSONParse } from '../../utils/jsonHelper';

const ITEMS_PER_PAGE = 10;

export default function UnifiedVariantManager({ variants, variantOptions, onVariantsChange }: UnifiedVariantManagerProps) {
    const [options, setOptions] = useState<any[]>(safeJSONParse(variantOptions, []));
    const [generatedVariants, setGeneratedVariants] = useState<any[]>(variants || []);
    const [currentPage, setCurrentPage] = useState(1);
    const [bulkPriceGross, setBulkPriceGross] = useState('');
    const [bulkPriceNet, setBulkPriceNet] = useState('');
    const [bulkSatuan, setBulkSatuan] = useState('');

    useEffect(() => {
        if (Array.isArray(variantOptions) && JSON.stringify(variantOptions) !== JSON.stringify(options)) {
            setOptions(variantOptions);
        }
    }, [variantOptions]);

    // Sync variants prop to state (for edit mode when API loads variants)
    // Also infer options from attributes if they are empty
    useEffect(() => {
        if (Array.isArray(variants) && variants.length > 0 && generatedVariants.length === 0) {
            // Normalize variants from API - ensure attributes are parsed
            const normalizedVariants = variants.map(v => ({
                ...v,
                attributes: typeof v.attributes === 'string' ? safeJSONParse(v.attributes, {}) : (v.attributes || {}),
                satuan: v.satuan || '',
            }));
            setGeneratedVariants(normalizedVariants);

            // If options are empty but variants have attributes, infer options from them
            const firstVariantAttrs = normalizedVariants[0]?.attributes || {};
            if (options.length === 0 && Object.keys(firstVariantAttrs).length > 0) {
                const inferredOptions = Object.keys(firstVariantAttrs).map(key => ({
                    name: key,
                    values: [...new Set(normalizedVariants.map(v => v.attributes?.[key]).filter(Boolean))]
                }));
                if (inferredOptions.length > 0) {
                    setOptions(inferredOptions);
                }
            }
        }
    }, [variants]);

    const handleAddOption = () => {
        if (options.length >= 4) {
            toast.error('Maksimal 4 jenis variasi');
            return;
        }
        setOptions([...options, { name: '', values: [] }]);
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        setOptions(newOptions);
        generateCombinations(newOptions);
    };

    const handleOptionNameChange = (index: number, name: string) => {
        const newOptions = [...options];
        newOptions[index].name = name;
        setOptions(newOptions);
    };

    const handleAddValue = (optionIndex: number, value: string) => {
        if (!value.trim()) return;
        const newOptions = [...options];
        if (newOptions[optionIndex].values.includes(value.trim())) return;
        newOptions[optionIndex].values.push(value.trim());
        setOptions(newOptions);
        generateCombinations(newOptions);
    };

    const handleRemoveValue = (optionIndex: number, valueIndex: number) => {
        const newOptions = [...options];
        newOptions[optionIndex].values.splice(valueIndex, 1);
        setOptions(newOptions);
        generateCombinations(newOptions);
    };

    const generateCombinations = (currentOptions: any[]) => {
        if (currentOptions.length === 0 || currentOptions.every(o => o.values.length === 0)) {
            onVariantsChange([], currentOptions);
            setGeneratedVariants([]);
            return;
        }

        const cartesian = (args: any[]) => {
            const r: any[] = [];
            const max = args.length - 1;
            function helper(arr: any[], i: number) {
                for (let j = 0, l = args[i].values.length; j < l; j++) {
                    const a = arr.slice(0);
                    a.push({ name: args[i].name, value: args[i].values[j] });
                    if (i === max) r.push(a);
                    else helper(a, i + 1);
                }
            }
            helper([], 0);
            return r;
        };

        const activeOptions = currentOptions.filter(o => o.values.length > 0 && o.name);
        if (activeOptions.length === 0) {
            setGeneratedVariants([]);
            onVariantsChange([], currentOptions);
            return;
        }

        const combinations = cartesian(activeOptions);
        const newVariants = combinations.map(combo => {
            const attributes: Record<string, string> = {};
            combo.forEach((c: any) => attributes[c.name] = c.value);

            const existing = generatedVariants.find(v => {
                const vAttrs = v.attributes || {};
                return Object.entries(attributes).every(([k, val]) => vAttrs[k] === val) &&
                    Object.keys(vAttrs).length === Object.keys(attributes).length;
            });

            return {
                id: existing?.id,
                attributes,
                price_gross: existing?.price_gross || 0,
                price_net: existing?.price_net || 0,
                satuan: existing?.satuan ?? '',
                is_active: existing?.is_active ?? true
            };
        });

        setGeneratedVariants(newVariants);
        onVariantsChange(newVariants, currentOptions);
        setCurrentPage(1);
    };

    const handleVariantChange = (index: number, field: string, value: any) => {
        const newVariants = [...generatedVariants];
        const realIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
        newVariants[realIndex][field] = value;

        // Validate: Gross must be > Net
        const variant = newVariants[realIndex];
        if ((field === 'price_gross' || field === 'price_net') &&
            Number(variant.price_gross) > 0 && Number(variant.price_net) > 0 &&
            Number(variant.price_gross) <= Number(variant.price_net)) {
            toast.warning('Harga Gross harus lebih tinggi dari Harga Net!');
        }

        setGeneratedVariants(newVariants);
        onVariantsChange(newVariants, options);
    };

    const handleBulkApply = () => {
        const pGross = parseInt(bulkPriceGross);
        const pNet = parseInt(bulkPriceNet);
        const hasSatuan = bulkSatuan.trim() !== '';

        if (isNaN(pGross) && isNaN(pNet) && !hasSatuan) return;

        // Validate: Gross must be > Net if both are provided
        if (!isNaN(pGross) && !isNaN(pNet) && pGross <= pNet) {
            toast.error('Harga Gross harus lebih tinggi dari Harga Net!');
            return;
        }

        const newVariants = generatedVariants.map(v => ({
            ...v,
            price_gross: !isNaN(pGross) ? pGross : v.price_gross,
            price_net: !isNaN(pNet) ? pNet : v.price_net,
            satuan: hasSatuan ? bulkSatuan.trim() : v.satuan,
        }));

        setGeneratedVariants(newVariants);
        onVariantsChange(newVariants, options);
        toast.success('Pengaturan massal berhasil diterapkan!');
        setBulkPriceGross('');
        setBulkPriceNet('');
        setBulkSatuan('');
    };

    const totalPages = Math.ceil(generatedVariants.length / ITEMS_PER_PAGE);
    const paginatedVariants = generatedVariants.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-5">
            {/* 1. Option Definitions - Compact Cards */}
            <div className="bg-gradient-to-br from-pink-50/50 to-white p-4 rounded-xl border border-pink-100">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#EB216A]" />
                        <span className="text-gray-700 font-medium text-sm">Tipe Variasi</span>
                        {options.length > 0 && (
                            <span className="text-[10px] bg-pink-100 text-[#EB216A] px-1.5 py-0.5 rounded-full font-medium">
                                {options.length} tipe
                            </span>
                        )}
                    </div>
                    {options.length < 4 && (
                        <Button
                            size="sm"
                            onClick={handleAddOption}
                            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white text-xs h-7 px-3"
                        >
                            <Plus className="w-3 h-3 mr-1" /> Tambah Tipe
                        </Button>
                    )}
                </div>

                {options.length === 0 ? (
                    <div
                        onClick={handleAddOption}
                        className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-pink-200 rounded-lg cursor-pointer hover:border-[#EB216A] hover:bg-pink-50/50 transition-all"
                    >
                        <Plus className="w-6 h-6 mx-auto mb-2 text-pink-300" />
                        Klik untuk menambahkan tipe variasi pertama
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {options.map((option, idx) => (
                            <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className="flex items-center gap-1 px-2.5 py-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                    <Input
                                        value={option.name}
                                        onChange={(e) => handleOptionNameChange(idx, e.target.value)}
                                        placeholder="Nama variasi..."
                                        className="h-6 text-sm font-medium border-0 p-0 focus-visible:ring-0 bg-transparent flex-1 placeholder:text-gray-400"
                                    />
                                    <span className="text-[10px] text-white font-medium bg-[#EB216A] px-1.5 py-0.5 rounded-full">
                                        {option.values.length}
                                    </span>
                                    <button
                                        onClick={() => handleRemoveOption(idx)}
                                        className="text-gray-400 hover:text-red-500 p-0.5 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Values */}
                                <div className="p-2 space-y-2 max-h-28 overflow-y-auto">
                                    <div className="flex flex-wrap gap-1">
                                        {option.values.map((val: string, vIdx: number) => (
                                            <span
                                                key={vIdx}
                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-pink-50 text-[#EB216A] border border-pink-200 font-medium"
                                            >
                                                {val}
                                                <button
                                                    onClick={() => handleRemoveValue(idx, vIdx)}
                                                    className="ml-1 text-pink-400 hover:text-red-500"
                                                >
                                                    <X className="w-2.5 h-2.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <Input
                                        placeholder="+ Ketik lalu Enter..."
                                        className="h-6 text-xs w-full border-dashed border-pink-200 focus:border-[#EB216A] placeholder:text-gray-400"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddValue(idx, e.currentTarget.value);
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Variant Count Summary */}
            {generatedVariants.length > 0 && (
                <div className="flex items-center justify-between px-1">
                    <span className="text-sm text-gray-600">
                        Total <strong className="text-[#EB216A]">{generatedVariants.length}</strong> kombinasi varian terbuat
                    </span>
                </div>
            )}

            {generatedVariants.length > 0 && (
                <div className="space-y-3">
                    {/* 2. Bulk Edit Bar - Pink Theme */}
                    <div className="flex flex-wrap items-end gap-3 bg-gradient-to-r from-pink-50 to-pink-100/50 p-3 rounded-lg border border-pink-200">
                        <div className="flex-1 min-w-[200px]">
                            <label className="text-xs text-[#EB216A] font-semibold mb-1.5 block">⚡ Atur Massal</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Harga Gross..."
                                    className="h-9 bg-white border-pink-200 focus:border-[#EB216A] focus:ring-[#EB216A]"
                                    type="number"
                                    value={bulkPriceGross}
                                    onChange={(e) => setBulkPriceGross(e.target.value)}
                                />
                                <Input
                                    placeholder="Harga Net..."
                                    className="h-9 bg-white border-pink-200 focus:border-[#EB216A] focus:ring-[#EB216A]"
                                    type="number"
                                    value={bulkPriceNet}
                                    onChange={(e) => setBulkPriceNet(e.target.value)}
                                />
                                <Input
                                    placeholder="Satuan..."
                                    className="h-9 bg-white border-pink-200 focus:border-[#EB216A] focus:ring-[#EB216A] w-24"
                                    value={bulkSatuan}
                                    onChange={(e) => setBulkSatuan(e.target.value)}
                                    list="satuan-options"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleBulkApply}
                            size="sm"
                            className="bg-[#EB216A] hover:bg-[#d11d5e] text-white h-9 px-5 shadow-md"
                        >
                            Terapkan ke Semua
                        </Button>
                    </div>

                    {/* 3. Variant Table - Clean & Minimal */}
                    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-2.5 w-2/5">Kombinasi Variasi</th>
                                    <th className="px-4 py-2.5 text-right">Harga Gross (Rp)</th>
                                    <th className="px-4 py-2.5 text-right">Harga Net (Rp)</th>
                                    <th className="px-4 py-2.5 text-center">Satuan</th>
                                    <th className="px-4 py-2.5 text-center w-16">Aktif</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedVariants.map((variant, idx) => (
                                    <tr key={idx} className="hover:bg-pink-50/30 transition-colors group">
                                        <td className="px-4 py-2">
                                            <div className="flex flex-wrap gap-1">
                                                {Object.entries(variant.attributes || {}).map(([k, v]: any) => (
                                                    <span
                                                        key={k}
                                                        className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 group-hover:bg-pink-100 group-hover:text-[#EB216A] transition-colors"
                                                    >
                                                        <span className="font-medium">{k}:</span> {v}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-1.5">
                                            <Input
                                                type="number"
                                                value={variant.price_gross}
                                                onChange={(e) => handleVariantChange(idx, 'price_gross', parseFloat(e.target.value) || 0)}
                                                className="text-right h-8 text-sm border-gray-200 focus:border-[#EB216A] focus:ring-[#EB216A]"
                                            />
                                        </td>
                                        <td className="px-4 py-1.5">
                                            <Input
                                                type="number"
                                                value={variant.price_net}
                                                onChange={(e) => handleVariantChange(idx, 'price_net', parseFloat(e.target.value) || 0)}
                                                className="text-right h-8 text-sm font-medium border-gray-200 focus:border-[#EB216A] focus:ring-[#EB216A]"
                                            />
                                        </td>
                                        <td className="px-4 py-1.5">
                                            <Input
                                                type="text"
                                                value={variant.satuan ?? ''}
                                                onChange={(e) => handleVariantChange(idx, 'satuan', e.target.value)}
                                                placeholder="meter"
                                                className="text-center h-8 text-sm border-gray-200 focus:border-[#EB216A] focus:ring-[#EB216A] w-20"
                                                list="satuan-options"
                                            />
                                        </td>
                                        <td className="px-4 py-1.5 text-center">
                                            <input
                                                type="checkbox"
                                                checked={variant.is_active}
                                                onChange={(e) => handleVariantChange(idx, 'is_active', e.target.checked)}
                                                className="size-4 rounded border-gray-300 text-[#EB216A] focus:ring-[#EB216A] cursor-pointer"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                                <span className="text-xs text-gray-500">
                                    Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, generatedVariants.length)} dari {generatedVariants.length}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="h-7 w-7 p-0 border-pink-200 hover:bg-pink-50 hover:border-[#EB216A]"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-xs font-medium px-2 text-[#EB216A]">
                                        {currentPage}/{totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-7 w-7 p-0 border-pink-200 hover:bg-pink-50 hover:border-[#EB216A]"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Datalist for satuan suggestions */}
            <datalist id="satuan-options">
                <option value="meter" />
                <option value="pcs" />
                <option value="set" />
                <option value="box" />
                <option value="lembar" />
                <option value="rol" />
            </datalist>
        </div>
    );
}
