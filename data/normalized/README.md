# Firebase Firestore Data Import

This directory contains normalized JSON data ready for import into Firebase Firestore.

## Structure

### products.json

Contains the complete product catalog normalized from the Google Sheets source.

**Collection Structure:**

```
/products/{productId}
```

**Document Structure:**

- `id` (string): Unique product identifier
- `itemCode` (string): Product SKU/item code
- `name` (string): Product name
- `description` (string): Product description
- `prices` (array): Array of price objects with effective dates
  - `id` (string): Unique price identifier
  - `effectiveDate` (string): ISO date when price becomes effective
  - `retail` (number): B2B retail price
  - `consumer` (number): B2C consumer price
- `imageUrl` (string|null): Optional product image URL
- `ecommerceLink` (string|null): Optional e-commerce link

### customers.json

Contains the retail customer database with hierarchical company structures and custom pricing overrides.

**Collection Structure:**

```
/customers/{customerId}
```

**Document Structure:**

- `id` (string): Unique customer identifier (snake_case)
- `name` (string): Customer display name
- `type` (string): "Consumer" or "Retail"
- `vatNumber` (string|null): VAT registration number
- `legalEntityName` (string|null): Legal business name
- `branchNumber` (string|null): Branch identifier for child companies
- `parentCompanyId` (string|null): Reference to parent company
- `addresses` (array): Customer addresses
  - `id` (string): Unique address identifier
  - `type` (string): "billing" or "delivery"
  - `isPrimary` (boolean): Whether this is the primary address
  - `addressLine1` (string): First address line
  - `addressLine2` (string|null): Second address line
  - `suburb` (string|null): Suburb/area
  - `city` (string): City name
  - `postalCode` (string|null): Postal code
  - `province` (string): Province/state
  - `country` (string): Country name
- `invoiceLevel` (string|null): "parent" or "branch" for billing hierarchy
- `billToParent` (boolean|null): Whether invoices go to parent company
- `paymentTerm` (string|null): Payment terms (e.g., "30 Days", "60 Days")
- `defaultInvoiceNotes` (string|null): Default notes for invoices
- `customProductPricing` (array|null): Custom price overrides
  - `id` (string): Unique pricing override identifier
  - `productId` (string): Reference to product
  - `customItemCode` (string|null): Customer-specific item code
  - `customDescription` (string|null): Customer-specific description
  - `customNote` (string|null): Additional pricing notes
  - `prices` (array): Price override array (same structure as product prices)

**Key Features:**

1. **Hierarchical Structure**: Parent companies with branch locations
2. **Custom Pricing**: Customer-specific price overrides that inherit through hierarchy
3. **Flexible Addressing**: Multiple addresses per customer with type classification
4. **Billing Control**: Configure invoice routing (parent vs branch level)
5. **Firebase-Ready**: Snake_case IDs and proper document structure

## Import Instructions

### Using Firebase CLI

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Import products collection
firebase firestore:import data/normalized --project your-project-id
```

### Using Firebase Admin SDK

```javascript
const admin = require("firebase-admin");
const productsData = require("./products.json");
const customersData = require("./customers.json");
const invoicesData = require("./invoices.json");
const paymentsData = require("./payments.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  // or use service account key
});

const db = admin.firestore();

// Import products
async function importProducts() {
  const batch = db.batch();

  productsData.forEach((product) => {
    const productRef = db.collection("products").doc(product.id);
    batch.set(productRef, product);
  });

  await batch.commit();
  console.log("Products imported successfully");
}

// Import customers
async function importCustomers() {
  const batch = db.batch();

  customersData.forEach((customer) => {
    const customerRef = db.collection("customers").doc(customer.id);
    batch.set(customerRef, customer);
  });

  await batch.commit();
  console.log("Customers imported successfully");
}

// Import invoices
async function importInvoices() {
  const batch = db.batch();

  invoicesData.forEach((invoice) => {
    const invoiceRef = db.collection("invoices").doc(invoice.id);
    batch.set(invoiceRef, invoice);
  });

  await batch.commit();
  console.log("Invoices imported successfully");
}

// Import payments
async function importPayments() {
  const batch = db.batch();

  paymentsData.forEach((payment) => {
    const paymentRef = db.collection("payments").doc(payment.id);
    batch.set(paymentRef, payment);
  });

  await batch.commit();
  console.log("Payments imported successfully");
}

// Run imports
async function main() {
  await importProducts();
  await importCustomers();
  await importInvoices();
  await importPayments();
  console.log("All data imported successfully!");
}

