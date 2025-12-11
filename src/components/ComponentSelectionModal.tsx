import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Check } from 'lucide-react';

interface ComponentOption {
  id: string;
  name: string;
  price: number;
  description: string;
  maxWidth?: number;
}

interface ComponentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemWidth: number; // in cm
  itemHeight: number; // in cm
  currentComponents: {
    relGorden?: ComponentOption;
    tassel?: ComponentOption;
    hook?: ComponentOption;
    kainVitrase?: ComponentOption;
    relVitrase?: ComponentOption;
  };
  onSelectComponent: (type: string, component: ComponentOption) => void;
  relGordenOptions: ComponentOption[];
  tasselOptions: ComponentOption[];
  hookOptions: ComponentOption[];
  kainVitraseOptions: ComponentOption[];
  relVitraseOptions: ComponentOption[];
}

export function ComponentSelectionModal({
  isOpen,
  onClose,
  itemWidth,
  itemHeight,
  currentComponents,
  onSelectComponent,
  relGordenOptions,
  tasselOptions,
  hookOptions,
  kainVitraseOptions,
  relVitraseOptions,
}: ComponentSelectionModalProps) {
  const [activeTab, setActiveTab] = useState<'relGorden' | 'tassel' | 'hook' | 'kainVitrase' | 'relVitrase'>('relGorden');

  // Filter rel options based on item width
  const filteredRelGordenOptions = relGordenOptions.filter(rel => rel.maxWidth! >= itemWidth);
  const filteredRelVitraseOptions = relVitraseOptions.filter(rel => rel.maxWidth! >= itemWidth);

  const tabs = [
    { id: 'relGorden' as const, label: 'Rel Gorden', count: filteredRelGordenOptions.length },
    { id: 'tassel' as const, label: 'Tassel', count: tasselOptions.length },
    { id: 'hook' as const, label: 'Hook', count: hookOptions.length },
    { id: 'kainVitrase' as const, label: 'Kain Vitrase', count: kainVitraseOptions.length },
    { id: 'relVitrase' as const, label: 'Rel Vitrase', count: filteredRelVitraseOptions.length },
  ];

  const getCurrentOptions = () => {
    switch (activeTab) {
      case 'relGorden':
        return filteredRelGordenOptions;
      case 'tassel':
        return tasselOptions;
      case 'hook':
        return hookOptions;
      case 'kainVitrase':
        return kainVitraseOptions;
      case 'relVitrase':
        return filteredRelVitraseOptions;
      default:
        return [];
    }
  };

  const getCurrentSelection = () => {
    return currentComponents[activeTab];
  };

  const handleSelect = (component: ComponentOption) => {
    onSelectComponent(activeTab, component);
  };

  const currentOptions = getCurrentOptions();
  const currentSelection = getCurrentSelection();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">Pilih Komponen</DialogTitle>
          <DialogDescription>
            Pilih komponen untuk item dengan ukuran {itemWidth} cm × {itemHeight} cm
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="md:w-48 flex-shrink-0">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-[#EB216A] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{tab.label}</span>
                    {currentComponents[tab.id] && (
                      <Check className="w-4 h-4" />
                    )}
                  </div>
                  <p className="text-xs opacity-75 mt-1">{tab.count} opsi</p>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-lg text-gray-900 mb-1">
                {tabs.find(t => t.id === activeTab)?.label}
              </h3>
              {currentSelection && (
                <Badge className="bg-green-100 text-green-700 border-0">
                  Terpilih: {currentSelection.name}
                </Badge>
              )}
            </div>

            {/* Options Grid */}
            <div className="overflow-y-auto max-h-[50vh] pr-2">
              {currentOptions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">
                    Tidak ada opsi yang cocok untuk ukuran ini
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Lebar maksimal yang tersedia tidak mencukupi
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {currentOptions.map((option) => {
                    const isSelected = currentSelection?.id === option.id;
                    
                    return (
                      <div
                        key={option.id}
                        onClick={() => handleSelect(option)}
                        className={`cursor-pointer p-5 rounded-xl border-2 transition-all duration-300 ${
                          isSelected
                            ? 'border-[#EB216A] bg-[#EB216A]/5 shadow-lg'
                            : 'border-gray-200 hover:border-[#EB216A]/50 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="text-base text-gray-900 mb-1">{option.name}</h4>
                            <p className="text-sm text-gray-500">{option.description}</p>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-[#EB216A] rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl text-[#EB216A]">
                            Rp {option.price.toLocaleString('id-ID')}
                          </span>
                          {(activeTab === 'hook') && (
                            <span className="text-xs text-gray-500">/ pcs</span>
                          )}
                          {(activeTab === 'kainVitrase') && (
                            <span className="text-xs text-gray-500">/ meter</span>
                          )}
                          {(activeTab === 'relGorden' || activeTab === 'relVitrase') && (
                            <span className="text-xs text-gray-500">/ meter</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="rounded-xl"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
