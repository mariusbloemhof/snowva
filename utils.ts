import { Product, Price, Customer, CustomerType, CustomerProductPrice, PaymentTerm, StatementTransaction, AgingAnalysis, LineItem, Payment, Invoice, DocumentStatus } from './types';
import { VAT_RATE } from './constants';

export const getCurrentPrice = (product: { prices?: Price[] } | undefined): Price | null => {
    if (!product || !product.prices || product.prices.length === 0) {
      return null;
    }
    const today = new Date().toISOString().split('T')[0];
    const effectivePrices = product.prices
      .filter(p => p.effectiveDate <= today)
      // FIX: Corrected localeCompare arguments to compare date strings.
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
    return effectivePrices.length > 0 ? effectivePrices[0] : null;
};

export const getCustomerProductPrice = (
  productId: string,
  customer: Customer,
  customers: Customer[]
): CustomerProductPrice | null => {
  // 1. Check direct customer overrides
  const localOverride = customer.customProductPricing?.find(p => p.productId === productId);
  if (localOverride) {
    return localOverride;
  }

  // 2. Check parent overrides if customer is a child
  if (customer.parentCompanyId) {
    const parent = customers.find(c => c.id === customer.parentCompanyId);
    if (parent) {
      const parentOverride = parent.customProductPricing?.find(p => p.productId === productId);
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
    const customEffectivePrice = getCurrentPrice({ ...product, prices: customPricing.prices });
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

export const calculateTotal = (invoice: Pick<Invoice, 'items' | 'shipping'>): number => {
    const itemsTotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const subtotal = itemsTotal + (invoice.shipping || 0);
    return subtotal * (1 + VAT_RATE);
};

export const calculatePaid = (invoiceId: string, allPayments: Payment[]): number => {
    let totalPaid = 0;
    for (const payment of allPayments) {
        for (const allocation of payment.allocations) {
            if (allocation.invoiceId === invoiceId) {
                totalPaid += allocation.amount;
            }
        }
    }
    return totalPaid;
};

export const calculateBalanceDue = (invoice: Invoice, allPayments: Payment[]): number => {
    const total = calculateTotal(invoice);
    const paid = calculatePaid(invoice.id, allPayments);
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
    transactions.sort((a, b) => a.date.localeCompare(b.date));

    // 4. Calculate running balance and format for statement
    let currentBalance = 0;
    const statementTransactions: StatementTransaction[] = transactions.map(tx => {
        if ('invoiceNumber' in tx) { // It's an Invoice
            const invoiceTotal = calculateTotal(tx);
            currentBalance += invoiceTotal;
            return {
                date: tx.date,
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
                reference: tx.reference || `Payment #${tx.id.slice(-4)}`,
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
            const dueDate = new Date(inv.dueDate || inv.date);
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