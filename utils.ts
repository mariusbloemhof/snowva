import { Timestamp } from 'firebase/firestore';
import { VAT_RATE } from './constants';
import { AgingAnalysis, Customer, CustomerProductPrice, CustomerType, DocumentStatus, Invoice, LineItem, Payment, PaymentTerm, Price, Product, StatementTransaction } from './types';

// Firebase Timestamp utility functions
export const dateUtils = {
  // Convert string to Timestamp
  stringToTimestamp: (dateStr: string): Timestamp => {
    return Timestamp.fromDate(new Date(dateStr));
  },

  // Format Timestamp for display
  formatTimestamp: (timestamp: Timestamp, format: 'short' | 'long' = 'short'): string => {
    const date = timestamp.toDate();
    return format === 'short' 
      ? date.toLocaleDateString()
      : date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
  },

  // For form inputs (HTML date inputs need string values)
  timestampToInputValue: (timestamp: Timestamp): string => {
    return timestamp.toDate().toISOString().split('T')[0];
  },

  // From form inputs
  inputValueToTimestamp: (inputValue: string): Timestamp => {
    return Timestamp.fromDate(new Date(inputValue));
  },

  // Current timestamp
  now: (): Timestamp => Timestamp.now(),

  // Today as string for form inputs
  todayString: (): string => {
    return new Date().toISOString().split('T')[0];
  },

  // Validation
  isValidTimestamp: (value: any): value is Timestamp => {
    return value instanceof Timestamp;
  },

  // Safe conversion - handles both strings and Timestamps
  toTimestamp: (dateInput: string | Date | Timestamp): Timestamp => {
    if (dateInput instanceof Timestamp) {
      return dateInput;
    }
    if (typeof dateInput === 'string') {
      return Timestamp.fromDate(new Date(dateInput));
    }
    return Timestamp.fromDate(dateInput);
  },

  // Safe display - handles both strings and Timestamps
  toDisplayString: (dateInput: string | Date | Timestamp | undefined): string => {
    if (!dateInput) return '';
    if (typeof dateInput === 'string') {
      return new Date(dateInput).toLocaleDateString();
    }
    if (dateInput instanceof Date) {
      return dateInput.toLocaleDateString();
    }
    if (dateInput instanceof Timestamp) {
      return dateInput.toDate().toLocaleDateString();
    }
    return '';
  }
};

export const getCurrentPrice = (product: { prices?: Price[] } | undefined): Price | null => {
    if (!product || !Array.isArray(product.prices) || product.prices.length === 0) {
      return null;
    }
    const today = new Date();
    const effectivePrices = product.prices
      .filter(p => p && p.effectiveDate && p.effectiveDate.toDate() <= today)
      .sort((a, b) => b.effectiveDate.toDate().getTime() - a.effectiveDate.toDate().getTime());
    return effectivePrices.length > 0 ? effectivePrices[0] : null;
};

export const getCustomerProductPrice = (
  productId: string,
  customer: Customer,
  customers: Customer[]
): CustomerProductPrice | null => {
  // 1. Check direct customer overrides
  if (Array.isArray(customer.customProductPricing)) {
    const localOverride = customer.customProductPricing.find(p => p.productId === productId);
    if (localOverride) {
      return localOverride;
    }
  }

  // 2. Check parent overrides if customer is a child
  if (customer.parentCompanyId) {
    const parent = customers.find(c => c.id === customer.parentCompanyId);
    if (parent && Array.isArray(parent.customProductPricing)) {
      const parentOverride = parent.customProductPricing.find(p => p.productId === productId);
      if (parentOverride) {
        return parentOverride;
      }
    }
  }

  // 3. No override found
  return null;
};

