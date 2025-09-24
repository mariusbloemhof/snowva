import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { Invoice, Customer, DocumentStatus, Payment, AppContextType } from '../types';
import { VAT_RATE, SNOWVA_DETAILS } from '../constants';
import { DownloadIcon, CheckCircleIcon, UsersIcon, PencilIcon, MailIcon, EyeIcon, PrintIcon, CashIcon } from './Icons';
import { formatDistanceToNow } from '../utils';
import { useToast } from '../contexts/ToastContext';

// Declare global libraries loaded from CDN
declare const jspdf: any;

const getPrimaryAddress = (customer: Customer | null | undefined) => {
    if (!customer) return undefined;
    // B2B primary is billing, B2C is any primary
    return customer.addresses.find(a => a.type === 'billing' && a.isPrimary) || customer.addresses.find(a => a.isPrimary);
}

const formatCurrency = (amount: number) => {
    // This function adds spaces as thousand separators
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const InvoiceViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { invoices, payments, customers } = useOutletContext<AppContextType>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const invoice = useMemo(() => invoices.find(inv => inv.id === id), [id, invoices]);

  const selectedCustomer = useMemo(() => customers.find(c => c.id === invoice?.customerId) || null, [invoice, customers]);
  const isBilledToParent = selectedCustomer?.billToParent && selectedCustomer.parentCompanyId;
  const billToCustomer = isBilledToParent ? customers.find(c => c.id === selectedCustomer.parentCompanyId) : selectedCustomer;

  const billingAddress = useMemo(() => getPrimaryAddress(billToCustomer), [billToCustomer]);
  
  const invoicePaymentAllocations = useMemo(() => {
    if (!invoice) return [];
    return payments
      .flatMap(p => p.allocations.map(a => ({ ...p, allocationAmount: a.amount, invoiceId: a.invoiceId })))
      .filter(pa => pa.invoiceId === invoice.id);
  }, [payments, invoice]);

  const subtotal = useMemo(() => {
    const itemsTotal = invoice?.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0;
    const shippingCost = invoice?.shipping || 0;
    return itemsTotal + shippingCost;
  }, [invoice]);
  const vatAmount = subtotal * VAT_RATE;
  const total = subtotal + vatAmount;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const userTimezoneOffset = d.getTimezoneOffset() * 60000;
    const correctedDate = new Date(d.getTime() + userTimezoneOffset);
    return correctedDate.toLocaleDateString('en-ZA').replace(/-/g, '/'); // YYYY/MM/DD
  };
  
 const generatePdf = async () => {
    if (!invoice) return null;
    addToast("Generating PDF...", "info");
    const { jsPDF } = jspdf;
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // --- HEADER ---
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text(SNOWVA_DETAILS.name, margin, 20);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(SNOWVA_DETAILS.regNo, margin, 25);
    pdf.text(SNOWVA_DETAILS.address[0], margin, 30);
    pdf.text(SNOWVA_DETAILS.address[1], margin, 34);
    pdf.text(SNOWVA_DETAILS.address[2], margin, 38);

    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text("TAX INVOICE", pageWidth - margin, 25, { align: "right" });

    // Header Details Table (right side)
    const headerDetailsX = pageWidth - margin - 65;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("Date:", headerDetailsX, 38);
    pdf.text("Invoice #:", headerDetailsX, 43);
    pdf.text("For:", headerDetailsX, 48);

    pdf.text(formatDate(invoice.date), headerDetailsX + 20, 38);
    pdf.text(invoice.invoiceNumber, headerDetailsX + 20, 43);
    pdf.text(selectedCustomer?.name || '', headerDetailsX + 20, 48);

    // --- BILLING INFO ---
    let yPos = 68; 

    pdf.text(`VAT #: ${SNOWVA_DETAILS.vatNo}`, margin, yPos);

    const billToX = pageWidth / 2 - 10;
    pdf.setFont("helvetica", "bold");
    pdf.text("Bill To:", billToX, yPos);
    
    pdf.setFont("helvetica", "normal");
    const billToAddressLines = [
        billToCustomer?.legalEntityName || billToCustomer?.name,
        billingAddress?.addressLine1,
        billingAddress?.addressLine2,
        billingAddress?.suburb,
        `${billingAddress?.city || ''} ${billingAddress?.postalCode || ''}`.trim(),
        `${billingAddress?.province || ''}`.trim(),
        billingAddress?.country
    ].filter(line => line && line.trim()).map(line => line!.trim());

    pdf.text(billToAddressLines, billToX + 20, yPos);
    
    // Dynamically calculate y position after address block
    const addressBlockHeight = billToAddressLines.length * 4;
    yPos += addressBlockHeight + 10;
    
    if (billToCustomer?.vatNumber) {
        pdf.setFont("helvetica", "normal");
        pdf.text("VAT #:", billToX, yPos);
        pdf.text(billToCustomer.vatNumber, billToX + 20, yPos);
        yPos += 5;
    }
     if (invoice.orderNumber) {
        pdf.setFont("helvetica", "normal");
        pdf.text("Order #:", billToX, yPos);
        pdf.text(invoice.orderNumber, billToX + 20, yPos);
        yPos += 5;
    }

    // --- TABLE ---
    const tableStartY = yPos + 10;
    const tableBody = invoice.items.map(item => [
        item.description,
        item.itemCode,
        item.quantity,
        'R',
        formatCurrency(item.unitPrice),
        'R',
        formatCurrency(item.quantity * item.unitPrice)
    ]);
    
    // Add Delivery Fee if it exists
    if (invoice.shipping && invoice.shipping > 0) {
        tableBody.push([
            'Shipping',
            '',
            1,
            'R',
            formatCurrency(invoice.shipping),
            'R',
            formatCurrency(invoice.shipping)
        ]);
    }


    (pdf as any).autoTable({
        startY: tableStartY,
        head: [['Description', 'Item Code', 'Qty', { content: 'Unit Price', colSpan: 2 }, { content: 'Total (Excl VAT)', colSpan: 2 }]],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [220, 220, 220], // Light Grey
            textColor: [50, 50, 50], // Dark Grey Text
            fontStyle: 'normal'
        },
        columnStyles: {
            0: { cellWidth: 60 }, // Description
            2: { halign: 'right' }, // Qty
            3: { cellWidth: 5, halign: 'left' }, // Currency Symbol (Unit Price)
            4: { halign: 'right' }, // Value (Unit Price)
            5: { cellWidth: 5, halign: 'left' }, // Currency Symbol (Total)
            6: { halign: 'right' }, // Value (Total)
        },
        margin: { left: margin, right: margin }
    });

    // --- TOTALS & FOOTER ---
    const finalY = (pdf as any).autoTable.previous.finalY;
    let footerY = finalY + 15;
    if (footerY > 250) { // Add new page if content is too low
        pdf.addPage();
        footerY = 30;
    }

    // Banking Details
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Banking details:", margin, footerY);

    pdf.setFont("helvetica", "normal");
    pdf.text(SNOWVA_DETAILS.name, margin, footerY + 5);
    pdf.text(SNOWVA_DETAILS.banking.bankName, margin, footerY + 10);
    pdf.text(`Branch code ${SNOWVA_DETAILS.banking.branchCode}`, margin, footerY + 15);
    pdf.text(`Account number ${SNOWVA_DETAILS.banking.accountNumber}`, margin, footerY + 20);

    // Totals on the right
    const totalsLabelX = pageWidth / 2 + 15;
    const totalsValueX = pageWidth - margin;
    const currencySymbolX = totalsValueX - 35;
    
    pdf.setLineWidth(0.2);
    pdf.line(totalsLabelX - 5, footerY - 2, totalsValueX, footerY - 2); 

    pdf.text("SUBTOTAL", totalsLabelX, footerY);
    pdf.text(`R`, currencySymbolX, footerY);
    pdf.text(formatCurrency(subtotal), totalsValueX, footerY, { align: 'right' });

    pdf.text("VAT Rate", totalsLabelX, footerY + 5);
    pdf.text(`${(VAT_RATE * 100).toFixed(0)}%`, totalsValueX, footerY + 5, { align: 'right' });

    pdf.line(totalsLabelX - 5, footerY + 7, totalsValueX, footerY + 7);

    pdf.text("Vat Amount", totalsLabelX, footerY + 10);
    pdf.text(`R`, currencySymbolX, footerY + 10);
    pdf.text(formatCurrency(vatAmount), totalsValueX, footerY + 10, { align: 'right' });
    
    pdf.setFont("helvetica", "bold");
    pdf.text("TOTAL", totalsLabelX, footerY + 18);
    pdf.text(`R`, currencySymbolX, footerY + 18);
    pdf.text(formatCurrency(total), totalsValueX, footerY + 18, { align: 'right' });
    
    pdf.setLineWidth(0.8);
    pdf.line(totalsLabelX - 5, footerY + 20, totalsValueX, footerY + 20);
    
    return pdf;
  };
  
  const handleDownload = async () => {
    const pdf = await generatePdf();
    if (pdf) {
      pdf.save(`Invoice-${invoice?.invoiceNumber}.pdf`);
    } else {
        addToast("Failed to generate PDF.", "error");
    }
  };

  const handlePrint = async () => {
    try {
        const pdf = await generatePdf();
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
    if (!billToCustomer || !billToCustomer.contactEmail) {
        addToast("This customer does not have an email address on file.", "error");
        return;
    }
    setIsEmailModalOpen(true);
  };
  
  const handleProceedWithEmail = () => {
      if (!billToCustomer || !billToCustomer.contactEmail || !invoice) return;

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

  const activityFeed = useMemo(() => {
    if (!invoice) return [];
    
    // Base events
    const createdEvent = {
        icon: <PencilIcon className="h-4 w-4 text-slate-500" />,
        user: 'System',
        text: 'created this invoice.',
        date: invoice.date,
        details: `Total: R ${formatCurrency(total)}`,
    };

    const sentDate = new Date(invoice.date);
    sentDate.setHours(sentDate.getHours() + 1); // 1 hour after creation
    const sentEvent = {
        icon: <MailIcon className="h-4 w-4 text-slate-500" />,
        user: 'System',
        text: 'sent the invoice to the customer.',
        date: sentDate.toISOString(),
        details: `To: ${billToCustomer?.contactEmail || 'N/A'}`,
    };

    const paymentEvents = invoicePaymentAllocations.flatMap(payment => {
        const viewDate = new Date(payment.date);
        viewDate.setMinutes(viewDate.getMinutes() - 10);
        return [
            {
                icon: <EyeIcon className="h-4 w-4 text-slate-500" />,
                user: selectedCustomer?.name || 'Customer',
                text: 'viewed the invoice.',
                date: viewDate.toISOString(),
            },
            {
                icon: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
                user: 'System',
                text: `recorded a payment.`,
                date: payment.date,
                details: `R ${formatCurrency(payment.allocationAmount)} via ${payment.method}`,
            }
        ];
    });

    const allEvents = [createdEvent, sentEvent, ...paymentEvents];

    return allEvents
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(item => ({ ...item, timeAgo: formatDistanceToNow(item.date) }));

}, [invoice, total, invoicePaymentAllocations, selectedCustomer, billToCustomer]);

  if (!invoice || !selectedCustomer) return <div>Loading...</div>;

  const statusInfo = getStatusInfo(invoice.status);

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
                            <p className="text-sm text-slate-500">
                                {invoice.dueDate
                                    ? `Due on ${new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                                    : 'No due date specified'
                                }
                            </p>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">Invoice</h1>
                    </div>
                    
                    <div className="mt-8 grid grid-cols-2 gap-8 border-t border-slate-100 pt-8">
                         <div>
                            <p className="text-sm font-semibold text-slate-800">From</p>
                            <p className="mt-2 text-sm text-slate-600">{SNOWVA_DETAILS.name}</p>
                            {SNOWVA_DETAILS.address.map(line => <p className="text-sm text-slate-600" key={line}>{line}</p>)}
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
                                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left sm:pl-6 lg:pl-8">Description</th>
                                                <th scope="col" className="py-3.5 px-3 text-left">Item Code</th>
                                                <th scope="col" className="py-3.5 px-3 text-right">Qty</th>
                                                <th scope="col" className="py-3.5 pl-3 pr-4 text-right sm:pr-6 lg:pr-8">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {invoice.items.map(item => (
                                                <tr key={item.id}>
                                                    <td className="py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-6 lg:pl-8">
                                                        {item.description}
                                                    </td>
                                                    <td className="px-3 py-4 text-sm text-slate-500">{item.itemCode}</td>
                                                    <td className="px-3 py-4 text-sm text-slate-500 text-right">{item.quantity.toFixed(1)}</td>
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
                                <span>Items Total</span>
                                <span>R {formatCurrency(subtotal - (invoice.shipping || 0))}</span>
                            </div>
                            {invoice.shipping && invoice.shipping > 0 && (
                                <div className="mt-2 flex justify-between">
                                    <span>Shipping</span>
                                    <span>R {formatCurrency(invoice.shipping)}</span>
                                </div>
                            )}
                            <div className="mt-2 flex justify-between pt-2 border-t border-slate-200">
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
                                            {item.timeAgo}
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
    </>
  );
};