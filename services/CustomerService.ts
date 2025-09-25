import { orderBy } from 'firebase/firestore';
import { Customer, CustomerType } from '../types';
import { FirebaseService } from './FirebaseService';

class CustomerService extends FirebaseService<Customer> {
  constructor() {
    super('customers');
  }

  // Get customers by type
  async getByType(type: CustomerType): Promise<Customer[]> {
    return this.getByField('type', type);
  }

  // Get all branch customers for a parent company
  async getBranchesByParentId(parentId: string): Promise<Customer[]> {
    return this.getByField('parentCompanyId', parentId);
  }

  // Get all parent companies (customers without parentCompanyId)
  async getParentCompanies(): Promise<Customer[]> {
    try {
      const allCustomers = await this.getAll([orderBy('name')]);
      return allCustomers.filter(customer => !customer.parentCompanyId);
    } catch (error) {
      console.error('Error getting parent companies:', error);
      throw error;
    }
  }

  // Search customers by name
  async searchByName(searchTerm: string): Promise<Customer[]> {
    try {
      // Note: Firestore doesn't support case-insensitive search or full-text search
      // This is a basic implementation. For better search, consider using Algolia or similar
      const allCustomers = await this.getAll([orderBy('name')]);
      const lowercaseSearch = searchTerm.toLowerCase();
      
      return allCustomers.filter(customer =>
        customer.name.toLowerCase().includes(lowercaseSearch) ||
        (customer.contactPerson?.toLowerCase().includes(lowercaseSearch)) ||
        (customer.contactEmail?.toLowerCase().includes(lowercaseSearch))
      );
    } catch (error) {
      console.error('Error searching customers:', error);
      throw error;
    }
  }

  // Get customers with their branch count
  async getCustomersWithBranchCount(): Promise<Array<Customer & { branchCount: number }>> {
    try {
      const allCustomers = await this.getAll([orderBy('name')]);
      
      return allCustomers.map(customer => {
        const branchCount = allCustomers.filter(c => c.parentCompanyId === customer.id).length;
        return { ...customer, branchCount };
      });
    } catch (error) {
      console.error('Error getting customers with branch count:', error);
      throw error;
    }
  }

  // Validate customer data before saving
  private validateCustomer(data: Partial<Customer>): void {
    if (data.name && data.name.trim().length < 2) {
      throw new Error('Customer name must be at least 2 characters long');
    }

    if (data.contactEmail && !this.isValidEmail(data.contactEmail)) {
      throw new Error('Invalid email format');
    }

    if (data.vatNumber && data.vatNumber.length > 0 && data.vatNumber.length < 10) {
      throw new Error('VAT number must be at least 10 characters');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Override create with validation
  async create(data: Omit<Customer, 'id'>): Promise<string> {
    this.validateCustomer(data);
    return super.create(data);
  }

  // Override update with validation
  async update(id: string, data: Partial<Customer>): Promise<void> {
    this.validateCustomer(data);
    return super.update(id, data);
  }
}

export const customerService = new CustomerService();