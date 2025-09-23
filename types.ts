

export enum CustomerType {
  B2C = 'Consumer',
  B2B = 'Retail',
}

export interface Address {
  id: string;
  type: 'billing' | 'delivery';
  isPrimary: boolean;
  street: string;
  city: string;
  postalCode: string;
  province: string;
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

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
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
  orderNumber?: string;
  items: LineItem[];
  status: DocumentStatus;
  notes?: string;
  payments: Payment[];
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