export const getResolvedProductDetails = (
  product: Product,
  customer: Customer,
  customers: Customer[]
) => {
  const customPricing = getCustomerProductPrice(product.id, customer, customers);
  const standardPrice = getCurrentPrice(product);
  
  const standardUnitPrice = customer.type === CustomerType.B2B 
    ? standardPrice?.retail ?? 0
    : standardPrice?.consumer ?? 0;

  if (customPricing && customer.type === CustomerType.B2B) {
    const customEffectivePrice = getCurrentPrice({ 
      ...product, 
      prices: Array.isArray(customPricing.prices) ? customPricing.prices : [] 
    });
    return {
      description: customPricing.customDescription || product.description,
      itemCode: customPricing.customItemCode || product.itemCode,
      unitPrice: customEffectivePrice?.retail ?? standardUnitPrice, // Fallback to standard retail
      note: customPricing.customNote,
    };
  }

  return {
    description: product.description,
    itemCode: product.itemCode,
    unitPrice: standardUnitPrice,
    note: undefined,
  };
};

export const calculateDueDate = (invoiceDate: string, term: PaymentTerm): string => {
  const date = new Date(invoiceDate);
  // Setting time to noon to avoid timezone issues with date changes
  date.setUTCHours(12, 0, 0, 0);

  switch (term) {
    case PaymentTerm.DAYS_30:
      date.setDate(date.getDate() + 30);
      break;
    case PaymentTerm.DAYS_60:
      date.setDate(date.getDate() + 60);
      break;
    case PaymentTerm.EOM_30:
      // Last day of the current month
      date.setMonth(date.getMonth() + 1, 0);
      // Add 30 days
      date.setDate(date.getDate() + 30);
      break;
    case PaymentTerm.COD:
    default:
      // Due date is the invoice date itself
      break;
  }
  return date.toISOString().split('T')[0];
};

// --- Centralized Financial Calculations ---

export const getDisplayPaymentNumber = (payment: any): string => {
    // If payment has a paymentNumber field, use it
    if (payment.paymentNumber) {
        return payment.paymentNumber;
    }
    
    // Otherwise, generate from ID by taking a hash/index approach
    // Convert the ID to a consistent short number
    const id = payment.id || '';
    
    // Simple hash function to convert ID to a number
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use absolute value and limit to 6 digits
    const num = Math.abs(hash) % 1000000;
    return `PAY${num.toString().padStart(6, '0')}`;
};

export const getNextPaymentNumber = (currentPayments: Payment[]): string => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const prefix = `P${year}-`;

    const lastNumForYear = currentPayments
        .filter(p => (p as any).paymentNumber && (p as any).paymentNumber.startsWith(prefix))
        .map(p => parseInt((p as any).paymentNumber.slice(-3), 10))
        .reduce((max, num) => Math.max(max, num), 0);
    
    return `${prefix}${(lastNumForYear + 1).toString().padStart(3, '0')}`;
};

export const calculateTotal = (doc: { items?: LineItem[], lineItems?: LineItem[], shipping?: number, shippingAmount?: number, totalAmount?: number }): number => {
    const items = doc?.items || doc?.lineItems;
    const shipping = doc?.shipping || doc?.shippingAmount || 0;
    
    if (!doc || !Array.isArray(items)) {
        return shipping * (1 + VAT_RATE);
    }
    const itemsTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const subtotal = itemsTotal + shipping;
    return subtotal * (1 + VAT_RATE);
};

export const calculatePaid = (invoiceId: string, allPayments: Payment[], invoices?: any[]): number => {
    if (!invoiceId || !Array.isArray(allPayments)) return 0;
    
    // Find the invoice to get its invoiceNumber
    let targetInvoiceNumber = invoiceId;
    if (invoices) {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        targetInvoiceNumber = invoice?.invoiceNumber || invoiceId;
    } else {
        // Try to extract invoice number from ID format (inv_241002101 -> 241002101)
        if (invoiceId.startsWith('inv_')) {
            targetInvoiceNumber = invoiceId.substring(4);
        }
    }
    
    let totalPaid = 0;
    for (const payment of allPayments) {
        if (payment && Array.isArray(payment.allocations)) {
            for (const allocation of payment.allocations) {
                // Handle both old (invoiceId) and new (invoiceNumber) field formats
                const allocRef = (allocation as any).invoiceNumber || (allocation as any).invoiceId;
                if (allocation && allocRef === targetInvoiceNumber) {
                    totalPaid += allocation.amount || 0;
                }
            }
        }
    }
    return totalPaid;
};

