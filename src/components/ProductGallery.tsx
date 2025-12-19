import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { getProductImagesArray } from '../utils/imageHelper';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductGalleryProps {
  images?: string[] | string | null;
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  // Parse and validate images using shared utility
  const imageList = getProductImagesArray(images);

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % imageList.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 border border-gray-100">
        <ImageWithFallback
          src={imageList[selectedImage]}
          alt={`${productName} - View ${selectedImage + 1}`}
          className="w-full h-full object-cover"
        />

        {/* Navigation Arrows */}
        {imageList.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110"
            >
              <ChevronLeft className="w-5 h-5 text-gray-900" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-110"
            >
              <ChevronRight className="w-5 h-5 text-gray-900" />
            </button>
          </>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm">
          {selectedImage + 1} / {imageList.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-5 gap-3">
        {imageList.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(index)}
            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${selectedImage === index
              ? 'border-[#EB216A] ring-2 ring-[#EB216A] ring-offset-2'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            <ImageWithFallback
              src={image}
              alt={`${productName} thumbnail ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
