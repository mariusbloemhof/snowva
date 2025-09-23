import { Product, Price, Customer, CustomerType, CustomerProductPrice } from './types';

export const getCurrentPrice = (product: { prices?: Price[] } | undefined): Price | null => {
    if (!product || !product.prices || product.prices.length === 0) {
      return null;
    }
    const today = new Date().toISOString().split('T')[0];
    const effectivePrices = product.prices
      .filter(p => p.effectiveDate <= today)
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
