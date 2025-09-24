
import { Customer, Product, Invoice, Quote, CustomerType, DocumentStatus, LineItem, Address, Payment, PaymentMethod, PaymentTerm } from './types';

export const VAT_RATE = 0.15;

export const SNOWVA_DETAILS = {
    name: 'Snowva™ Trading Pty Ltd',
    regNo: '2010/007043/07',
    address: [
        '67 Wildevy Street',
        'Lynnwood Manor',
        'Pretoria'
    ],
    vatNo: '4100263500',
    banking: {
        bankName: 'First National Bank',
        branchCode: '250 655',
        accountNumber: '62264885082'
    }
};


export const customers: Customer[] = [
  { id: 'cust_001', name: '4 Seasons Winkel', type: CustomerType.B2B, vatNumber: '4123456789', contactPerson: 'John Doe', contactEmail: 'accounts@4seasons.co.za', contactPhone: '021-555-0101', addresses: [{ id: 'addr_001', type: 'delivery', isPrimary: true, addressLine1: '123 Main Rd', city: 'Cape Town', postalCode: '8001', province: 'Western Cape', country: 'South Africa' }], paymentTerm: PaymentTerm.DAYS_30 },
  { id: 'cust_002', name: '4X4 Unlimited Pty Ltd', type: CustomerType.B2B, vatNumber: '4234567890', contactPerson: 'Jane Smith', contactEmail: 'info@4x4unlimited.co.za', contactPhone: '011-555-0102', addresses: [{ id: 'addr_002', type: 'delivery', isPrimary: true, addressLine1: '4x4 Adventure Lane', city: 'Johannesburg', postalCode: '2001', province: 'Gauteng', country: 'South Africa' }], paymentTerm: PaymentTerm.DAYS_30 },
  { id: 'cust_003', name: 'A&A Business Services Pty Ltd', type: CustomerType.B2B, vatNumber: '4345678901', contactPerson: 'Peter Jones', contactEmail: 'contact@aabusiness.co.za', contactPhone: '031-555-0103', addresses: [{ id: 'addr_003', type: 'delivery', isPrimary: true, addressLine1: '1 Service St', city: 'Durban', postalCode: '4001', province: 'KwaZulu-Natal', country: 'South Africa' }], paymentTerm: PaymentTerm.DAYS_30 },
  { id: 'cust_004', name: 'Sportsmans Warehouse', type: CustomerType.B2B, vatNumber: '4080304928', legalEntityName: 'Holdsport Group Pty Ltd t/a Sportsmans Warehouse', contactPerson: 'Head Office', contactEmail: 'hq@swarehouse.co.za', contactPhone: '021-555-0104', addresses: [{ id: 'addr_004', type: 'billing', isPrimary: true, addressLine1: 'PO Box 2721', city: 'Cape Town', postalCode: '8000', province: 'Western Cape', country: 'South Africa' }], defaultInvoiceNotes: 'A valid PO number must be referenced on the invoice.', paymentTerm: PaymentTerm.DAYS_60,
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
  { id: 'cust_005', name: 'Sportsmans Warehouse - Atterbury', type: CustomerType.B2B, parentCompanyId: 'cust_004', branchNumber: 'SW01', contactEmail: 'atterbury@swarehouse.co.za', addresses: [{ id: 'addr_005', type: 'delivery', isPrimary: true, addressLine1: 'Shop 1, Atterbury Value Mart', suburb: 'Faerie Glen', city: 'Pretoria', postalCode: '0081', province: 'Gauteng', country: 'South Africa' }], invoiceLevel: 'branch', billToParent: true,
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
  { id: 'cust_006', name: 'Sportsmans Warehouse - Ballito', type: CustomerType.B2B, parentCompanyId: 'cust_004', branchNumber: 'SW02', contactEmail: 'ballito@swarehouse.co.za', addresses: [{ id: 'addr_006', type: 'delivery', isPrimary: true, addressLine1: 'Ballito Junction Mall', addressLine2: 'Leonora Dr', suburb: 'Ballito', city: 'Dolphin Coast', postalCode: '4420', province: 'KwaZulu-Natal', country: 'South Africa' }], invoiceLevel: 'branch', billToParent: true },
  { id: 'cust_007', name: 'Sportsmans Warehouse - Centurion', type: CustomerType.B2B, parentCompanyId: 'cust_004', branchNumber: 'SW03', contactEmail: 'centurion@swarehouse.co.za', addresses: [{ id: 'addr_007', type: 'delivery', isPrimary: true, addressLine1: 'Centurion Mall', addressLine2: '1269 Heuwel Rd', suburb: 'Centurion', city: 'Centurion', postalCode: '0157', province: 'Gauteng', country: 'South Africa' }], invoiceLevel: 'branch' },
  { id: 'cust_008', name: 'Hendrik Coetzee', type: CustomerType.B2C, contactPhone: '0718542160', contactEmail: 'hendrik.c@email.com', addresses: [{ id: 'addr_008', type: 'delivery', isPrimary: true, addressLine1: '55 General St', suburb: 'Wilgers', city: 'Pretoria', postalCode: '0081', province: 'Gauteng', country: 'South Africa' }] },
  { id: 'cust_009', name: 'Trans Africa Self drive adventures & Tours', type: CustomerType.B2B, addresses: [{ id: 'addr_009', type: 'billing', isPrimary: true, addressLine1: '7 Hill street', city: 'Keurboomstrand', postalCode: '6600', province: 'Western Cape', country: 'South Africa'}], paymentTerm: PaymentTerm.COD },
];

export const products: Product[] = [
  { id: 'prod_001', itemCode: '078119125409', name: 'Snowva Ultimate Ice Maker', description: 'Snowva Ultimate Ice Maker', prices: [{ id: 'price_001', effectiveDate: '2024-01-01', retail: 187.83, consumer: 313.04 }], imageUrl: 'https://snowva.com/cdn/shop/files/1_2_1080x.jpg?v=1719299690' },
  { id: 'prod_002', itemCode: 'GRID2525', name: 'Braai Grid - Small', description: 'Braai Grid - Small', prices: [{ id: 'price_002', effectiveDate: '2024-01-01', retail: 365.22, consumer: 434.78 }], imageUrl: 'https://snowva.com/cdn/shop/files/SNOWVA-WEBSITE-MAY-2024-27_1080x.jpg?v=1715002078' },
  { id: 'prod_003', itemCode: '123456', name: 'BraaiTas', description: 'BraaiTas', prices: [{ id: 'price_003', effectiveDate: '2024-01-01', retail: 1043.48, consumer: 1304.35 }], imageUrl: 'https://snowva.com/cdn/shop/files/SNOWVA-WEBSITE-MAY-2024-19_1080x.jpg?v=1715001399' },
  { id: 'prod_004', itemCode: 'MAKABRAAI', name: 'Makabrai', description: 'Makabrai Charcoal/Briquettes', prices: [{ id: 'price_004', effectiveDate: '2024-01-01', retail: 652.17, consumer: 750.00}], imageUrl: 'https://snowva.com/cdn/shop/files/Mnr-Briket-charcoal-briquettes-braai-bbq-2_1080x.jpg?v=1714999862' }
];

const lineItemsForInv001: LineItem[] = [
    { id: 'li_001', productId: 'prod_001', description: 'Snowva Ultimate Ice Maker', quantity: 5, unitPrice: 187.83, itemCode: '078119125409' },
    { id: 'li_002', productId: 'prod_002', description: 'Braai Grid - Small', quantity: 5, unitPrice: 365.22, itemCode: 'GRID2525' },
    { id: 'li_003', productId: 'prod_003', description: 'BraaiTas', quantity: 10, unitPrice: 1043.48, itemCode: '123456' },
];

export const invoices: Invoice[] = [
  { id: 'inv_001', invoiceNumber: '250827101', customerId: 'cust_009', date: '2025-08-27', dueDate: '2025-08-27', orderNumber: '#270801', items: lineItemsForInv001, status: DocumentStatus.FINALIZED, notes: 'Thank you for your business.' },
  { id: 'inv_002', invoiceNumber: '250707101', customerId: 'cust_008', date: '2025-07-07', dueDate: '2025-07-07', items: [{ id: 'li_004', productId: 'prod_004', description: 'Makabrai', quantity: 1, unitPrice: 652.17, itemCode: 'MAKABRAAI'}], status: DocumentStatus.PAID },
  { id: 'inv_003', invoiceNumber: '241007101', customerId: 'cust_006', date: '2024-10-07', dueDate: '2024-12-06', orderNumber: 'PO10630114', items: [{ id: 'li_005', productId: 'prod_001', description: 'Snowva Ultimate Ice Maker', quantity: 1, unitPrice: 1321.74, itemCode: '1013250' }], status: DocumentStatus.PARTIALLY_PAID },
  { id: 'inv_004', invoiceNumber: '241216101', customerId: 'cust_005', date: '2024-12-16', dueDate: '2025-02-14', orderNumber: 'PO10634368', items: [{ id: 'li_006', productId: 'prod_001', description: 'Snowva Ultimate Ice Maker', quantity: 1, unitPrice: 1321.74, itemCode: '1013250' }], status: DocumentStatus.FINALIZED },
  { id: 'inv_005', invoiceNumber: 'DRAFT-16999888', customerId: 'cust_001', date: '2025-09-01', items: [], status: DocumentStatus.DRAFT },
];

export const quotes: Quote[] = [
  { id: 'q_001', quoteNumber: 'Q-2025-001', customerId: 'cust_002', date: '2025-08-15', validUntil: '2025-09-14', items: [{ id: 'li_q_001', productId: 'prod_001', description: 'Snowva Ultimate Ice Maker', quantity: 20, unitPrice: 187.83, itemCode: '078119125409' }], status: DocumentStatus.ACCEPTED },
  { id: 'q_002', quoteNumber: 'Q-2025-002', customerId: 'cust_003', date: '2025-08-20', validUntil: '2025-09-19', items: [{ id: 'li_q_002', productId: 'prod_002', description: 'Braai Grid - Small', quantity: 10, unitPrice: 365.22, itemCode: 'GRID2525' }], status: DocumentStatus.DRAFT },
];

export const payments: Payment[] = [
  { id: 'pay_001', customerId: 'cust_008', date: '2025-07-08', totalAmount: 750.00, method: PaymentMethod.EFT, reference: 'INV 250707101', allocations: [{ invoiceId: 'inv_002', amount: 750.00 }] },
  { id: 'pay_002', customerId: 'cust_004', date: '2024-11-01', totalAmount: 500.00, method: PaymentMethod.EFT, reference: 'Deposit', allocations: [{ invoiceId: 'inv_003', amount: 500.00 }] },
];
