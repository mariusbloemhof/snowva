
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Invoice, Customer, Product, LineItem, DocumentStatus, CustomerType, Quote, PaymentTerm } from '../types';
import { products, VAT_RATE } from '../constants';
import { TrashIcon, PlusIcon, CheckCircleIcon } from './Icons';
import { getResolvedProductDetails, calculateDueDate } from '../utils';
import { ProductSelector } from './ProductSelector';
import { useToast } from '../contexts/ToastContext';

interface InvoiceEditorProps {
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    customers: Customer[];
    invoiceId?: string;
}

type FormErrors = {
    customerId?: string;
    items?: string;
}

const getNextInvoiceNumber = (currentInvoices: Invoice[]) => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const prefix = `${year}${month}${day}`;

    const lastNumForToday = currentInvoices
        .filter(inv => inv.invoiceNumber.startsWith(prefix))
        .map(inv => parseInt(inv.invoiceNumber.slice(-3), 10))
        .reduce((max, num) => Math.max(max, num), 0);
    
    return `${prefix}${(lastNumForToday + 1).toString().padStart(3, '0')}`;
};

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ invoices, setInvoices, customers, invoiceId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    const quoteToConvert = location.state?.fromQuote as Quote | undefined;

    if (quoteToConvert) {
        const newInvoiceFromQuote: Invoice = {
            id: `inv_${Date.now()}`,
            invoiceNumber: `DRAFT-${Date.now()}`,
            customerId: quoteToConvert.customerId,
            date: new Date().toISOString().split('T')[0],
            items: quoteToConvert.items.map((item, index) => ({...item, id: `li_${Date.now()}_${index}`})),
            status: DocumentStatus.DRAFT,
            notes: `Based on Quote #${quoteToConvert.quoteNumber}\n${quoteToConvert.notes || ''}`.trim(),
            quoteId: quoteToConvert.id,
        };
        setInvoice(newInvoiceFromQuote);
        setSelectedCustomer(customers.find(c => c.id === newInvoiceFromQuote.customerId) || null);
        // Clear location state to prevent re-triggering on re-render
        window.history.replaceState({}, document.title)
    } else if (invoiceId) {
      const foundInvoice = invoices.find(inv => inv.id === invoiceId);
      if (foundInvoice) {
        setInvoice(foundInvoice);
        setSelectedCustomer(customers.find(c => c.id === foundInvoice.customerId) || null);
      }
    } else {
      setInvoice({
        id: `inv_${Date.now()}`,
        invoiceNumber: `DRAFT-${Date.now()}`,
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
        status: DocumentStatus.DRAFT,
        notes: '',
      });
      setSelectedCustomer(null);
    }
  }, [invoiceId, invoices, location.state, customers]);

  const handleFieldChange = (field: keyof Invoice, value: any) => {
    if (invoice) {
      setInvoice({ ...invoice, [field]: value });
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cust = customers.find(c => c.id === e.target.value);
    if (cust && invoice) {
      setSelectedCustomer(cust);
      const newNotes = invoice.notes ? invoice.notes : cust.defaultInvoiceNotes || '';
      setInvoice({ ...invoice, customerId: cust.id, notes: newNotes });
      if (errors.customerId) setErrors(prev => ({...prev, customerId: undefined}));
    }
  };
  
  const handleItemChange = <T,>(index: number, field: keyof LineItem, value: T) => {
    if (invoice) {
      const newItems = [...invoice.items];
      (newItems[index] as any)[field] = value;
      setInvoice({ ...invoice, items: newItems });
    }
  };

  const addLineItem = () => {
     if (invoice) {
        const newItem: LineItem = {
            id: `li_${Date.now()}`,
            productId: '',
            description: 'Select a product...',
            quantity: 1,
            unitPrice: 0,
        };
        setInvoice({ ...invoice, items: [...invoice.items, newItem] });
        if (errors.items) setErrors(prev => ({...prev, items: undefined}));
    }
  };
  
  const removeLineItem = (index: number) => {
    if(invoice) {
        setInvoice({...invoice, items: invoice.items.filter((_, i) => i !== index)})
    }
  }

  const handleProductSelection = (index: number, product: Product) => {
    if(product && invoice && selectedCustomer) {
        const newItems = [...invoice.items];
        const resolvedDetails = getResolvedProductDetails(product, selectedCustomer, customers);

        newItems[index].productId = product.id;
        newItems[index].description = resolvedDetails.description;
        newItems[index].unitPrice = resolvedDetails.unitPrice;
        if (newItems[index].quantity < 1) {
            newItems[index].quantity = 1;
        }
        setInvoice({...invoice, items: newItems});
    }
  };

  const saveInvoice = () => {
    if (!invoice) return;
    const invoiceIndex = invoices.findIndex(inv => inv.id === invoice.id);
    if (invoiceIndex > -1) {
      const updatedInvoices = [...invoices];
      updatedInvoices[invoiceIndex] = invoice;
      setInvoices(updatedInvoices);
    } else {
      setInvoices([...invoices, invoice]);
    }
    addToast('Draft saved successfully!', 'success');
  };

  const validateForFinalize = () => {
    const newErrors: FormErrors = {};
    if (!invoice?.customerId) {
        newErrors.customerId = 'Please select a customer.';
    }
    if (!invoice?.items || invoice.items.length === 0) {
        newErrors.items = 'Please add at least one line item before finalizing.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const finalizeInvoice = () => {
    if (!validateForFinalize() || !invoice) {
        addToast('Cannot finalize. Please fix the errors.', 'error');
        return;
    }

    const customer = customers.find(c => c.id === invoice.customerId);
    if (!customer) {
        addToast('Could not find customer details.', 'error');
        return;
    }

    const dueDate = calculateDueDate(
        invoice.date, 
        customer.paymentTerm || PaymentTerm.COD
    );

    const finalInvoice = {
        ...invoice,
        status: DocumentStatus.FINALIZED as DocumentStatus,
        invoiceNumber: getNextInvoiceNumber(invoices),
        dueDate: dueDate,
    };

    const invoiceIndex = invoices.findIndex(inv => inv.id === invoice.id);
    if (invoiceIndex > -1) {
        const updatedInvoices = [...invoices];
        updatedInvoices[invoiceIndex] = finalInvoice;
        setInvoices(updatedInvoices);
    } else {
        setInvoices([...invoices, finalInvoice]);
    }
    addToast('Invoice finalized successfully!', 'success');
    navigate(`/invoices/${finalInvoice.id}`);
  };

  const subtotal = useMemo(() => invoice?.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0, [invoice]);
  const vatAmount = subtotal * VAT_RATE;
  const total = subtotal + vatAmount;

  if (!invoice) return <div>Loading...</div>;

  const formElementClasses = "block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
  const labelClasses = "block text-sm font-medium leading-6 text-slate-900";


  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-200 pb-4">
            <div>
                <h2 className="text-2xl font-semibold leading-6 text-slate-900">
                    {invoiceId ? `Editing Invoice ${invoice.invoiceNumber}` : 'New Invoice'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">Fill in the details below to create or update an invoice.</p>
            </div>
            <div className="flex items-center justify-end space-x-3 mt-4 sm:mt-0">
                <button type="button" onClick={() => navigate('/invoices')} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
                <button type="button" onClick={saveInvoice} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save Draft</button>
                <button type="button" onClick={finalizeInvoice} className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600">
                    <CheckCircleIcon className="w-5 h-5"/> <span>Finalize Invoice</span>
                </button>
            </div>
        </div>

        <div className="space-y-12">
            <div className="border-b border-slate-200 pb-12">
                <h2 className="text-base font-semibold leading-7 text-slate-900">Invoice Details</h2>
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
                         <label htmlFor="date" className={labelClasses}>Invoice Date</label>
                        <div className="mt-2">
                            <input type="date" id="date" value={invoice.date} onChange={e => handleFieldChange('date', e.target.value)} className={formElementClasses}/>
                        </div>
                    </div>
                    <div className="sm:col-span-3">
                         <label htmlFor="orderNumber" className={labelClasses}>Order # <span className="text-slate-500">(optional)</span></label>
                         <div className="mt-2">
                             <input type="text" id="orderNumber" value={invoice.orderNumber || ''} onChange={e => handleFieldChange('orderNumber', e.target.value)} className={formElementClasses}/>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-b border-slate-200 pb-12">
                <h2 className="text-base font-semibold leading-7 text-slate-900">Line Items</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Add products to the invoice. The price will be determined based on the selected customer.</p>
                <div className="mt-10">
                    <div className={`-mx-4 ring-1 ${errors.items ? 'ring-red-500' : 'ring-slate-200'} sm:mx-0 sm:rounded-lg`}>
                            <table className="min-w-full">
                                <thead className="sr-only sm:table-header-group">
                                    <tr>
                                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6 w-1/2">Product</th>
                                        <th className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900 w-[15%]">Quantity</th>
                                        <th className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900 w-1/4">Unit Price</th>
                                        <th className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-slate-900 sm:pr-6">Total</th>
                                        <th><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map((item, index) => (
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
                        <label htmlFor="notes" className={labelClasses}>Notes / Remarks</label>
                        <div className="mt-2">
                            <textarea id="notes" rows={4} value={invoice.notes || ''} onChange={(e) => handleFieldChange('notes', e.target.value)} className={`${formElementClasses}`} placeholder="Add any notes for the customer..."></textarea>
                        </div>
                    </div>
                    <div className="flex justify-end items-start">
                        <div className="w-full max-w-sm space-y-2 bg-slate-50 p-4 rounded-lg">
                            <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-medium text-slate-700">R {subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-sm"><span>VAT ({VAT_RATE * 100}%)</span><span className="font-medium text-slate-700">R {vatAmount.toFixed(2)}</span></div>
                            <div className="flex justify-between pt-2 mt-2 border-t border-slate-200 font-semibold text-base"><span>Total</span><span>R {total.toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
