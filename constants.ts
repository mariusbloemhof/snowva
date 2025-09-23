
import { Customer, Product, Invoice, Quote, CustomerType, DocumentStatus, LineItem, Address, Payment, PaymentMethod, PaymentTerm } from './types';

export const VAT_RATE = 0.15;

export const customers: Customer[] = [
  { id: 'cust_001', name: '4 Seasons Winkel', type: CustomerType.B2B, vatNumber: '4123456789', contactPerson: 'John Doe', contactEmail: 'accounts@4seasons.co.za', contactPhone: '021-555-0101', addresses: [{ id: 'addr_001', type: 'delivery', isPrimary: true, street: '123 Main Rd', city: 'Cape Town', postalCode: '8001', province: 'Western Cape' }], paymentTerm: PaymentTerm.DAYS_30 },
  { id: 'cust_002', name: '4X4 Unlimited Pty Ltd', type: CustomerType.B2B, vatNumber: '4234567890', contactPerson: 'Jane Smith', contactEmail: 'info@4x4unlimited.co.za', contactPhone: '011-555-0102', addresses: [{ id: 'addr_002', type: 'delivery', isPrimary: true, street: '4x4 Adventure Lane', city: 'Johannesburg', postalCode: '2001', province: 'Gauteng' }], paymentTerm: PaymentTerm.DAYS_30 },
  { id: 'cust_003', name: 'A&A Business Services Pty Ltd', type: CustomerType.B2B, vatNumber: '4345678901', contactPerson: 'Peter Jones', contactEmail: 'contact@aabusiness.co.za', contactPhone: '031-555-0103', addresses: [{ id: 'addr_003', type: 'delivery', isPrimary: true, street: '1 Service St', city: 'Durban', postalCode: '4001', province: 'KwaZulu-Natal' }], paymentTerm: PaymentTerm.DAYS_30 },
  { id: 'cust_004', name: 'Sportsmans Warehouse', type: CustomerType.B2B, vatNumber: '4080304928', legalEntityName: 'Sportsmans Warehouse Holdings (Pty) Ltd', contactPerson: 'Head Office', contactEmail: 'hq@swarehouse.co.za', contactPhone: '021-555-0104', addresses: [{ id: 'addr_004', type: 'billing', isPrimary: true, street: 'PO Box 2721', city: 'Cape Town', postalCode: '8000', province: 'Western Cape' }], defaultInvoiceNotes: 'A valid PO number must be referenced on the invoice.', paymentTerm: PaymentTerm.DAYS_60,
    customProductPricing: [
      {
        id: 'cpp_001',
        productId: 'prod_001', // Snowva Ultimate Ice Maker
        prices: [
          { id: 'price_cpp_001', effectiveDate: '2024-01-01', retail: 185.00, consumer: 310.00 }
        ],
        customDescription: 'Snowva Ultimate Ice Maker (SW Contract)',
        customItemCode: 'SW-0781159125409'
      }
    ],
  },
  { id: 'cust_005', name: 'Sportsmans Warehouse - Atterbury', type: CustomerType.B2B, parentCompanyId: 'cust_004', branchNumber: 'SW01', contactEmail: 'atterbury@swarehouse.co.za', addresses: [{ id: 'addr_005', type: 'delivery', isPrimary: true, street: 'Atterbury Value Mart', city: 'Pretoria', postalCode: '0081', province: 'Gauteng' }], invoiceLevel: 'branch', billToParent: true,
    customProductPricing: [
      {
        id: 'cpp_002',
        productId: 'prod_001', // Override parent's override
        prices: [
          { id: 'price_cpp_002', effectiveDate: '2024-01-01', retail: 184.00, consumer: 310.00 }
        ]
      },
      {
        id: 'cpp_003',
        productId: 'prod_002', // Outray
        prices: [
          { id: 'price_cpp_003', effectiveDate: '2024-01-01', retail: 370.00, consumer: 400.00 }
        ],
        customNote: 'Special branch pricing'
      }
    ]
  },
  { id: 'cust_006', name: 'Sportsmans Warehouse - Ballito', type: CustomerType.B2B, parentCompanyId: 'cust_004', branchNumber: 'SW02', contactEmail: 'ballito@swarehouse.co.za', addresses: [{ id: 'addr_006', type: 'delivery', isPrimary: true, street: 'Ballito Junction', city: 'Ballito', postalCode: '4420', province: 'KwaZulu-Natal' }], invoiceLevel: 'branch', billToParent: true },
  { id: 'cust_007', name: 'Sportsmans Warehouse - Centurion', type: CustomerType.B2B, parentCompanyId: 'cust_004', branchNumber: 'SW03', contactEmail: 'centurion@swarehouse.co.za', addresses: [{ id: 'addr_007', type: 'delivery', isPrimary: true, street: 'Centurion Mall', city: 'Centurion', postalCode: '0157', province: 'Gauteng' }], invoiceLevel: 'branch' },
  { id: 'cust_008', name: 'Hendrik Coetzee', type: CustomerType.B2C, contactPhone: '0718542160', contactEmail: 'hendrik.c@email.com', addresses: [{ id: 'addr_008', type: 'delivery', isPrimary: true, street: '55 General St', city: 'Wilgers', postalCode: '0081', province: 'Gauteng' }] },
  { id: 'cust_009', name: 'Trans Africa Self drive adventures & Tours', type: CustomerType.B2B, vatNumber: '4567890123', contactEmail: 'bookings@transafrica.com', addresses: [{ id: 'addr_009', type: 'delivery', isPrimary: true, street: '7 Hill street', city: 'Keurboomstrand', postalCode: '6600', province: 'Western Cape' }], paymentTerm: PaymentTerm.DAYS_30 },
  { id: 'cust_010', name: 'Obaro', type: CustomerType.B2B, vatNumber: '4880101867', contactEmail: 'info@obaro.co.za', addresses: [{ id: 'addr_010', type: 'billing', isPrimary: true, street: '26 Lood St', city: 'Isando', postalCode: '1600', province: 'Gauteng' }], paymentTerm: PaymentTerm.EOM_30 },
  { id: 'cust_011', name: 'Obaro - Brits', type: CustomerType.B2B, parentCompanyId: 'cust_010', branchNumber: 'OB01', contactEmail: 'brits@obaro.co.za', addresses: [{ id: 'addr_011', type: 'delivery', isPrimary: true, street: '1 Industria St', city: 'Brits', postalCode: '0250', province: 'North West' }], invoiceLevel: 'branch' },
  { id: 'cust_012', name: 'Obaro - Dwaalboom', type: CustomerType.B2B, parentCompanyId: 'cust_010', branchNumber: 'OB02', contactEmail: 'dwaalboom@obaro.co.za', addresses: [{ id: 'addr_012', type: 'delivery', isPrimary: true, street: 'Main Rd', city: 'Dwaalboom', postalCode: '0386', province: 'Limpopo' }], invoiceLevel: 'branch' },
  { id: 'cust_013', name: 'Outdoor Warehouse', type: CustomerType.B2B, vatNumber: '4430177198', contactEmail: 'support@odw.co.za', addresses: [{ id: 'addr_013', type: 'billing', isPrimary: true, street: '1 Outdoor Way', city: 'Cape Town', postalCode: '8001', province: 'Western Cape' }], paymentTerm: PaymentTerm.DAYS_30 },
  { id: 'cust_014', name: 'Outdoor Warehouse - Alberton', type: CustomerType.B2B, parentCompanyId: 'cust_013', contactEmail: 'alberton@odw.co.za', addresses: [{ id: 'addr_014', type: 'delivery', isPrimary: true, street: 'New Redruth Village', city: 'Alberton', postalCode: '1449', province: 'Gauteng' }], invoiceLevel: 'branch' },
  { id: 'cust_015', name: 'Outdoor Warehouse - Ballito', type: CustomerType.B2B, parentCompanyId: 'cust_013', contactEmail: 'ballito@odw.co.za', addresses: [{ id: 'addr_015', type: 'delivery', isPrimary: true, street: 'Lifestyle Centre', city: 'Ballito', postalCode: '4420', province: 'KwaZulu-Natal' }], invoiceLevel: 'branch' },
];

