import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase.config';

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

class FirebaseConnectionTester {
  private testCollectionName = '_connection_test';
  
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      console.log('Testing Firebase connection...');
      
      // Test 1: Create a test document
      const testDoc = doc(db, this.testCollectionName, 'test-doc');
      const testData = {
        message: 'Firebase connection test',
        timestamp: new Date().toISOString(),
        randomValue: Math.random()
      };
      
      await setDoc(testDoc, testData);
      console.log('✓ Test document created successfully');
      
      // Test 2: Read the test document
      const docSnap = await getDoc(testDoc);
      if (!docSnap.exists()) {
        throw new Error('Test document was not found after creation');
      }
      
      const retrievedData = docSnap.data();
      console.log('✓ Test document retrieved successfully');
      
      // Test 3: Verify data integrity
      if (retrievedData?.message !== testData.message) {
        throw new Error('Data integrity check failed');
      }
      console.log('✓ Data integrity verified');
      
      // Test 4: List documents in collection
      const querySnapshot = await getDocs(collection(db, this.testCollectionName));
      console.log(`✓ Collection query successful (${querySnapshot.size} documents found)`);
      
      // Test 5: Delete test document (cleanup)
      await deleteDoc(testDoc);
      console.log('✓ Test document deleted successfully');
      
      return {
        success: true,
        message: 'Firebase connection test completed successfully!',
        details: {
          testsRun: 5,
          testData: retrievedData,
          documentsFound: querySnapshot.size
        }
      };
      
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      
      return {
        success: false,
        message: 'Firebase connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  async testAllServices(): Promise<{ [serviceName: string]: ConnectionTestResult }> {
    const results: { [serviceName: string]: ConnectionTestResult } = {};
    
    // Test basic connection first
    results.connection = await this.testConnection();
    
    if (!results.connection.success) {
      return results;
    }
    
    // Test each collection that our services will use
    const collections = ['customers', 'products', 'invoices', 'payments', 'quotes'];
    
    for (const collectionName of collections) {
      try {
        console.log(`Testing ${collectionName} collection...`);
        
        // Test collection access
        const testCollection = collection(db, collectionName);
        const snapshot = await getDocs(testCollection);
        
        results[collectionName] = {
          success: true,
          message: `${collectionName} collection accessible`,
          details: {
            documentsCount: snapshot.size,
            collectionPath: collectionName
          }
        };
        
        console.log(`✓ ${collectionName} collection test passed (${snapshot.size} documents)`);
        
      } catch (error) {
        results[collectionName] = {
          success: false,
          message: `Failed to access ${collectionName} collection`,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        
        console.error(`✗ ${collectionName} collection test failed:`, error);
      }
    }
    
    return results;
  }
  
  async checkFirebaseConfig(): Promise<ConnectionTestResult> {
    try {
      // Since we can't easily check environment variables in this context,
      // we'll try to use the database connection itself as a config test
      if (!db) {
        return {
          success: false,
          message: 'Firebase database not initialized',
          error: 'Database instance is null or undefined'
        };
      }
      
      // Try to get the app instance to verify configuration
      const app = db.app;
      if (!app) {
        return {
          success: false,
          message: 'Firebase app not properly configured',
          error: 'App instance is not available'
        };
      }
      
      return {
        success: true,
        message: 'Firebase configuration appears to be valid',
        details: {
          appName: app.name,
          hasDatabase: !!db
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Error checking Firebase configuration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const firebaseConnectionTester = new FirebaseConnectionTester();

// Helper function to run comprehensive tests
export async function runFirebaseTests(): Promise<void> {
  console.log('🔥 Starting Firebase Connection Tests...\n');
  
  // Check configuration
  console.log('1. Checking Firebase configuration...');
  const configResult = await firebaseConnectionTester.checkFirebaseConfig();
  console.log(configResult.success ? '✅' : '❌', configResult.message);
  if (!configResult.success) {
    console.error('Configuration Error:', configResult.error);
    return;
  }
  if (configResult.details) {
    console.log('   App Name:', configResult.details.appName);
    console.log('   Has Database:', configResult.details.hasDatabase || false);
  }
  console.log();
  
  // Test all services
  console.log('2. Testing Firebase services...');
  const results = await firebaseConnectionTester.testAllServices();
  
  let successCount = 0;
  let totalTests = 0;
  
  Object.entries(results).forEach(([testName, result]) => {
    totalTests++;
    if (result.success) {
      successCount++;
      console.log('✅', `${testName}:`, result.message);
    } else {
      console.log('❌', `${testName}:`, result.message);
      if (result.error) {
        console.log('   Error:', result.error);
      }
    }
  });
  
  console.log(`\n🏁 Firebase Tests Complete: ${successCount}/${totalTests} passed`);
  
  if (successCount === totalTests) {
    console.log('🎉 Firebase is ready for use!');
  } else {
    console.log('⚠️  Some tests failed. Please check your Firebase setup.');
  }
}