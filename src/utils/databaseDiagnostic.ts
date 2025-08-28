import { supabase } from '../supabaseClient';

interface DatabaseConnectionTest {
  testName: string;
  success: boolean;
  error?: string;
  data?: unknown;
  timestamp: string;
}

interface QueryResult {
  query: number;
  itemCount: number;
  success: boolean;
}

export class DatabaseDiagnostic {
  private results: DatabaseConnectionTest[] = [];

  async runAllTests(): Promise<DatabaseConnectionTest[]> {
    console.log('🔧 Starting runAllTests...');
    console.log('🔧 Supabase client:', supabase);
    this.results = [];
    
    try {
      console.log('🔧 Test 1: Basic connection test');
      await this.testBasicConnection();
      console.log('✅ Test 1 completed');
      
      console.log('🔧 Test 2: Menu items query');
      await this.testMenuItemsQuery();
      console.log('✅ Test 2 completed');
      
      console.log('🔧 Test 3: Auth session check');
      await this.testAuthSession();
      console.log('✅ Test 3 completed');
      
      console.log('🔧 Test 4: Direct API test');
      await this.testDirectAPI();
      console.log('✅ Test 4 completed');
      
      console.log('🔧 Test 5: Multiple consecutive queries');
      await this.testConsecutiveQueries();
      console.log('✅ Test 5 completed');
      
      console.log('🔧 All tests completed, returning results:', this.results);
      return this.results;
    } catch (error) {
      console.error('💣 Error in runAllTests:', error);
      throw error;
    }
  }

  private async testBasicConnection() {
    console.log('🔗 Starting basic connection test...');
    try {
      console.log('🔗 Testing simple ping to Supabase auth service...');
      
      // First test: Simple auth service ping (should always work)
      const { data: authTest, error: authError } = await supabase.auth.getSession();
      console.log('🔗 Auth service test - data:', authTest, 'error:', authError);
      
      if (authError) {
        throw new Error(`Auth service error: ${authError.message}`);
      }
      
      console.log('🔗 Auth service working, now testing database query...');
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000);
      });
      
      // Try a simple table list query first
      console.log('🔗 Attempting to list tables...');
      const tableQueryPromise = supabase
        .from('menu_items')
        .select('id')
        .limit(1);
        
      const result = await Promise.race([tableQueryPromise, timeoutPromise]);
      const { data, error } = result as { data: unknown; error: unknown };
      
      console.log('🔗 Query result - data:', data, 'error:', error);
      
      if (error) throw error;
      
      console.log('🔗 Adding success result...');
      this.addResult({
        testName: 'Basic Connection',
        success: true,
        data: { count: data },
        timestamp: new Date().toISOString()
      });
      console.log('🔗 Basic connection test completed successfully');
    } catch (error) {
      console.error('🔗 Basic connection test failed:', error);
      this.addResult({
        testName: 'Basic Connection',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }

  private async testMenuItemsQuery() {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .limit(5);
      
      if (error) throw error;
      
      this.addResult({
        testName: 'Menu Items Query',
        success: true,
        data: { itemCount: data?.length || 0, firstItem: data?.[0] },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.addResult({
        testName: 'Menu Items Query',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }

  private async testAuthSession() {
    try {
      const { data: session, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      this.addResult({
        testName: 'Auth Session',
        success: true,
        data: { 
          hasSession: !!session.session,
          user: session.session?.user?.email || 'anonymous'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.addResult({
        testName: 'Auth Session',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }

  private async testDirectAPI() {
    try {
      const response = await fetch('http://localhost:5000/api/menu');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      this.addResult({
        testName: 'Direct API',
        success: true,
        data: { 
          itemCount: data?.length || 0,
          status: response.status
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.addResult({
        testName: 'Direct API',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  }

  private async testConsecutiveQueries() {
    const queryResults: QueryResult[] = [];
    
    try {
      // Run 5 consecutive queries with a 500ms delay between each
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data, error } = await supabase
          .from('menu_items')
          .select('id, name')
          .limit(3);
        
        if (error) throw error;
        
        queryResults.push({
          query: i + 1,
          itemCount: data?.length || 0,
          success: true
        });
      }
      
      this.addResult({
        testName: 'Consecutive Queries',
        success: true,
        data: { queries: queryResults },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.addResult({
        testName: 'Consecutive Queries',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: { completedQueries: queryResults },
        timestamp: new Date().toISOString()
      });
    }
  }

  private addResult(result: DatabaseConnectionTest) {
    this.results.push(result);
    console.log(`[DatabaseDiagnostic] ${result.testName}: ${result.success ? '✅' : '❌'}`, result);
  }

  getResults(): DatabaseConnectionTest[] {
    return this.results;
  }

  getFailedTests(): DatabaseConnectionTest[] {
    return this.results.filter(r => !r.success);
  }

  getSuccessfulTests(): DatabaseConnectionTest[] {
    return this.results.filter(r => r.success);
  }
}

export const databaseDiagnostic = new DatabaseDiagnostic();
