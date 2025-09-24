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
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  
  // Header Section - Company Details + TAX INVOICE
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  
  companySection: {
    width: '60%',
  },
  
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 3,
  },
  
  companyDetails: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.3,
    marginBottom: 1,
  },
  
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#000000',
  },
  
  // Invoice Details Section - Date, Invoice #, For
  invoiceDetailsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  
  invoiceDetailsLeft: {
    width: '50%',
  },
  
  invoiceDetailsRight: {
    width: '50%',
    alignItems: 'flex-end',
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  
  detailLabel: {
    fontSize: 10,
    textAlign: 'right',
    marginRight: 15,
    width: 80,
    fontWeight: 'normal',
  },
  
  detailValue: {
    fontSize: 10,
    textAlign: 'right',
    width: 120,
    fontWeight: 'normal',
  },
  
  // VAT and Bill To Section
  vatBillSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  
  vatSection: {
    width: '50%',
  },
  
  billToSection: {
    width: '50%',
    alignItems: 'flex-end',
  },
  
  vatText: {
    fontSize: 10,
    fontWeight: 'normal',
  },
  
  billToTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  
  billToDetails: {
    alignItems: 'flex-end',
  },
  
  customerName: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 3,
    textAlign: 'right',
  },
  
  addressLine: {
    fontSize: 9,
    marginBottom: 1,
    textAlign: 'right',
    fontWeight: 'normal',
  },
  
  // Table Section - EXACT MATCH TO BUSINESS TEMPLATE
  table: {
    marginBottom: 50,
    borderWidth: 0.1,
    borderColor: '#3F3F3FFF',
  },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E5E5E5',
    borderBottomWidth: 0.1,
    borderColor: '#3B3B3BFF',
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 2,
  },
  
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0.1,
    borderRightWidth: 0.1, 
    borderColor: '#818181FF',
    minHeight: 25,
    // NO BORDERS BETWEEN ROWS - matches business template
  },
  
  // Table Column Styles - EXACT PROPORTIONS FROM BUSINESS TEMPLATE
  descriptionCol: {
    width: '40%',
    paddingHorizontal: 8,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderColor: '#000000',
  },
  
  itemCodeCol: {
    width: '20%',
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#000000',
  },
  
  qtyCol: {
    width: '10%',
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#000000',
  },
  
  unitPriceCol: {
    width: '15%',
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#000000',
  },
  
  totalCol: {
    width: '15%',
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Text styles for table content
  descriptionText: {
    fontSize: 9,
    textAlign: 'left',
    fontWeight: 'normal',
  },
  
  centerText: {
    fontSize: 9,
    textAlign: 'center',
    fontWeight: 'normal',
  },
  
  currencyText: {
    fontSize: 9,
    textAlign: 'center',
    fontWeight: 'normal',
  },
  
  amountText: {
    fontSize: 9,
    textAlign: 'right',
    fontWeight: 'normal',
  },
  
  // Footer Section - Banking + Totals
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  bankingDetails: {
    width: '50%',
  },
  
  bankingTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  
  bankingLine: {
    fontSize: 9,
    marginBottom: 2,
    fontWeight: 'normal',
  },
  
  // Totals Box - EXACT MATCH TO BUSINESS TEMPLATE
  totalsBox: {
    width: '45%',
    borderWidth: 1,
    borderColor: '#000000',
  },
  
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderColor: '#000000',
  },
  
  totalRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 2,
    borderColor: '#000000',
    backgroundColor: '#F5F5F5',
  },
  
  totalLabel: {
    fontSize: 9,
    fontWeight: 'normal',
  },
  
  totalAmount: {
    fontSize: 9,
    textAlign: 'right',
    fontWeight: 'normal',
  },
  
  totalLabelBold: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  
  totalAmountBold: {
    fontSize: 11,
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
          <View style={styles.companySection}>
            <Text style={styles.companyName}>{SNOWVA_DETAILS.name}</Text>
            {SNOWVA_DETAILS.address.map((line, index) => (
              <Text key={index} style={styles.companyDetails}>{line}</Text>
            ))}
            <Text style={styles.companyDetails}>VAT: {SNOWVA_DETAILS.vatNo}</Text>
          </View>
          
          <View>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
          </View>
        </View>

        {/* Invoice Details Section */}
        <View style={styles.invoiceDetailsSection}>
          <View style={styles.invoiceDetailsLeft}></View>
          <View style={styles.invoiceDetailsRight}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice #:</Text>
              <Text style={styles.detailValue}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Invoice Date:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.issueDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Due Date:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.dueDate)}</Text>
            </View>
          </View>
        </View>

        {/* VAT and Bill To Section */}
        <View style={styles.vatBillSection}>
          <View style={styles.vatSection}>
            <Text style={styles.vatText}>VAT No: {SNOWVA_DETAILS.vatNo}</Text>
          </View>
          <View style={styles.billToSection}>
            <Text style={styles.billToTitle}>BILL TO:</Text>
            <View style={styles.billToDetails}>
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
          </View>
        </View>

        {/* Table Section */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.descriptionCol}>
              <Text style={styles.tableHeaderCell}>Description</Text>
            </View>
            <View style={styles.itemCodeCol}>
              <Text style={styles.tableHeaderCell}>Item Code</Text>
            </View>
            <View style={styles.qtyCol}>
              <Text style={styles.tableHeaderCell}>Qty</Text>
            </View>
            <View style={styles.unitPriceCol}>
              <Text style={styles.tableHeaderCell}>Unit Price</Text>
            </View>
            <View style={styles.totalCol}>
              <Text style={styles.tableHeaderCell}>Total (Excl VAT)</Text>
            </View>
          </View>

          {/* Table Body */}
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.descriptionCol}>
                <Text style={styles.descriptionText}>{item.description}</Text>
              </View>
              <View style={styles.itemCodeCol}>
                <Text style={styles.centerText}>{item.itemCode}</Text>
              </View>
              <View style={styles.qtyCol}>
                <Text style={styles.centerText}>{item.quantity}</Text>
              </View>
              <View style={styles.unitPriceCol}>
                <Text style={styles.currencyText}>R {formatCurrency(item.unitPrice)}</Text>
              </View>
              <View style={styles.totalCol}>
                <Text style={styles.currencyText}>R {formatCurrency(item.quantity * item.unitPrice)}</Text>
              </View>
            </View>
          ))}

          {/* Shipping Row */}
          {invoice.shipping && invoice.shipping > 0 && (
            <View style={styles.tableRow}>
              <View style={styles.descriptionCol}>
                <Text style={styles.descriptionText}>Delivery Fee</Text>
              </View>
              <View style={styles.itemCodeCol}>
                <Text style={styles.centerText}></Text>
              </View>
              <View style={styles.qtyCol}>
                <Text style={styles.centerText}>1</Text>
              </View>
              <View style={styles.unitPriceCol}>
                <Text style={styles.currencyText}>R {formatCurrency(invoice.shipping)}</Text>
              </View>
              <View style={styles.totalCol}>
                <Text style={styles.currencyText}>R {formatCurrency(invoice.shipping)}</Text>
              </View>
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
            <View style={styles.totalRowLast}>
              <Text style={styles.totalLabelBold}>TOTAL</Text>
              <Text style={styles.totalAmountBold}>R {formatCurrency(total)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};