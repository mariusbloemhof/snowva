import { orderBy } from 'firebase/firestore';
import { Product } from '../types';
import { FirebaseService } from './FirebaseService';

class ProductService extends FirebaseService<Product> {
  constructor() {
    super('products');
  }

  // Search by description (acting as category)
  async getByDescription(searchTerm: string): Promise<Product[]> {
    try {
      const allProducts = await this.getAll([orderBy('name')]);
      const lowercaseSearch = searchTerm.toLowerCase();
      return allProducts.filter(product => 
        product.description?.toLowerCase().includes(lowercaseSearch)
      );
    } catch (error) {
      console.error('Error getting products by description:', error);
      throw error;
    }
  }

  // Get all products (no isActive field in current model)
  async getActiveProducts(): Promise<Product[]> {
    try {
      return await this.getAll([orderBy('name')]);
    } catch (error) {
      console.error('Error getting products:', error);
      throw error;
    }
  }

  // Search products by name or item code
  async searchProducts(searchTerm: string): Promise<Product[]> {
    try {
      const allProducts = await this.getAll([orderBy('name')]);
      const lowercaseSearch = searchTerm.toLowerCase();
      
      return allProducts.filter(product =>
        product.name.toLowerCase().includes(lowercaseSearch) ||
        product.itemCode.toLowerCase().includes(lowercaseSearch) ||
        (product.description?.toLowerCase().includes(lowercaseSearch))
      );
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  // Get products with low stock (if you track inventory)
  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    try {
      const allProducts = await this.getAll();
      // Note: Assuming you might add stock tracking later
      return allProducts.filter((product: any) => 
        product.stockLevel !== undefined && product.stockLevel <= threshold
      );
    } catch (error) {
      console.error('Error getting low stock products:', error);
      throw error;
    }
  }

  // Get all unique descriptions (acting as categories)
  async getDescriptions(): Promise<string[]> {
    try {
      const allProducts = await this.getAll();
      const descriptions = new Set(allProducts.map(product => product.description).filter(Boolean));
      return Array.from(descriptions).sort();
    } catch (error) {
      console.error('Error getting descriptions:', error);
      throw error;
    }
  }

  // Validate product data
  private validateProduct(data: Partial<Product>): void {
    if (data.name && data.name.trim().length < 2) {
      throw new Error('Product name must be at least 2 characters long');
    }

    if (data.itemCode && data.itemCode.trim().length < 1) {
      throw new Error('Item code is required');
    }

    if (data.prices) {
      data.prices.forEach((price, index) => {
        if (price.retail <= 0) {
          throw new Error(`Retail price ${index + 1} must be greater than 0`);
        }
        if (price.consumer <= 0) {
          throw new Error(`Consumer price ${index + 1} must be greater than 0`);
        }
      });
    }
  }



  // Override create with validation
  async create(data: Omit<Product, 'id'>): Promise<string> {
    this.validateProduct(data);
    
    // Note: Item codes don't need to be unique - they're for display purposes only
    return super.create(data);
  }

  // Override update with validation
  async update(id: string, data: Partial<Product>): Promise<void> {
    this.validateProduct(data);
    
    // Note: Item codes don't need to be unique - they're for display purposes only
    return super.update(id, data);
  }
}

export const productService = new ProductService();