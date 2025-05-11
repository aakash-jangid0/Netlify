import React from 'react';
import { motion } from 'framer-motion';

export const Button = React.forwardRef(({
  className = '',
  variant = 'default',
  size = 'default',
  children,
  disabled,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    default: "bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500",
    destructive: "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-100 focus-visible:ring-gray-400",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 focus-visible:ring-gray-400",
    ghost: "bg-transparent hover:bg-gray-100 focus-visible:ring-gray-400",
    link: "bg-transparent underline-offset-4 hover:underline text-green-500 hover:bg-transparent",
  };
  
  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-8 text-lg",
  };

  const variantStyle = variants[variant] || variants.default;
  const sizeStyle = sizes[size] || sizes.default;
  const combinedClassName = `${baseStyles} ${variantStyle} ${sizeStyle} ${className}`;

  return (
    <motion.button
      className={combinedClassName}
      ref={ref}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
