import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Grid } from 'lucide-react';
import { getIconComponent } from '../../utils/iconHelpers';

interface DynamicIconProps {
  icon: string;
  className?: string;
  [key: string]: any; // Allow any additional props
}

/**
 * A component that dynamically renders Lucide icons by name
 * This improved approach prevents the "Objects are not valid as React children" error
 */
const DynamicIcon: React.FC<DynamicIconProps> = ({ icon, className = "w-5 h-5", ...restProps }) => {
  // Get the icon component
  const IconComponent = getIconComponent(icon);
  
  // Render the icon component with all provided props
  return <IconComponent className={className} {...restProps} />;
};

export default DynamicIcon;
