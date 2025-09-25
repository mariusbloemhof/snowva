import React, { useEffect, useRef, useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { clearAllData, dataMigration } from '../utils/dataMigration';
import { runFirebaseTests } from '../utils/firebaseTest';

interface MigrationStatus {
  isRunning: boolean;
  results?: any;
  error?: string;
}

interface ConsoleLog {
  id: number;
  timestamp: string;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
}

export const FirebaseAdmin: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus>({ isRunning: false });
  const [testStatus, setTestStatus] = useState<MigrationStatus>({ isRunning: false });
  const [clearStatus, setClearStatus] = useState<MigrationStatus>({ isRunning: false });
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const consoleContainerRef = useRef<HTMLDivElement>(null);
  const logIdCounter = useRef(0);
  
  const { 
    customers, products, invoices, payments, quotes,
    loading 
  } = useFirebase();

  // Auto-scroll console to bottom when new logs are added
  useEffect(() => {
    if (consoleContainerRef.current) {
      const container = consoleContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [consoleLogs]);

  // Helper function to add logs to console
  const addConsoleLog = (level: ConsoleLog['level'], message: string) => {
    const newLog: ConsoleLog = {
      id: ++logIdCounter.current,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    };
    setConsoleLogs(prev => [...prev, newLog]);
  };

  // Override console methods to capture logs
  const withConsoleCapture = (fn: () => Promise<any>) => {
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      addConsoleLog('log', args.join(' '));
      originalLog(...args);
    };
    console.info = (...args) => {
      addConsoleLog('info', args.join(' '));
      originalInfo(...args);
    };
    console.warn = (...args) => {
      addConsoleLog('warn', args.join(' '));
      originalWarn(...args);
    };
    console.error = (...args) => {
      addConsoleLog('error', args.join(' '));
      originalError(...args);
    };

    return fn().finally(() => {
      console.log = originalLog;
      console.info = originalInfo;
      console.warn = originalWarn;
      console.error = originalError;
    });
  };

  const handleTestConnection = async () => {
    setTestStatus({ isRunning: true });
    setShowConsole(true);
    addConsoleLog('info', '🔥 Starting Firebase connection test...');
    
    try {
      await withConsoleCapture(async () => {
        await runFirebaseTests();
      });
      addConsoleLog('info', '✅ Firebase connection test completed successfully!');
      setTestStatus({ 
        isRunning: false, 
        results: 'Firebase connection test completed successfully!' 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addConsoleLog('error', `❌ Connection test failed: ${errorMessage}`);
      setTestStatus({ 
        isRunning: false, 
        error: errorMessage 
      });
    }
  };

  const handleMigrateData = async () => {
    setMigrationStatus({ isRunning: true });
    setShowConsole(true);
    addConsoleLog('info', '🚀 Starting data migration...');
    
    try {
      const results = await withConsoleCapture(async () => {
        return await dataMigration.migrateAll();
      });
      
      // Add detailed results to console
      let totalMigrated = 0;
      let totalErrors = 0;
      
      Object.entries(results).forEach(([type, result]: [string, any]) => {
        totalMigrated += result.migrated;
        totalErrors += result.errors?.length || 0;
        
        if (result.errors?.length > 0) {
          addConsoleLog('error', `❌ ${type}: ${result.migrated} migrated, ${result.errors.length} errors`);
          result.errors.forEach((error: string) => {
            addConsoleLog('error', `   • ${error}`);
          });
        } else {
          addConsoleLog('info', `✅ ${type}: ${result.migrated} items migrated successfully`);
        }
      });
      
      addConsoleLog('info', `🎉 Migration complete: ${totalMigrated} items migrated, ${totalErrors} errors`);
      setMigrationStatus({ isRunning: false, results });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addConsoleLog('error', `❌ Migration failed: ${errorMessage}`);
      setMigrationStatus({ 
        isRunning: false, 
        error: errorMessage 
      });
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete ALL data from Firebase!\n\nThis action cannot be undone. Are you sure you want to continue?')) {
      return;
    }

    setClearStatus({ isRunning: true });
    setShowConsole(true);
    addConsoleLog('warn', '⚠️  Starting database clear operation...');
    
    try {
      await withConsoleCapture(async () => {
        await clearAllData();
      });
      
      addConsoleLog('info', '🗑️  Database cleared successfully');
      setClearStatus({ 
        isRunning: false, 
        results: 'Database cleared successfully!' 
      });
      
      // Refresh data in the UI
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addConsoleLog('error', `❌ Database clear failed: ${errorMessage}`);
      setClearStatus({ 
        isRunning: false, 
        error: errorMessage 
      });
    }
  };

  const clearConsole = () => {
    setConsoleLogs([]);
    addConsoleLog('info', 'Console cleared');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Firebase Administration</h1>
            <p className="text-sm text-gray-600 mt-1">Test Firebase connectivity and migrate data</p>
          </div>

          <div className="p-6 space-y-8">
            
            {/* Connection Test Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Test</h2>
              <p className="text-sm text-gray-600 mb-4">
                Test your Firebase connection and verify all services are working properly.
              </p>
              
              <div className="flex space-x-3 mb-4">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus.isRunning}
                  className={`px-4 py-2 rounded-md text-white font-medium ${
                    testStatus.isRunning 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {testStatus.isRunning ? 'Testing Connection...' : 'Test Firebase Connection'}
                </button>
                
                {!showConsole && (
                  <button
                    onClick={() => setShowConsole(true)}
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Show Console
                  </button>
                )}
              </div>

              {testStatus.results && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800">{testStatus.results}</p>
                </div>
              )}

              {testStatus.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800">Error: {testStatus.error}</p>
                </div>
              )}
            </div>

            {/* Current Data Status */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Firebase Data</h2>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {loading.customers ? '...' : customers.length}
                  </div>
                  <div className="text-sm text-gray-600">Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {loading.products ? '...' : products.length}
                  </div>
                  <div className="text-sm text-gray-600">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {loading.invoices ? '...' : invoices.length}
                  </div>
                  <div className="text-sm text-gray-600">Invoices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {loading.payments ? '...' : payments.length}
                  </div>
                  <div className="text-sm text-gray-600">Payments</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {loading.quotes ? '...' : quotes.length}
                  </div>
                  <div className="text-sm text-gray-600">Quotes</div>
                </div>
              </div>
            </div>

            {/* Console Output */}
            {showConsole && (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Console Output</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={clearConsole}
                      className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setShowConsole(false)}
                      className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Hide
                    </button>
                  </div>
                </div>
                
                <div 
                  ref={consoleContainerRef}
                  className="bg-black text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm"
                >
                  {consoleLogs.length === 0 ? (
                    <div className="text-gray-500">Console output will appear here...</div>
                  ) : (
                    consoleLogs.map(log => (
                      <div key={log.id} className={`mb-1 ${
                        log.level === 'error' ? 'text-red-400' : 
                        log.level === 'warn' ? 'text-yellow-400' : 
                        log.level === 'info' ? 'text-blue-400' : 
                        'text-green-400'
                      }`}>
                        <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Database Management */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Database Management</h2>
              <p className="text-sm text-gray-600 mb-4">
                Clear all data from Firebase or manage your database content.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      <strong>DANGER:</strong> Clearing the database will permanently delete ALL data. 
                      This action cannot be undone!
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClearDatabase}
                disabled={clearStatus.isRunning}
                className={`px-4 py-2 rounded-md text-white font-medium ${
                  clearStatus.isRunning 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-700 hover:bg-red-800'
                }`}
              >
                {clearStatus.isRunning ? 'Clearing Database...' : 'Clear All Firebase Data'}
              </button>

              {clearStatus.results && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800">{clearStatus.results}</p>
                </div>
              )}

              {clearStatus.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800">Error: {clearStatus.error}</p>
                </div>
              )}
            </div>

            {/* Data Migration Section */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Migration</h2>
              <p className="text-sm text-gray-600 mb-4">
                Migrate your existing mock data to Firebase. This will populate your Firebase collections 
                with the data from your constants file.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Warning:</strong> This will create new documents in Firebase. 
                      Make sure your Firebase project is properly configured.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mb-4">
                <button
                  onClick={handleMigrateData}
                  disabled={migrationStatus.isRunning}
                  className={`px-4 py-2 rounded-md text-white font-medium ${
                    migrationStatus.isRunning 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {migrationStatus.isRunning ? 'Migrating Data...' : 'Migrate All Data to Firebase'}
                </button>
                
                {!showConsole && (
                  <button
                    onClick={() => setShowConsole(true)}
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Show Console
                  </button>
                )}
              </div>

              {migrationStatus.results && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="font-medium text-green-800 mb-2">Migration Results:</h3>
                  <div className="space-y-2 text-sm text-green-700">
                    {Object.entries(migrationStatus.results).map(([type, result]: [string, any]) => (
                      <div key={type}>
                        <strong>{type}:</strong> {result.migrated} items migrated
                        {result.errors?.length > 0 && (
                          <span className="text-red-600"> ({result.errors.length} errors)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {migrationStatus.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800">Error: {migrationStatus.error}</p>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>First, test your Firebase connection to ensure everything is set up correctly</li>
                <li>Review the current data counts above to see what's already in Firebase</li>
                <li>If Firebase is empty, run the data migration to populate it with your mock data</li>
                <li>Watch the console output for detailed logs and error messages during operations</li>
                <li>Use "Clear All Firebase Data" if you need to reset the database completely</li>
                <li>Once migration is complete, your app will use Firebase instead of mock data</li>
                <li>All changes will now persist to Firebase and sync across sessions</li>
              </ol>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  💡 <strong>Tip:</strong> The console will show detailed logs including any errors during migration. 
                  This will help you identify and fix any data issues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};