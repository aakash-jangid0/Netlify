import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

interface CartAnimationProps {
  isAnimating: boolean;
  startPosition: { x: number; y: number };
  onComplete: () => void;
}

function CartAnimation({ isAnimating, startPosition, onComplete }: CartAnimationProps) {
  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          initial={{ 
            opacity: 1,
            scale: 1,
            x: startPosition.x,
            y: startPosition.y,
            zIndex: 100
          }}
          animate={{
            opacity: [1, 1, 0],
            scale: [1, 1.2, 0.5],
            x: window.innerWidth - 80,
            y: window.innerHeight - 80,
          }}
          transition={{
            duration: 0.8,
            ease: "easeInOut"
          }}
          onAnimationComplete={onComplete}
          className="fixed z-50 bg-orange-500 text-white p-2 rounded-full pointer-events-none"
        >
          <ShoppingCart className="w-6 h-6" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CartAnimation;