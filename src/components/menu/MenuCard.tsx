import React, { useRef, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import CartAnimation from '../cart/CartAnimation';

interface MenuCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  preparationTime: number;
  isAvailable: boolean;
}

function MenuCard({ id, name, description, price, image, isAvailable }: MenuCardProps) {
  const { addToCart } = useCart();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [animationStart, setAnimationStart] = React.useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = async () => {
    if (!buttonRef.current) return;

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

  const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

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
            src={imageError ? fallbackImage : image} 
            alt={name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
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
}

export default MenuCard;