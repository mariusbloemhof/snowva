import { orderBy, Timestamp } from 'firebase/firestore';
import { DocumentStatus, Quote } from '../types';
import { FirebaseService } from './FirebaseService';

class QuoteService extends FirebaseService<Quote> {
  constructor() {
    super('quotes');
  }

  protected isDateField(fieldName: string): boolean {
    return ['date', 'validUntil', 'createdAt', 'updatedAt'].includes(fieldName);
  }

  // Get quotes by customer
  async getByCustomerId(customerId: string): Promise<Quote[]> {
    return this.getByField('customerId', customerId);
  }

  // Get quotes by status
  async getByStatus(status: DocumentStatus): Promise<Quote[]> {
    return this.getByField('status', status);
  }

  // Get active quotes (not expired)
  async getActiveQuotes(): Promise<Quote[]> {
    try {
      const today = Timestamp.now();
      const allQuotes = await this.getAll([orderBy('date', 'desc')]);
      
      return allQuotes.filter(quote => 
        quote.validUntil.toMillis() >= today.toMillis() && 
        quote.status !== DocumentStatus.REJECTED
      );
    } catch (error) {
      console.error('Error getting active quotes:', error);
      throw error;
    }
  }

  // Get expired quotes
  async getExpiredQuotes(): Promise<Quote[]> {
    try {
      const today = Timestamp.now();
      const allQuotes = await this.getAll([orderBy('validUntil')]);
      
      return allQuotes.filter(quote => 
        quote.validUntil.toMillis() < today.toMillis() && 
        quote.status !== DocumentStatus.ACCEPTED &&
        quote.status !== DocumentStatus.REJECTED
      );
    } catch (error) {
      console.error('Error getting expired quotes:', error);
      throw error;
    }
  }

  // Get quotes for a date range
  async getByDateRange(startDate: string, endDate: string): Promise<Quote[]> {
    try {
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      const allQuotes = await this.getAll([orderBy('date')]);
      return allQuotes.filter(quote => 
        quote.date.toMillis() >= startTimestamp.toMillis() && 
        quote.date.toMillis() <= endTimestamp.toMillis()
      );
    } catch (error) {
      console.error('Error getting quotes by date range:', error);
      throw error;
    }
  }

  // Generate next quote number
  async getNextQuoteNumber(): Promise<string> {
    try {
      const allQuotes = await this.getAll();
      const quoteNumbers = allQuotes
        .map(quote => quote.quoteNumber)
        .filter(num => /^QUO\d+$/.test(num)) // Only QUO prefix numbers
        .map(num => parseInt(num.replace('QUO', '')))
        .filter(num => !isNaN(num));

      const maxNumber = quoteNumbers.length > 0 ? Math.max(...quoteNumbers) : 0;
      return `QUO${(maxNumber + 1).toString().padStart(6, '0')}`; // QUO000001 format
    } catch (error) {
      console.error('Error generating quote number:', error);
      // Fallback to timestamp-based number
      return `QUO${Date.now().toString().slice(-6)}`;
    }
  }

  // Validate quote data
  private validateQuote(data: Partial<Quote>): void {
    if (data.customerId && data.customerId.trim().length === 0) {
      throw new Error('Customer is required');
    }

    if (data.date && data.date.toMillis() > Timestamp.now().toMillis()) {
      throw new Error('Quote date cannot be in the future');
    }

    if (data.validUntil && data.date && data.validUntil.toMillis() < data.date.toMillis()) {
      throw new Error('Valid until date cannot be before quote date');
    }

    if (data.items) {
      if (data.items.length === 0) {
        throw new Error('Quote must have at least one item');
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

  // Create quote with auto-generated quote number
  async create(data: Omit<Quote, 'id'>): Promise<string> {
    this.validateQuote(data);
    
    // Auto-generate quote number if not provided
    if (!data.quoteNumber) {
      const quoteNumber = await this.getNextQuoteNumber();
      data = { ...data, quoteNumber };
    }

    // Set default status if not provided
    if (!data.status) {
      data = { ...data, status: DocumentStatus.DRAFT };
    }

    // Set default valid until date (30 days from quote date)
    if (!data.validUntil && data.date) {
      const validUntilDate = data.date.toDate();
      validUntilDate.setDate(validUntilDate.getDate() + 30);
      data = { ...data, validUntil: Timestamp.fromDate(validUntilDate) };
    }

    return super.create(data);
  }

  // Override update with validation
  async update(id: string, data: Partial<Quote>): Promise<void> {
    this.validateQuote(data);
    return super.update(id, data);
  }

  // Update quote status
  async updateStatus(id: string, status: DocumentStatus): Promise<void> {
    return this.update(id, { status });
  }

  // Accept quote
  async acceptQuote(id: string): Promise<void> {
    return this.updateStatus(id, DocumentStatus.ACCEPTED);
  }

  // Reject quote
  async rejectQuote(id: string): Promise<void> {
    return this.updateStatus(id, DocumentStatus.REJECTED);
  }

  // Convert quote to invoice (returns quote data formatted for invoice)
  async convertToInvoiceData(quoteId: string): Promise<any> {
    try {
      const quote = await this.getById(quoteId);
      if (!quote) {
        throw new Error('Quote not found');
      }

      if (quote.status !== DocumentStatus.ACCEPTED) {
        throw new Error('Quote must be accepted before converting to invoice');
      }

      // Return invoice data structure
      return {
        customerId: quote.customerId,
        issueDate: Timestamp.now(), // Today's date for invoice
        quoteId: quote.id,
        items: quote.items,
        notes: quote.notes,
        shipping: quote.shipping,
      };
    } catch (error) {
      console.error('Error converting quote to invoice:', error);
      throw error;
    }
  }

  // Search quotes by quote number or customer reference
  async searchQuotes(searchTerm: string): Promise<Quote[]> {
    try {
      const allQuotes = await this.getAll([orderBy('date', 'desc')]);
      const lowercaseSearch = searchTerm.toLowerCase();
      
      return allQuotes.filter(quote =>
        quote.quoteNumber.toLowerCase().includes(lowercaseSearch) ||
        (quote.notes?.toLowerCase().includes(lowercaseSearch))
      );
    } catch (error) {
      console.error('Error searching quotes:', error);
      throw error;
    }
  }
}

export const quoteService = new QuoteService();