



import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Invoice, Customer, CustomerType, Address, Payment, DocumentStatus } from '../types';
import { customers, products, VAT_RATE } from '../constants';
import { MailIcon, PrintIcon, DownloadIcon, CashIcon } from './Icons';
import { getCustomerProductPrice } from '../utils';

// Declare global libraries loaded from CDN
declare const html2canvas: any;
declare const jspdf: any;

interface InvoiceViewerProps {
    invoice: Invoice;
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    payments: Payment[];
    setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
}

const getPrimaryAddress = (customer: Customer | null | undefined): Address | undefined => {
    if (!customer) return undefined;
    if (customer.type === CustomerType.B2B) {
      return customer.addresses.find(a => a.type === 'billing' && a.isPrimary) || customer.addresses.find(a => a.isPrimary);
    }
    return customer.addresses.find(a => a.isPrimary);
}

const calculateTotal = (items: Invoice['items']) => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    return subtotal * (1 + VAT_RATE);
};

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ invoice, payments }) => {
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);

  const selectedCustomer = useMemo(() => customers.find(c => c.id === invoice.customerId) || null, [invoice.customerId]);
  const isBilledToParent = selectedCustomer?.billToParent && selectedCustomer.parentCompanyId;
  const billToCustomer = isBilledToParent ? customers.find(c => c.id === selectedCustomer.parentCompanyId) : selectedCustomer;

  const billingAddress = useMemo(() => getPrimaryAddress(billToCustomer), [billToCustomer]);
  const deliveryAddress = useMemo(() => getPrimaryAddress(selectedCustomer), [selectedCustomer]);
  
  const invoicePaymentAllocations = useMemo(() => {
    return payments
      .flatMap(p => p.allocations.map(a => ({ ...p, allocationAmount: a.amount, invoiceId: a.invoiceId })))
      .filter(pa => pa.invoiceId === invoice.id);
  }, [payments, invoice.id]);

  const total = useMemo(() => calculateTotal(invoice.items), [invoice.items]);
  const amountPaid = useMemo(() => invoicePaymentAllocations.reduce((sum, p) => sum + p.allocationAmount, 0), [invoicePaymentAllocations]);
  const balanceDue = useMemo(() => total - amountPaid, [total, amountPaid]);

  const isB2B = selectedCustomer?.type === CustomerType.B2B;
  
  const generatePdf = async (options: { autoPrint?: boolean } = {}) => {
    const input = invoiceRef.current;
    if (!input) return null;

    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    if (options.autoPrint) {
      pdf.autoPrint();
    }
    return pdf;
  };
  
  const handleDownload = async () => {
    const pdf = await generatePdf();
    if (pdf) {
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    }
  };
  
  const handlePrint = async () => {
    try {
      const pdf = await generatePdf({ autoPrint: true });
      if (!pdf) {
        alert("Failed to generate the invoice PDF.");
        return;
      }

      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      window.open(url);
    } catch (error) {
      console.error("Error during print preparation:", error);
      alert("An error occurred while preparing the document for printing.");
    }
  };


  if (!invoice) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-5xl mx-auto">
        <div className="flex justify-end space-x-4 mb-4">
            <button onClick={() => navigate('/invoices')} className="px-4 py-2 bg-slate-200 text-text-primary rounded-md hover:bg-slate-300">Back to List</button>
            <button onClick={handleDownload} className="flex items-center bg-snowva-orange text-white px-4 py-2 rounded-md hover:bg-snowva-orange-dark">
              <DownloadIcon /> <span className="ml-2">Download</span>
            </button>
            <button onClick={handlePrint} className="flex items-center bg-slate-500 text-white px-4 py-2 rounded-md hover:bg-slate-600">
              <PrintIcon /> <span className="ml-2">Print</span>
           </button>
            <button className="flex items-center bg-snowva-cyan text-white px-4 py-2 rounded-md hover:bg-snowva-blue">
              <MailIcon/> <span className="ml-2">Email Invoice</span>
           </button>
        </div>

        <div ref={invoiceRef} className="border border-gray-300 bg-white">
            <div className="p-8">
                <div className="flex justify-between items-start pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-snowva-blue">Snowva™ Trading Pty Ltd</h1>
                        <p className="text-sm text-gray-600">2010/007043/07</p>
                        <p className="text-sm text-gray-600">67 Wildevy Street, Lynnwood Manor, Pretoria</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-light text-gray-600 tracking-widest">TAX INVOICE</h2>
                        <div className="mt-2 text-sm space-y-1">
                            <p><span className="font-bold text-gray-700">Date:</span> {invoice.date}</p>
                            <p><span className="font-bold text-gray-700">Invoice #:</span> {invoice.invoiceNumber}</p>
                            <p><span className="font-bold text-gray-700">Due Date:</span> {invoice.dueDate || invoice.date}</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-8 py-6 border-y border-gray-200">
                     <div>
                        <h3 className="font-bold text-gray-700 mb-1">{isBilledToParent ? "Deliver To:" : "Bill To & Deliver To:"}</h3>
                        {selectedCustomer ? (
                             <div className="text-sm text-gray-600">
                                <p className="font-bold text-base text-gray-800">{selectedCustomer.name}</p>
                                {deliveryAddress && (
                                    <>
                                    <p>{deliveryAddress.street}</p>
                                    <p>{deliveryAddress.city}, {deliveryAddress.province}, {deliveryAddress.postalCode}</p>
                                    </>
                                )}
                             </div>
                        ) : <p className="text-gray-500">N/A</p>}
                    </div>

                    {isBilledToParent && (
                        <div>
                            <h3 className="font-bold text-gray-700 mb-1">Bill To:</h3>
                            {billToCustomer ? (
                                <div className="text-sm text-gray-600">
                                    <p className="font-bold text-base text-gray-800">{billToCustomer.legalEntityName || billToCustomer.name}</p>
                                    {billingAddress && (
                                        <>
                                        <p>{billingAddress.street}</p>
                                        <p>{billingAddress.city}, {billingAddress.province}, {billingAddress.postalCode}</p>
                                        </>
                                    )}
                                </div>
                            ) : <p className="text-gray-500">N/A</p>}
                        </div>
                    )}
                </div>
                 <div className="py-2">
                     {isB2B && (
                        <>
                            <p className="text-sm"><span className="font-bold">VAT #:</span> {billToCustomer?.vatNumber || 'N/A'}</p>
                            <p className="text-sm"><span className="font-bold">Order #:</span> {invoice.orderNumber || 'N/A'}</p>
                        </>
                    )}
                 </div>
                <table className="w-full my-8">
                    <thead>
                        <tr className="bg-slate-700 text-white">
                            <th className="p-3 text-left font-semibold text-sm">DESCRIPTION</th>
                            {isB2B && <th className="p-3 text-left font-semibold text-sm w-36">Item Code</th>}
                            <th className="p-3 text-right font-semibold text-sm w-24">Qty</th>
                            <th className="p-3 text-right font-semibold text-sm w-36">Unit Price</th>
                            <th className="p-3 text-right font-semibold text-sm w-40">Total (Excl VAT)</th>
                        </tr>
                    </thead>
                    <tbody className="border-b border-gray-300">
                        {invoice.items.map((item) => {
                            const product = products.find(p => p.id === item.productId);
                            const customPricing = selectedCustomer ? getCustomerProductPrice(item.productId, selectedCustomer, customers) : null;
                            const itemCode = customPricing?.customItemCode || product?.itemCode || 'N/A';
                            return (
                            <tr key={item.id} className="border-b border-gray-200 last:border-b-0">
                                <td className="p-2 align-top">{item.description}</td>
                                {isB2B && <td className="p-2 align-top text-left">{itemCode}</td>}
                                <td className="p-2 align-top text-right">{item.quantity}</td>
                                <td className="p-2 align-top text-right">R {item.unitPrice.toFixed(2)}</td>
                                <td className="p-2 align-top text-right">R {(item.quantity * item.unitPrice).toFixed(2)}</td>
                            </tr>
                        )})}
                        {invoice.items.length === 0 && (
                            <tr><td colSpan={isB2B ? 5 : 4} className="h-48 text-center text-slate-500">No items on this invoice.</td></tr>
                        )}
                    </tbody>
                </table>
                <div className="flex justify-between items-start gap-8">
                    <div className="w-1/2 text-sm">
                        <h4 className="font-bold mb-1">Banking details:</h4>
                        <p>Snowva Pty Ltd</p>
                        <p>First National Bank</p>
                        <p>Branch code 250 655</p>
                        <p>Account number 62264885082</p>
                    </div>
                    <div className="w-1/2">
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between p-2"><span>SUBTOTAL</span><span className="font-medium">R {(total / (1 + VAT_RATE)).toFixed(2)}</span></div>
                            <div className="flex justify-between p-2"><span>VAT ({(VAT_RATE * 100).toFixed(0)}%)</span><span className="font-medium">R {(total - (total / (1 + VAT_RATE))).toFixed(2)}</span></div>
                            <div className="flex justify-between p-3 bg-slate-700 text-white font-bold text-base"><span>TOTAL DUE</span><span>R {total.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-8 print:hidden">
             <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 mb-6 rounded-r-md" role="alert">
                <p className="font-bold text-lg">Financial Summary</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between"><span>Invoice Total:</span> <span>R {total.toFixed(2)}</span></div>
                  <div className="flex justify-between text-green-700"><span>Amount Paid:</span> <span>- R {amountPaid.toFixed(2)}</span></div>
                  <div className="flex justify-between text-lg font-semibold pt-1 mt-1 border-t border-blue-200"><span>Balance Due:</span> <span>R {balanceDue.toFixed(2)}</span></div>
                </div>
            </div>

            <h3 className="text-xl font-semibold text-text-primary mb-4 border-b pb-2">Payment Management</h3>
            
            <div className="mb-6">
                <h4 className="font-semibold mb-2 text-text-secondary">Payment History for this Invoice</h4>
                {invoicePaymentAllocations.length > 0 ? (
                    <div className="overflow-x-auto border rounded-md">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-3 font-semibold text-sm">Date</th>
                                    <th className="p-3 font-semibold text-sm">Method</th>
                                    <th className="p-3 font-semibold text-sm">Reference</th>
                                    <th className="p-3 font-semibold text-sm text-right">Amount Allocated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoicePaymentAllocations.map(p => (
                                    <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                                        <td className="p-3">{p.date}</td>
                                        <td className="p-3">{p.method}</td>
                                        <td className="p-3">{p.reference || 'N/A'}</td>
                                        <td className="p-3 text-right">R {p.allocationAmount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-text-secondary italic bg-slate-50 p-4 rounded-md">No payments recorded for this invoice yet.</p>
                )}
            </div>

            {invoice.status !== DocumentStatus.PAID && (
                 <button onClick={() => navigate('/payments/record', { state: { invoiceId: invoice.id }})} className="flex items-center justify-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors w-full md:w-auto">
                    <CashIcon /> <span className="ml-2">Record Payment</span>
                </button>
            )}
        </div>
    </div>
  );
};