// This script will verify the staff_documents and staff_performance_reviews tables

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const envContent = fs.readFileSync('.env', 'utf8');
console.log('ENV file content:', envContent);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Key found (not showing for security)' : 'No key found');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
  console.log('Verifying staff_documents and staff_performance_reviews tables...');
  
  try {
    // Check staff_documents table directly
    console.log('Checking staff_documents table...');
    const { data: documentsCountData, error: documentsCountError } = await supabase
      .from('staff_documents')
      .select('count()', { count: 'exact', head: true })
      .limit(1);
    
    const documentsExists = !documentsCountError || documentsCountError.code !== '42P01';
    console.log('staff_documents table exists:', documentsExists);
    
    // Check staff_performance_reviews table directly
    console.log('Checking staff_performance_reviews table...');
    const { data: reviewsCountData, error: reviewsCountError } = await supabase
      .from('staff_performance_reviews')
      .select('count()', { count: 'exact', head: true })
      .limit(1);
    
    const reviewsExists = !reviewsCountError || reviewsCountError.code !== '42P01';
    console.log('staff_performance_reviews table exists:', reviewsExists);
    
    // Check staff_documents data
    if (documentsExists) {
      const { data: documentsData, error: documentsError } = await supabase
        .from('staff_documents')
        .select('*')
        .limit(5);
      
      if (documentsError) {
        console.error('Error fetching staff_documents:', documentsError);
      } else {
        console.log(`Found ${documentsData?.length || 0} document records:`);
        if (documentsData && documentsData.length > 0) {
          console.log(JSON.stringify(documentsData, null, 2));
        } else {
          console.log('No documents found. You may need to add sample data.');
        }
      }
    } else {
      console.log('staff_documents table does not exist or cannot be accessed');
    }
    
    // Check staff_performance_reviews data
    if (reviewsExists) {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('staff_performance_reviews')
        .select('*')
        .limit(5);
      
      if (reviewsError) {
        console.error('Error fetching staff_performance_reviews:', reviewsError);
      } else {
        console.log(`Found ${reviewsData?.length || 0} performance review records:`);
        if (reviewsData && reviewsData.length > 0) {
          console.log(JSON.stringify(reviewsData, null, 2));
        } else {
          console.log('No performance reviews found. You may need to add sample data.');
        }
      }
    } else {
      console.log('staff_performance_reviews table does not exist or cannot be accessed');
    }
    
    // Get staff data to help with troubleshooting
    console.log('Checking staff table...');
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id, full_name')
      .limit(5);
      
    if (staffError) {
      console.error('Error fetching staff:', staffError);
    } else {
      console.log(`Found ${staffData?.length || 0} staff records:`);
      console.log(JSON.stringify(staffData, null, 2));
    }
  } catch (error) {
    console.error('Error verifying tables:', error);
  }
}

verifyTables()
  .catch(console.error)
  .finally(() => {
    console.log('Verification completed');
    process.exit(0);
  });
