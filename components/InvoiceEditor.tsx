import React, { useEffect, useState } from 'react';
import { useBlocker, useLocation, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { VAT_RATE } from '../constants';
import { useFirebase } from '../contexts/FirebaseContext';
import { useToast } from '../contexts/ToastContext';
import { AppContextType, Customer, DocumentStatus, Invoice, LineItem, Product, Quote } from '../types';
import { dateUtils, getResolvedProductDetails } from '../utils';
import { ArrowLeftIcon, CheckCircleIcon, PlusIcon, TrashIcon } from './Icons';
import { ProductSelector } from './ProductSelector';

interface FormErrors {
    customerId?: string;
    items?: string;
}

// Form values for HTML inputs (using strings for dates)
interface InvoiceFormValues {
  id: string;
  invoiceNumber: string;
  customerId: string;
  issueDate: string; // HTML date input format
  dueDate?: string;  // HTML date input format
  poNumber?: string;
  lineItems: LineItem[];
  shippingAmount: number;
  status: DocumentStatus;
  notes?: string;
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

export const InvoiceEditor: React.FC = () => {
  const { id: invoiceId } = useParams<{ id: string }>();
  const { invoices, setInvoices, customers, products } = useOutletContext<AppContextType>();
  const { invoiceOperations } = useFirebase();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [formValues, setFormValues] = useState<InvoiceFormValues | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const [isDirty, setIsDirty] = useState(false);
  const initialState = React.useRef<string>('');
  const initialDataLoaded = React.useRef(false);
  const isSaving = React.useRef(false);

  // Convert formValues to Firebase Invoice format
  const formValuesToInvoice = (formData: InvoiceFormValues): Invoice => {
    const itemsTotal = formData.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const vatAmount = itemsTotal * VAT_RATE;
    const totalAmount = itemsTotal + formData.shippingAmount + vatAmount;

    const invoice: Invoice = {
      id: formData.id,
      invoiceNumber: formData.invoiceNumber,
      customerId: formData.customerId,
      issueDate: dateUtils.stringToTimestamp(formData.issueDate),
      lineItems: formData.lineItems,
      subtotal: itemsTotal,
      taxAmount: vatAmount,
      discountAmount: 0,
      shippingAmount: formData.shippingAmount,
      totalAmount: totalAmount,
      status: formData.status,
      notes: formData.notes
    };

    if (formData.dueDate) {
      invoice.dueDate = dateUtils.stringToTimestamp(formData.dueDate);
    }

    if (formData.poNumber) {
      invoice.poNumber = formData.poNumber;
    }

    return invoice;
  };

  // Convert Firebase Invoice to form values
  const invoiceToFormValues = (invoice: Invoice): InvoiceFormValues => {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      issueDate: dateUtils.timestampToInputValue(invoice.issueDate),
      dueDate: invoice.dueDate ? dateUtils.timestampToInputValue(invoice.dueDate) : undefined,
      poNumber: invoice.poNumber || '',
      lineItems: invoice.lineItems,
      shippingAmount: invoice.shippingAmount,
      status: invoice.status,
      notes: invoice.notes || ''
    };
  };

  // Handle cancel - discard changes and navigate away
  const handleCancel = () => {
    setIsDirty(false);
    setTimeout(() => {
      navigate('/invoices');
    }, 0);
  };

  useEffect(() => {
    // Reset on ID change
    initialDataLoaded.current = false;
    setIsDirty(false);

    const quoteToConvert = location.state?.fromQuote as Quote | undefined;

    if (quoteToConvert) {
        const newFormValues: InvoiceFormValues = {
            id: `inv_${Date.now()}`,
            invoiceNumber: `DRAFT-${Date.now()}`,
            customerId: quoteToConvert.customerId,
            issueDate: dateUtils.todayString(),
            lineItems: quoteToConvert.items.map((item, index) => ({...item, id: `li_${Date.now()}_${index}`})),
            shippingAmount: 0,
            status: DocumentStatus.DRAFT,
            notes: `Based on Quote #${quoteToConvert.quoteNumber}\n${quoteToConvert.notes || ''}`.trim()
        };
        setFormValues(newFormValues);
        setSelectedCustomer(customers.find(c => c.id === newFormValues.customerId) || null);
        window.history.replaceState({}, document.title);
    } else if (invoiceId) {
      const foundInvoice = invoices.find(inv => inv.id === invoiceId);
      if (foundInvoice) {
        setFormValues(invoiceToFormValues(foundInvoice));
        setSelectedCustomer(customers.find(c => c.id === foundInvoice.customerId) || null);
      }
    } else {
        const newFormValues: InvoiceFormValues = {
            id: `inv_${Date.now()}`,
            invoiceNumber: `DRAFT-${Date.now()}`,
            customerId: '',
            issueDate: dateUtils.todayString(),
            lineItems: [],
            shippingAmount: 0,
            status: DocumentStatus.DRAFT,
            notes: ''
          };
      setFormValues(newFormValues);
      setSelectedCustomer(null);
    }
  }, [invoiceId, customers, location.state?.fromQuote, invoices]);

  // Track changes for unsaved warning
  useEffect(() => {
    if (formValues && initialDataLoaded.current) {
      const currentState = JSON.stringify(formValues);
      setIsDirty(currentState !== initialState.current);
    } else if (formValues && !initialDataLoaded.current) {
      initialState.current = JSON.stringify(formValues);
      initialDataLoaded.current = true;
    }
  }, [formValues]);

  // Handle form field changes
  const handleFieldChange = <K extends keyof InvoiceFormValues>(field: K, value: InvoiceFormValues[K]) => {
    if (!formValues) return;
    
    setFormValues(prev => prev ? { ...prev, [field]: value } : null);
    
    // Clear errors when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle customer selection
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    const customer = customers.find(c => c.id === customerId) || null;
    
    setSelectedCustomer(customer);
    handleFieldChange('customerId', customerId);
  };

  // Add line item
  const addLineItem = () => {
    if (!formValues) return;
    
    const newItem: LineItem = {
      id: `li_${Date.now()}`,
      productId: '',
      description: '',
      quantity: 1,
      unitPrice: 0
    };
    
    handleFieldChange('lineItems', [...formValues.lineItems, newItem]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    if (!formValues) return;
    
    handleFieldChange('lineItems', formValues.lineItems.filter((_, i) => i !== index));
  };

  // Handle product selection for line item
  const handleProductSelection = (index: number, product: Product | null) => {
    if (!formValues || !product || !selectedCustomer) return;
    
    const resolvedProduct = getResolvedProductDetails(product, selectedCustomer, customers);
    const newItems = [...formValues.lineItems];
    
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      description: product.name,
      unitPrice: resolvedProduct.unitPrice
    };
    
    handleFieldChange('lineItems', newItems);
  };

  // Handle line item field changes
  const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    if (!formValues) return;
    
    const newItems = [...formValues.lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    handleFieldChange('lineItems', newItems);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formValues?.customerId) {
      newErrors.customerId = 'Please select a customer';
    }
    
    if (!formValues?.lineItems.length) {
      newErrors.items = 'Please add at least one line item';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save invoice
  const saveInvoice = async () => {
    if (!validateForm() || !formValues || isSaving.current) return;
    
    isSaving.current = true;
    
    try {
      const invoice = formValuesToInvoice(formValues);
      
      if (!formValues.invoiceNumber || formValues.invoiceNumber.startsWith('DRAFT-')) {
        invoice.invoiceNumber = getNextInvoiceNumber(invoices);
        setFormValues(prev => prev ? { ...prev, invoiceNumber: invoice.invoiceNumber } : null);
      }

      if (invoiceId) {
        // Update existing
        await invoiceOperations.update(invoiceId, invoice);
        const updatedInvoices = [...invoices];
        const invoiceIndex = updatedInvoices.findIndex(inv => inv.id === invoiceId);
        if (invoiceIndex >= 0) {
          updatedInvoices[invoiceIndex] = invoice;
          setInvoices(updatedInvoices);
        }
      } else {
        // Create new
        await invoiceOperations.create(invoice);
        setInvoices([...invoices, invoice]);
      }

      setIsDirty(false);
      addToast('Invoice saved successfully', 'success');
      navigate('/invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
      addToast('Failed to save invoice', 'error');
    } finally {
      isSaving.current = false;
    }
  };

  // Finalize invoice
  const finalizeInvoice = async () => {
    if (!validateForm() || !formValues || isSaving.current) return;
    
    isSaving.current = true;
    
    try {
      const invoice = formValuesToInvoice({
        ...formValues,
        status: DocumentStatus.FINALIZED
      });
      
      if (!formValues.invoiceNumber || formValues.invoiceNumber.startsWith('DRAFT-')) {
        invoice.invoiceNumber = getNextInvoiceNumber(invoices);
      }

      if (invoiceId) {
        await invoiceOperations.update(invoiceId, invoice);
        const updatedInvoices = [...invoices];
        const invoiceIndex = updatedInvoices.findIndex(inv => inv.id === invoiceId);
        if (invoiceIndex >= 0) {
          updatedInvoices[invoiceIndex] = invoice;
          setInvoices(updatedInvoices);
        }
      } else {
        await invoiceOperations.create(invoice);
        setInvoices([...invoices, invoice]);
      }

      setIsDirty(false);
      addToast('Invoice finalized successfully', 'success');
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error finalizing invoice:', error);
      addToast('Failed to finalize invoice', 'error');
    } finally {
      isSaving.current = false;
    }
  };

  // Calculate totals
  const itemsTotal = formValues?.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
  const shippingCost = formValues?.shippingAmount || 0;
  const subtotal = itemsTotal + shippingCost;
  const vatAmount = itemsTotal * VAT_RATE;
  const total = subtotal + vatAmount;

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return isDirty && currentLocation.pathname !== nextLocation.pathname;
  });

  // CSS classes
  const labelClasses = "block text-sm font-medium leading-6 text-slate-900";
  const formElementClasses = "block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";

  if (!formValues) return <div>Loading...</div>;

  return (
    <>
      {blocker.state === "blocked" && (
        <div className="modal-backdrop">
          <div className="card card-elevated w-full max-w-lg">
            <h3 className="text-lg font-bold mb-2 text-slate-900">Unsaved Changes</h3>
            <p className="text-sm text-slate-600 mb-4">
              You have unsaved changes. Are you sure you want to leave without saving?
            </p>
            <div className="mt-6 flex justify-end space-x-4">
              <button onClick={() => blocker.reset?.()} className="button-secondary">Stay</button>
              <button onClick={() => blocker.proceed?.()} className="button-danger">Leave</button>
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
                {invoiceId ? 'Edit Invoice' : 'Create Invoice'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">Fill in the details below to create or update an invoice.</p>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 mt-4 sm:mt-0">
            <button type="button" onClick={handleCancel} className="button-secondary">Cancel</button>
            <button type="button" onClick={saveInvoice} className="button-primary">Save Draft</button>
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
                  <input type="date" id="date" value={formValues.issueDate} onChange={e => handleFieldChange('issueDate', e.target.value)} className={formElementClasses}/>
                </div>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="orderNumber" className={labelClasses}>Order # <span className="text-slate-500">(optional)</span></label>
                <div className="mt-2">
                  <input type="text" id="orderNumber" value={formValues.poNumber || ''} onChange={e => handleFieldChange('poNumber', e.target.value)} className={formElementClasses}/>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 pb-12">
            <h2 className="text-base font-semibold leading-7 text-slate-900">Line Items</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Add products to the invoice. The price will be determined based on the selected customer.</p>
            <div className="mt-10">
              <div className={`-mx-4 ring-1 ${errors.items ? 'ring-red-500' : 'ring-slate-200'} sm:mx-0 sm:rounded-lg`}>
                <table className="table-base">
                  <thead className="table-header sr-only sm:table-header-group">
                    <tr>
                      <th className="table-cell table-cell-header text-left w-1/2">Product</th>
                      <th className="table-cell table-cell-header text-right w-[15%]">Quantity</th>
                      <th className="table-cell table-cell-header text-right w-1/4">Unit Price</th>
                      <th className="table-cell table-cell-header text-right">Total</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formValues.lineItems.map((item, index) => (
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
                          <button type="button" onClick={() => removeLineItem(index)} className="button-ghost button-danger"><TrashIcon className="w-5 h-5" /></button>
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
                      name="include-shipping"
                      type="checkbox"
                      checked={formValues.shippingAmount > 0}
                      onChange={e => handleFieldChange('shippingAmount', e.target.checked ? 0 : 0)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="ml-3 text-sm leading-6">
                    <label htmlFor="include-shipping" className="font-medium text-slate-900">
                      Include Shipping
                    </label>
                    <p className="text-slate-500">Include a separate charge for shipping.</p>
                  </div>
                </div>
                {formValues.shippingAmount !== undefined && (
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
                        value={formValues.shippingAmount || ''}
                        onChange={(e) => handleFieldChange('shippingAmount', parseFloat(e.target.value) || 0)}
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
                    <textarea id="notes" rows={4} value={formValues.notes || ''} onChange={(e) => handleFieldChange('notes', e.target.value)} className={`${formElementClasses}`} placeholder="Add any notes for the customer..."></textarea>
                  </div>
                </div>
              </div>
              <div className="flex justify-end items-start">
                <div className="w-full max-w-sm space-y-2 bg-slate-50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm"><span>Items Total</span><span className="font-medium text-slate-700">R {(subtotal - shippingCost).toFixed(2)}</span></div>
                  {shippingCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span className="font-medium text-slate-700">R {shippingCost.toFixed(2)}</span>
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
