
import React, { useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// FIX: Removed unused and non-existent 'LineItemPriority' type from import.
import { Invoice, Customer, CustomerType, Address, Payment, DocumentStatus, PaymentMethod } from '../types';
import { VAT_RATE } from '../constants';
import { DownloadIcon, CheckCircleIcon, UsersIcon, PencilIcon, MailIcon, EyeIcon } from './Icons';
import { formatDistanceToNow } from '../utils';
import { useToast } from '../contexts/ToastContext';

// Declare global libraries loaded from CDN
declare const html2canvas: any;
declare const jspdf: any;

interface InvoiceViewerProps {
    invoice: Invoice;
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    payments: Payment[];
    setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
    customers: Customer[];
}

const getPrimaryAddress = (customer: Customer | null | undefined): Address | undefined => {
    if (!customer) return undefined;
    // B2B primary is billing, B2C is any primary
    return customer.addresses.find(a => a.type === 'billing' && a.isPrimary) || customer.addresses.find(a => a.isPrimary);
}

const formatCurrency = (amount: number) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ invoice, invoices, setInvoices, payments, setPayments, customers }) => {
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const selectedCustomer = useMemo(() => customers.find(c => c.id === invoice.customerId) || null, [invoice.customerId, customers]);
  const isBilledToParent = selectedCustomer?.billToParent && selectedCustomer.parentCompanyId;
  const billToCustomer = isBilledToParent ? customers.find(c => c.id === selectedCustomer.parentCompanyId) : selectedCustomer;

  const billingAddress = useMemo(() => getPrimaryAddress(billToCustomer), [billToCustomer]);
  
  const invoicePaymentAllocations = useMemo(() => {
    return payments
      .flatMap(p => p.allocations.map(a => ({ ...p, allocationAmount: a.amount, invoiceId: a.invoiceId })))
      .filter(pa => pa.invoiceId === invoice.id);
  }, [payments, invoice.id]);

  const subtotal = useMemo(() => invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [invoice.items]);
  const vatAmount = subtotal * VAT_RATE;
  const total = subtotal + vatAmount;
  const amountPaid = useMemo(() => invoicePaymentAllocations.reduce((sum, p) => sum + p.allocationAmount, 0), [invoicePaymentAllocations]);
  
  const generatePdf = async () => {
    const input = invoiceRef.current;
    if (!input) return null;

    addToast("Generating PDF...", "info");
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
    return pdf;
  };
  
  const handleDownload = async () => {
    const pdf = await generatePdf();
    if (pdf) {
      pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
    } else {
        addToast("Failed to generate PDF.", "error");
    }
  };

  const getStatusInfo = (status: DocumentStatus): { text: string; className: string } => {
    switch (status) {
        case DocumentStatus.PAID: return { text: 'Paid', className: 'bg-green-100 text-green-700' };
        case DocumentStatus.PARTIALLY_PAID: return { text: 'Partially Paid', className: 'bg-orange-100 text-orange-700' };
        default: return { text: 'Due', className: 'bg-yellow-100 text-yellow-800' };
    }
  };

  const statusInfo = getStatusInfo(invoice.status);

  const activityFeed = useMemo(() => {
      let feed = [
          { icon: <PencilIcon />, user: 'System', text: 'created the invoice.', date: invoice.date },
          { icon: <MailIcon />, user: 'System', text: 'sent the invoice.', date: invoice.date },
      ];
      if (invoice.status === DocumentStatus.PAID || invoice.status === DocumentStatus.PARTIALLY_PAID) {
        const latestPayment = invoicePaymentAllocations.sort((a,b) => b.date.localeCompare(a.date))[0];
        if(latestPayment) {
            feed.push({ icon: <EyeIcon />, user: selectedCustomer?.name || 'Customer', text: 'viewed the invoice.', date: latestPayment.date })
            feed.push({ icon: <CheckCircleIcon />, user: selectedCustomer?.name || 'Customer', text: 'paid the invoice.', date: latestPayment.date })
        }
      }
      return feed.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoice, invoicePaymentAllocations, selectedCustomer]);

  if (!invoice || !selectedCustomer) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Invoice */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm" ref={invoiceRef}>
            <div className="p-8 sm:p-10">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-slate-500">Issued on {new Date(invoice.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-sm text-slate-500">Due on {new Date(invoice.dueDate!).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Invoice</h1>
                </div>
                
                <div className="mt-8 grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                     <div>
                        <p className="text-sm font-semibold text-slate-800">From</p>
                        <p className="mt-2 text-sm text-slate-600">Snowva™ Trading Pty Ltd</p>
                        <p className="text-sm text-slate-600">67 Wildevy Street, Lynnwood Manor</p>
                        <p className="text-sm text-slate-600">Pretoria, 0081</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800">To</p>
                        <p className="mt-2 text-sm text-slate-600 font-medium">{billToCustomer?.name}</p>
                        {billingAddress && (
                           <p className="text-sm text-slate-600">{billingAddress.addressLine1}, {billingAddress.city}</p>
                        )}
                    </div>
                </div>

                <div className="mt-10">
                    <div className="flow-root">
                        <div className="-mx-4 -my-2 sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle">
                                <table className="min-w-full">
                                    <thead className="text-sm font-semibold text-slate-900 border-b border-slate-200">
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left sm:pl-6 lg:pl-8">Projects</th>
                                            <th scope="col" className="py-3.5 px-3 text-right">Hours</th>
                                            <th scope="col" className="py-3.5 px-3 text-right">Rate</th>
                                            <th scope="col" className="py-3.5 pl-3 pr-4 text-right sm:pr-6 lg:pr-8">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {invoice.items.map(item => (
                                            <tr key={item.id}>
                                                <td className="py-4 pl-4 pr-3 text-sm sm:pl-6 lg:pl-8">
                                                    <p className="font-medium text-slate-900">{item.description}</p>
                                                    <p className="text-slate-500">Item description for product.</p>
                                                </td>
                                                <td className="px-3 py-4 text-sm text-slate-500 text-right">{item.quantity.toFixed(1)}</td>
                                                <td className="px-3 py-4 text-sm text-slate-500 text-right">R {formatCurrency(item.unitPrice)}</td>
                                                <td className="py-4 pl-3 pr-4 text-sm font-medium text-slate-800 text-right sm:pr-6 lg:pr-8">R {formatCurrency(item.quantity * item.unitPrice)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end border-t border-slate-100 pt-8">
                    <div className="w-full max-w-sm text-sm text-slate-600">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>R {formatCurrency(subtotal)}</span>
                        </div>
                        <div className="mt-2 flex justify-between">
                            <span>Tax ({(VAT_RATE * 100).toFixed(0)}%)</span>
                            <span>R {formatCurrency(vatAmount)}</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between font-semibold text-slate-900">
                            <span>Total</span>
                            <span>R {formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-slate-800">Amount</p>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}>{statusInfo.text}</span>
                </div>
                <p className="mt-1 text-3xl font-bold text-slate-900">R {formatCurrency(total)}</p>
                
                <div className="mt-6 space-y-3 text-sm border-t border-slate-100 pt-4">
                    <div className="flex items-center gap-3">
                        <UsersIcon className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-600 font-medium">{billToCustomer?.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircleIcon className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-600">Paid with EFT</span>
                    </div>
                </div>

                <button onClick={handleDownload} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-100 transition-colors">
                    <DownloadIcon className="w-4 h-4" />
                    Download receipt
                </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Activity</h3>
                <ul className="space-y-6">
                    {activityFeed.map((item, index) => (
                        <li key={index} className="relative flex gap-x-4">
                            <div className={`absolute left-0 top-0 flex w-6 justify-center ${index === activityFeed.length - 1 ? '' : '-bottom-6'}`}>
                                <div className="w-px bg-slate-200"></div>
                            </div>
                            <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-100 ring-1 ring-slate-300"></div>
                            </div>
                            <p className="flex-auto py-0.5 text-xs leading-5 text-slate-500">
                                <span className="font-medium text-slate-900">{item.user}</span> {item.text}
                            </p>
                            <time dateTime={item.date} className="flex-none py-0.5 text-xs leading-5 text-slate-500">
                                {formatDistanceToNow(item.date)}
                            </time>
                        </li>
                    ))}
                </ul>
                <div className="mt-6">
                    <div className="relative">
                        <textarea rows={3} placeholder="Add your comment..." className="block w-full rounded-lg border-0 bg-slate-50 py-2.5 pr-10 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"></textarea>
                         <div className="absolute bottom-2 right-2 flex gap-2">
                            <button className="text-slate-400 hover:text-indigo-600"><PencilIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    <div className="flex justify-end pt-3">
                        <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Comment</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