export const calculateBalanceDue = (invoice: Invoice, allPayments: Payment[]): number => {
    if (!invoice) return 0;
    const total = calculateTotal(invoice);
    const paid = calculatePaid(invoice.id, allPayments, [invoice]);
    // Return a value rounded to 2 decimal places to avoid floating point issues
    return parseFloat((total - paid).toFixed(2));
};

export const formatDistanceToNow = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours > 0) return `${diffHours}h ago`;
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'just now';
  }
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}m ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};


// --- Statement and Aging Calculation ---

export const getStatementDataForCustomer = (
    customerId: string,
    allCustomers: Customer[],
    allInvoices: Invoice[],
    allPayments: Payment[]
): {
    transactions: StatementTransaction[];
    aging: AgingAnalysis;
    totalBalance: number;
    customer: Customer;
    childCustomers: Customer[];
} | null => {
    const primaryCustomer = allCustomers.find(c => c.id === customerId);
    if (!primaryCustomer) return null;

    // 1. Identify all relevant customer IDs (primary + children who bill to parent)
    const relevantCustomerIds = new Set<string>([customerId]);
    const childCustomers = allCustomers.filter(
        c => c.parentCompanyId === customerId && c.billToParent
    );
    childCustomers.forEach(c => relevantCustomerIds.add(c.id));
    
    // 2. Gather all invoices and payments for these customers
    const relevantInvoices = allInvoices.filter(
        inv => relevantCustomerIds.has(inv.customerId) && inv.status !== DocumentStatus.DRAFT
    );
    // Payments are only recorded against the parent/primary customer
    const relevantPayments = allPayments.filter(p => p.customerId === customerId);

    // 3. Create a unified, sorted list of transactions
    const transactions: (Invoice | Payment)[] = [...relevantInvoices, ...relevantPayments];
    transactions.sort((a, b) => ((a as any).paymentDate || (a as any).issueDate || (a as any).date || '').localeCompare((b as any).paymentDate || (b as any).issueDate || (b as any).date || ''));

    // 4. Calculate running balance and format for statement
    let currentBalance = 0;
    const statementTransactions: StatementTransaction[] = transactions.map(tx => {
        if ('invoiceNumber' in tx) { // It's an Invoice
            const invoiceTotal = calculateTotal(tx);
            currentBalance += invoiceTotal;
            return {
                date: (tx as any).issueDate || (tx as any).date,
                type: 'Invoice',
                reference: tx.invoiceNumber,
                sourceId: tx.id,
                debit: invoiceTotal,
                credit: 0,
                balance: currentBalance,
            };
        } else { // It's a Payment
            currentBalance -= tx.totalAmount;
            return {
                date: tx.date,
                type: 'Payment',
                reference: tx.paymentNumber,
                sourceId: tx.id,
                debit: 0,
                credit: tx.totalAmount,
                balance: currentBalance,
            };
        }
    });

    // 5. Calculate aging for all outstanding invoices
    const aging: AgingAnalysis = { current: 0, days30: 0, days60: 0, days90: 0, days120plus: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    relevantInvoices.forEach(inv => {
        const balanceDue = calculateBalanceDue(inv, allPayments);
        if (balanceDue > 0.01) { // If there is a balance
            const dueDate = new Date(inv.dueDate || (inv as any).issueDate || (inv as any).date);
            dueDate.setHours(0, 0, 0, 0);
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysOverdue <= 0) aging.current += balanceDue;
            else if (daysOverdue <= 30) aging.days30 += balanceDue;
            else if (daysOverdue <= 60) aging.days60 += balanceDue;
            else if (daysOverdue <= 90) aging.days90 += balanceDue;
            else aging.days120plus += balanceDue;
        }
    });

    return {
        transactions: statementTransactions.reverse(), // Show most recent first
        aging,
        totalBalance: parseFloat(currentBalance.toFixed(2)),
        customer: primaryCustomer,
        childCustomers
    };
};