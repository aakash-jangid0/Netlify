import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

function FloatingCart() {
  const { cartItems } = useCart();
  const [isVisible, setIsVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      // Show cart when scrolling up or at the top
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY.current || currentScrollY < 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && cartItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6"
        >
          <Link
            to="/cart"
            className="bg-orange-500 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-orange-600 transition-colors relative flex items-center justify-center"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
            {cartItems.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-white text-orange-500 text-xs font-bold rounded-full h-5 w-5 md:h-6 md:w-6 flex items-center justify-center border-2 border-orange-500"
              >
                {cartItems.length}
              </motion.span>
            )}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FloatingCart;