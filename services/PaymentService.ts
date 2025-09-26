import { orderBy, Timestamp } from 'firebase/firestore';
import { Payment, PaymentMethod } from '../types';
import { FirebaseService } from './FirebaseService';

class PaymentService extends FirebaseService<Payment> {
  constructor() {
    super('payments');
  }

  protected isDateField(fieldName: string): boolean {
    return ['date', 'paymentDate', 'createdAt', 'updatedAt'].includes(fieldName);
  }

  // Get payments by customer
  async getByCustomerId(customerId: string): Promise<Payment[]> {
    return this.getByField('customerId', customerId);
  }

  // Get payments by method
  async getByMethod(method: PaymentMethod): Promise<Payment[]> {
    return this.getByField('method', method);
  }

  // Get payments for a date range
  async getByDateRange(startDate: string, endDate: string): Promise<Payment[]> {
    try {
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      const allPayments = await this.getAll([orderBy('date', 'desc')]);
      return allPayments.filter(payment => 
        payment.date.toMillis() >= startTimestamp.toMillis() && 
        payment.date.toMillis() <= endTimestamp.toMillis()
      );
    } catch (error) {
      console.error('Error getting payments by date range:', error);
      throw error;
    }
  }

  // Get unallocated payments (payments with remaining amounts)
  async getUnallocatedPayments(): Promise<Payment[]> {
    try {
      const allPayments = await this.getAll([orderBy('date', 'desc')]);
      return allPayments.filter(payment => {
        const totalAllocated = payment.allocations.reduce((sum, allocation) => 
          sum + allocation.amount, 0
        );
        return totalAllocated < payment.totalAmount;
      });
    } catch (error) {
      console.error('Error getting unallocated payments:', error);
      throw error;
    }
  }

  // Generate next payment number
  async getNextPaymentNumber(): Promise<string> {
    try {
      const allPayments = await this.getAll();
      const paymentNumbers = allPayments
        .map(payment => payment.paymentNumber)
        .filter(num => /^PAY\d+$/.test(num)) // Only PAY prefix numbers
        .map(num => parseInt(num.replace('PAY', '')))
        .filter(num => !isNaN(num));

      const maxNumber = paymentNumbers.length > 0 ? Math.max(...paymentNumbers) : 0;
      return `PAY${(maxNumber + 1).toString().padStart(6, '0')}`; // PAY000001 format
    } catch (error) {
      console.error('Error generating payment number:', error);
      // Fallback to timestamp-based number
      return `PAY${Date.now().toString().slice(-6)}`;
    }
  }

  // Validate payment data
  private validatePayment(data: Partial<Payment>): void {
    if (data.totalAmount !== undefined && data.totalAmount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    if (data.customerId && data.customerId.trim().length === 0) {
      throw new Error('Customer is required');
    }

    if (data.date && data.date.toMillis() > Timestamp.now().toMillis()) {
      throw new Error('Payment date cannot be in the future');
    }

    if (data.allocations) {
      const totalAllocated = data.allocations.reduce((sum, allocation) => 
        sum + allocation.amount, 0
      );
      
      if (data.totalAmount !== undefined && totalAllocated > data.totalAmount) {
        throw new Error('Total allocation amount cannot exceed payment amount');
      }

      data.allocations.forEach((allocation, index) => {
        if (allocation.amount <= 0) {
          throw new Error(`Allocation ${index + 1} amount must be greater than 0`);
        }
        // Check for invoiceNumber (new format) or invoiceId (legacy format for backward compatibility)
        const invoiceRef = allocation.invoiceNumber || (allocation as any).invoiceId;
        if (!invoiceRef || invoiceRef.trim().length === 0) {
          throw new Error(`Allocation ${index + 1} must have a valid invoice`);
        }
      });
    }
  }

  // Calculate remaining unallocated amount
  calculateUnallocatedAmount(payment: Payment): number {
    const totalAllocated = payment.allocations.reduce((sum, allocation) => 
      sum + allocation.amount, 0
    );
    return payment.totalAmount - totalAllocated;
  }

  // Create payment with auto-generated payment number
  async create(data: Omit<Payment, 'id'>): Promise<string> {
    this.validatePayment(data);
    
    // Auto-generate payment number if not provided
    if (!data.paymentNumber) {
      const paymentNumber = await this.getNextPaymentNumber();
      data = { ...data, paymentNumber };
    }

    // Initialize empty allocations if not provided
    if (!data.allocations) {
      data = { ...data, allocations: [] };
    }

    return super.create(data);
  }

  // Override update with validation
  async update(id: string, data: Partial<Payment>): Promise<void> {
    this.validatePayment(data);
    return super.update(id, data);
  }

  // Add allocation to payment
  async addAllocation(paymentId: string, invoiceNumber: string, amount: number): Promise<void> {
    try {
      const payment = await this.getById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      const unallocatedAmount = this.calculateUnallocatedAmount(payment);
      if (amount > unallocatedAmount) {
        throw new Error('Allocation amount exceeds unallocated payment amount');
      }

      const newAllocation = {
        invoiceNumber,
        amount
      };

      const updatedAllocations = [...payment.allocations, newAllocation];
      await this.update(paymentId, { allocations: updatedAllocations });
    } catch (error) {
      console.error('Error adding allocation:', error);
      throw error;
    }
  }

  // Remove allocation from payment by invoice number
  async removeAllocation(paymentId: string, invoiceNumber: string): Promise<void> {
    try {
      const payment = await this.getById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      const updatedAllocations = payment.allocations.filter(
        allocation => allocation.invoiceNumber !== invoiceNumber
      );
      
      await this.update(paymentId, { allocations: updatedAllocations });
    } catch (error) {
      console.error('Error removing allocation:', error);
      throw error;
    }
  }

  // Search payments by payment number or reference
  async searchPayments(searchTerm: string): Promise<Payment[]> {
    try {
      const allPayments = await this.getAll([orderBy('date', 'desc')]);
      const lowercaseSearch = searchTerm.toLowerCase();
      
      return allPayments.filter(payment =>
        payment.paymentNumber.toLowerCase().includes(lowercaseSearch) ||
        (payment.reference?.toLowerCase().includes(lowercaseSearch))
      );
    } catch (error) {
      console.error('Error searching payments:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();