export const products: Product[] = [
  { id: 'prod_001', itemCode: '0781159125409', name: 'Snowva Ultimate Ice Maker', description: 'Snowva Ultimate Ice Maker', 
    prices: [
        { id: 'price_001a', effectiveDate: '2023-01-01', retail: 180.00, consumer: 300.00 },
        { id: 'price_001b', effectiveDate: '2024-07-01', retail: 187.83, consumer: 315.00 },
    ], 
    imageUrl: 'https://picsum.photos/seed/prod_001/200', ecommerceLink: 'https://snowva.com/products/ice-maker' },
  { id: 'prod_002', itemCode: '123456', name: 'Outray', description: 'Outray', 
    prices: [
        { id: 'price_002a', effectiveDate: '2024-01-01', retail: 375.00, consumer: 400.00 }
    ], 
    imageUrl: 'https://picsum.photos/seed/prod_002/200', ecommerceLink: 'https://snowva.com/products/outray' },
  { id: 'prod_003', itemCode: '123456', name: 'Makabrai', description: 'Makabrai', 
    prices: [
        { id: 'price_003a', effectiveDate: '2024-01-01', retail: 652.17, consumer: 750.00 }
    ], 
    imageUrl: 'https://picsum.photos/seed/prod_003/200', ecommerceLink: 'https://snowva.com/products/makabrai' },
  { id: 'prod_004', itemCode: '123456', name: 'Braai Bak - 2.5l', description: 'Braai Bak - 2.5l', 
    prices: [
        { id: 'price_004a', effectiveDate: '2024-01-01', retail: 285.00, consumer: 450.00 }
    ], 
    imageUrl: 'https://picsum.photos/seed/prod_004/200', ecommerceLink: 'https://snowva.com/products/braai-bak' },
  { id: 'prod_005', itemCode: 'GRID2525', name: 'Braai Grid - Small', description: 'Braai Grid - Small', 
    prices: [
        { id: 'price_005a', effectiveDate: '2024-01-01', retail: 365.22, consumer: 650.00 }
    ], 
    imageUrl: 'https://picsum.photos/seed/prod_005/200', ecommerceLink: 'https://snowva.com/products/braai-grid' },
  { id: 'prod_006', itemCode: '123456', name: 'BraaiTas', description: 'BraaiTas', 
    prices: [
        { id: 'price_006a', effectiveDate: '2024-01-01', retail: 1043.48, consumer: 1600.00 }
    ], 
    imageUrl: 'https://picsum.photos/seed/prod_006/200', ecommerceLink: 'https://snowva.com/products/braaitas' },
];

