import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

interface StarRatingProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  id,
  value, 
  onChange,
  max = 5 
}) => {
  return (
    <div className="flex items-center space-x-1" id={id}>
      {Array.from({ length: max }).map((_, index) => (
        <motion.button
          key={index}
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(index + 1)}
          className="focus:outline-none"
          aria-label={`Rate ${index + 1} out of ${max}`}
        >
          <Star
            className={`h-6 w-6 ${
              index < value 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            } transition-colors`}
          />
        </motion.button>
      ))}
    </div>
  );
};

export default StarRating;
