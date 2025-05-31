// Utility functions for className concatenation
export function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
