import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';
import { SNOWVA_DETAILS, VAT_RATE } from '../constants';
import { Customer, Invoice } from '../types';

interface InvoicePDFProps {
  invoice: Invoice;
  billToCustomer: Customer;
  billingAddress: any;
  subtotal: number;
  vatAmount: number;
  total: number;
}

const formatCurrency = (amount: number) => {
  return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  
  // Header Section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  
  logo: {
    width: '40%',
  },
  
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 2,
  },
  
  companyDetails: {
    fontSize: 8,
    color: '#666666',
    lineHeight: 1.2,
  },
  
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
    width: '40%',
  },
  
  // Invoice Info Section
  invoiceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  
  billToSection: {
    width: '45%',
  },
  
  invoiceDetailsSection: {
    width: '45%',
    alignItems: 'flex-end',
  },
  
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  
  customerName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  
  addressLine: {
    fontSize: 9,
    marginBottom: 1,
    lineHeight: 1.2,
  },
  
  invoiceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  
  detailLabel: {
    width: 60,
    fontSize: 9,
    textAlign: 'right',
    marginRight: 5,
  },
  
  detailValue: {
    width: 80,
    fontSize: 9,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  
  // Table Section
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderWidth: 0.5,
    borderColor: '#000000',
    paddingVertical: 5,
    paddingHorizontal: 3,
  },
  
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: '#000000',
    paddingVertical: 3,
    paddingHorizontal: 3,
    minHeight: 20,
  },
  
  // Column widths
  descriptionCell: {
    width: '40%',
    fontSize: 8,
  },
  
  itemCodeCell: {
    width: '15%',
    fontSize: 8,
    textAlign: 'center',
  },
  
  qtyCell: {
    width: '8%',
    fontSize: 8,
    textAlign: 'center',
  },
  
  currencyCell: {
    width: '5%',
    fontSize: 8,
    textAlign: 'center',
  },
  
  priceCell: {
    width: '16%',
    fontSize: 8,
    textAlign: 'right',
  },
  
  totalCell: {
    width: '16%',
    fontSize: 8,
    textAlign: 'right',
  },
  
  // Footer Section
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  bankingDetails: {
    width: '45%',
  },
  
  bankingTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  
  bankingLine: {
    fontSize: 8,
    marginBottom: 1,
  },
  
  totalsBox: {
    width: '45%',
    borderWidth: 0.5,
    borderColor: '#000000',
    padding: 5,
  },
  
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    paddingVertical: 1,
  },
  
  totalRowBorder: {
    borderTopWidth: 0.5,
    borderColor: '#000000',
    paddingTop: 2,
  },
  
  totalLabel: {
    fontSize: 8,
  },
  
  totalLabelBold: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  
  totalAmount: {
    fontSize: 8,
    textAlign: 'right',
  },
  
  totalAmountBold: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'right',
  },
});

export const InvoicePDF: React.FC<InvoicePDFProps> = ({
  invoice,
  billToCustomer,
  billingAddress,
  subtotal,
  vatAmount,
  total,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    const correctedDate = new Date(d.getTime() + userTimezoneOffset);
    const day = correctedDate.getDate().toString().padStart(2, '0');
    const month = (correctedDate.getMonth() + 1).toString().padStart(2, '0');
    const year = correctedDate.getFullYear();
    return `${year}/${month}/${day}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.companyName}>{SNOWVA_DETAILS.name}</Text>
            {SNOWVA_DETAILS.address.map((line, index) => (
              <Text key={index} style={styles.companyDetails}>{line}</Text>
            ))}
            <Text style={styles.companyDetails}>VAT: {SNOWVA_DETAILS.vatNo}</Text>
          </View>
          
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
          </View>
        </View>

        {/* Invoice Info Section */}
        <View style={styles.invoiceInfo}>
          {/* Bill To Section */}
          <View style={styles.billToSection}>
            <Text style={styles.sectionTitle}>BILL TO:</Text>
            <Text style={styles.customerName}>{billToCustomer.name}</Text>
            {billingAddress && (
              <>
                <Text style={styles.addressLine}>{billingAddress.street}</Text>
                <Text style={styles.addressLine}>
                  {billingAddress.city}, {billingAddress.province} {billingAddress.postalCode}
                </Text>
              </>
            )}
            {billToCustomer.vatNumber && (
              <Text style={styles.addressLine}>VAT #: {billToCustomer.vatNumber}</Text>
            )}
            {invoice.orderNumber && (
              <Text style={styles.addressLine}>Order #: {invoice.orderNumber}</Text>
            )}
          </View>

          {/* Invoice Details Section */}
          <View style={styles.invoiceDetailsSection}>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.detailLabel}>Invoice #:</Text>
              <Text style={styles.detailValue}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.detailLabel}>Invoice Date:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.issueDate)}</Text>
            </View>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.detailLabel}>Due Date:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
          </View>
        </View>

        {/* Table Section */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.itemCodeCell]}>Item Code</Text>
            <Text style={[styles.tableHeaderCell, styles.qtyCell]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.currencyCell]}></Text>
            <Text style={[styles.tableHeaderCell, styles.priceCell]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.currencyCell]}></Text>
            <Text style={[styles.tableHeaderCell, styles.totalCell]}>Total (Excl VAT)</Text>
          </View>

          {/* Table Body */}
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.descriptionCell]}>{item.description}</Text>
              <Text style={[styles.itemCodeCell]}>{item.itemCode}</Text>
              <Text style={[styles.qtyCell]}>{item.quantity}</Text>
              <Text style={[styles.currencyCell]}>R</Text>
              <Text style={[styles.priceCell]}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={[styles.currencyCell]}>R</Text>
              <Text style={[styles.totalCell]}>{formatCurrency(item.quantity * item.unitPrice)}</Text>
            </View>
          ))}

          {/* Shipping Row */}
          {invoice.shipping && invoice.shipping > 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.descriptionCell]}>Delivery Fee</Text>
              <Text style={[styles.itemCodeCell]}></Text>
              <Text style={[styles.qtyCell]}>1</Text>
              <Text style={[styles.currencyCell]}>R</Text>
              <Text style={[styles.priceCell]}>{formatCurrency(invoice.shipping)}</Text>
              <Text style={[styles.currencyCell]}>R</Text>
              <Text style={[styles.totalCell]}>{formatCurrency(invoice.shipping)}</Text>
            </View>
          )}
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          {/* Banking Details */}
          <View style={styles.bankingDetails}>
            <Text style={styles.bankingTitle}>Banking details:</Text>
            <Text style={styles.bankingLine}>{SNOWVA_DETAILS.name}</Text>
            <Text style={styles.bankingLine}>{SNOWVA_DETAILS.banking.bankName}</Text>
            <Text style={styles.bankingLine}>Branch code {SNOWVA_DETAILS.banking.branchCode}</Text>
            <Text style={styles.bankingLine}>Account number {SNOWVA_DETAILS.banking.accountNumber}</Text>
          </View>

          {/* Totals Box */}
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>SUBTOTAL</Text>
              <Text style={styles.totalAmount}>R {formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>VAT Rate</Text>
              <Text style={styles.totalAmount}>{(VAT_RATE * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Vat Amount</Text>
              <Text style={styles.totalAmount}>R {formatCurrency(vatAmount)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowBorder]}>
              <Text style={styles.totalLabelBold}>TOTAL</Text>
              <Text style={styles.totalAmountBold}>R {formatCurrency(total)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};