// Script to analyze the current database state
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Get Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 
                    process.env.NEXT_PUBLIC_SUPABASE_URL || 
                    process.env.SUPABASE_URL;

const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 
                    process.env.VITE_SUPABASE_SERVICE_KEY || 
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                    process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to query database structure
async function getCurrentDatabaseState() {
  console.log('🔍 Analyzing current database state...');
  
  try {
    // Test authentication first
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('❌ Authentication error:', authError.message);
      return;
    }
    
    console.log(authData?.session ? 
      `✅ Authenticated as ${authData.session.user.email}` : 
      '⚠️ Not authenticated - some tables may be inaccessible due to RLS');
    
    // Get list of tables in public schema
    const { data: tablesList, error: tablesError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError.message);
      
      // Try an alternative approach with RPC
      console.log('Trying alternative approach...');
      
      // Create a placeholder for the database structure
      const dbStructure = {
        tables: [],
        schemas: ['public', 'auth', 'storage'],
        extensions: [],
        message: 'Limited access - using known table names'
      };
      
      // List of tables we expect to find based on migrations
      const expectedTables = [
        'profiles', 'orders', 'order_items', 'customers', 'staff', 
        'tables', 'invoices', 'invoice_items', 'staff_attendance',
        'staff_shifts', 'staff_documents', 'staff_performance_reviews'
      ];
      
      // Check each expected table
      for (const tableName of expectedTables) {
        try {
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!countError) {
            console.log(`✅ Table '${tableName}' exists`);
            dbStructure.tables.push({
              name: tableName,
              exists: true,
              recordCount: count,
              columns: [] // We'll try to get columns next
            });
            
            // Try to get sample data to infer structure
            const { data: sampleData, error: sampleError } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
              
            if (!sampleError && sampleData && sampleData.length > 0) {
              const columns = Object.keys(sampleData[0]).map(col => ({
                name: col,
                type: typeof sampleData[0][col]
              }));
              
              dbStructure.tables[dbStructure.tables.length - 1].columns = columns;
            }
          } else {
            console.log(`❌ Table '${tableName}' does not exist or is not accessible: ${countError.message}`);
            dbStructure.tables.push({
              name: tableName,
              exists: false,
              error: countError.message
            });
          }
        } catch (err) {
          console.error(`Error checking table '${tableName}':`, err);
          dbStructure.tables.push({
            name: tableName,
            exists: false,
            error: err.message
          });
        }
      }
      
      // Save the database structure
      fs.writeFileSync('current_database_structure.json', JSON.stringify(dbStructure, null, 2));
      console.log('✅ Limited database structure saved to current_database_structure.json');
      
      return dbStructure;
    }
    
    console.log(`✅ Found ${tablesList.length} tables in public schema`);
    
    // Full database structure object
    const dbStructure = {
      timestamp: new Date().toISOString(),
      tables: []
    };
    
    // Get details for each table
    for (const table of tablesList) {
      const tableName = table.tablename;
      console.log(`\nAnalyzing table: ${tableName}`);
      
      // Get column information
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
        
      if (columnsError) {
        console.error(`❌ Error fetching columns for ${tableName}:`, columnsError.message);
        continue;
      }
      
      // Get record count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.log(`⚠️ Could not get record count for ${tableName}: ${countError.message}`);
      }
      
      // Add to structure
      dbStructure.tables.push({
        name: tableName,
        columns: columns,
        recordCount: countError ? 'unknown' : count
      });
      
      console.log(`- Columns: ${columns.length}`);
      columns.forEach(col => {
        console.log(`  • ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      console.log(`- Records: ${countError ? 'unknown' : count}`);
    }
    
    // Save the complete database structure to a file
    fs.writeFileSync('current_database_structure.json', JSON.stringify(dbStructure, null, 2));
    console.log('\n✅ Current database structure saved to current_database_structure.json');
    
    return dbStructure;
  } catch (error) {
    console.error('❌ Error analyzing database:', error);
  }
}

// Execute the function
getCurrentDatabaseState()
  .catch(error => {
    console.error('❌ Unhandled error:', error);
  })
  .finally(() => {
    console.log('\n✅ Analysis complete');
  });
