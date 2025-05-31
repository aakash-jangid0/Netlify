import { supabase } from '../lib/supabase';
import { defaultWebsiteSettings } from '../types/websiteSettings';
import { toast } from 'react-hot-toast';

export const initializeWebsiteSettings = async () => {
  try {
    console.log('Checking website_settings table...');
    
    // Try to fetch from the table first
    const { data, error } = await supabase
      .from('website_settings')
      .select('id')
      .limit(1);

    if (error) {
      // If table doesn't exist, we'll get an error
      if (error.code === '42P01' || error.message?.includes('relation "website_settings" does not exist')) {
        console.log('Website settings table does not exist. Please run the migration.');
        toast.error('Database setup required. Please contact administrator.');
        return false;
      }
      throw error;
    }

    // If table exists but no data, insert default settings
    if (data && data.length === 0) {
      console.log('Creating default website settings...');
      const { error: insertError } = await supabase
        .from('website_settings')
        .insert([{
          ...defaultWebsiteSettings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (insertError) {
        throw insertError;
      }

      console.log('Default website settings created successfully!');
      toast.success('Website settings initialized successfully!');
    }

    return true;
  } catch (error) {
    console.error('Error initializing website settings:', error);
    toast.error('Failed to initialize website settings');
    return false;
  }
};

export const checkTableExists = async () => {
  try {
    const { data, error } = await supabase
      .from('website_settings')
      .select('id')
      .limit(1);

    return !error || error.code !== '42P01';
  } catch (error) {
    return false;
  }
};
