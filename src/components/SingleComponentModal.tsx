import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Check } from 'lucide-react';

interface ComponentOption {
  id: string;
  name: string;
  price: number;
  description: string;
  maxWidth?: number;
  image?: string;
}

interface SingleComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  options: ComponentOption[];
  currentSelection?: ComponentOption;
  onSelect: (component: ComponentOption) => void;
}

export function SingleComponentModal({
  isOpen,
  onClose,
  title,
  description,
  options,
  currentSelection,
  onSelect,
}: SingleComponentModalProps) {
  const handleSelect = (component: ComponentOption) => {
    onSelect(component);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Options Grid */}
        <div className="overflow-y-auto max-h-[60vh] pr-2">
          {options.length === 0 ? (
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
              {options.map((option) => {
                const isSelected = currentSelection?.id === option.id;
                
                return (
                  <div
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className={`cursor-pointer rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                      isSelected
                        ? 'border-[#EB216A] bg-[#EB216A]/5 shadow-lg'
                        : 'border-gray-200 hover:border-[#EB216A]/50 hover:shadow-md'
                    }`}
                  >
                    {/* Image */}
                    {option.image && (
                      <div className="relative h-32 overflow-hidden bg-gray-100">
                        <img
                          src={option.image}
                          alt={option.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-7 h-7 bg-[#EB216A] rounded-full flex items-center justify-center shadow-lg">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-base text-gray-900 mb-1">{option.name}</h4>
                          <p className="text-sm text-gray-500">{option.description}</p>
                        </div>
                        {isSelected && !option.image && (
                          <div className="w-6 h-6 bg-[#EB216A] rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl text-[#EB216A]">
                          Rp {option.price.toLocaleString('id-ID')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {title.includes('Hook') && '/ pcs'}
                          {(title.includes('Kain') || title.includes('Rel')) && '/ meter'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
