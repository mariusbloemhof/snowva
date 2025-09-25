import { orderBy, Timestamp } from 'firebase/firestore';
import { DocumentStatus, Invoice } from '../types';
import { FirebaseService } from './FirebaseService';

class InvoiceService extends FirebaseService<Invoice> {
  constructor() {
    super('invoices');
  }

  protected isDateField(fieldName: string): boolean {
    return ['date', 'dueDate', 'issueDate', 'createdAt', 'updatedAt'].includes(fieldName);
  }

  // Get invoices by customer
  async getByCustomerId(customerId: string): Promise<Invoice[]> {
    return this.getByField('customerId', customerId);
  }

  // Get invoices by status
  async getByStatus(status: DocumentStatus): Promise<Invoice[]> {
    return this.getByField('status', status);
  }

  // Get unpaid invoices (Draft, Finalized, Partially Paid)
  async getUnpaidInvoices(): Promise<Invoice[]> {
    try {
      const allInvoices = await this.getAll([orderBy('date', 'desc')]);
      return allInvoices.filter(invoice => 
        invoice.status !== DocumentStatus.PAID
      );
    } catch (error) {
      console.error('Error getting unpaid invoices:', error);
      throw error;
    }
  }

  // Get overdue invoices
  async getOverdueInvoices(): Promise<Invoice[]> {
    try {
      const today = Timestamp.now();
      const allInvoices = await this.getAll([orderBy('dueDate')]);
      
      return allInvoices.filter(invoice => 
        invoice.dueDate && 
        invoice.dueDate.seconds < today.seconds && 
        invoice.status !== DocumentStatus.PAID
      );
    } catch (error) {
      console.error('Error getting overdue invoices:', error);
      throw error;
    }
  }

  // Get invoices for a date range
  async getByDateRange(startDate: string, endDate: string): Promise<Invoice[]> {
    try {
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      const allInvoices = await this.getAll([orderBy('issueDate')]);
      return allInvoices.filter(invoice => 
        invoice.issueDate.seconds >= startTimestamp.seconds && 
        invoice.issueDate.seconds <= endTimestamp.seconds
      );
    } catch (error) {
      console.error('Error getting invoices by date range:', error);
      throw error;
    }
  }

  // Generate next invoice number
  async getNextInvoiceNumber(): Promise<string> {
    try {
      const allInvoices = await this.getAll();
      const invoiceNumbers = allInvoices
        .map(invoice => invoice.invoiceNumber)
        .filter(num => /^\d+$/.test(num)) // Only numeric invoice numbers
        .map(num => parseInt(num))
        .filter(num => !isNaN(num));

      const maxNumber = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) : 0;
      return (maxNumber + 1).toString().padStart(8, '0'); // 8-digit invoice number
    } catch (error) {
      console.error('Error generating invoice number:', error);
      // Fallback to timestamp-based number
      return Date.now().toString();
    }
  }

  // Calculate invoice totals
  private calculateInvoiceTotals(invoice: Partial<Invoice>): {
    subtotal: number;
    vatAmount: number;
    total: number;
  } {
    if (!invoice.items || invoice.items.length === 0) {
      return { subtotal: 0, vatAmount: 0, total: 0 };
    }

    const subtotal = invoice.items.reduce((sum, item) => 
      sum + (item.quantity * item.unitPrice), 0
    ) + (invoice.shipping || 0);

    const vatRate = 0.15; // 15% VAT (configurable)
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;

    return { subtotal, vatAmount, total };
  }

  // Validate invoice data
  private validateInvoice(data: Partial<Invoice>): void {
    if (data.customerId && data.customerId.trim().length === 0) {
      throw new Error('Customer is required');
    }

    if (data.issueDate && data.issueDate.seconds > Timestamp.now().seconds) {
      throw new Error('Invoice date cannot be in the future');
    }

    if (data.dueDate && data.issueDate && data.dueDate.seconds < data.issueDate.seconds) {
      throw new Error('Due date cannot be before invoice date');
    }

    if (data.items) {
      if (data.items.length === 0) {
        throw new Error('Invoice must have at least one item');
      }

      data.items.forEach((item, index) => {
        if (!item.description || item.description.trim().length === 0) {
          throw new Error(`Item ${index + 1} description is required`);
        }
        if (item.quantity <= 0) {
          throw new Error(`Item ${index + 1} quantity must be greater than 0`);
        }
        if (item.unitPrice < 0) {
          throw new Error(`Item ${index + 1} unit price cannot be negative`);
        }
      });
    }
  }

  // Create invoice with auto-generated invoice number
  async create(data: Omit<Invoice, 'id'>): Promise<string> {
    this.validateInvoice(data);
    
    // Auto-generate invoice number if not provided
    if (!data.invoiceNumber) {
      const invoiceNumber = await this.getNextInvoiceNumber();
      data = { ...data, invoiceNumber };
    }

    // Set default status if not provided
    if (!data.status) {
      data = { ...data, status: DocumentStatus.DRAFT };
    }

    return super.create(data);
  }

  // Override update with validation
  async update(id: string, data: Partial<Invoice>): Promise<void> {
    this.validateInvoice(data);
    return super.update(id, data);
  }

  // Update invoice status
  async updateStatus(id: string, status: DocumentStatus): Promise<void> {
    return this.update(id, { status });
  }

  // Search invoices by invoice number or customer reference
  async searchInvoices(searchTerm: string): Promise<Invoice[]> {
    try {
      const allInvoices = await this.getAll([orderBy('date', 'desc')]);
      const lowercaseSearch = searchTerm.toLowerCase();
      
      return allInvoices.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(lowercaseSearch) ||
        (invoice.orderNumber?.toLowerCase().includes(lowercaseSearch)) ||
        (invoice.notes?.toLowerCase().includes(lowercaseSearch))
      );
    } catch (error) {
      console.error('Error searching invoices:', error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();