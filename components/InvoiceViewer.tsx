
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Invoice, Customer, DocumentStatus, Payment } from '../types';
import { VAT_RATE } from '../constants';
import { DownloadIcon, CheckCircleIcon, UsersIcon, PencilIcon, MailIcon, EyeIcon, PrintIcon, CashIcon } from './Icons';
import { formatDistanceToNow } from '../utils';
import { useToast } from '../contexts/ToastContext';

// Declare global libraries loaded from CDN
declare const html2canvas: any;
declare const jspdf: any;

interface InvoiceTemplateProps {
    invoice: Invoice;
    customer: Customer | null;
    billToCustomer: Customer | null;
    subtotal: number;
    vatAmount: number;
    total: number;
}

const formatCurrencyTemplate = (amount: number) => {
    return `R ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
};

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, billToCustomer, subtotal, vatAmount, total }) => {
    const billToAddress = billToCustomer?.addresses.find(a => a.isPrimary) || billToCustomer?.addresses[0];

    return (
        <div className="bg-white text-slate-800 p-10 font-sans w-[210mm] min-h-[297mm]">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <p className="text-sm text-slate-600">Issued on {new Date(invoice.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    {invoice.dueDate && <p className="text-sm text-slate-600">Due on {new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>}
                </div>
                <h1 className="text-3xl font-bold">Invoice</h1>
            </div>

            <div className="border-t border-slate-200 pt-8 mb-10">
                <div className="flex justify-between">
                    <div className="text-sm">
                        <p className="font-bold mb-1">From</p>
                        <p>Snowva™ Trading Pty Ltd</p>
                        <p>67 Wildevy Street, Lynnwood Manor</p>
                        <p>Pretoria, 0081</p>
                    </div>
                    <div className="text-sm text-right">
                        <p className="font-bold mb-1">To</p>
                        <p>{billToCustomer?.name}</p>
                        {billToAddress && (
                            <>
                                <p>{billToAddress.addressLine1}</p>
                                <p>{billToAddress.city}, {billToAddress.postalCode}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-300 text-slate-500">
                        <th className="text-left font-semibold py-3 pr-3">Projects</th>
                        <th className="text-right font-semibold py-3 px-3 w-24">Hours</th>
                        <th className="text-right font-semibold py-3 px-3 w-32">Rate</th>
                        <th className="text-right font-semibold py-3 pl-3 w-32">Price</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map(item => (
                        <tr key={item.id} className="border-b border-slate-100">
                            <td className="py-4 pr-3">
                                <p className="font-medium text-slate-900">{item.description}</p>
                                <p className="text-slate-600">Item description for product.</p>
                            </td>
                            <td className="text-right px-3">{item.quantity.toFixed(1)}</td>
                            <td className="text-right px-3">{formatCurrencyTemplate(item.unitPrice)}</td>
                            <td className="text-right pl-3 font-medium text-slate-900">{formatCurrencyTemplate(item.quantity * item.unitPrice)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mt-8">
                <div className="w-full max-w-xs text-sm">
                    <div className="flex justify-between text-slate-600 py-2">
                        <span>Subtotal</span>
                        <span>{formatCurrencyTemplate(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 py-2">
                        <span>Tax (15%)</span>
                        <span>{formatCurrencyTemplate(vatAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 py-2 mt-2 border-t-2 border-slate-300">
                        <span>Total</span>
                        <span>{formatCurrencyTemplate(total)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


interface InvoiceViewerProps {
    invoice: Invoice;
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    payments: Payment[];
    setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
    customers: Customer[];
}

const getPrimaryAddress = (customer: Customer | null | undefined) => {
    if (!customer) return undefined;
    // B2B primary is billing, B2C is any primary
    return customer.addresses.find(a => a.type === 'billing' && a.isPrimary) || customer.addresses.find(a => a.isPrimary);
}

const formatCurrency = (amount: number) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({ invoice, invoices, setInvoices, payments, setPayments, customers }) => {
  const navigate = useNavigate();
  const invoiceTemplateContainerRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

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
  
  const generatePdf = async (options: { autoPrint?: boolean } = {}) => {
    const input = invoiceTemplateContainerRef.current;
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
    
    if (options.autoPrint) {
        pdf.autoPrint();
    }
    
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

  const handlePrint = async () => {
    try {
        const pdf = await generatePdf({ autoPrint: true });
        if (!pdf) {
            addToast("Failed to generate the invoice PDF.", "error");
            return;
        }
        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.print();
                 setTimeout(() => {
                    document.body.removeChild(iframe);
                    URL.revokeObjectURL(url);
                }, 100);
            }, 1);
        };
    } catch (error) {
        console.error("Error during print preparation:", error);
        addToast("An error occurred while preparing the document for printing.", "error");
    }
  };
  
  const handleEmailButtonClick = () => {
    if (!billToCustomer || !billToCustomer.contactEmail) {
        addToast("This customer does not have an email address on file.", "error");
        return;
    }
    setIsEmailModalOpen(true);
  };
  
  const handleProceedWithEmail = () => {
      if (!billToCustomer || !billToCustomer.contactEmail) return;

      const subject = `Invoice ${invoice.invoiceNumber} from Snowva™ Trading Pty Ltd`;
      const body = `Dear ${billToCustomer.contactPerson || billToCustomer.name},\n\nPlease find your invoice attached.\n\nTotal Amount: R ${total.toFixed(2)}\nDue Date: ${invoice.dueDate}\n\nTo view your invoice, please download the attached PDF.\n\nKind regards,\nThe Snowva™ Team`;
      const mailtoLink = `mailto:${billToCustomer.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      try {
          window.location.href = mailtoLink;
      } catch (error) {
          addToast("Could not open email client.", "error");
          console.error("Mailto link error:", error);
      }

      setIsEmailModalOpen(false);
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
    const feed: {
        icon: React.ReactElement;
        user: string;
        text: string;
        date: string;
        details?: string;
    }[] = [];

    // Invoice creation
    feed.push({
        icon: <PencilIcon className="h-4 w-4 text-slate-500" />,
        user: 'System',
        text: 'created this invoice.',
        date: invoice.date,
        details: `Total: R ${formatCurrency(total)}`,
    });

    // Add a sent event, maybe a bit after creation.
    const sentDate = new Date(invoice.date);
    sentDate.setHours(sentDate.getHours() + 1); // 1 hour after creation
    feed.push({
        icon: <MailIcon className="h-4 w-4 text-slate-500" />,
        user: 'System',
        text: 'sent the invoice to the customer.',
        date: sentDate.toISOString(),
        details: `To: ${billToCustomer?.contactEmail || 'N/A'}`,
    });

    // Each payment allocation is an event
    invoicePaymentAllocations
        .sort((a, b) => a.date.localeCompare(b.date)) // sort payments chronologically
        .forEach(payment => {
            // A simulated "view" event before payment
            const viewDate = new Date(payment.date);
            viewDate.setMinutes(viewDate.getMinutes() - 10); // 10 minutes before payment
            feed.push({
                icon: <EyeIcon className="h-4 w-4 text-slate-500" />,
                user: selectedCustomer?.name || 'Customer',
                text: 'viewed the invoice.',
                date: viewDate.toISOString(),
            });

            feed.push({
                icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
                user: 'System', // Payments are recorded by the system user
                text: `recorded a payment.`,
                date: payment.date,
                details: `R ${formatCurrency(payment.allocationAmount)} via ${payment.method}`,
            });
        });

    // Sort everything by date, descending (most recent first)
    return feed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

}, [invoice, total, invoicePaymentAllocations, selectedCustomer, billToCustomer]);

  if (!invoice || !selectedCustomer) return <div>Loading...</div>;

  return (
    <>
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-200 pb-4 print:hidden">
            <div>
                <h2 className="text-2xl font-semibold leading-6 text-slate-900">Invoice {invoice.invoiceNumber}</h2>
                <p className="mt-1 text-sm text-slate-600">for <span className="font-medium text-indigo-600">{billToCustomer?.name}</span></p>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-4 sm:mt-0">
                {invoice.status !== DocumentStatus.PAID && (
                    <button
                        onClick={() => navigate('/payments/record', { state: { invoiceId: invoice.id } })}
                        className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        <CashIcon className="w-5 h-5"/> <span>Record Payment</span>
                    </button>
                )}
                <button onClick={handleDownload} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                    <DownloadIcon className="w-5 h-5"/> <span>Download</span>
                </button>
                <button onClick={handlePrint} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                    <PrintIcon className="w-5 h-5"/> <span>Print</span>
                </button>
                <button onClick={handleEmailButtonClick} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                    <MailIcon className="w-5 h-5"/> <span>Email</span>
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left Column: Invoice UI */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
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
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 mb-4">Activity</h3>
                    <ul className="space-y-6">
                        {activityFeed.map((item, index) => (
                            <li key={index} className="relative flex gap-x-4">
                                {/* Vertical line connecting the dots */}
                                {index < activityFeed.length - 1 && (
                                    <div className="absolute left-3 top-6 -bottom-6 w-px bg-slate-200" aria-hidden="true" />
                                )}

                                {/* Icon */}
                                <div className="relative flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                                    {item.icon}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-auto pt-0.5">
                                    <div className="flex justify-between gap-x-4">
                                        <p className="text-sm leading-5 text-slate-600">
                                            <span className="font-medium text-slate-900">{item.user}</span> {item.text}
                                        </p>
                                        <time dateTime={item.date} className="flex-none text-xs leading-5 text-slate-500" title={new Date(item.date).toLocaleString()}>
                                            {formatDistanceToNow(item.date)}
                                        </time>
                                    </div>
                                    {item.details && <p className="text-xs text-slate-500 mt-1">{item.details}</p>}
                                </div>
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
        {isEmailModalOpen && billToCustomer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                    <h3 className="text-lg font-bold mb-2 text-slate-900">Confirm Email</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        This will open your default email client. First, use the 'Download' button to save the PDF, then attach it to the email.
                    </p>
                    <p className="text-sm text-slate-600 mb-4">
                        Recipient: <span className="font-semibold text-indigo-600">{billToCustomer.contactEmail}</span>
                    </p>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button onClick={() => setIsEmailModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
                        <button onClick={handleProceedWithEmail} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Proceed</button>
                    </div>
                </div>
            </div>
        )}
    </div>

    {/* Hidden container for PDF generation */}
    <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
        <div ref={invoiceTemplateContainerRef}>
            <InvoiceTemplate
                invoice={invoice}
                customer={selectedCustomer}
                billToCustomer={billToCustomer}
                subtotal={subtotal}
                vatAmount={vatAmount}
                total={total}
            />
        </div>
    </div>
    </>
  );
};
