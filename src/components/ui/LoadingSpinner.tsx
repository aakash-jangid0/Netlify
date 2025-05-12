import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'white' | 'orange' | 'gray';
}

export default function LoadingSpinner({ 
  size = 'medium', 
  color = 'orange' 
}: LoadingSpinnerProps) {
  // Determine size based on prop
  const sizeClass = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-10 w-10'
  }[size];
  
  // Determine color class
  const colorClass = {
    white: 'text-white',
    orange: 'text-orange-500',
    gray: 'text-gray-500'
  }[color];

  return (
    <div className="flex justify-center items-center">
      <motion.svg 
        className={`${sizeClass} ${colorClass} animate-spin`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
        initial={{ opacity: 0.6, rotate: 0 }}
        animate={{ opacity: 1, rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </motion.svg>
    </div>
  );
}