const sampleLineItems1: LineItem[] = [
    {id: 'li_001', productId: 'prod_003', description: 'Makabrai', quantity: 1, unitPrice: 652.17},
];

const sampleLineItems2: LineItem[] = [
    {id: 'li_002', productId: 'prod_001', description: 'Snowva Ultimate Ice Maker', quantity: 5, unitPrice: 187.83},
    {id: 'li_003', productId: 'prod_005', description: 'Braai Grid - Small', quantity: 5, unitPrice: 365.22},
    {id: 'li_004', productId: 'prod_006', description: 'BraaiTas', quantity: 10, unitPrice: 1043.48},
];

export const payments: Payment[] = [
  { id: 'pay_001', customerId: 'cust_008', date: '2025-07-10', totalAmount: 750.00, method: PaymentMethod.EFT, reference: 'H.Coetzee Inv 250707101', allocations: [{ invoiceId: 'inv_001', amount: 750.00 }] },
  { id: 'pay_002', customerId: 'cust_009', date: '2025-09-01', totalAmount: 10000.00, method: PaymentMethod.EFT, allocations: [{ invoiceId: 'inv_002', amount: 10000.00 }] },
];

export const invoices: Invoice[] = [
    { id: 'inv_001', invoiceNumber: '250707101', customerId: 'cust_008', date: '2025-07-07', dueDate: '2025-07-07', items: sampleLineItems1, status: DocumentStatus.PAID },
    { id: 'inv_002', invoiceNumber: '250827101', customerId: 'cust_009', date: '2025-08-27', dueDate: '2025-09-26', orderNumber: '#270801', items: sampleLineItems2, status: DocumentStatus.PARTIALLY_PAID },
    { id: 'inv_003', invoiceNumber: '241007101', customerId: 'cust_005', date: '2024-10-07', dueDate: '2024-12-06', items: [{id: 'li_005', productId: 'prod_001', description: 'Snowva Ultimate Ice Maker', quantity: 1, unitPrice: 1520.00 / 1.15}], status: DocumentStatus.FINALIZED, notes: 'PO #12345' },
    { id: 'inv_004', invoiceNumber: 'DRAFT-001', customerId: 'cust_001', date: new Date().toISOString().split('T')[0], items: [], status: DocumentStatus.DRAFT },
];

export const quotes: Quote[] = [
    { id: 'qt_001', quoteNumber: 'Q-2024-001', customerId: 'cust_002', date: '2024-07-15', validUntil: '2024-08-15', items: sampleLineItems2, status: DocumentStatus.DRAFT },
    { id: 'qt_002', quoteNumber: 'Q-2024-002', customerId: 'cust_011', date: '2024-07-18', validUntil: '2024-08-18', items: [sampleLineItems1[0]], status: DocumentStatus.ACCEPTED },
];