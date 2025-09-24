

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
  effectiveDate: string;
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
}

export enum PaymentMethod {
  EFT = 'EFT',
  CARD = 'Card',
  CASH = 'Cash',
}

export interface PaymentAllocation {
  invoiceId: string;
  amount: number;
}

export interface Payment {
  id: string;
  customerId: string;
  date: string;
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

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  date: string;
  dueDate?: string;
  orderNumber?: string;
  quoteId?: string;
  items: LineItem[];
  status: DocumentStatus;
  notes?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  date: string;
  validUntil: string;
  items: LineItem[];
  status: DocumentStatus;
  notes?: string;
}

export interface StatementTransaction {
  date: string;
  type: 'Invoice' | 'Payment';
  reference: string; // Invoice # or Payment Ref
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