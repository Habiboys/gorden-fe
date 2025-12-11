import { useState } from 'react';
import { Slider } from './ui/slider';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { X } from 'lucide-react';

interface FilterSidebarProps {
  onFilterChange?: (filters: any) => void;
}

export function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [priceRange, setPriceRange] = useState([50000, 500000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  const categories = [
    'Gorden Minimalis',
    'Gorden Klasik',
    'Roller Blind',
    'Vertical Blind',
    'Vitrase',
    'Wallpaper'
  ];

  const materials = [
    'Polyester',
    'Katun',
    'Linen',
    'Blackout',
    'Satin',
    'Suede'
  ];

  const handleCategoryToggle = (category: string) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(updated);
  };

  const handleMaterialToggle = (material: string) => {
    const updated = selectedMaterials.includes(material)
      ? selectedMaterials.filter(m => m !== material)
      : [...selectedMaterials, material];
    setSelectedMaterials(updated);
  };

  const resetFilters = () => {
    setPriceRange([50000, 500000]);
    setSelectedCategories([]);
    setSelectedMaterials([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl text-gray-900">Filter</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-gray-500 hover:text-[#EB216A]"
        >
          <X className="w-4 h-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h4 className="text-lg text-gray-900 mb-4">Kategori</h4>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
                className="border-gray-300 data-[state=checked]:bg-[#EB216A] data-[state=checked]:border-[#EB216A]"
              />
              <Label
                htmlFor={category}
                className="text-sm text-gray-700 cursor-pointer hover:text-[#EB216A] transition-colors"
              >
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h4 className="text-lg text-gray-900 mb-4">Rentang Harga</h4>
        <div className="space-y-4">
          <Slider
            min={50000}
            max={1000000}
            step={10000}
            value={priceRange}
            onValueChange={setPriceRange}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Rp {priceRange[0].toLocaleString('id-ID')}
            </span>
            <span className="text-gray-600">
              Rp {priceRange[1].toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Material Filter */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h4 className="text-lg text-gray-900 mb-4">Material</h4>
        <div className="space-y-3">
          {materials.map((material) => (
            <div key={material} className="flex items-center space-x-2">
              <Checkbox
                id={material}
                checked={selectedMaterials.includes(material)}
                onCheckedChange={() => handleMaterialToggle(material)}
                className="border-gray-300 data-[state=checked]:bg-[#EB216A] data-[state=checked]:border-[#EB216A]"
              />
              <Label
                htmlFor={material}
                className="text-sm text-gray-700 cursor-pointer hover:text-[#EB216A] transition-colors"
              >
                {material}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}