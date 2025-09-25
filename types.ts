import { Dispatch, SetStateAction } from 'react';

export enum CustomerType {
  B2C = 'Consumer',
  B2B = 'Retail',
}

export enum PaymentTerm {
  COD = 'Cash on Delivery',
  DAYS_30 = '30 Days',
  DAYS_60 = '60 Days',
  EOM_30 = 'End of Month + 30 Days',
}

export interface Address {
  id: string;
  type: 'billing' | 'delivery';
  isPrimary: boolean;
  addressLine1: string;
  addressLine2?: string;
  suburb?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface CustomerProductPrice {
  id: string;
  productId: string;
  customItemCode?: string;
  customDescription?: string;
  customNote?: string;
  prices: Price[];
}

export interface Customer {
  id:string;
  name: string;
  type: CustomerType;
  branchNumber?: string;
  vatNumber?: string;
  legalEntityName?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  addresses: Address[];
  parentCompanyId?: string;
  invoiceLevel?: 'parent' | 'branch';
  defaultInvoiceNotes?: string;
  customProductPricing?: CustomerProductPrice[];
  paymentTerm?: PaymentTerm;
  billToParent?: boolean;
}

export interface Price {
  id: string;
  effectiveDate: Timestamp;
  retail: number;
  consumer: number;
}

export interface Product {
  id: string;
  itemCode: string;
  name: string;
  description: string;
  prices: Price[];
  imageUrl?: string;
  ecommerceLink?: string;
}

export interface LineItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  itemCode?: string;
}

export enum PaymentMethod {
  EFT = 'EFT',
  CARD = 'Card',
  CASH = 'Cash',
}

export interface PaymentAllocation {
  invoiceNumber: string;
  amount: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  date: Timestamp;
  totalAmount: number;
  method: PaymentMethod;
  reference?: string;
  allocations: PaymentAllocation[];
}

export enum DocumentStatus {
  DRAFT = 'Draft',
  FINALIZED = 'Finalized',
  PARTIALLY_PAID = 'Partially Paid',
  PAID = 'Paid',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}

import { Timestamp } from 'firebase/firestore';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  issueDate: Timestamp;
  dueDate?: Timestamp;
  date?: Timestamp; // For backward compatibility with components
  poNumber?: string;
  orderNumber?: string; // For backward compatibility with components
  type?: string;
  lineItems: LineItem[];
  items?: LineItem[]; // For backward compatibility with components
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  shipping?: number; // For backward compatibility with components
  totalAmount: number;
  status: DocumentStatus;
  notes?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  date: Timestamp;
  validUntil: Timestamp;
  items: LineItem[];
  status: DocumentStatus;
  notes?: string;
  shipping?: number;
}

export interface StatementTransaction {
  date: Timestamp;
  type: 'Invoice' | 'Payment';
  reference: string; // Invoice # or Payment #
  sourceId: string; // The original ID of the invoice or payment
  debit: number;
  credit: number;
  balance: number;
}

export interface AgingAnalysis {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120plus: number;
}

export interface AppContextType {
    customers: Customer[];
    setCustomers: Dispatch<SetStateAction<Customer[]>>;
    products: Product[];
    setProducts: Dispatch<SetStateAction<Product[]>>;
    invoices: Invoice[];
    setInvoices: Dispatch<SetStateAction<Invoice[]>>;
    payments: Payment[];
    setPayments: Dispatch<SetStateAction<Payment[]>>;
    quotes: Quote[];
    setQuotes: Dispatch<SetStateAction<Quote[]>>;
}