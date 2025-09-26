import {
    customerService,
    invoiceService,
    paymentService,
    productService,
    quoteService
} from '../services';

// Import normalized data from data directory
import customersData from '../data/normalized/customers.json';
import invoicesData from '../data/normalized/invoices.json';
import paymentsData from '../data/normalized/payments.json';
import productsData from '../data/normalized/products.json';

// TODO: Add quotes data file when available
// For now, quotes will be empty until proper data file is created

// Extract data arrays from the JSON structure
const customers = Object.values(customersData) as any[];
const products = Object.values(productsData.products) as any[];
const invoices = invoicesData as any[]; // Already an array
const payments = paymentsData as any[]; // Already an array  
const quotes: any[] = []; // Empty until quotes data file is available

interface MigrationResult {
  success: boolean;
  message: string;
  migrated: number;
  errors: string[];
}

class DataMigration {
  async migrateCustomers(): Promise<MigrationResult> {
    console.log('Starting customer migration from normalized data...');
    console.log(`Found ${customers.length} customers to migrate`);
    const errors: string[] = [];
    let migrated = 0;
    
    try {
      for (const customer of customers) {
        try {
          const { id, ...customerData } = customer;
          await customerService.createWithId(id, customerData);
          migrated++;
          console.log(`Migrated customer: ${customer.name} with ID: ${id}`);
        } catch (error) {
          const errorMsg = `Failed to migrate customer ${customer.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
      
      return {
        success: errors.length === 0,
        message: `Customer migration completed. ${migrated}/${customers.length} migrated successfully.`,
        migrated,
        errors
      };
    } catch (error) {
      return {
        success: false,
        message: `Customer migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migrated,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  async migrateProducts(): Promise<MigrationResult> {
    console.log('Starting product migration from normalized data...');
    console.log(`Found ${products.length} products to migrate`);
    const errors: string[] = [];
    let migrated = 0;
    
    try {
      for (const product of products) {
        try {
          const { id, ...productData } = product;
          await productService.createWithId(id, productData);
          migrated++;
          console.log(`Migrated product: ${product.name} with ID: ${id}`);
        } catch (error) {
          const errorMsg = `Failed to migrate product ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
      
      return {
        success: errors.length === 0,
        message: `Product migration completed. ${migrated}/${products.length} migrated successfully.`,
        migrated,
        errors
      };
    } catch (error) {
      return {
        success: false,
        message: `Product migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migrated,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  async migrateInvoices(): Promise<MigrationResult> {
    console.log('Starting invoice migration from normalized data...');
    console.log(`Found ${invoices.length} invoices to migrate`);
    const errors: string[] = [];
    let migrated = 0;
    
    try {
      for (const invoice of invoices) {
        try {
          const { id, ...invoiceData } = invoice;
          await invoiceService.create(invoiceData);
          migrated++;
          console.log(`Migrated invoice: ${invoice.invoiceNumber}`);
        } catch (error) {
          const errorMsg = `Failed to migrate invoice ${invoice.invoiceNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
      
      return {
        success: errors.length === 0,
        message: `Invoice migration completed. ${migrated}/${invoices.length} migrated successfully.`,
        migrated,
        errors
      };
    } catch (error) {
      return {
        success: false,
        message: `Invoice migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migrated,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  async migratePayments(): Promise<MigrationResult> {
    console.log('Starting payment migration from normalized data...');
    console.log(`Found ${payments.length} payments to migrate`);
    const errors: string[] = [];
    let migrated = 0;
    
    try {
      for (const payment of payments) {
        try {
          const { id, ...paymentData } = payment;
          await paymentService.create(paymentData);
          migrated++;
          console.log(`Migrated payment: ${payment.paymentNumber}`);
        } catch (error) {
          const errorMsg = `Failed to migrate payment ${payment.paymentNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
      
      return {
        success: errors.length === 0,
        message: `Payment migration completed. ${migrated}/${payments.length} migrated successfully.`,
        migrated,
        errors
      };
    } catch (error) {
      return {
        success: false,
        message: `Payment migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migrated,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  async migrateQuotes(): Promise<MigrationResult> {
    console.log('Starting quote migration...');
    const errors: string[] = [];
    let migrated = 0;
    
    try {
      for (const quote of quotes) {
        try {
          const { id, ...quoteData } = quote;
          await quoteService.create(quoteData);
          migrated++;
          console.log(`Migrated quote: ${quote.quoteNumber}`);
        } catch (error) {
          const errorMsg = `Failed to migrate quote ${quote.quoteNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }
      
      return {
        success: errors.length === 0,
        message: `Quote migration completed. ${migrated}/${quotes.length} migrated successfully.`,
        migrated,
        errors
      };
    } catch (error) {
      return {
        success: false,
        message: `Quote migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migrated,
        errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
  
  async migrateAll(): Promise<{ [key: string]: MigrationResult }> {
    console.log('Starting full data migration...');
    
    const results = {
      customers: await this.migrateCustomers(),
      products: await this.migrateProducts(),
      invoices: await this.migrateInvoices(),
      payments: await this.migratePayments(),
      quotes: await this.migrateQuotes(),
    };
    
    // Summary
    const totalMigrated = Object.values(results).reduce((sum, result) => sum + result.migrated, 0);
    const totalErrors = Object.values(results).reduce((sum, result) => sum + result.errors.length, 0);
    
    console.log('=== Migration Summary ===');
    console.log(`Total items migrated: ${totalMigrated}`);
    console.log(`Total errors: ${totalErrors}`);
    
    Object.entries(results).forEach(([type, result]) => {
      console.log(`${type}: ${result.migrated} migrated, ${result.errors.length} errors`);
      if (result.errors.length > 0) {
        console.log(`  Errors:`, result.errors);
      }
    });
    
    return results;
  }

  // Utility method to get data counts for each collection
  getDataCounts(): { [key: string]: number } {
    return {
      customers: customers.length,
      products: products.length,
      invoices: invoices.length,
      payments: payments.length,
      quotes: quotes.length
    };
  }
}

export const dataMigration = new DataMigration();

// Helper function to clear a specific collection (use with caution!)
export async function clearCollection(collectionName: 'customers' | 'products' | 'invoices' | 'payments' | 'quotes'): Promise<void> {
  console.warn(`WARNING: This will delete all data from the ${collectionName} collection!`);
  
  try {
    let items: any[];
    let service: any;
    
    switch (collectionName) {
      case 'customers':
        items = await customerService.getAll();
        service = customerService;
        break;
      case 'products':
        items = await productService.getAll();
        service = productService;
        break;
      case 'invoices':
        items = await invoiceService.getAll();
        service = invoiceService;
        break;
      case 'payments':
        items = await paymentService.getAll();
        service = paymentService;
        break;
      case 'quotes':
        items = await quoteService.getAll();
        service = quoteService;
        break;
      default:
        throw new Error(`Unknown collection: ${collectionName}`);
    }
    
    // Delete all items from the specific collection
    const deletePromises = items.map(item => service.delete(item.id));
    await Promise.all(deletePromises);
    
    console.log(`All data cleared from ${collectionName} collection (${items.length} items deleted)`);
  } catch (error) {
    console.error(`Error clearing ${collectionName} collection:`, error);
    throw error;
  }
}

// Helper function to clear all Firebase collections (use with caution!)
export async function clearAllData(): Promise<void> {
  console.warn('WARNING: This will delete all data from Firebase!');
  
  try {
    // Get all data first
    const [customers, products, invoices, payments, quotes] = await Promise.all([
      customerService.getAll(),
      productService.getAll(),
      invoiceService.getAll(),
      paymentService.getAll(),
      quoteService.getAll(),
    ]);
    
    // Delete all items
    const deletePromises = [
      ...customers.map(item => customerService.delete(item.id)),
      ...products.map(item => productService.delete(item.id)),
      ...invoices.map(item => invoiceService.delete(item.id)),
      ...payments.map(item => paymentService.delete(item.id)),
      ...quotes.map(item => quoteService.delete(item.id)),
    ];
    
    await Promise.all(deletePromises);
    console.log('All data cleared from Firebase');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}