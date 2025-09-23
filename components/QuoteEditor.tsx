import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote, Customer, Product, LineItem, DocumentStatus, CustomerType, Address } from '../types';
import { quotes as mockQuotes, customers, products, VAT_RATE } from '../constants';
import { TrashIcon, PlusIcon, MailIcon, CheckCircleIcon, PrintIcon, SwitchHorizontalIcon } from './Icons';
import { getResolvedProductDetails } from '../utils';
import { ProductSelector } from './ProductSelector';

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
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
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
        alert('Quote Finalized!');
    } else {
        alert('Please select a customer before finalizing.');
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

  if (!quote) return <div>Loading...</div>;

  return (
    <div className="bg-white p-8 rounded-lg shadow-2xl max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-4xl font-bold text-snowva-blue mb-2">SNOWVA<span className="text-sm align-top">™</span></h1>
                <p>Snowva™ Trading Pty Ltd</p>
                <p>67 Wildevy Street, Lynnwood Manor, Pretoria</p>
            </div>
            <div className="text-right">
                <h2 className="text-4xl font-light text-slate-600 uppercase tracking-widest">Quote</h2>
                <div className="mt-4">
                     <div className="flex justify-end items-center mt-1">
                        <span className="font-bold mr-2">Quote #:</span>
                        <span>{quote.quoteNumber}</span>
                    </div>
                    <div className="flex justify-end items-center">
                        <span className="font-bold mr-2">Date:</span>
                        <input type="date" value={quote.date} onChange={e => !isFinalized && setQuote({...quote, date: e.target.value})} disabled={isFinalized} className="p-1 border rounded-md"/>
                    </div>
                     <div className="flex justify-end items-center mt-1">
                        <span className="font-bold mr-2">Valid Until:</span>
                        <input type="date" value={quote.validUntil} onChange={e => !isFinalized && setQuote({...quote, validUntil: e.target.value})} disabled={isFinalized} className="p-1 border rounded-md"/>
                    </div>
                </div>
            </div>
        </div>

        <div className="mb-8">
            <h3 className="font-bold text-slate-600 border-b pb-1 mb-2">Quote For:</h3>
            {isFinalized || !quote.customerId ? (
                 <div>
                    <p className="font-bold">{selectedCustomer?.name}</p>
                    {billingAddress && (
                        <>
                        <p>{billingAddress.street}</p>
                        <p>{billingAddress.city}, {billingAddress.province} {billingAddress.postalCode}</p>
                        </>
                    )}
                </div>
            ) : (
                <select value={selectedCustomer?.id || ''} onChange={handleCustomerChange} className="w-full p-2 border rounded-md" disabled={isFinalized}>
                    <option value="">Select a customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            )}
        </div>

        <table className="w-full mb-8">
            <thead>
                <tr className="bg-snowva-blue text-white">
                    <th className="p-2 text-left font-semibold">Description</th>
                    <th className="p-2 text-right font-semibold w-24">Qty</th>
                    <th className="p-2 text-right font-semibold w-32">Unit Price</th>
                    <th className="p-2 text-right font-semibold w-32">Total (Excl VAT)</th>
                    {!isFinalized && <th className="p-2 w-12"></th>}
                </tr>
            </thead>
            <tbody>
                {quote.items.map((item, index) => (
                    <tr key={item.id} className="border-b">
                         <td className="p-2">
                            {isFinalized ? item.description : 
                               <ProductSelector 
                                 products={products}
                                 initialProductId={item.productId}
                                 onSelectProduct={(product) => handleProductSelection(index, product)}
                               />
                            }
                        </td>
                        <td className="p-2"><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))} className="w-full text-right p-1 border rounded-md" disabled={isFinalized}/></td>
                        <td className="p-2"><input type="number" step="0.01" value={item.unitPrice.toFixed(2)} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} className="w-full text-right p-1 border rounded-md" disabled={isFinalized}/></td>
                        <td className="p-2 text-right">R {(item.quantity * item.unitPrice).toFixed(2)}</td>
                        {!isFinalized && <td className="p-2 text-center"><button onClick={() => removeLineItem(index)} className="text-red-500 hover:text-red-700"><TrashIcon /></button></td>}
                    </tr>
                ))}
                {!isFinalized && (
                     <tr><td colSpan={5} className="pt-2">
                        <button 
                            onClick={addLineItem} 
                            disabled={!selectedCustomer}
                            className="flex items-center text-snowva-cyan hover:text-snowva-blue font-semibold disabled:text-gray-400 disabled:cursor-not-allowed">
                            <PlusIcon /> <span className="ml-1">Add Item</span>
                        </button>
                    </td></tr>
                )}
            </tbody>
        </table>
        
        <div className="flex justify-end">
            <div className="w-1/2">
                <div className="flex justify-between p-2"><span className="font-semibold">SUBTOTAL</span><span>R {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between p-2"><span className="font-semibold">VAT ({VAT_RATE * 100}%)</span><span>R {vatAmount.toFixed(2)}</span></div>
                <div className="flex justify-between p-2 bg-snowva-blue text-white font-bold text-lg rounded-md"><span>TOTAL</span><span>R {total.toFixed(2)}</span></div>
            </div>
        </div>

        <div className="mt-12 flex justify-end space-x-4">
             {!isFinalized ? (
                <button onClick={finalizeQuote} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                    <CheckCircleIcon/> <span className="ml-2">Finalize Quote</span>
                </button>
            ) : (
                <>
                 {quote.status === DocumentStatus.ACCEPTED && (
                    <button onClick={handleConvertToInvoice} className="flex items-center bg-snowva-orange text-white px-4 py-2 rounded-md hover:bg-snowva-orange-dark">
                        <SwitchHorizontalIcon className="w-5 h-5"/> <span className="ml-2">Convert to Invoice</span>
                    </button>
                 )}
                 <button onClick={() => window.print()} className="flex items-center bg-slate-500 text-white px-4 py-2 rounded-md hover:bg-slate-600">
                   <PrintIcon className="w-5 h-5"/> <span className="ml-2">Print</span>
                </button>
                 <button className="flex items-center bg-snowva-cyan text-white px-4 py-2 rounded-md hover:bg-snowva-blue">
                   <MailIcon/> <span className="ml-2">Email Quote</span>
                </button>
                </>
            )}
        </div>
    </div>
  );
};