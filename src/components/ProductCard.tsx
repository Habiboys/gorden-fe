import { Heart, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getProductImageUrl } from '../utils/imageHelper';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';

interface ProductCardProps {
  id: string;
  sku?: string;  // SKU for URL (shorter than UUID)
  name: string;
  price: number;
  minPrice?: number;  // From cheapest variant
  maxPrice?: number;  // From most expensive variant
  image?: string;
  images?: string[] | string;
  category: string;
  comparePrice?: number;
  original_price?: number;
  price_unit?: string;
  satuan?: string;
  minPriceGross?: number;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  is_custom?: boolean;
  is_warranty?: boolean;
  badges?: {
    id: number;
    label: string;
    text_color: string;
    bg_color: string;
    position: string;
  }[];
}

export function ProductCard({ id, sku, name, price, minPrice, minPriceGross, image, images, featured, bestSeller, newArrival, original_price, price_unit, satuan, is_custom, is_warranty, badges }: ProductCardProps) {
  const productImage = getProductImageUrl(images || image);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);

  const inWishlist = isInWishlist(id);

  // Only show price if minPrice exists (from variants)
  const hasVariants = minPrice !== undefined && minPrice > 0;
  // const hasPriceRange = hasVariants && maxPrice && maxPrice > minPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only add to cart if has variant price
    if (!hasVariants) return;

    addToCart({
      id,
      name,
      sku,
      price: Number(minPrice),
      image: productImage,
    });
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    await toggleWishlist(id);
  };

  return (
    <Link to={`/product/${sku || id}`} className="group relative h-full block">
      {/* Card Container */}
      <div className="relative bg-white rounded-md overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <ImageWithFallback
            src={productImage}
            alt={name}
            className="w-full h-full object-cover"
          />

          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Combined Badges Rendering: Dynamic + Legacy */}
          {(() => {
            const dynamicBadges = badges || [];
            const legacyBadges: { id: string; label: string; bg_color: string; text_color: string; position: string }[] = [];

            // Check if dynamic badge for each type exists (to avoid duplicates)
            const hasBestSellerBadge = dynamicBadges.some(b => b.label.toLowerCase().includes('best seller') || b.label.toLowerCase().includes('terlaris'));
            const hasNewArrivalBadge = dynamicBadges.some(b => b.label.toLowerCase().includes('new') || b.label.toLowerCase().includes('baru'));
            const hasFeaturedBadge = dynamicBadges.some(b => b.label.toLowerCase().includes('featured') || b.label.toLowerCase().includes('unggulan'));
            const hasWarrantyBadge = dynamicBadges.some(b => b.label.toLowerCase().includes('garansi'));
            const hasCustomBadge = dynamicBadges.some(b => b.label.toLowerCase().includes('custom'));

            // Add legacy badges only if no corresponding dynamic badge exists
            if (bestSeller && !hasBestSellerBadge) {
              legacyBadges.push({ id: 'legacy-bestseller', label: 'Best Seller', bg_color: '#EB216A', text_color: '#FFFFFF', position: 'top-left' });
            }
            if (newArrival && !hasNewArrivalBadge && !bestSeller) {
              legacyBadges.push({ id: 'legacy-newarrival', label: 'New', bg_color: '#EB216A', text_color: '#FFFFFF', position: 'top-left' });
            }
            if (featured && !hasFeaturedBadge && !bestSeller && !newArrival) {
              legacyBadges.push({ id: 'legacy-featured', label: 'Featured', bg_color: '#EB216A', text_color: '#FFFFFF', position: 'top-left' });
            }
            // Bottom-left legacy badges (only if no dynamic version)
            if (is_warranty && !hasWarrantyBadge) {
              legacyBadges.push({ id: 'legacy-warranty', label: 'Garansi 1 Tahun', bg_color: '#3B82F6', text_color: '#FFFFFF', position: 'bottom-left' });
            }
            if (is_custom && !hasCustomBadge) {
              legacyBadges.push({ id: 'legacy-custom', label: 'Gorden Custom', bg_color: '#8B5CF6', text_color: '#FFFFFF', position: 'bottom-left' });
            }

            // Combine: dynamic badges first (their positions from DB), then legacy
            const allBadges = [...dynamicBadges, ...legacyBadges];

            return (
              <>
                {/* Top Left Group */}
                <div className="absolute top-4 left-4 flex flex-col gap-1 items-start z-10">
                  {allBadges.filter(b => b.position === 'top-left').map(badge => (
                    <Badge key={badge.id} className="border-0 shadow-lg text-[10px] px-2 py-0.5 whitespace-nowrap" style={{ backgroundColor: badge.bg_color, color: badge.text_color }}>
                      {badge.label}
                    </Badge>
                  ))}
                </div>

                {/* Bottom Left Group */}
                <div className="absolute bottom-4 left-4 flex flex-col items-start gap-1 transition-opacity duration-300 group-hover:opacity-0 z-10">
                  {allBadges.filter(b => b.position === 'bottom-left').map(badge => (
                    <Badge key={badge.id} className="border-0 shadow-lg text-[10px] px-2 py-0.5 whitespace-nowrap" style={{ backgroundColor: badge.bg_color, color: badge.text_color }}>
                      {badge.label}
                    </Badge>
                  ))}
                </div>

                {/* Top Right Group */}
                <div className="absolute top-4 right-4 flex flex-col gap-1 items-end z-20">
                  {allBadges.filter(b => b.position === 'top-right').map(badge => (
                    <Badge key={badge.id} className="border-0 shadow-lg text-[10px] px-2 py-0.5 whitespace-nowrap" style={{ backgroundColor: badge.bg_color, color: badge.text_color }}>
                      {badge.label}
                    </Badge>
                  ))}
                </div>

                {/* Bottom Right Group */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-1 items-end z-10">
                  {allBadges.filter(b => b.position === 'bottom-right').map(badge => (
                    <Badge key={badge.id} className="border-0 shadow-lg text-[10px] px-2 py-0.5 whitespace-nowrap" style={{ backgroundColor: badge.bg_color, color: badge.text_color }}>
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              </>
            );
          })()}

          {/* Quick Add Button - Shows on Hover */}
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 z-30">
            <button
              className="w-full shadow-xl border-0 rounded-md py-2 px-3 text-sm font-medium flex items-center justify-center gap-2 transition-all"
              style={{
                backgroundColor: isHovered ? '#EB216A' : 'white',
                color: isHovered ? 'white' : '#EB216A'
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="font-medium">Tambah ke Keranjang</span>
            </button>
          </div>
        </div>

        {/* Content Section - Fixed Height */}
        <div className="p-4 lg:p-5 flex flex-col flex-grow">
          <h3 className="text-sm lg:text-base font-semibold text-gray-900 mb-2 lg:mb-3 line-clamp-2 min-h-[40px] lg:min-h-[48px]">
            {name}
          </h3>

          {/* Price Section */}
          <div className="flex items-end justify-between mt-auto">
            <div className="flex flex-col gap-1">
              {/* Show discount if Gross > Net */}
              {minPriceGross && minPrice && Number(minPriceGross) > Number(minPrice) ? (
                <>
                  <div className="flex items-center gap-1 lg:gap-2">
                    <span className="text-xs lg:text-sm text-gray-400 line-through">
                      Rp {Number(minPriceGross).toLocaleString('id-ID')}
                    </span>
                    <span className="text-[10px] lg:text-xs bg-[#EB216A] text-white px-1.5 lg:px-2 py-0.5 rounded">
                      -{Math.round((1 - (Number(minPrice) / Number(minPriceGross))) * 100)}%
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-normal leading-tight">Mulai dari</span>
                    <span className="text-sm lg:text-base text-[#EB216A] font-semibold leading-tight">
                      Rp {Number(minPrice).toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              ) : minPrice && !isNaN(Number(minPrice)) ? (
                <>
                  <div className="h-4 lg:h-5" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 font-normal leading-tight">Mulai dari</span>
                    <span className="text-sm lg:text-base text-[#EB216A] font-semibold leading-tight">
                      Rp {Number(minPrice).toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-sm text-gray-500">Lihat varian</span>
              )}
              <span className="text-[10px] text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 mt-1 self-start">Per {price_unit || satuan || 'meter'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddToCart}
                className={`transition-colors text-gray-400 hover:text-[#EB216A]`}
                title="Tambah ke Keranjang"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`transition-colors ${inWishlist ? 'text-[#EB216A]' : 'text-gray-400 hover:text-[#EB216A]'
                  }`}
              >
                <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}