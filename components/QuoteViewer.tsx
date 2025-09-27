import React, { useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { SNOWVA_DETAILS, VAT_RATE } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { Address, AppContextType, Customer, DocumentStatus } from '../types';
import { dateUtils, formatDistanceToNow } from '../utils';
import { ArrowLeftIcon, CheckCircleIcon, DownloadIcon, MailIcon, PrintIcon, SwitchHorizontalIcon, UsersIcon, XCircleIcon } from './Icons';

// Declare global libraries loaded from CDN
declare const jspdf: any;

const getBillingAddress = (customer: Customer | null): Address | undefined => {
    if (!customer || !Array.isArray(customer.addresses)) return undefined;
    return customer.addresses.find(a => a.type === 'billing' && a.isPrimary) || customer.addresses.find(a => a.isPrimary);
}

const formatCurrency = (amount: number) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const QuoteViewer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { quotes, customers, setQuotes } = useOutletContext<AppContextType>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    
    const quote = useMemo(() => quotes.find(q => q.id === id), [id, quotes]);
    const selectedCustomer = useMemo(() => customers.find(c => c.id === quote?.customerId) || null, [quote, customers]);
    const billingAddress = useMemo(() => getBillingAddress(selectedCustomer), [selectedCustomer]);

    const subtotal = useMemo(() => {
        const itemsTotal = quote?.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
        const shippingCost = quote?.shipping || 0;
        return itemsTotal + shippingCost;
    }, [quote]);
    const vatAmount = subtotal * VAT_RATE;
    const total = subtotal + vatAmount;

    const handleConvertToInvoice = () => {
        if (quote) {
            navigate('/invoices/new', { state: { fromQuote: quote } });
        }
    };
    
    const generatePdf = async () => {
      if (!quote || !selectedCustomer) {
          addToast("Missing quote or customer data.", "error");
          return null;
      }

      addToast("Generating PDF...", "info");
      const { jsPDF } = jspdf;
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const margin = 15;

      // Header
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(SNOWVA_DETAILS.name, margin, 20);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(SNOWVA_DETAILS.address.join(', '), margin, 26);
      
      pdf.setFontSize(28);
      pdf.setFont("helvetica", "light");
      pdf.text("QUOTE", 210 - margin, 25, { align: "right" });
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Date:", 150, 35);
      pdf.text("Quote #:", 150, 40);
      pdf.text("Valid Until:", 150, 45);
      pdf.setFont("helvetica", "normal");
      pdf.text(quote.date.toDate().toLocaleDateString('en-ZA'), 175, 35);
      pdf.text(quote.quoteNumber, 175, 40);
      pdf.text(quote.validUntil.toDate().toLocaleDateString('en-ZA'), 175, 45);

      // Billing info
      pdf.text(`VAT #: ${SNOWVA_DETAILS.vatNo}`, margin, 55);

      const billToLines = [
        selectedCustomer.name,
        billingAddress?.addressLine1,
        billingAddress?.city,
      ].filter(Boolean);
      pdf.setFont("helvetica", "bold");
      pdf.text("Quote For:", 110, 55);
      pdf.setFont("helvetica", "normal");
      pdf.text(billToLines, 135, 55);

      // Table
      const hasItemCodes = quote.items.some(item => item.itemCode);
      const head = [['Description', ...(hasItemCodes ? ['Item Code'] : []), 'Qty', 'Unit Price', 'Total (Excl VAT)']];
      const body = quote.items.map(item => [
          item.description,
          ...(hasItemCodes ? [item.itemCode || ''] : []),
          item.quantity,
          `R ${item.unitPrice.toFixed(2)}`,
          `R ${(item.quantity * item.unitPrice).toFixed(2)}`
      ]);

      if (quote.shipping && quote.shipping > 0) {
        const shippingRow = [
            'Shipping',
            ...(hasItemCodes ? [''] : []),
            1,
            `R ${quote.shipping.toFixed(2)}`,
            `R ${quote.shipping.toFixed(2)}`
        ];
        body.push(shippingRow);
      }

      (pdf as any).autoTable({
          startY: 75,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: { fillColor: [51, 62, 72], textColor: 255, fontStyle: 'normal' },
          columnStyles: {
            [hasItemCodes ? 2 : 1]: { halign: 'right' },
            [hasItemCodes ? 3 : 2]: { halign: 'right' },
            [hasItemCodes ? 4 : 3]: { halign: 'right' },
          },
      });

      const finalY = (pdf as any).autoTable.previous.finalY;
      
      // Footer & Totals
      pdf.setFont("helvetica", "bold");
      pdf.text("Banking details:", margin, finalY + 15);
      pdf.setFont("helvetica", "normal");
      pdf.text(SNOWVA_DETAILS.banking.bankName, margin, finalY + 20);
      pdf.text(`Account number ${SNOWVA_DETAILS.banking.accountNumber}`, margin, finalY + 25);
      
      const totalsX = 130;
      pdf.text("SUBTOTAL", totalsX, finalY + 15);
      pdf.text(`R ${subtotal.toFixed(2)}`, 210 - margin, finalY + 15, { align: 'right' });
      
      pdf.text("VAT Amount", totalsX, finalY + 20);
      pdf.text(`R ${vatAmount.toFixed(2)}`, 210 - margin, finalY + 20, { align: 'right' });
      
      pdf.setFont("helvetica", "bold");
      pdf.text("TOTAL", totalsX, finalY + 25);
      pdf.text(`R ${total.toFixed(2)}`, 210 - margin, finalY + 25, { align: 'right' });
      pdf.setLineWidth(0.5);
      pdf.line(120, finalY + 27, 210 - margin, finalY + 27);

      return pdf;
    };
  
    const handleDownload = async () => {
        const pdf = await generatePdf();
        if (pdf) pdf.save(`Quote-${quote?.quoteNumber}.pdf`);
    };

    const handlePrint = async () => {
        try {
            const pdf = await generatePdf();
            if (!pdf) { return; }
            const blob = pdf.output('blob');
            const url = URL.createObjectURL(blob);
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = url;
            document.body.appendChild(iframe);
            iframe.onload = () => {
                setTimeout(() => {
                    if (iframe.contentWindow) {
                        iframe.contentWindow.print();
                        setTimeout(() => {
                            document.body.removeChild(iframe);
                            URL.revokeObjectURL(url);
                        }, 100);
                    }
                }, 1);
            };
        } catch (error) {
            console.error("Error during print preparation:", error);
            addToast("An error occurred while preparing the document for printing.", "error");
        }
    };
    
    const handleEmailButtonClick = () => {
        if (!selectedCustomer?.contactEmail) {
            addToast("Customer has no email address.", "error");
            return;
        }
        setIsEmailModalOpen(true);
    };
    
    const handleProceedWithEmail = () => {
        if (!selectedCustomer?.contactEmail) return;

        const subject = `Quote ${quote?.quoteNumber} from Snowva™`;
        const body = `Dear ${selectedCustomer.name},\n\nPlease find your quote attached.\n\nKind regards,\nThe Snowva Team`;
        window.location.href = `mailto:${selectedCustomer.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setIsEmailModalOpen(false);
    };

    const getStatusInfo = (status: DocumentStatus): { text: string; className: string } => {
        switch (status) {
            case DocumentStatus.ACCEPTED: return { text: 'Accepted', className: 'bg-green-100 text-green-700' };
            case DocumentStatus.REJECTED: return { text: 'Rejected', className: 'bg-red-100 text-red-700' };
            default: return { text: status, className: 'bg-slate-100 text-slate-700' };
        }
    };

    if (!quote || !selectedCustomer) return <div>Loading...</div>;

    const statusInfo = getStatusInfo(quote.status);

    const activityFeed = [
        {
// FIX: Conditionally render a status icon based on whether the quote was accepted or rejected.
            icon: quote.status === DocumentStatus.ACCEPTED
                ? <CheckCircleIcon className="h-4 w-4 text-green-500" />
                : quote.status === DocumentStatus.REJECTED
                ? <XCircleIcon className="h-4 w-4 text-red-500" />
                : <CheckCircleIcon className="h-4 w-4 text-slate-500" />,
            user: 'System',
            text: `finalized this quote as ${quote.status}.`,
            date: quote.date,
        },
        {
            icon: <UsersIcon className="h-4 w-4 text-slate-500" />,
            user: 'System',
            text: 'created this quote.',
            date: quote.date,
        }
    ].map(item => ({...item, timeAgo: formatDistanceToNow(item.date.toDate().toISOString())}));

    return (
        <>
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-200 pb-4 print:hidden">
                <div className="flex items-center gap-x-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center rounded-md p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-semibold leading-6 text-slate-900">Quote {quote.quoteNumber}</h2>
                        <p className="mt-1 text-sm text-slate-600">for <span className="font-medium text-indigo-600">{selectedCustomer.name}</span></p>
                    </div>
                </div>
                <div className="flex items-center justify-end space-x-3 mt-4 sm:mt-0">
                    {quote.status === DocumentStatus.ACCEPTED && (
                        <button type="button" onClick={handleConvertToInvoice} className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                            <SwitchHorizontalIcon className="w-5 h-5"/> <span>Convert to Invoice</span>
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
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 sm:p-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-1">SNOWVA<span className="text-sm align-top">™</span></h1>
                            <p className="text-sm text-slate-600">{SNOWVA_DETAILS.name}</p>
                            {SNOWVA_DETAILS.address.map(line => <p className="text-sm text-slate-600" key={line}>{line}</p>)}
                        </div>
                        <div className="text-left sm:text-right mt-4 sm:mt-0">
                            <h2 className="text-3xl font-light text-slate-600 uppercase tracking-wider">Quote</h2>
                            <div className="mt-2 text-sm space-y-2">
                                <p><span className="font-semibold text-slate-700">Quote #:</span> {quote.quoteNumber}</p>
                                <p><span className="font-semibold text-slate-700">Date:</span> {dateUtils.formatTimestamp(quote.date)}</p>
                                <p><span className="font-semibold text-slate-700">Valid Until:</span> {dateUtils.formatTimestamp(quote.validUntil)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8 p-4 border rounded-lg bg-slate-50">
                        <h3 className="font-semibold text-slate-800 mb-2">Quote For:</h3>
                        <div className="text-sm">
                            <p className="font-bold text-slate-900">{selectedCustomer?.name}</p>
                            {billingAddress && (
                                <div className="text-slate-600">
                                    <p>{billingAddress.addressLine1}</p>
                                    <p>{billingAddress.addressLine2}</p>
                                    <p>{billingAddress.city}, {billingAddress.postalCode}</p>
                                </div>
                            )}
                        </div>
                    </div>

                     <table className="table-base table-compact">
                        <thead>
                            <tr className="bg-slate-100 text-slate-800">
                                <th className="p-3 text-left font-semibold">Description</th>
                                <th className="p-3 text-right font-semibold w-24">Qty</th>
                                <th className="p-3 text-right font-semibold w-32">Unit Price</th>
                                <th className="p-3 text-right font-semibold w-32">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quote.items.map((item) => (
                                <tr key={item.id} className="border-b border-slate-200">
                                    <td className="p-3 align-top">{item.description}</td>
                                    <td className="p-3 text-right align-top">{item.quantity}</td>
                                    <td className="p-3 text-right align-top">R {item.unitPrice.toFixed(2)}</td>
                                    <td className="p-3 text-right align-top">R {(item.quantity * item.unitPrice).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-8 flex justify-end">
                        <div className="w-full max-w-sm space-y-2 text-sm">
                            <div className="flex justify-between"><span>Items Total</span><span className="font-medium text-slate-700">R {(subtotal - (quote.shipping || 0)).toFixed(2)}</span></div>
                            {quote.shipping && quote.shipping > 0 && (
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span className="font-medium text-slate-700">R {quote.shipping.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-slate-200"><span>Subtotal</span><span className="font-medium text-slate-700">R {subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>VAT ({(VAT_RATE * 100).toFixed(0)}%)</span><span className="font-medium text-slate-700">R {vatAmount.toFixed(2)}</span></div>
                            <div className="flex justify-between pt-2 mt-2 border-t border-slate-200 font-semibold text-base"><span>Total</span><span>R {total.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-semibold text-slate-800">Amount</p>
                            <span className={`status-badge ${statusInfo.className}`}>{statusInfo.text}</span>
                        </div>
                        <p className="mt-1 text-3xl font-bold text-slate-900">R {formatCurrency(total)}</p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-800 mb-4">Activity</h3>
                        <ul className="space-y-6">
                            {activityFeed.map((item, index) => (
                            <li key={index} className="relative flex gap-x-4">
                                {index < activityFeed.length - 1 && (
                                    <div className="absolute left-3 top-6 -bottom-6 w-px bg-slate-200" aria-hidden="true" />
                                )}
                                <div className="relative flex h-6 w-6 flex-none items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                                    {item.icon}
                                </div>
                                <div className="flex-auto pt-0.5">
                                    <div className="flex justify-between gap-x-4">
                                        <p className="text-sm leading-5 text-slate-600">
                                            <span className="font-medium text-slate-900">{item.user}</span> {item.text}
                                        </p>
                                        <time dateTime={item.date.toDate().toISOString()} className="flex-none text-xs leading-5 text-slate-500" title={item.date.toDate().toLocaleString()}>
                                            {item.timeAgo}
                                        </time>
                                    </div>
                                </div>
                            </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
         {isEmailModalOpen && selectedCustomer && (
            <div className="modal-backdrop">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                    <h3 className="text-lg font-bold mb-2 text-slate-900">Confirm Email</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        This will open your default email client. First, use the 'Download' button to save the PDF, then attach it to the email.
                    </p>
                    <p className="text-sm text-slate-600 mb-4">
                        Recipient: <span className="font-semibold text-indigo-600">{selectedCustomer.contactEmail}</span>
                    </p>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button onClick={() => setIsEmailModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
                        <button onClick={handleProceedWithEmail} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Proceed</button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};