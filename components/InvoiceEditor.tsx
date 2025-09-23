import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Invoice, Customer, Product, LineItem, DocumentStatus, CustomerType, Quote, PaymentTerm } from '../types';
import { customers, products, VAT_RATE } from '../constants';
import { TrashIcon, PlusIcon, CheckCircleIcon } from './Icons';
import { getResolvedProductDetails, calculateDueDate } from '../utils';
import { ProductSelector } from './ProductSelector';

interface InvoiceEditorProps {
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    invoiceId?: string;
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

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ invoices, setInvoices, invoiceId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

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
  }, [invoiceId, invoices, location.state]);

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
    alert('Draft saved!');
  };

  const finalizeInvoice = () => {
    if (invoice && invoice.customerId) {
        const customer = customers.find(c => c.id === invoice.customerId);
        if (!customer) {
            alert('Could not find customer details.');
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
        navigate(`/invoices/${finalInvoice.id}`);
    } else {
        alert('Please select a customer before finalizing.');
    }
  };

  const subtotal = useMemo(() => invoice?.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0, [invoice]);
  const vatAmount = subtotal * VAT_RATE;
  const total = subtotal + vatAmount;

  if (!invoice) return <div>Loading...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-2xl font-semibold text-text-primary">
                {invoiceId ? `Editing Invoice ${invoice.invoiceNumber}` : 'New Invoice'}
            </h2>
            <div className="flex justify-end space-x-4">
                <button onClick={() => navigate('/invoices')} className="px-4 py-2 bg-slate-200 text-text-primary rounded-md hover:bg-slate-300">Cancel</button>
                <button onClick={saveInvoice} className="px-4 py-2 bg-snowva-blue text-white rounded-md hover:bg-snowva-blue-dark">Save Draft</button>
                <button onClick={finalizeInvoice} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                    <CheckCircleIcon/> <span className="ml-2">Finalize Invoice</span>
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label htmlFor="customer" className="block text-sm font-medium text-text-secondary">Customer</label>
                <select id="customer" value={selectedCustomer?.id || ''} onChange={handleCustomerChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue">
                    <option value="">Select a customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label htmlFor="date" className="block text-sm font-medium text-text-secondary">Invoice Date</label>
                    <input type="date" id="date" value={invoice.date} onChange={e => handleFieldChange('date', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue"/>
                </div>
                 <div>
                    <label htmlFor="orderNumber" className="block text-sm font-medium text-text-secondary">Order # (optional)</label>
                    <input type="text" id="orderNumber" value={invoice.orderNumber || ''} onChange={e => handleFieldChange('orderNumber', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue"/>
                </div>
            </div>
        </div>

        <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-medium text-text-primary px-1">Line Items</legend>
            <div className="mt-2">
                <table className="w-full table-fixed">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="p-2 text-left font-semibold text-sm w-2/5">Product</th>
                            <th className="p-2 text-right font-semibold text-sm w-[15%]">Quantity</th>
                            <th className="p-2 text-right font-semibold text-sm w-1/5">Unit Price (ex. VAT)</th>
                            <th className="p-2 text-right font-semibold text-sm w-1/5">Total</th>
                            <th className="p-2 w-12"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items.map((item, index) => (
                            <tr key={item.id} className="border-b">
                                <td className="p-2">
                                   <ProductSelector 
                                     products={products}
                                     initialProductId={item.productId}
                                     onSelectProduct={(product) => handleProductSelection(index, product)}
                                   />
                                </td>
                                <td className="p-2"><input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} className="w-full text-right p-2 border rounded-md"/></td>
                                <td className="p-2"><input type="number" step="0.01" value={item.unitPrice.toFixed(2)} onChange={e => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full text-right p-2 border rounded-md"/></td>
                                <td className="p-2 text-right">R {(item.quantity * item.unitPrice).toFixed(2)}</td>
                                <td className="p-2 text-center"><button onClick={() => removeLineItem(index)} className="text-red-500 hover:text-red-700 p-2"><TrashIcon /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <button 
                    onClick={addLineItem} 
                    disabled={!selectedCustomer}
                    className="flex items-center text-snowva-cyan hover:text-snowva-blue font-semibold mt-4 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    <PlusIcon /> <span className="ml-1">Add Item</span>
                 </button>
            </div>
        </fieldset>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                 <label htmlFor="notes" className="block text-sm font-medium text-text-secondary">Notes / Remarks</label>
                 <textarea id="notes" rows={4} value={invoice.notes || ''} onChange={(e) => handleFieldChange('notes', e.target.value)} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" placeholder="Add any notes for the customer..."></textarea>
            </div>
            <div className="flex justify-end items-end">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between p-2 border-b"><span>SUBTOTAL</span><span className="font-medium">R {subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between p-2 border-b"><span>VAT ({VAT_RATE * 100}%)</span><span className="font-medium">R {vatAmount.toFixed(2)}</span></div>
                    <div className="flex justify-between p-2 bg-slate-100 rounded-md font-bold text-lg"><span>TOTAL</span><span>R {total.toFixed(2)}</span></div>
                </div>
            </div>
        </div>
    </div>
  );
};