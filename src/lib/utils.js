/**
 * Combines multiple class names into a single string
 * This is a simplified version of the clsx or classnames libraries
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
