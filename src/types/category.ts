// Category types for the application
export interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  icon?: string; // Icon name from Lucide icons library
  created_at?: string;
  updated_at?: string;
}
