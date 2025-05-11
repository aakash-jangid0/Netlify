import React from 'react';
import { cn } from '../../lib/utils';
import { Star, StarHalf } from 'lucide-react';

export const StarRating = ({ 
  value = 0, 
  onChange, 
  max = 5,
  size = 'default',
  readOnly = false,
  id,
  className
}) => {
  const handleClick = (newValue) => {
    if (readOnly || !onChange) return;
    onChange(newValue);
  };

  const sizes = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8"
  };
  
  const starSize = sizes[size];

  return (
    <div 
      className={cn(
        "flex items-center gap-1", 
        readOnly ? "" : "cursor-pointer",
        className
      )}
      id={id}
    >
      {[...Array(max)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= value;
        
        return (
          <div
            key={index}
            onClick={() => handleClick(starValue)}
            className={cn(
              "transition-all duration-100",
              readOnly ? "" : "hover:scale-110"
            )}
          >
            <Star
              className={cn(
                starSize,
                "transition-colors",
                isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              )}
            />
          </div>
        );
      })}
      {!readOnly && (
        <span className="ml-2 text-sm text-gray-600">
          {value}/{max}
        </span>
      )}
    </div>
  );
};

export default StarRating;
