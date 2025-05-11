import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Grid } from 'lucide-react'; // Default icon

/**
 * Simple function to get the Lucide icon component by name
 * @param iconName The name of the icon from Lucide
 * @returns The icon component (or Grid as fallback)
 */
export const getIconComponent = (iconName: string) => {
  try {
    if (typeof iconName !== 'string') {
      return Grid;
    }
    
    // Get icon component by name
    const IconComponent = (LucideIcons as any)[iconName];
    
    return IconComponent && typeof IconComponent === 'function' 
      ? IconComponent 
      : Grid;
  } catch (error) {
    console.error(`Error getting icon ${iconName}:`, error);
    return Grid;
  }
};

/**
 * Render a Lucide icon component with provided props
 * @param iconName Name of the Lucide icon
 * @param props Props to pass to the icon
 * @returns React element with the icon
 */
export const renderIcon = (iconName: string, props = {}) => {
  const IconComponent = getIconComponent(iconName);
  return React.createElement(IconComponent, props);
};

/**
 * Get React element for an icon by name with provided props
 * @param iconName Name of the Lucide icon
 * @param props Props to pass to the icon
 * @returns React element with the icon
 */
export const getIconElement = (iconName: string, props = {}) => {
  return renderIcon(iconName, props);
};

/**
 * Check if the provided icon name is valid
 * @param iconName Name of the Lucide icon
 * @returns Boolean indicating if the icon exists
 */
export const isValidIconName = (iconName: string): boolean => {
  return typeof iconName === 'string' && typeof (LucideIcons as any)[iconName] === 'function';
};
