import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useBlocker, useParams, useOutletContext } from 'react-router-dom';
import { Quote, Customer, Product, LineItem, DocumentStatus, Address, AppContextType } from '../types';
import { products as allProducts, VAT_RATE, SNOWVA_DETAILS } from '../constants';
import { TrashIcon, PlusIcon, MailIcon, CheckCircleIcon, PrintIcon, SwitchHorizontalIcon, DownloadIcon } from './Icons';
import { getResolvedProductDetails } from '../utils';
import { ProductSelector } from './ProductSelector';
import { useToast } from '../contexts/ToastContext';

// Declare global libraries loaded from CDN
declare const jspdf: any;

const getNextQuoteNumber = (currentQuotes: Quote[]) => {
    const lastNum = currentQuotes
        .map(q => parseInt(q.quoteNumber.split('-').pop() || '0', 10))
        .reduce((max, num) => Math.max(max, num), 0);
    return `Q-${new Date().getFullYear()}-${(lastNum + 1).toString().padStart(3, '0')}`;
};

const getBillingAddress = (customer: Customer | null): Address | undefined => {
    if (!customer) return undefined;
    return customer.addresses.find(a => a.type === 'billing' && a.isPrimary) || customer.addresses.find(a => a.isPrimary);
}

export const QuoteEditor: React.FC = () => {
  const { id: quoteId } = useParams<{ id: string }>();
  const { customers, quotes, setQuotes } = useOutletContext<AppContextType>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const initialState = React.useRef<string>('');
  const initialDataLoaded = React.useRef(false);
  const [showUnsavedChangesPrompt, setShowUnsavedChangesPrompt] = useState(false);
  
  // FIX: Defer navigation to a useEffect to prevent race condition with useBlocker
  interface NavOptions { path: string; options?: { state: any; replace?: boolean } }
  const [navigateTo, setNavigateTo] = useState<NavOptions | null>(null);
  useEffect(() => {
    // Only navigate after the component has re-rendered with isSaving = true.
    if (navigateTo && isSaving) {
        navigate(navigateTo.path, navigateTo.options);
    }
  }, [navigateTo, isSaving, navigate]);

  const isFinalized = useMemo(() => quote?.status !== DocumentStatus.DRAFT, [quote]);
  const billingAddress = useMemo(() => getBillingAddress(selectedCustomer), [selectedCustomer]);


  useEffect(() => {
    // Reset on ID change
    initialDataLoaded.current = false;
    setIsDirty(false);

    if (quoteId) {
      const foundQuote = quotes.find(q => q.id === quoteId);
      if (foundQuote) {
        setQuote(foundQuote);
        setSelectedCustomer(customers.find(c => c.id === foundQuote.customerId) || null);
      }
    } else {
      const newQuote = {
        id: `qt_${Date.now()}`,
        quoteNumber: `DRAFT-Q-${Date.now()}`,
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [],
        status: DocumentStatus.DRAFT
      };
      setQuote(newQuote);
      setSelectedCustomer(null);
    }
  }, [quoteId, customers, quotes]);

  useEffect(() => {
    if (quote && !initialDataLoaded.current) {
        initialState.current = JSON.stringify(quote);
        initialDataLoaded.current = true;
    }
    if (quote) {
        if (isFinalized) {
            setIsDirty(false);
        } else {
            const currentState = JSON.stringify(quote);
            setIsDirty(currentState !== initialState.current);
        }
    }
  }, [quote, isFinalized]);

    const blocker = useBlocker(isDirty && !isSaving);

    useEffect(() => {
        if (blocker.state === 'blocked') {
            setShowUnsavedChangesPrompt(true);
        } else {
            setShowUnsavedChangesPrompt(false);
        }
    }, [blocker]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (isDirty) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cust = customers.find(c => c.id === e.target.value);
    if (cust && quote) {
      setSelectedCustomer(cust);
      setQuote({ ...quote, customerId: cust.id });
      if (customerError) setCustomerError(null);
    }
  };
  
  const handleItemChange = <T,>(index: number, field: keyof LineItem, value: T) => {
    if (quote && !isFinalized) {
      const newItems = [...quote.items];
      (newItems[index] as any)[field] = value;
      setQuote({ ...quote, items: newItems });
    }
  };

  const addLineItem = () => {
     if (quote && !isFinalized) {
        const newItem: LineItem = {
            id: `li_${Date.now()}`,
            productId: '',
            description: 'Select a product...',
            quantity: 1,
            unitPrice: 0,
        };
        setQuote({ ...quote, items: [...quote.items, newItem] });
    }
  };
  
  const removeLineItem = (index: number) => {
    if(quote && !isFinalized) {
        setQuote({...quote, items: quote.items.filter((_, i) => i !== index)})
    }
  }

  const handleProductSelection = (index: number, product: Product) => {
    if(product && quote && !isFinalized && selectedCustomer) {
        const newItems = [...quote.items];
        const resolvedDetails = getResolvedProductDetails(product, selectedCustomer, customers);
            
        newItems[index].productId = product.id;
        newItems[index].description = resolvedDetails.description;
        newItems[index].unitPrice = resolvedDetails.unitPrice;
        newItems[index].itemCode = resolvedDetails.itemCode;
        if (newItems[index].quantity < 1) {
            newItems[index].quantity = 1;
        }
        setQuote({...quote, items: newItems});
    }
  };
  
  const saveQuote = (isFinalizing: boolean = false): Quote | null => {
    if (!quote) return null;

    let quoteToSave = { ...quote };

    if (isFinalizing) {
        if (!quote.customerId) {
            setCustomerError('Please select a customer before finalizing.');
            addToast('Please select a customer before finalizing.', 'error');
            return null;
        }
        quoteToSave = {
            ...quote,
            status: DocumentStatus.ACCEPTED,
            quoteNumber: getNextQuoteNumber(quotes)
        };
    }

    const quoteIndex = quotes.findIndex(q => q.id === quoteToSave.id);
    if (quoteIndex > -1) {
        const updatedQuotes = [...quotes];
        updatedQuotes[quoteIndex] = quoteToSave;
        setQuotes(updatedQuotes);
    } else {
        setQuotes([...quotes, quoteToSave]);
    }
    return quoteToSave;
  }

  const finalizeQuote = () => {
      setIsSaving(true);
      const finalizedQuote = saveQuote(true);
      if (finalizedQuote) {
          initialState.current = JSON.stringify(finalizedQuote);
          setQuote(finalizedQuote);
          addToast('Quote finalized successfully!', 'success');
          // FIX: Trigger navigation via useEffect
          setNavigateTo({ path: `/quotes/${finalizedQuote.id}` });
      } else {
        setIsSaving(false); // Reset if save failed
      }
  };

  const handleConvertToInvoice = () => {
    if (quote) {
        setIsSaving(true);
        // FIX: Trigger navigation via useEffect
        setNavigateTo({ path: '/invoices/new', options: { state: { fromQuote: quote } } });
    }
  };
  
  const subtotal = useMemo(() => quote?.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0, [quote]);
  const vatAmount = subtotal * VAT_RATE;
  const total = subtotal + vatAmount;

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
      pdf.text(new Date(quote.date).toLocaleDateString('en-ZA'), 175, 35);
      pdf.text(quote.quoteNumber, 175, 40);
      pdf.text(new Date(quote.validUntil).toLocaleDateString('en-ZA'), 175, 45);

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

  const formElementClasses = "block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";

  if (!quote) return <div>Loading...</div>;

  return (
    <>
    {showUnsavedChangesPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-lg font-bold mb-2 text-slate-900">Unsaved Changes</h3>
                <p className="text-sm text-slate-600 mb-4">
                    You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
                </p>
                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={() => blocker.reset?.()} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Stay</button>
                    <button onClick={() => blocker.proceed?.()} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">Leave</button>
                </div>
            </div>
        </div>
    )}
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">SNOWVA<span className="text-sm align-top">™</span></h1>
                <p className="text-sm text-slate-600">{SNOWVA_DETAILS.name}</p>
                {SNOWVA_DETAILS.address.map(line => <p className="text-sm text-slate-600" key={line}>{line}</p>)}
            </div>
            <div className="text-left sm:text-right mt-4 sm:mt-0">
                <h2 className="text-3xl font-light text-slate-600 uppercase tracking-wider">Quote</h2>
                <div className="mt-2 text-sm space-y-2">
                     <div className="flex sm:justify-end items-center">
                        <span className="font-semibold text-slate-700 w-24">Quote #:</span>
                        <span>{quote.quoteNumber}</span>
                    </div>
                    <div className="flex sm:justify-end items-center">
                        <label htmlFor="quoteDate" className="font-semibold text-slate-700 w-24">Date:</label>
                        <input id="quoteDate" type="date" value={quote.date} onChange={e => !isFinalized && setQuote({...quote, date: e.target.value})} disabled={isFinalized} className={`${formElementClasses} w-auto p-1 disabled:bg-transparent disabled:ring-0 disabled:shadow-none`}/>
                    </div>
                     <div className="flex sm:justify-end items-center">
                        <label htmlFor="validUntil" className="font-semibold text-slate-700 w-24">Valid Until:</label>
                        <input id="validUntil" type="date" value={quote.validUntil} onChange={e => !isFinalized && setQuote({...quote, validUntil: e.target.value})} disabled={isFinalized} className={`${formElementClasses} w-auto p-1 disabled:bg-transparent disabled:ring-0 disabled:shadow-none`}/>
                    </div>
                </div>
            </div>
        </div>

        <div className="mb-8 p-4 border rounded-lg bg-slate-50">
            <h3 className="font-semibold text-slate-800 mb-2">Quote For:</h3>
            {isFinalized ? (
                 <div className="text-sm">
                    <p className="font-bold text-slate-900">{selectedCustomer?.name}</p>
                    {billingAddress && (
                        <div className="text-slate-600">
                            <p>{billingAddress.addressLine1}</p>
                            {billingAddress.addressLine2 && <p>{billingAddress.addressLine2}</p>}
                            <p>
                                {billingAddress.suburb && `${billingAddress.suburb}, `}
                                {billingAddress.city}
                            </p>
                            <p>{billingAddress.province}, {billingAddress.postalCode}</p>
                            <p>{billingAddress.country}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <select value={selectedCustomer?.id || ''} onChange={handleCustomerChange} className={`${formElementClasses} ${customerError ? 'ring-red-500' : ''}`} disabled={isFinalized}>
                        <option value="">Select a customer...</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {customerError && <p className="text-sm text-red-600 mt-1">{customerError}</p>}
                </div>
            )}
        </div>

        <table className="w-full mb-8 text-sm">
            <thead >
                <tr className="bg-slate-800 text-white">
                    <th className="p-3 text-left font-semibold">Description</th>
                    <th className="p-3 text-right font-semibold w-24">Qty</th>
                    <th className="p-3 text-right font-semibold w-32">Unit Price</th>
                    <th className="p-3 text-right font-semibold w-32">Total (Excl VAT)</th>
                    {!isFinalized && <th className="p-3 w-12"><span className="sr-only">Remove</span></th>}
                </tr>
            </thead>
            <tbody>
                {quote.items.map((item, index) => (
                    <tr key={item.id} className="border-b border-slate-200">
                         <td className="p-2 align-top">
                            {isFinalized ? item.description : 
                               <ProductSelector 
                                 products={allProducts}
                                 initialProductId={item.productId}
                                 onSelectProduct={(product) => handleProductSelection(index, product)}
                               />
                            }
                        </td>
                        <td className="p-2 align-top"><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} className={`${formElementClasses} text-right`} disabled={isFinalized}/></td>
                        <td className="p-2 align-top"><input type="number" step="0.01" value={item.unitPrice.toFixed(2)} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} className={`${formElementClasses} text-right`} disabled={isFinalized}/></td>
                        <td className="p-2 text-right align-top pt-4">R {(item.quantity * item.unitPrice).toFixed(2)}</td>
                        {!isFinalized && <td className="p-2 text-center align-top pt-3"><button type="button" onClick={() => removeLineItem(index)} className="text-slate-400 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button></td>}
                    </tr>
                ))}
                {!isFinalized && (
                     <tr><td colSpan={6} className="pt-2">
                        <button 
                            type="button"
                            onClick={addLineItem} 
                            disabled={!selectedCustomer}
                             className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 mt-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:text-gray-400 disabled:cursor-not-allowed">
                            <PlusIcon className="w-5 h-5"/> Add Item
                        </button>
                    </td></tr>
                )}
            </tbody>
        </table>
        
        <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2 bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-medium text-slate-700">R {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span>VAT ({VAT_RATE * 100}%)</span><span className="font-medium text-slate-700">R {vatAmount.toFixed(2)}</span></div>
                <div className="flex justify-between pt-2 mt-2 border-t border-slate-200 font-semibold text-base"><span>Total</span><span>R {total.toFixed(2)}</span></div>
            </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row justify-end items-center gap-4">
             {!isFinalized ? (
                <button type="button" onClick={finalizeQuote} className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600">
                    <CheckCircleIcon className="w-5 h-5"/> <span>Finalize Quote</span>
                </button>
            ) : (
                <>
                 {quote.status === DocumentStatus.ACCEPTED && (
                    <button type="button" onClick={handleConvertToInvoice} className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        <SwitchHorizontalIcon className="w-5 h-5"/> <span>Convert to Invoice</span>
                    </button>
                 )}
                 <button type="button" onClick={handleDownload} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                   <DownloadIcon className="w-5 h-5"/> <span>Download</span>
                </button>
                 <button type="button" onClick={handlePrint} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                   <PrintIcon className="w-5 h-5"/> <span>Print</span>
                </button>
                 <button type="button" onClick={handleEmailButtonClick} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                   <MailIcon className="w-5 h-5"/> <span>Email Quote</span>
                </button>
                </>
            )}
        </div>
    </div>
     {isEmailModalOpen && selectedCustomer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
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
