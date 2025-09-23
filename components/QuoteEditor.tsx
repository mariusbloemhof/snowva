
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote, Customer, Product, LineItem, DocumentStatus, CustomerType, Address, LineItemPriority } from '../types';
import { quotes as mockQuotes, customers, products, VAT_RATE } from '../constants';
import { TrashIcon, PlusIcon, MailIcon, CheckCircleIcon, PrintIcon, SwitchHorizontalIcon } from './Icons';
import { getResolvedProductDetails } from '../utils';
import { ProductSelector } from './ProductSelector';
import { useToast } from '../contexts/ToastContext';

interface QuoteEditorProps {
  quoteId?: string;
}

const getNextQuoteNumber = () => {
    const lastNum = mockQuotes
        .map(q => parseInt(q.quoteNumber.split('-').pop() || '0', 10))
        .reduce((max, num) => Math.max(max, num), 0);
    return `Q-${new Date().getFullYear()}-${(lastNum + 1).toString().padStart(3, '0')}`;
};

const getBillingAddress = (customer: Customer | null): Address | undefined => {
    if (!customer) return undefined;
    return customer.addresses.find(a => a.type === 'billing' && a.isPrimary) || customer.addresses.find(a => a.isPrimary);
}

export const QuoteEditor: React.FC<QuoteEditorProps> = ({ quoteId }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerError, setCustomerError] = useState<string | null>(null);
  
  const isFinalized = useMemo(() => quote?.status !== DocumentStatus.DRAFT, [quote]);
  const billingAddress = useMemo(() => getBillingAddress(selectedCustomer), [selectedCustomer]);


  useEffect(() => {
    if (quoteId) {
      const foundQuote = mockQuotes.find(q => q.id === quoteId);
      if (foundQuote) {
        setQuote(foundQuote);
        setSelectedCustomer(customers.find(c => c.id === foundQuote.customerId) || null);
      }
    } else {
      setQuote({
        id: `qt_${Date.now()}`,
        quoteNumber: `DRAFT-Q-${Date.now()}`,
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [],
        status: DocumentStatus.DRAFT
      });
      setSelectedCustomer(null);
    }
  }, [quoteId]);

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
            priority: LineItemPriority.MEDIUM,
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
        if (newItems[index].quantity < 1) {
            newItems[index].quantity = 1;
        }
        setQuote({...quote, items: newItems});
    }
  };
  
  const finalizeQuote = () => {
    if (quote && quote.customerId) {
        setQuote({
            ...quote,
            status: DocumentStatus.ACCEPTED, // or some other logic
            quoteNumber: getNextQuoteNumber()
        });
        addToast('Quote finalized successfully!', 'success');
    } else {
        setCustomerError('Please select a customer before finalizing.');
        addToast('Please select a customer before finalizing.', 'error');
    }
  };

  const handleConvertToInvoice = () => {
    if (quote) {
        navigate('/invoices/new', {
            state: { fromQuote: quote }
        });
    }
  };

  const subtotal = useMemo(() => quote?.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0, [quote]);
  const vatAmount = subtotal * VAT_RATE;
  const total = subtotal + vatAmount;
  
  const formElementClasses = "block w-full rounded-md border-0 py-1.5 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";


  if (!quote) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">SNOWVA<span className="text-sm align-top">™</span></h1>
                <p className="text-sm text-slate-600">Snowva™ Trading Pty Ltd</p>
                <p className="text-sm text-slate-600">67 Wildevy Street, Lynnwood Manor, Pretoria</p>
            </div>
            <div className="text-left sm:text-right mt-4 sm:mt-0">
                <h2 className="text-3xl font-light text-slate-600 uppercase tracking-wider">Quote</h2>
                <div className="mt-2 text-sm space-y-2">
                     <div className="flex sm:justify-end items-center">
                        <span className="font-semibold text-slate-700 w-24">Quote #:</span>
                        <span>{quote.quoteNumber}</span>
                    </div>
                    <div className="flex sm:justify-end items-center">
                        <span className="font-semibold text-slate-700 w-24">Date:</span>
                        <input type="date" value={quote.date} onChange={e => !isFinalized && setQuote({...quote, date: e.target.value})} disabled={isFinalized} className="p-1 border rounded-md disabled:bg-slate-50 disabled:border-slate-200"/>
                    </div>
                     <div className="flex sm:justify-end items-center">
                        <span className="font-semibold text-slate-700 w-24">Valid Until:</span>
                        <input type="date" value={quote.validUntil} onChange={e => !isFinalized && setQuote({...quote, validUntil: e.target.value})} disabled={isFinalized} className="p-1 border rounded-md disabled:bg-slate-50 disabled:border-slate-200"/>
                    </div>
                </div>
            </div>
        </div>

        <div className="mb-8 p-4 border rounded-lg bg-slate-50">
            <h3 className="font-semibold text-slate-800 mb-2">Quote For:</h3>
            {isFinalized || (!quoteId && !quote.customerId) ? (
                 <div className="text-sm">
                    <p className="font-bold text-slate-900">{selectedCustomer?.name}</p>
                    {billingAddress && (
                        <div className="text-slate-600">
                        <p>{billingAddress.street}</p>
                        <p>{billingAddress.city}, {billingAddress.province} {billingAddress.postalCode}</p>
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
                    <th className="p-3 text-left font-semibold w-32">Priority</th>
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
                                 products={products}
                                 initialProductId={item.productId}
                                 onSelectProduct={(product) => handleProductSelection(index, product)}
                               />
                            }
                        </td>
                        <td className="p-2 align-top">
                            {!isFinalized ? (
                                <select
                                    value={item.priority || LineItemPriority.MEDIUM}
                                    onChange={e => handleItemChange(index, 'priority', e.target.value as LineItemPriority)}
                                    className={formElementClasses}
                                    disabled={isFinalized}
                                >
                                    <option value={LineItemPriority.HIGH}>High</option>
                                    <option value={LineItemPriority.MEDIUM}>Medium</option>
                                    <option value={LineItemPriority.LOW}>Low</option>
                                </select>
                            ) : item.priority && (
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                    item.priority === LineItemPriority.HIGH ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                    item.priority === LineItemPriority.MEDIUM ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                                    'bg-slate-50 text-slate-600 ring-slate-500/20'
                                }`}>
                                    {item.priority}
                                </span>
                            )}
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
                 <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                   <PrintIcon className="w-5 h-5"/> <span>Print</span>
                </button>
                 <button type="button" className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                   <MailIcon className="w-5 h-5"/> <span>Email Quote</span>
                </button>
                </>
            )}
        </div>
    </div>
  );
};
