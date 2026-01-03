import { Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

interface OptionGroup {
    id: string;
    name: string;
    values: string[];
}

interface AdminVariantGeneratorProps {
    onGenerate: (variants: any[], options: OptionGroup[]) => void;
    onCancel: () => void;
}

export default function AdminVariantGenerator({ onGenerate, onCancel }: AdminVariantGeneratorProps) {
    const [groups, setGroups] = useState<OptionGroup[]>([
        { id: '1', name: 'Lebar', values: [] }
    ]);

    const [newValue, setNewValue] = useState<{ [key: string]: string }>({});

    const addGroup = () => {
        setGroups([...groups, {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            values: []
        }]);
    };

    const removeGroup = (id: string) => {
        setGroups(groups.filter(g => g.id !== id));
    };

    const updateGroupName = (id: string, name: string) => {
        setGroups(groups.map(g => g.id === id ? { ...g, name } : g));
    };

    const addValue = (groupId: string) => {
        const val = newValue[groupId]?.trim();
        if (!val) return;

        setGroups(groups.map(g => {
            if (g.id === groupId && !g.values.includes(val)) {
                return { ...g, values: [...g.values, val] };
            }
            return g;
        }));
        setNewValue({ ...newValue, [groupId]: '' });
    };

    const removeValue = (groupId: string, valueToRemove: string) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                return { ...g, values: g.values.filter(v => v !== valueToRemove) };
            }
            return g;
        }));
    };

    const handleKeyPress = (e: React.KeyboardEvent, groupId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addValue(groupId);
        }
    };

    const generateCombinations = () => {
        // Validation
        if (groups.length === 0) {
            toast.error('Minimal satu tipe variasi');
            return;
        }
        for (const g of groups) {
            if (!g.name) {
                toast.error('Nama variasi tidak boleh kosong');
                return;
            }
            if (g.values.length === 0) {
                toast.error(`Nilai untuk ${g.name} masih kosong`);
                return;
            }
        }

        // Generate Cartesian Product
        // @ts-ignore
        const cartesian = (args) => {
            const r: any[] = [];
            const max = args.length - 1;
            function helper(arr: any[], i: number) {
                for (let j = 0, l = args[i].length; j < l; j++) {
                    const a = arr.slice(0); // clone arr
                    a.push(args[i][j]);
                    if (i === max) r.push(a);
                    else helper(a, i + 1);
                }
            }
            helper([], 0);
            return r;
        };

        const combinations = cartesian(groups.map(g => g.values));

        // Map to Variant Objects
        const variants = combinations.map(combo => {
            const attributes: { [key: string]: string } = {};
            groups.forEach((g, idx) => {
                attributes[g.name] = combo[idx];
            });

            return {
                id: Math.random().toString(36).substr(2, 9), // Temp ID
                attributes: attributes, // JSON storage
                price_gross: 0,
                price_net: 0,
                is_active: true
            };
        });

        onGenerate(variants, groups);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {groups.map((group, idx) => (
                    <div key={group.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 mr-4">
                                <Label className="mb-1.5 block">Nama Variasi (Contoh: Lebar, Tinggi)</Label>
                                <Input
                                    value={group.name}
                                    onChange={(e) => updateGroupName(group.id, e.target.value)}
                                    placeholder="Nama Variasi..."
                                    className="bg-white"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeGroup(group.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 mt-6"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        <div>
                            <Label className="mb-1.5 block">Pilihan Nilai</Label>
                            <div className="flex gap-2 mb-2">
                                <Input
                                    value={newValue[group.id] || ''}
                                    onChange={(e) => setNewValue({ ...newValue, [group.id]: e.target.value })}
                                    onKeyDown={(e) => handleKeyPress(e, group.id)}
                                    placeholder={`Tambah nilai untuk ${group.name || 'variasi'}...`}
                                    className="bg-white"
                                />
                                <Button
                                    type="button"
                                    onClick={() => addValue(group.id)}
                                    variant="outline"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {group.values.map((val, vIdx) => (
                                    <span key={vIdx} className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-white border border-gray-200 text-gray-800">
                                        {val}
                                        <button
                                            onClick={() => removeValue(group.id, val)}
                                            className="ml-1.5 text-gray-400 hover:text-red-500"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Button onClick={addGroup} variant="outline" className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Tambah Tipe Variasi Lain
            </Button>

            <div className="flex justify-end pt-4 border-t gap-3">
                <Button variant="outline" onClick={onCancel}>Batal</Button>
                <Button onClick={generateCombinations} className="bg-[#EB216A] hover:bg-[#d11d5e] text-white">
                    Generate Kombinasi
                </Button>
            </div>
        </div>
    );
}
