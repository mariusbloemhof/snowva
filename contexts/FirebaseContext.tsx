import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    customerService,
    invoiceService,
    paymentService,
    productService,
    quoteService
} from '../services';
import { Customer, Invoice, Payment, Product, Quote } from '../types';
import { useToast } from './ToastContext';

interface FirebaseContextType {
  // Data
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  payments: Payment[];
  quotes: Quote[];
  
  // Loading states
  loading: {
    customers: boolean;
    products: boolean;
    invoices: boolean;
    payments: boolean;
    quotes: boolean;
  };
  
  // Error states
  errors: {
    customers: string | null;
    products: string | null;
    invoices: string | null;
    payments: string | null;
    quotes: string | null;
  };
  
  // CRUD operations
  customerOperations: {
    create: (data: Omit<Customer, 'id'>) => Promise<string>;
    update: (id: string, data: Partial<Customer>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
  };
  
  productOperations: {
    create: (data: Omit<Product, 'id'>) => Promise<string>;
    update: (id: string, data: Partial<Product>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
  };
  
  invoiceOperations: {
    create: (data: Omit<Invoice, 'id'>) => Promise<string>;
    update: (id: string, data: Partial<Invoice>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
  };
  
  paymentOperations: {
    create: (data: Omit<Payment, 'id'>) => Promise<string>;
    update: (id: string, data: Partial<Payment>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
  };
  
  quoteOperations: {
    create: (data: Omit<Quote, 'id'>) => Promise<string>;
    update: (id: string, data: Partial<Quote>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
  };
  
  // Utility functions
  isOnline: boolean;
  refreshAll: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    customers: true,
    products: true,
    invoices: true,
    payments: true,
    quotes: true,
  });
  
  // Error states
  const [errors, setErrors] = useState({
    customers: null as string | null,
    products: null as string | null,
    invoices: null as string | null,
    payments: null as string | null,
    quotes: null as string | null,
  });
  
  // Online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const { addToast } = useToast();
  
  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Helper function to handle operations with error handling
  const handleOperation = async <T,>(
    operation: () => Promise<T>,
    successMessage?: string,
    errorContext?: string
  ): Promise<T | undefined> => {
    try {
      const result = await operation();
      if (successMessage) {
        addToast(successMessage, 'success');
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      const contextMessage = errorContext ? `${errorContext}: ${errorMessage}` : errorMessage;
      
      console.error(contextMessage, error);
      addToast(contextMessage, 'error');
      
      if (!isOnline) {
        addToast('You appear to be offline. Changes will sync when connection is restored.', 'info');
      }
      
      throw error;
    }
  };
  
  // Load customers
  const loadCustomers = async () => {
    try {
      setLoading(prev => ({ ...prev, customers: true }));
      setErrors(prev => ({ ...prev, customers: null }));
      
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.warn('Firebase customers failed, trying local fallback:', error);
      try {
        // Fallback to local JSON data
        const response = await fetch('/data/normalized/customers.json');
        const customersArray = await response.json();
        setCustomers(customersArray as Customer[]);
        setErrors(prev => ({ ...prev, customers: null }));
      } catch (fallbackError) {
        const errorMessage = 'Failed to load customers from both Firebase and local data';
        setErrors(prev => ({ ...prev, customers: errorMessage }));
        console.error('Error loading customers fallback:', fallbackError);
      }
    } finally {
      setLoading(prev => ({ ...prev, customers: false }));
    }
  };
  
  // Load products
  const loadProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      setErrors(prev => ({ ...prev, products: null }));
      
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.warn('Firebase products failed, trying local fallback:', error);
      try {
        // Fallback to local JSON data
        const response = await fetch('/data/normalized/products.json');
        const jsonData = await response.json();
        // Convert nested products object to array
        const productsArray = jsonData.products ? Object.values(jsonData.products) : [];
        setProducts(productsArray as Product[]);
        setErrors(prev => ({ ...prev, products: null }));
      } catch (fallbackError) {
        const errorMessage = 'Failed to load products from both Firebase and local data';
        setErrors(prev => ({ ...prev, products: errorMessage }));
        console.error('Error loading products fallback:', fallbackError);
      }
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };
  
  // Load invoices
  const loadInvoices = async () => {
    try {
      setLoading(prev => ({ ...prev, invoices: true }));
      setErrors(prev => ({ ...prev, invoices: null }));
      
      const data = await invoiceService.getAll();
      setInvoices(data);
    } catch (error) {
      console.warn('Firebase invoices failed, trying local fallback:', error);
      try {
        // Fallback to local JSON data
        const response = await fetch('/data/normalized/invoices.json');
        const invoicesArray = await response.json();
        setInvoices(invoicesArray as Invoice[]);
        setErrors(prev => ({ ...prev, invoices: null }));
      } catch (fallbackError) {
        const errorMessage = 'Failed to load invoices from both Firebase and local data';
        setErrors(prev => ({ ...prev, invoices: errorMessage }));
        console.error('Error loading invoices fallback:', fallbackError);
      }
    } finally {
      setLoading(prev => ({ ...prev, invoices: false }));
    }
  };
  
  // Load payments
  const loadPayments = async () => {
    try {
      setLoading(prev => ({ ...prev, payments: true }));
      setErrors(prev => ({ ...prev, payments: null }));
      
      const data = await paymentService.getAll();
      setPayments(data);
    } catch (error) {
      console.warn('Firebase payments failed, trying local fallback:', error);
      try {
        // Fallback to local JSON data
        const response = await fetch('/data/normalized/payments.json');
        const paymentsArray = await response.json();
        setPayments(paymentsArray as Payment[]);
        setErrors(prev => ({ ...prev, payments: null }));
      } catch (fallbackError) {
        const errorMessage = 'Failed to load payments from both Firebase and local data';
        setErrors(prev => ({ ...prev, payments: errorMessage }));
        console.error('Error loading payments fallback:', fallbackError);
      }
    } finally {
      setLoading(prev => ({ ...prev, payments: false }));
    }
  };
  
  // Load quotes
  const loadQuotes = async () => {
    try {
      setLoading(prev => ({ ...prev, quotes: true }));
      setErrors(prev => ({ ...prev, quotes: null }));
      
      const data = await quoteService.getAll();
      setQuotes(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load quotes';
      setErrors(prev => ({ ...prev, quotes: errorMessage }));
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(prev => ({ ...prev, quotes: false }));
    }
  };
  
  // Load all data on mount
  useEffect(() => {
    loadCustomers();
    loadProducts();
    loadInvoices();
    loadPayments();
    loadQuotes();
  }, []);
  
  // Customer operations
  const customerOperations = {
    create: async (data: Omit<Customer, 'id'>) => {
      const id = await handleOperation(
        () => customerService.create(data),
        'Customer created successfully',
        'Failed to create customer'
      );
      if (id) {
        await loadCustomers(); // Refresh data
      }
      return id!;
    },
    
    update: async (id: string, data: Partial<Customer>) => {
      await handleOperation(
        () => customerService.update(id, data),
        'Customer updated successfully',
        'Failed to update customer'
      );
      await loadCustomers(); // Refresh data
    },
    
    delete: async (id: string) => {
      await handleOperation(
        () => customerService.delete(id),
        'Customer deleted successfully',
        'Failed to delete customer'
      );
      await loadCustomers(); // Refresh data
    },
    
    refresh: loadCustomers,
  };
  
  // Product operations
  const productOperations = {
    create: async (data: Omit<Product, 'id'>) => {
      const id = await handleOperation(
        () => productService.create(data),
        'Product created successfully',
        'Failed to create product'
      );
      if (id) {
        await loadProducts(); // Refresh data
      }
      return id!;
    },
    
    update: async (id: string, data: Partial<Product>) => {
      await handleOperation(
        () => productService.update(id, data),
        'Product updated successfully',
        'Failed to update product'
      );
      await loadProducts(); // Refresh data
    },
    
    delete: async (id: string) => {
      await handleOperation(
        () => productService.delete(id),
        'Product deleted successfully',
        'Failed to delete product'
      );
      await loadProducts(); // Refresh data
    },
    
    refresh: loadProducts,
  };
  
  // Invoice operations
  const invoiceOperations = {
    create: async (data: Omit<Invoice, 'id'>) => {
      const id = await handleOperation(
        () => invoiceService.create(data),
        'Invoice created successfully',
        'Failed to create invoice'
      );
      if (id) {
        await loadInvoices(); // Refresh data
      }
      return id!;
    },
    
    update: async (id: string, data: Partial<Invoice>) => {
      await handleOperation(
        () => invoiceService.update(id, data),
        'Invoice updated successfully',
        'Failed to update invoice'
      );
      await loadInvoices(); // Refresh data
    },
    
    delete: async (id: string) => {
      await handleOperation(
        () => invoiceService.delete(id),
        'Invoice deleted successfully',
        'Failed to delete invoice'
      );
      await loadInvoices(); // Refresh data
    },
    
    refresh: loadInvoices,
  };
  
  // Payment operations
  const paymentOperations = {
    create: async (data: Omit<Payment, 'id'>) => {
      const id = await handleOperation(
        () => paymentService.create(data),
        'Payment recorded successfully',
        'Failed to record payment'
      );
      if (id) {
        await loadPayments(); // Refresh data
      }
      return id!;
    },
    
    update: async (id: string, data: Partial<Payment>) => {
      await handleOperation(
        () => paymentService.update(id, data),
        'Payment updated successfully',
        'Failed to update payment'
      );
      await loadPayments(); // Refresh data
    },
    
    delete: async (id: string) => {
      await handleOperation(
        () => paymentService.delete(id),
        'Payment deleted successfully',
        'Failed to delete payment'
      );
      await loadPayments(); // Refresh data
    },
    
    refresh: loadPayments,
  };
  
  // Quote operations
  const quoteOperations = {
    create: async (data: Omit<Quote, 'id'>) => {
      const id = await handleOperation(
        () => quoteService.create(data),
        'Quote created successfully',
        'Failed to create quote'
      );
      if (id) {
        await loadQuotes(); // Refresh data
      }
      return id!;
    },
    
    update: async (id: string, data: Partial<Quote>) => {
      await handleOperation(
        () => quoteService.update(id, data),
        'Quote updated successfully',
        'Failed to update quote'
      );
      await loadQuotes(); // Refresh data
    },
    
    delete: async (id: string) => {
      await handleOperation(
        () => quoteService.delete(id),
        'Quote deleted successfully',
        'Failed to delete quote'
      );
      await loadQuotes(); // Refresh data
    },
    
    refresh: loadQuotes,
  };
  
  // Refresh all data
  const refreshAll = async () => {
    await Promise.all([
      loadCustomers(),
      loadProducts(),
      loadInvoices(),
      loadPayments(),
      loadQuotes(),
    ]);
  };
  
  const contextValue: FirebaseContextType = {
    customers,
    products,
    invoices,
    payments,
    quotes,
    loading,
    errors,
    customerOperations,
    productOperations,
    invoiceOperations,
    paymentOperations,
    quoteOperations,
    isOnline,
    refreshAll,
  };
  
  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};