main().catch(console.error);
```

## Data Transformation Notes

### Customer Data Complexity

The customer spreadsheet contained a complex horizontal structure with:

- Basic company information (name, VAT, addresses)
- Multiple product pricing columns with custom prices per customer
- Hierarchical company relationships (parent companies with branches)
- Mixed billing arrangements (some branches bill to parent)

**Transformation Process:**

1. **Name Normalization**: Converted company names to snake_case IDs for Firestore compatibility
2. **Address Parsing**: Extracted structured addresses from concatenated address fields
3. **Custom Pricing Extraction**: Parsed horizontal pricing data into normalized price arrays
4. **Hierarchy Detection**: Identified parent-child relationships based on company structure
5. **Data Validation**: Cleaned currency values, normalized item codes, handled missing data

**Special Cases Handled:**

- **Outdoor Warehouse/Sportsmans Warehouse**: Large retail chains with 30+ branches
- **Obaro**: Multi-location agricultural supplier with regional branches
- **BKB Limited**: Agricultural cooperative with regional operations
- **Custom Item Codes**: Some customers use different item codes for same products
- **Price Variations**: Branch-level price overrides that differ from parent company
- **Billing Arrangements**: Some branches bill separately, others consolidate to parent

**Data Quality Notes:**

- Currency values converted from "R 216.00" format to numeric 216.00
- Missing postal codes handled gracefully
- Duplicate company entries (like multiple Outdoor Warehouse branches) properly separated
- Custom product descriptions preserved where they differ from standard catalog

### Integration with Existing System

The normalized data maintains compatibility with the existing React TypeScript interfaces:

- Customer type enum: "Consumer" | "Retail"
- Payment terms: "30 Days", "60 Days", "Cash on Delivery"
- Address types: "billing" | "delivery"
- Custom pricing inherits through parent-child relationships

This structure supports the existing hierarchical pricing resolution logic in `utils.ts`.
await batch.commit();
console.log("Products imported successfully");
}

importProducts().catch(console.error);

````

### Using Firestore Console

1. Go to Firebase Console > Firestore Database
2. Create a new collection called "products"
3. Manually add documents using the JSON structure provided

## Data Validation

All products follow the TypeScript interface:

```typescript
interface Product {
  id: string;
  itemCode: string;
  name: string;
  description: string;
  prices: Price[];
  imageUrl?: string;
  ecommerceLink?: string;
}

interface Price {
  id: string;
  effectiveDate: string;
  retail: number;
  consumer: number;
}
````

## Source Data

- **Source**: Google Sheets
- **URL**: https://docs.google.com/spreadsheets/d/1XMFQW8kGOhXzVMFcPFYIlVOdsch96KITbogKEGdOS9g/
- **Last Updated**: September 24, 2025
- **Total Products**: 11

## Notes

- All prices are effective from January 1, 2025
- Product IDs use snake_case convention for Firestore compatibility
- Price IDs are unique and follow pattern: `price_{product}_{sequence}`
- Missing image URLs and e-commerce links are set to `null` for future updates

### invoices.json

Contains **470 sales invoices** with proper product line items and payment status. **Updated with corrected product mapping from Google Sheets.**

**Collection Structure:**

```
/invoices/{invoiceId}
```

**Document Structure:**

- `id` (string): Invoice ID format `inv_{invoiceNumber}`
- `invoiceNumber` (string): Invoice number from system
- `customerId` (string): Normalized customer ID reference
- `issueDate` (string): Invoice date (YYYY-MM-DD)
- `dueDate` (string): Payment due date
- `status` (string): "Paid" (198) or "Unpaid" (272)
- `poNumber` (string): Customer purchase order number
- `type` (string): "Retail" or "Consumer"
- `lineItems` (array): Invoice line items with **correct product mapping**:
  - `productId` (string): Maps to products.json (prod_snowva, prod_outray, etc.)
  - `quantity` (number): Item quantity
  - `unitPrice` (number): Price per unit
- `subtotal` (number): Line items total
- `taxAmount` (number): Tax amount (usually 0 - VAT inclusive)
- `discountAmount` (number): Discount applied
- `shippingAmount` (number): Courier charges
- `totalAmount` (number): Final invoice total
- `notes` (string): Additional information

**Date Range:** October 2024 - August 2025  
**Product Coverage:** All 11 Snowva products properly mapped

- `id` (string): Unique line item identifier
- `productId` (string): Product reference
- `description` (string): Item description
- `quantity` (number): Quantity ordered
- `unitPrice` (number): Unit price (VAT inclusive)
- `itemCode` (string): Product SKU
- `status` (string): "Draft", "Finalized", "Partially Paid", "Paid"
- `shipping` (number): Courier/shipping charges
- `notes` (string|null): Additional invoice notes

### payments.json

Contains **198 payment records** for paid invoices, automatically generated from invoice status.

**Collection Structure:**

```
/payments/{paymentId}
```

**Document Structure:**

- `id` (string): Payment ID format `pay_{invoiceNumber}`
- `customerId` (string): Reference to customer document (normalized)
- `paymentDate` (string): Payment date matching invoice date
- `amount` (number): Payment amount (equals invoice total)
- `method` (string): "Unknown" (not specified in source data)
- `reference` (string): "Payment for invoice {invoiceNumber}"
- `allocations` (array): Single allocation per payment:
  - `invoiceId` (string): Reference to paid invoice
  - `amount` (number): Allocated amount (full payment)

**Coverage:** One payment record per paid invoice (198/470 invoices paid)  
**Date Range:** October 2024 - August 2025

- `invoiceId` (string): Invoice reference
- `amount` (number): Amount allocated to invoice

## Invoice & Payment Data Source

- **Source**: Google Sheets - Invoices
- **URL**: https://docs.google.com/spreadsheets/d/1jNxXxHg4Zt4k0DaJZaJGCeboUq1fyE4psTaFL_Jkg44/
- **Transformation Notes**:
  - Converted horizontal product columns (Qty/Price pairs) to structured line items
  - Mapped "Paid" status to payment records with automatic allocation
  - Generated unique payment references for all paid invoices
  - Separated consumer vs retail transactions
  - Preserved purchase order numbers and courier charges
  - Multiple products per invoice normalized into line items array
