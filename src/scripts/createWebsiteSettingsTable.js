// Create website_settings table if it doesn't exist
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const createWebsiteSettingsTable = async () => {
  try {
    console.log('Checking website_settings table...');
    
    // Try to query the table to see if it exists
    const { data, error } = await supabase
      .from('website_settings')
      .select('id')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('\n❌ website_settings table does not exist!');
      console.log('\n📋 To create the table, please:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Run the SQL script from: database/create_website_settings.sql');
      console.log('\n🔗 Supabase URL:', supabaseUrl);
      return false;
    } else if (error) {
      throw error;
    } else {
      console.log('✅ website_settings table exists!');
      
      // Check if we have default data
      if (!data || data.length === 0) {
        console.log('📝 Creating default website settings...');
        
        const { error: insertError } = await supabase
          .from('website_settings')
          .insert({
            site_name: 'TastyBites',
            footer_text: '© 2025 TastyBites. All rights reserved.',
            hero_title: 'Experience Fine Dining at Its Best',
            hero_description: 'Discover our exquisite cuisine in an elegant dining atmosphere.',
            hero_button_text: 'View Menu',
            hero_button_url: '/menu'
          });

        if (insertError) {
          throw insertError;
        }
        
        console.log('✅ Default website settings created!');
      } else {
        console.log('✅ Website settings data already exists!');
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error with website_settings table:', error);
    return false;
  }
};

// Run the function
createWebsiteSettingsTable();
