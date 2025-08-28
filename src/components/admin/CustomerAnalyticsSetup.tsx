import React, { useState } from 'react';
import { oneClickSetup, checkSetupStatus } from '../../utils/autoSetup';

/**
 * Admin component for one-click customer analytics setup
 */
const CustomerAnalyticsSetup: React.FC = () => {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [setupLog, setSetupLog] = useState<string[]>([]);

  // Check setup status on component mount
  React.useEffect(() => {
    checkSetupStatus().then(setIsSetup);
  }, []);

  const handleOneClickSetup = async () => {
    setIsLoading(true);
    setSetupLog([]);
    
    // Capture console logs during setup
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.log = (...args) => {
      setSetupLog(prev => [...prev, `ℹ️ ${args.join(' ')}`]);
      originalConsoleLog(...args);
    };
    
    console.error = (...args) => {
      setSetupLog(prev => [...prev, `❌ ${args.join(' ')}`]);
      originalConsoleError(...args);
    };
    
    console.warn = (...args) => {
      setSetupLog(prev => [...prev, `⚠️ ${args.join(' ')}`]);
      originalConsoleWarn(...args);
    };

    try {
      await oneClickSetup();
      setIsSetup(true);
    } catch (error) {
      console.error('Setup failed:', error);
    } finally {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsLoading(true);
    try {
      const status = await checkSetupStatus();
      setIsSetup(status);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          🤖 Automated Customer Analytics
        </h2>
        <p className="text-gray-600">
          One-click setup for automated customer tracking, analytics, and insights.
        </p>
      </div>

      {/* Status Display */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div 
              className={`w-4 h-4 rounded-full ${
                isSetup === null 
                  ? 'bg-gray-400' 
                  : isSetup 
                    ? 'bg-green-500' 
                    : 'bg-red-500'
              }`}
            />
            <span className="font-medium">
              Status: {
                isSetup === null 
                  ? 'Checking...' 
                  : isSetup 
                    ? 'Active & Automated' 
                    : 'Not Set Up'
              }
            </span>
          </div>
          
          <button
            onClick={handleCheckStatus}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>

      {/* Features List */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">📊 Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Automatic customer creation for all orders',
            'Real-time analytics updates',
            'Loyalty tier tracking',
            'Purchase behavior analysis',
            'Cuisine preference detection',
            'Visit frequency calculation',
            'Order history analytics',
            'Database trigger backups',
            'Zero manual maintenance required',
            'Handles both website & counter orders'
          ].map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Setup Button */}
      {!isSetup && (
        <div className="mb-6">
          <button
            onClick={handleOneClickSetup}
            disabled={isLoading}
            className={`
              w-full py-4 px-6 rounded-lg font-semibold text-white transition-all
              ${isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
              }
            `}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                <span>Setting up automated analytics...</span>
              </div>
            ) : (
              '🚀 One-Click Setup - Automate Customer Analytics'
            )}
          </button>
          
          <p className="text-sm text-gray-500 mt-2 text-center">
            This will set up database triggers, populate existing data, and enable real-time updates.
          </p>
        </div>
      )}

      {/* Success Message */}
      {isSetup && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="text-green-800 font-semibold">System Active!</h3>
              <p className="text-green-700 text-sm">
                Customer analytics are now fully automated. No manual intervention required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Setup Log */}
      {setupLog.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">📋 Setup Log</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            {setupLog.map((log, index) => (
              <div key={index} className="text-sm text-gray-700 mb-1 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-3">🔧 How It Works</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 font-bold">1.</span>
            <span>
              <strong>Database Setup:</strong> Creates customer analytics columns and automated triggers
            </span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 font-bold">2.</span>
            <span>
              <strong>Data Population:</strong> Analyzes existing orders and builds customer profiles
            </span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 font-bold">3.</span>
            <span>
              <strong>Real-time Updates:</strong> Every new order automatically updates customer analytics
            </span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-500 font-bold">4.</span>
            <span>
              <strong>Backup Systems:</strong> Database triggers ensure updates never get missed
            </span>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">🔍 Technical Details</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• <strong>Application-level:</strong> React hooks automatically update analytics</p>
          <p>• <strong>Database-level:</strong> PostgreSQL triggers provide backup automation</p>
          <p>• <strong>Real-time:</strong> Supabase subscriptions sync changes instantly</p>
          <p>• <strong>Retry Logic:</strong> Failed updates are automatically retried</p>
          <p>• <strong>Performance:</strong> Optimized indexes for fast analytics queries</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalyticsSetup;
