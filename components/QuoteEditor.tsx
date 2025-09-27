import { Timestamp } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { VAT_RATE } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { AppContextType, Customer, DocumentStatus, LineItem, Product, Quote } from '../types';
import { dateUtils, getResolvedProductDetails } from '../utils';
import { ArrowLeftIcon, CheckCircleIcon, PlusIcon, TrashIcon } from './Icons';
import { ProductSelector } from './ProductSelector';


interface FormErrors {
    customerId?: string;
    items?: string;
}

const getNextQuoteNumber = (currentQuotes: Quote[]) => {
    const lastNum = currentQuotes
        .map(q => parseInt(q.quoteNumber.split('-').pop() || '0', 10))
        .reduce((max, num) => Math.max(max, num), 0);
    return `Q-${new Date().getFullYear()}-${(lastNum + 1).toString().padStart(3, '0')}`;
};

export const QuoteEditor: React.FC = () => {
  const { id: quoteId } = useParams<{ id: string }>();
  const { customers, quotes, setQuotes, products } = useOutletContext<AppContextType>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Form input values (strings for date inputs)
  const [formValues, setFormValues] = useState({
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  const [isDirty, setIsDirty] = useState(false);
  const initialState = useRef<string>('');
  const initialDataLoaded = useRef(false);
  const isSaving = useRef(false);
  const [showUnsavedChangesPrompt, setShowUnsavedChangesPrompt] = useState(false);
  const [finalizedQuoteId, setFinalizedQuoteId] = useState<string | null>(null);
  
  useEffect(() => {
    if (finalizedQuoteId) {
        navigate(`/quotes/${finalizedQuoteId}`);
    }
  }, [finalizedQuoteId, navigate]);

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
        date: Timestamp.fromDate(new Date()),
        validUntil: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        items: [],
        status: DocumentStatus.DRAFT
      };
      setQuote(newQuote);
      setSelectedCustomer(null);
    }
  }, [quoteId, customers, quotes]);

  // Sync form values when quote changes
  useEffect(() => {
    if (quote) {
      setFormValues({
        date: dateUtils.timestampToInputValue(quote.date),
        validUntil: dateUtils.timestampToInputValue(quote.validUntil)
      });
    }
  }, [quote]);

  useEffect(() => {
    if (quote && !initialDataLoaded.current) {
        initialState.current = JSON.stringify(quote);
        initialDataLoaded.current = true;
    }
    if (quote) {
        const currentState = JSON.stringify(quote);
        setIsDirty(currentState !== initialState.current);
    }
  }, [quote]);

    const blocker = useBlocker(isDirty && !isSaving.current);

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

  const handleFieldChange = (field: keyof Quote, value: any) => {
    if (quote) {
      if (field === 'date' || field === 'validUntil') {
        // Update form values for string inputs
        setFormValues(prev => ({ ...prev, [field]: value }));
        // Update quote with Timestamp
        setQuote({ ...quote, [field]: dateUtils.stringToTimestamp(value) });
      } else {
        setQuote({ ...quote, [field]: value });
      }
    }
  };

  const handleShippingToggle = (enabled: boolean) => {
    if (quote) {
        setQuote({ ...quote, shipping: enabled ? quote.shipping || 0 : undefined });
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cust = customers.find(c => c.id === e.target.value);
    if (cust && quote) {
      setSelectedCustomer(cust);
      setQuote({ ...quote, customerId: cust.id });
      if (errors.customerId) setErrors(prev => ({...prev, customerId: undefined}));
    }
  };
  
  const handleItemChange = <T,>(index: number, field: keyof LineItem, value: T) => {
    if (quote) {
      const newItems = [...quote.items];
      (newItems[index] as any)[field] = value;
      setQuote({ ...quote, items: newItems });
    }
  };

  const addLineItem = () => {
     if (quote) {
        const newItem: LineItem = {
            id: `li_${Date.now()}`,
            productId: '',
            description: 'Select a product...',
            quantity: 1,
            unitPrice: 0,
        };
        setQuote({ ...quote, items: [...quote.items, newItem] });
        if (errors.items) setErrors(prev => ({...prev, items: undefined}));
    }
  };
  
  const removeLineItem = (index: number) => {
    if(quote) {
        setQuote({...quote, items: quote.items.filter((_, i) => i !== index)})
    }
  }

  const handleProductSelection = (index: number, product: Product) => {
    if(product && quote && selectedCustomer) {
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

  const validateForFinalize = () => {
    const newErrors: FormErrors = {};
    if (!quote?.customerId) {
        newErrors.customerId = 'Please select a customer.';
    }
    if (!quote?.items || quote.items.length === 0) {
        newErrors.items = 'Please add at least one line item before finalizing.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Handle cancel - discard changes and navigate away
  const handleCancel = () => {
    // Reset dirty state first
    setIsDirty(false);
    // Use setTimeout to ensure state update is processed before navigation
    setTimeout(() => {
      navigate('/quotes');
    }, 0);
  };
  
  const saveDraft = () => {
    if (!quote) return;
    const quoteIndex = quotes.findIndex(q => q.id === quote.id);
    if (quoteIndex > -1) {
      const updatedQuotes = [...quotes];
      updatedQuotes[quoteIndex] = quote;
      setQuotes(updatedQuotes);
    } else {
      setQuotes([...quotes, quote]);
    }
    addToast('Draft saved successfully!', 'success');
    
    initialState.current = JSON.stringify(quote);
    setIsDirty(false);
  };

  const finalizeQuote = () => {
      if (!validateForFinalize() || !quote) {
        addToast('Cannot finalize. Please fix the errors.', 'error');
        return;
      }

      const finalQuote: Quote = {
          ...quote,
          status: DocumentStatus.ACCEPTED,
          quoteNumber: getNextQuoteNumber(quotes),
      };
      
      const quoteIndex = quotes.findIndex(q => q.id === finalQuote.id);
      if (quoteIndex > -1) {
          const updatedQuotes = [...quotes];
          updatedQuotes[quoteIndex] = finalQuote;
          setQuotes(updatedQuotes);
      } else {
          setQuotes([...quotes, finalQuote]);
      }
      
      addToast('Quote finalized successfully!', 'success');
      
      initialState.current = JSON.stringify(finalQuote);
      setIsDirty(false);
      
      // Set flag to bypass blocker during navigation
      isSaving.current = true;
      setFinalizedQuoteId(finalQuote.id);
  };
  
  const subtotal = useMemo(() => {
    const itemsTotal = quote?.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
    const shippingCost = quote?.shipping || 0;
    return itemsTotal + shippingCost;
  }, [quote]);
  const vatAmount = subtotal * VAT_RATE;
  const total = subtotal + vatAmount;

  const formElementClasses = "block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
  const labelClasses = "block text-sm font-medium leading-6 text-slate-900";

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
     <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-x-3">
                  <button 
                      type="button"
                      onClick={() => navigate(-1)}
                      className="inline-flex items-center rounded-md p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                      <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <div>
                      <h2 className="text-2xl font-semibold leading-6 text-slate-900">
                          {quoteId ? `Editing Quote ${quote.quoteNumber}` : 'New Quote'}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">Fill in the details below to create or update a quote.</p>
                  </div>
              </div>
              <div className="flex items-center justify-end space-x-3 mt-4 sm:mt-0">
                  <button type="button" onClick={handleCancel} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
                  <button type="button" onClick={saveDraft} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save Draft</button>
                  <button type="button" onClick={finalizeQuote} className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600">
                      <CheckCircleIcon className="w-5 h-5"/> <span>Finalize Quote</span>
                  </button>
              </div>
          </div>

          <div className="space-y-12">
              <div className="border-b border-slate-200 pb-12">
                  <h2 className="text-base font-semibold leading-7 text-slate-900">Quote Details</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Set the customer, date, and other primary details.</p>
                  <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                      <div className="sm:col-span-4">
                          <label htmlFor="customer" className={labelClasses}>Customer</label>
                          <div className="mt-2">
                              <select id="customer" value={selectedCustomer?.id || ''} onChange={handleCustomerChange} className={`${formElementClasses} ${errors.customerId ? 'ring-red-500' : ''}`}>
                                  <option value="">Select a customer...</option>
                                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                          </div>
                          {errors.customerId && <p className="text-sm text-red-600 mt-1">{errors.customerId}</p>}
                      </div>
                      <div className="sm:col-span-3">
                          <label htmlFor="date" className={labelClasses}>Quote Date</label>
                          <div className="mt-2">
                              <input type="date" id="date" value={formValues.date} onChange={e => handleFieldChange('date', e.target.value)} className={formElementClasses}/>
                          </div>
                      </div>
                      <div className="sm:col-span-3">
                          <label htmlFor="validUntil" className={labelClasses}>Valid Until</label>
                          <div className="mt-2">
                              <input type="date" id="validUntil" value={formValues.validUntil} onChange={e => handleFieldChange('validUntil', e.target.value)} className={formElementClasses}/>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="border-b border-slate-200 pb-12">
                  <h2 className="text-base font-semibold leading-7 text-slate-900">Line Items</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Add products to the quote. The price will be determined based on the selected customer.</p>
                  <div className="mt-10">
                      <div className={`-mx-4 ring-1 ${errors.items ? 'ring-red-500' : 'ring-slate-200'} sm:mx-0 sm:rounded-lg`}>
                              <table className="table-base">
                                  <thead className="sr-only sm:table-header-group">
                                      <tr>
                                          <th className="py-3 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6 w-1/2">Product</th>
                                          <th className="px-3 py-3 text-right text-sm font-semibold text-slate-900 w-[15%]">Quantity</th>
                                          <th className="px-3 py-3 text-right text-sm font-semibold text-slate-900 w-1/4">Unit Price</th>
                                          <th className="py-3 pl-3 pr-4 text-right text-sm font-semibold text-slate-900 sm:pr-6">Total</th>
                                          <th><span className="sr-only">Actions</span></th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {quote.items.map((item, index) => (
                                          <tr key={item.id} className="border-b border-slate-200">
                                              <td className="p-2 sm:pl-6">
                                                  <ProductSelector 
                                                  products={products}
                                                  initialProductId={item.productId}
                                                  onSelectProduct={(product) => handleProductSelection(index, product)}
                                                  />
                                              </td>
                                              <td className="p-2">
                                                  <input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} className={`${formElementClasses} text-right`}/>
                                              </td>
                                              <td className="p-2">
                                                  <input type="number" step="0.01" value={item.unitPrice.toFixed(2)} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} className={`${formElementClasses} text-right`}/>
                                              </td>
                                              <td className="p-2 text-right sm:pr-6">
                                                  <span className="text-sm text-slate-700">R {(item.quantity * item.unitPrice).toFixed(2)}</span>
                                              </td>
                                              <td className="p-2 text-center">
                                                  <button type="button" onClick={() => removeLineItem(index)} className="text-slate-400 hover:text-red-600 p-2"><TrashIcon className="w-5 h-5" /></button>
                                              </td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                              <div className="p-4 border-t border-slate-200">
                                  <button 
                                      type="button"
                                      onClick={addLineItem} 
                                      disabled={!selectedCustomer}
                                      className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                                  >
                                      <PlusIcon className="w-5 h-5"/> Add Item
                                  </button>
                                  {errors.items && <p className="text-sm text-red-600 mt-2">{errors.items}</p>}
                              </div>
                          </div>
                  </div>
              </div>
              
              <div>
                  <h2 className="text-base font-semibold leading-7 text-slate-900">Summary</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Add any final notes and review the totals before finalizing.</p>
                  <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                            <div className="relative flex items-start mb-6">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="include-shipping"
                                        type="checkbox"
                                        checked={quote.shipping !== undefined}
                                        onChange={(e) => handleShippingToggle(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="include-shipping" className="font-medium text-slate-900">
                                        Add Shipping Cost
                                    </label>
                                    <p className="text-slate-500">Include a separate charge for shipping.</p>
                                </div>
                            </div>
                            {quote.shipping !== undefined && (
                                <div>
                                    <label htmlFor="shipping" className={labelClasses}>Shipping Amount (ex. VAT)</label>
                                    <div className="relative mt-2 rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-gray-500 sm:text-sm">R</span>
                                        </div>
                                        <input
                                            type="number"
                                            name="shipping"
                                            id="shipping"
                                            value={quote.shipping || ''}
                                            onChange={(e) => handleFieldChange('shipping', parseFloat(e.target.value) || 0)}
                                            className={`${formElementClasses} pl-7`}
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="mt-8">
                                <label htmlFor="notes" className={labelClasses}>Notes / Remarks</label>
                                <div className="mt-2">
                                    <textarea id="notes" rows={4} value={quote.notes || ''} onChange={(e) => handleFieldChange('notes', e.target.value)} className={`${formElementClasses}`} placeholder="Add any notes for the customer..."></textarea>
                                </div>
                            </div>
                      </div>
                      <div className="flex justify-end items-start">
                          <div className="w-full max-w-sm space-y-2 bg-slate-50 p-4 rounded-lg">
                              <div className="flex justify-between text-sm"><span>Items Total</span><span className="font-medium text-slate-700">R {(subtotal - (quote.shipping || 0)).toFixed(2)}</span></div>
                               {quote.shipping !== undefined && (
                                <div className="flex justify-between text-sm">
                                    <span>Shipping</span>
                                    <span className="font-medium text-slate-700">R {(quote.shipping || 0).toFixed(2)}</span>
                                </div>
                               )}
                               <div className="flex justify-between text-sm pt-2 border-t border-slate-200"><span>Subtotal</span><span className="font-medium text-slate-700">R {subtotal.toFixed(2)}</span></div>
                              <div className="flex justify-between text-sm"><span>VAT ({VAT_RATE * 100}%)</span><span className="font-medium text-slate-700">R {vatAmount.toFixed(2)}</span></div>
                              <div className="flex justify-between pt-2 mt-2 border-t border-slate-200 font-semibold text-base"><span>Total</span><span>R {total.toFixed(2)}</span></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </>
  );
};
