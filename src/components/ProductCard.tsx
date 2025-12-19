import { Heart, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getProductImageUrl } from '../utils/imageHelper';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  images?: string[] | string;
  category: string;
  comparePrice?: number;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
}

export function ProductCard({ id, name, price, image, images, featured, bestSeller, newArrival }: ProductCardProps) {
  const productImage = getProductImageUrl(images || image);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    addToCart({
      id,
      name,
      price: Number(price),
      image: productImage,
    });
  };

  return (
    <Link to={`/product/${id}`} className="group relative h-full block">
      {/* Card Container */}
      <div className="relative bg-white rounded-md overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <ImageWithFallback
            src={productImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badge */}
          {(featured || bestSeller || newArrival) && (
            <Badge className="absolute top-4 left-4 bg-[#EB216A] text-white border-0 shadow-lg">
              {bestSeller ? 'Best Seller' : newArrival ? 'New' : 'Featured'}
            </Badge>
          )}

          {/* Wishlist Button */}
          <button
            onClick={(e) => e.preventDefault()}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#EB216A] hover:text-white shadow-lg"
          >
            <Heart className="w-5 h-5" />
          </button>

          {/* Quick View Button - Shows on Hover */}
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <Button
              className="w-full bg-white text-[#EB216A] hover:bg-[#EB216A] hover:text-white shadow-xl"
              size="sm"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Tambah ke Keranjang
            </Button>
          </div>
        </div>

        {/* Content Section - Fixed Height */}
        <div className="p-4 lg:p-5 flex flex-col flex-grow">
          <h3 className="text-sm lg:text-base text-gray-900 mb-2 lg:mb-3 group-hover:text-[#EB216A] transition-colors line-clamp-2 min-h-[40px] lg:min-h-[48px]">
            {name}
          </h3>

          {/* Price Section */}
          <div className="flex items-end justify-between mt-auto">
            <div className="flex flex-col gap-1">
              <span className="text-lg lg:text-xl text-[#EB216A]">
                Rp {Number(price).toLocaleString('id-ID')}
              </span>
              <span className="text-xs text-gray-500">Per meter</span>
            </div>
            <button
              onClick={(e) => e.preventDefault()}
              className="text-gray-400 hover:text-[#EB216A] transition-colors"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}