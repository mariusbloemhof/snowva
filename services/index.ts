// Central export for all Firebase services
export { customerService } from './CustomerService';
export { FirebaseService } from './FirebaseService';
export { invoiceService } from './InvoiceService';
export { paymentService } from './PaymentService';
export { productService } from './ProductService';
export { quoteService } from './QuoteService';

// Re-export Firebase config for direct access if needed
export { auth, db } from '../firebase.config';
