// Script to diagnose Supabase connection and staff table fetching
import { supabase } from './src/lib/supabase';

async function diagnoseSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabase.rpc('version');
    if (healthError) {
      console.error('❌ Failed to connect to Supabase:', healthError);
    } else {
      console.log('✅ Supabase connection successful');
      console.log('Supabase version:', healthCheck);
    }
    
    // Check if staff table exists
    console.log('\nChecking if staff table exists...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'staff');
    
    if (tableError) {
      console.error('❌ Error checking for staff table:', tableError);
    } else if (!tableInfo || tableInfo.length === 0) {
      console.error('❌ Staff table does not exist');
    } else {
      console.log('✅ Staff table exists');
    }
    
    // Try to fetch staff data
    console.log('\nTrying to fetch staff data...');
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .limit(1);
    
    if (staffError) {
      console.error('❌ Failed to fetch staff data:', staffError);
      console.error('Error details:', {
        message: staffError.message,
        details: staffError.details,
        hint: staffError.hint,
        code: staffError.code
      });
    } else if (!staffData || staffData.length === 0) {
      console.log('ℹ️ No staff records found, but query was successful');
    } else {
      console.log('✅ Successfully fetched staff data');
      console.log('First staff record (partial):', {
        id: staffData[0].id,
        name: staffData[0].full_name,
        email: staffData[0].email
      });
    }
    
    // Check RLS policies
    console.log('\nChecking Row Level Security policies...');
    const { data: rlsPolicies, error: rlsError } = await supabase
      .from('pg_policies')
      .select('*')
      .ilike('tablename', 'staff');
      
    if (rlsError) {
      console.error('❌ Error checking RLS policies:', rlsError);
    } else {
      if (rlsPolicies && rlsPolicies.length > 0) {
        console.log(`✅ Found ${rlsPolicies.length} RLS policies for staff table`);
        rlsPolicies.forEach((policy, i) => {
          console.log(`  Policy ${i + 1}: ${policy.policyname}`);
        });
      } else {
        console.warn('⚠️ No RLS policies found for staff table');
      }
    }
    
    // Check authentication status
    const { data: authData } = await supabase.auth.getSession();
    if (authData?.session) {
      console.log('\n✅ User is authenticated');
      console.log('User ID:', authData.session.user.id);
      console.log('User email:', authData.session.user.email);
    } else {
      console.warn('\n⚠️ User is not authenticated - this might be the issue if RLS requires authentication');
    }
    
  } catch (error) {
    console.error('Unexpected error during diagnosis:', error);
  }
}

// Run the diagnosis
diagnoseSupabaseConnection()
  .then(() => {
    console.log('\nDiagnosis complete');
  })
  .catch(err => {
    console.error('Failed to run diagnosis:', err);
  });
