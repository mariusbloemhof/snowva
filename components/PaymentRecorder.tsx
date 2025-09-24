import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useBlocker, useParams, useOutletContext } from 'react-router-dom';
import { Customer, Invoice, Payment, PaymentMethod, DocumentStatus, LineItem, PaymentAllocation, AppContextType } from '../types';
import { CheckCircleIcon } from './Icons';
import { calculateBalanceDue, calculatePaid, calculateTotal } from '../utils';
import { useToast } from '../contexts/ToastContext';

export const PaymentRecorder: React.FC = () => {
    const { id: paymentId } = useParams<{ id: string }>();
    const { customers, invoices, setInvoices, payments, setPayments } = useOutletContext<AppContextType>();
    const location = useLocation();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const isEditMode = !!paymentId;

    const { customerId, invoiceId } = (isEditMode ? {} : (location.state || {})) as { customerId?: string; invoiceId?: string; };
    
    const [paymentDetails, setPaymentDetails] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        method: PaymentMethod.EFT,
        reference: '',
    });
    
    const [allocations, setAllocations] = useState<Record<string, number>>({});
    
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const initialState = React.useRef<string>('');
    const initialDataLoaded = React.useRef(false);
    const [showUnsavedChangesPrompt, setShowUnsavedChangesPrompt] = useState(false);

    // FIX: Defer navigation to a useEffect to prevent race condition with useBlocker
    const [shouldNavigate, setShouldNavigate] = useState(false);
    useEffect(() => {
        // Only navigate after the component has re-rendered with isSaving = true.
        if (shouldNavigate && isSaving) {
            navigate('/payments');
        }
    }, [shouldNavigate, isSaving, navigate]);

    const existingPayment = useMemo(() => {
        if (!paymentId) return null;
        return payments.find(p => p.id === paymentId);
    }, [paymentId, payments]);

    const customer = useMemo(() => {
        if (isEditMode && existingPayment) {
            return customers.find(c => c.id === existingPayment.customerId);
        }
        const targetCustomer = customers.find(c => c.id === customerId);
        const targetInvoice = invoices.find(i => i.id === invoiceId);
        return targetCustomer || (targetInvoice ? customers.find(c => c.id === targetInvoice.customerId) : null);
    }, [isEditMode, existingPayment, customerId, invoiceId, customers, invoices]);

    useEffect(() => {
        initialDataLoaded.current = false;
        setIsDirty(false);

        if (isEditMode && existingPayment) {
            const details = {
                date: existingPayment.date,
                amount: existingPayment.totalAmount,
                method: existingPayment.method,
                reference: existingPayment.reference || '',
            };
            const allocs = existingPayment.allocations.reduce((acc, alloc) => {
                acc[alloc.invoiceId] = alloc.amount;
                return acc;
            }, {} as Record<string, number>);
            setPaymentDetails(details);
            setAllocations(allocs);

        } else if (invoiceId) {
            const targetInvoice = invoices.find(i => i.id === invoiceId);
            if (targetInvoice) {
                const balance = calculateBalanceDue(targetInvoice, payments);
                const finalBalance = parseFloat(balance.toFixed(2));
                setPaymentDetails(prev => ({...prev, amount: finalBalance}));
                setAllocations({ [targetInvoice.id]: finalBalance });
            }
        } else {
             // Reset to default for a new payment for a customer
            setPaymentDetails({
                date: new Date().toISOString().split('T')[0],
                amount: 0,
                method: PaymentMethod.EFT,
                reference: '',
            });
            setAllocations({});
        }
    }, [isEditMode, existingPayment, invoiceId, customerId, invoices, payments]);

    useEffect(() => {
        // Capture initial state once data is loaded
        if (!initialDataLoaded.current && customer) {
            initialState.current = JSON.stringify({ paymentDetails, allocations });
            initialDataLoaded.current = true;
        }
        
        const currentState = JSON.stringify({ paymentDetails, allocations });
        setIsDirty(currentState !== initialState.current);

    }, [paymentDetails, allocations, customer]);


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
    
    const openInvoices = useMemo(() => {
        if (!customer) return [];

        const isOutstanding = (inv: Invoice) => 
            inv.status === DocumentStatus.FINALIZED || 
            inv.status === DocumentStatus.PARTIALLY_PAID || 
            (isEditMode && (allocations[inv.id] || 0) > 0);

        // Start with the direct customer's invoices
        let relevantInvoices = invoices.filter(inv => 
            inv.customerId === customer.id && isOutstanding(inv)
        );

        // If the selected customer is a parent company, find invoices from children who bill to parent
        const childCustomers = customers.filter(c => c.parentCompanyId === customer.id && c.billToParent);
        if (childCustomers.length > 0) {
            const childCustomerIds = new Set(childCustomers.map(c => c.id));
            const childInvoices = invoices.filter(inv => 
                childCustomerIds.has(inv.customerId) && isOutstanding(inv)
            );
            relevantInvoices = [...relevantInvoices, ...childInvoices];
        }
        
        // Use a Set to remove duplicates in case an invoice is somehow included twice
        const uniqueInvoices = Array.from(new Map(relevantInvoices.map(item => [item.id, item])).values());
        
        return uniqueInvoices.sort((a: Invoice, b: Invoice) => a.date.localeCompare(b.date));
    }, [customer, invoices, isEditMode, allocations, customers]);

    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPaymentDetails(prev => ({ ...prev, [name]: name === 'amount' ? (parseFloat(value) || 0) : value }));
    };

    const handleAllocationChange = (invoiceId: string, value: string) => {
        let amount = parseFloat(value) || 0;
        const invoice = openInvoices.find(i => i.id === invoiceId);
        if (!invoice) return;

        const otherPayments = isEditMode ? payments.filter(p => p.id !== paymentId) : payments;
        const balance: number = calculateBalanceDue(invoice, otherPayments);

        if (amount < 0) {
            amount = 0;
        }
        // Use a small tolerance for floating point comparisons
        if (amount > balance + 0.001) {
            amount = parseFloat(balance.toFixed(2));
        }
        
        setAllocations(prev => ({ ...prev, [invoiceId]: amount }));
    };

    const totalAllocated = useMemo<number>(() => Object.values(allocations).reduce((sum: number, val: number) => sum + (val || 0), 0), [allocations]);
    const unallocatedAmount = paymentDetails.amount - totalAllocated;

    const handleSubmit = () => {
        if (!customer) { addToast('Error: No customer identified for this payment.', 'error'); return; }
        if (paymentDetails.amount <= 0) { addToast('Payment amount must be positive.', 'error'); return; }
        if (Math.abs(unallocatedAmount) > 0.005) { addToast('The total allocated amount must equal the payment amount.', 'error'); return; }

        let validationError = '';
        Object.entries(allocations).forEach(([invId, amount]) => {
            if (amount > 0) {
                const invoice = invoices.find(i => i.id === invId);
                if (!invoice) { validationError = `Error: Could not find invoice with ID ${invId}.`; return; }
                
                const otherPayments = isEditMode ? payments.filter(p => p.id !== paymentId) : payments;
                const balance: number = calculateBalanceDue(invoice, otherPayments);

                if (amount > balance + 0.005) {
                    validationError = `Allocation for invoice ${invoice.invoiceNumber} (R ${amount.toFixed(2)}) exceeds its balance of R ${balance.toFixed(2)}.`;
                }
            }
        });
        if (validationError) { addToast(validationError, 'error'); return; }

        const newAllocations = Object.entries(allocations)
            .filter(([, amount]) => amount > 0)
            .map(([invoiceId, amount]) => ({ invoiceId, amount }));

        let newPayments: Payment[];
        setIsSaving(true);

        if (isEditMode && existingPayment) {
            const updatedPayment: Payment = { ...existingPayment, ...paymentDetails, totalAmount: paymentDetails.amount, reference: paymentDetails.reference || undefined, allocations: newAllocations };
            newPayments = payments.map(p => p.id === paymentId ? updatedPayment : p);
        } else {
            const newPayment: Payment = { id: `pay_${Date.now()}`, customerId: customer.id, ...paymentDetails, totalAmount: paymentDetails.amount, reference: paymentDetails.reference || undefined, allocations: newAllocations };
            newPayments = [...payments, newPayment];
        }
        setPayments(newPayments);

        const affectedInvoiceIds = new Set<string>();
        if(isEditMode && existingPayment) existingPayment.allocations.forEach(a => affectedInvoiceIds.add(a.invoiceId));
        newAllocations.forEach(a => affectedInvoiceIds.add(a.invoiceId));

        const updatedInvoices = invoices.map((inv: Invoice) => {
            if (affectedInvoiceIds.has(inv.id)) {
                const paid: number = calculatePaid(inv.id, newPayments);
                // FIX: Pass the entire invoice object to calculateTotal, not just the items array.
                const total: number = calculateTotal(inv);
                const balance: number = total - paid;
                let newStatus = inv.status;

                if (balance <= 0.005 && paid > 0) newStatus = DocumentStatus.PAID;
                else if (paid > 0) newStatus = DocumentStatus.PARTIALLY_PAID;
                else if (inv.status !== DocumentStatus.DRAFT) newStatus = DocumentStatus.FINALIZED;
                
                return { ...inv, status: newStatus };
            }
            return inv;
        });
        setInvoices(updatedInvoices);
        
        addToast(`Payment ${isEditMode ? 'updated' : 'recorded'} successfully!`, 'success');
        // FIX: Trigger navigation via useEffect
        setShouldNavigate(true);
    };

    if (!customer) return <div className="bg-white p-6 rounded-lg shadow-md">Loading or invalid selection...</div>;
    
    const formElementClasses = "block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
    const labelClasses = "block text-sm font-medium leading-6 text-slate-900";


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
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4">
                    <div>
                        <h2 className="text-2xl font-semibold leading-6 text-slate-900">{isEditMode ? 'Edit Payment' : 'Record Payment'}</h2>
                        <p className="mt-1 text-sm text-slate-600">For: <span className="font-medium text-indigo-600">{customer.name}</span></p>
                    </div>
                    <div className="flex items-center justify-end space-x-3 mt-4 sm:mt-0">
                        <button type="button" onClick={() => navigate('/payments')} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
                        <button type="button" onClick={handleSubmit} className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
                        <CheckCircleIcon className="w-5 h-5"/> <span>{isEditMode ? 'Update Payment' : 'Record Payment'}</span>
                        </button>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-lg">
                    <h3 className="text-base font-semibold leading-6 text-slate-900 border-b border-slate-200 px-4 py-3">Payment Details</h3>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label htmlFor="paymentAmount" className={labelClasses}>Total Amount</label>
                            <div className="mt-2"><input type="number" name="amount" id="paymentAmount" value={paymentDetails.amount} onChange={handleDetailChange} step="0.01" min="0" className={formElementClasses} /></div>
                        </div>
                        <div>
                            <label htmlFor="paymentDate" className={labelClasses}>Payment Date</label>
                            <div className="mt-2"><input type="date" name="date" id="paymentDate" value={paymentDetails.date} onChange={handleDetailChange} className={formElementClasses}/></div>
                        </div>
                        <div>
                            <label htmlFor="paymentMethod" className={labelClasses}>Method</label>
                            <div className="mt-2">
                                <select name="method" id="paymentMethod" value={paymentDetails.method} onChange={handleDetailChange} className={formElementClasses}>
                                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="paymentReference" className={labelClasses}>Reference <span className="text-slate-500">(optional)</span></label>
                            <div className="mt-2"><input type="text" name="reference" id="paymentReference" value={paymentDetails.reference} onChange={handleDetailChange} className={formElementClasses}/></div>
                        </div>
                    </div>
                </div>
                
                <div className="border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-center border-b border-slate-200 px-4 py-3">
                        <div>
                            <h3 className="text-base font-semibold leading-6 text-slate-900">Invoice Allocations</h3>
                            <p className="mt-1 text-sm text-slate-500">Apply the payment amount to open invoices.</p>
                        </div>
                        <div className={`text-sm font-medium p-2 rounded-md ${unallocatedAmount.toFixed(2) !== '0.00' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            Unallocated: R {unallocatedAmount.toFixed(2)}
                        </div>
                    </div>
                    <div className="p-4">
                        {openInvoices.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className="text-sm text-slate-600">
                                        <tr>
                                            <th className="py-2 text-left font-semibold">Invoice #</th>
                                            <th className="py-2 text-left font-semibold">Date</th>
                                            <th className="py-2 text-right font-semibold">Balance Due</th>
                                            <th className="py-2 text-right font-semibold w-48">Allocation Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {openInvoices.map(invoice => {
                                            const otherPayments = isEditMode ? payments.filter(p => p.id !== paymentId) : payments;
                                            const balance = calculateBalanceDue(invoice, otherPayments);
                                            return (
                                                <tr key={invoice.id} className="border-t border-slate-200">
                                                    <td className="py-3 text-sm font-medium text-indigo-600">{invoice.invoiceNumber}</td>
                                                    <td className="py-3 text-sm text-slate-500">{invoice.date}</td>
                                                    <td className="py-3 text-sm text-slate-500 text-right">R {balance.toFixed(2)}</td>
                                                    <td className="py-3 text-right">
                                                        <input 
                                                            type="number" 
                                                            value={allocations[invoice.id] || ''} 
                                                            onChange={e => handleAllocationChange(invoice.id, e.target.value)} 
                                                            className={`${formElementClasses} text-right`} 
                                                            placeholder="0.00"
                                                            max={balance}
                                                            step="0.01"
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 p-4">No open invoices for this customer.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};