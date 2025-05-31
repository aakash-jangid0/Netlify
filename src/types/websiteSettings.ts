// Comprehensive interface for website customization settings
export interface WebsiteSettings {
  id?: string;
  business_id?: string;
  
  // Brand settings
  logo_url?: string;
  site_name: string;
  tagline?: string;
  
  // Hero section customization
  hero_background_image?: string;
  hero_title?: string;
  hero_subtitle?: string;
  hero_cta_text?: string;
  hero_cta_link?: string;
  
  // Features section
  features_section_title?: string;
  feature_1_title?: string;
  feature_1_description?: string;
  feature_1_icon?: string;
  feature_2_title?: string;
  feature_2_description?: string;
  feature_2_icon?: string;
  feature_3_title?: string;
  feature_3_description?: string;
  feature_3_icon?: string;
  
  // Popular dishes section
  popular_dishes_title?: string;
  popular_dish_ids?: string[]; // Array of menu item IDs
  
  // Call to action section
  cta_title?: string;
  cta_subtitle?: string;
  cta_button_text?: string;
  cta_button_link?: string;
  cta_background_color?: string;
    // Color scheme
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  
  // Typography
  font_family?: string;
    // Footer social media links
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  youtube_url?: string;
  linkedin_url?: string;
  
  // Opening hours
  hours_mon_fri?: string;
  hours_sat?: string;
  hours_sun?: string;
  
  // Contact details
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  
  // Created and updated timestamps
  created_at?: Date;
  updated_at?: Date;
}

// Default website settings
export const defaultWebsiteSettings: WebsiteSettings = {
  site_name: 'TastyBites',
  tagline: 'Delicious food, delivered fast',
  
  // Hero section defaults
  hero_background_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80',
  hero_title: 'Experience Fine Dining at Its Best',
  hero_subtitle: 'Discover our exquisite cuisine in an elegant dining atmosphere.',
  hero_cta_text: 'View Menu',
  hero_cta_link: '/menu',
  
  // Features section defaults
  features_section_title: 'Why Choose Us',
  feature_1_title: 'Fresh Ingredients',
  feature_1_description: 'We use only the finest, locally-sourced ingredients',
  feature_1_icon: 'UtensilsCrossed',
  feature_2_title: 'Quick Service',
  feature_2_description: 'Efficient table service within 15 minutes of ordering',
  feature_2_icon: 'Clock',
  feature_3_title: 'Best Quality',
  feature_3_description: 'Award-winning dishes prepared by expert chefs',
  feature_3_icon: 'Star',
  
  // Popular dishes defaults
  popular_dishes_title: 'Popular Dishes',
  popular_dish_ids: [],
  
  // CTA section defaults
  cta_title: 'Ready to Experience Our Cuisine?',
  cta_subtitle: 'Join us for an unforgettable dining experience',
  cta_button_text: 'View Full Menu',
  cta_button_link: '/menu',
  cta_background_color: '#f97316',
    // Color scheme defaults
  primary_color: '#f97316',
  secondary_color: '#fb923c',
  accent_color: '#ea580c',
  
  // Typography defaults
  font_family: 'Inter',
  
  // Opening hours defaults
  hours_mon_fri: 'Mon - Fri: 11:00 AM - 10:00 PM',
  hours_sat: 'Sat: 11:00 AM - 11:00 PM',
  hours_sun: 'Sun: 12:00 PM - 9:00 PM',
  
  // Contact defaults
  contact_phone: '+1 (555) 123-4567',
  contact_email: 'info@tastybites.com',
  contact_address: '123 Food Street, Cuisine City, CC 12345'
};
