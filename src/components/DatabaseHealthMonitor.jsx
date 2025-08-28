import React, { useState } from 'react';
import databaseDiagnostic from '../utils/databaseDiagnostic';

/**
 * Database Health Monitor Component
 * 
 * This component provides a UI for diagnosing and fixing database connection issues.
 * Use this when experiencing timeout or connection problems with the database.
 */
const DatabaseHealthMonitor = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const diagnosticResults = await databaseDiagnostic.runDiagnostic();
      setResults(diagnosticResults);
    } catch (error) {
      console.error('Failed to run diagnostic:', error);
      setResults({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const fixConnections = async () => {
    setFixing(true);
    try {
      await databaseDiagnostic.fixConnections();
      runDiagnostic(); // Run diagnostic again after fix attempt
    } catch (error) {
      console.error('Failed to fix connections:', error);
      setResults({
        ...results,
        fixAttempt: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setFixing(false);
    }
  };

  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setExpanded(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg"
          title="Database Health Monitor"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Database Health</h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <button
            onClick={runDiagnostic}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? 'Running...' : 'Diagnose'}
          </button>
          <button
            onClick={fixConnections}
            disabled={fixing || loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {fixing ? 'Fixing...' : 'Fix Connections'}
          </button>
        </div>

        {results && (
          <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm overflow-auto max-h-60">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-3 h-3 rounded-full ${results.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className={results.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                {results.success ? 'Healthy' : 'Issues Detected'}
              </span>
            </div>
            
            <div className="text-gray-600 dark:text-gray-300 text-xs mb-2">
              {new Date(results.timestamp).toLocaleString()}
            </div>
            
            {results.error && (
              <div className="text-red-600 dark:text-red-400 mb-2">
                Error: {results.error}
              </div>
            )}
            
            {results.results && results.results.map((test, index) => (
              <div key={index} className="mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${test.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="font-medium">{test.name}</span>
                </div>
                {test.responseTime && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 ml-4">
                    Response time: {test.responseTime.toFixed(1)}ms
                  </div>
                )}
                {test.error && (
                  <div className="text-xs text-red-600 dark:text-red-400 ml-4">
                    {test.error}
                  </div>
                )}
                {test.data && (
                  <div className="text-xs text-gray-600 dark:text-gray-300 ml-4">
                    {JSON.stringify(test.data)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseHealthMonitor;
