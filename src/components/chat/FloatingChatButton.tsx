import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sparkles } from 'lucide-react';
import { SupportChatModal } from '../chat/SupportChatModal';
import { useAuth } from '../../context/AuthContext';

interface FloatingChatButtonProps {
  orderId?: string;
}

export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({ orderId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();

  // Only show for logged-in users
  if (!user) return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed bottom-6 right-6 z-40"
          >
            {/* Pulse animation background */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-30"
            />
            
            {/* Sparkle effects */}
            <AnimatePresence>
              {isHovered && (
                <>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: 360 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute -top-2 -right-2 text-yellow-400"
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, rotate: -360 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="absolute -bottom-1 -left-1 text-yellow-400"
                  >
                    <Sparkles className="w-3 h-3" />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <motion.button
              onClick={() => setIsOpen(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              whileHover={{ 
                scale: 1.1, 
                rotate: [0, -10, 10, 0],
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
              }}
              whileTap={{ scale: 0.9 }}
              className="relative w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:shadow-blue-500/50 group overflow-hidden"
            >
              {/* Animated background overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Icon with animation */}
              <motion.div
                animate={{ 
                  scale: isHovered ? [1, 1.2, 1] : 1,
                  rotate: isHovered ? [0, 15, -15, 0] : 0 
                }}
                transition={{ duration: 0.5, repeat: isHovered ? Infinity : 0 }}
              >
                <MessageCircle className="w-7 h-7 relative z-10" />
              </motion.div>

              {/* Notification badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: 'spring', stiffness: 500 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 bg-white rounded-full"
                />
              </motion.div>
            </motion.button>

            {/* Tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="absolute right-20 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shadow-xl backdrop-blur-sm"
                >
                  Need help? Chat with support
                  <div className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2 w-0 h-0 border-l-8 border-r-0 border-t-4 border-b-4 border-l-gray-900 border-t-transparent border-b-transparent" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {orderId && (
        <SupportChatModal
          orderId={orderId}
          onClose={() => setIsOpen(false)}
          isOpen={isOpen}
        />
      )}
    </>
  );
};
