import React, { useRef, useState, useEffect, memo } from 'react';
import { useCart } from '../../context/CartContext';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import CartAnimation from '../cart/CartAnimation';
import { getResponsiveImageUrl } from '../../utils/imageUtils';

interface MenuCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  preparationTime: number;
  isAvailable: boolean;
  index?: number; // Add index for prioritizing initial visible items
}

// Preload the fallback image once for the entire app
const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
const fallbackImageLoader = new Image();
fallbackImageLoader.src = fallbackImage;

const MenuCard = memo(function MenuCard({ 
  id, name, description, price, image, isAvailable, index = 0 
}: MenuCardProps) {
  const { addToCart } = useCart();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [animationStart, setAnimationStart] = React.useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Conditional animations based on index to limit overhead
  const shouldAnimate = index < 20;
  
  // Use effect to preload the image if it's one of the first items
  useEffect(() => {
    if (index < 6 && image && !imageLoaded && !imageError) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => setImageError(true);
      img.src = getResponsiveImageUrl(image, 400);
      return () => {
        img.onload = null;
        img.onerror = null;
      };
    }
  }, [image, index, imageLoaded, imageError]);

  const handleAddToCart = () => {
    if (!buttonRef.current) return;

    // For items further down, skip animation
    if (index > 10) {
      addToCart({ id, name, price, image });
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    setAnimationStart({
      x: rect.left,
      y: rect.top
    });

    setIsAnimating(true);
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
    addToCart({ id, name, price, image });
  };

  // Simplified card component for items beyond the first 20
  if (!shouldAnimate) {
    return (
      <div className={`bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col ${!isAvailable ? 'opacity-75' : ''}`}>
        <div className="relative h-48">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img 
            src={imageError ? fallbackImage : getResponsiveImageUrl(image, 400)} 
            alt={name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
            width="400"
            height="300"
          />
          {!isAvailable && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-medium">Not Available</span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-medium text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">{description}</p>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-lg font-semibold text-orange-500">₹{price}</span>
            <button
              ref={buttonRef}
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original animated component for initial visible items
  return (
    <>
      <motion.div
        whileHover={{ y: -5 }}
        className={`bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col ${!isAvailable ? 'opacity-75' : ''}`}
      >
        <div className="relative h-48">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img 
            src={imageError ? fallbackImage : getResponsiveImageUrl(image, 400)} 
            alt={name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            loading={index < 6 ? "eager" : "lazy"}
            width="400"
            height="300"
            decoding={index < 6 ? "sync" : "async"}
            fetchPriority={index < 6 ? "high" : "auto"}
          />
          {!isAvailable && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-medium">Not Available</span>
            </div>
          )}
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-medium text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">{description}</p>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-lg font-semibold text-orange-500">₹{price}</span>
            <motion.button
              ref={buttonRef}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      <CartAnimation
        isAnimating={isAnimating}
        startPosition={animationStart}
        onComplete={handleAnimationComplete}
      />
    </>
  );
});

export default MenuCard;