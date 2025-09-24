
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Customer, Invoice, Payment, PaymentMethod, DocumentStatus, LineItem, PaymentAllocation } from '../types';
import { CheckCircleIcon } from './Icons';
import { calculateBalanceDue, calculatePaid, calculateTotal } from '../utils';
import { useToast } from '../contexts/ToastContext';

interface PaymentRecorderProps {
    customers: Customer[];
    invoices: Invoice[];
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    payments: Payment[];
    setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
    paymentId?: string;
}

export const PaymentRecorder: React.FC<PaymentRecorderProps> = ({ customers, invoices, setInvoices, payments, setPayments, paymentId }) => {
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
        
        // FIX: Add explicit types to sort callback parameters to prevent 'unknown' type error.
        return uniqueInvoices.sort((a: Invoice, b: Invoice) => a.date.localeCompare(b.date));
    }, [customer, invoices, isEditMode, allocations, customers]);

    useEffect(() => {
        if (isEditMode && existingPayment) {
            setPaymentDetails({
                date: existingPayment.date,
                amount: existingPayment.totalAmount,
                method: existingPayment.method,
                reference: existingPayment.reference || '',
            });
            setAllocations(existingPayment.allocations.reduce((acc, alloc) => {
                acc[alloc.invoiceId] = alloc.amount;
                return acc;
            }, {} as Record<string, number>));
        } else if (invoiceId) {
            const targetInvoice = invoices.find(i => i.id === invoiceId);
            if (targetInvoice) {
                const balance = calculateBalanceDue(targetInvoice, payments);
                const finalBalance = parseFloat(balance.toFixed(2));
                setPaymentDetails(prev => ({...prev, amount: finalBalance}));
                setAllocations({ [targetInvoice.id]: finalBalance });
            }
        }
    }, [isEditMode, existingPayment, invoiceId, invoices, payments]);

    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPaymentDetails(prev => ({ ...prev, [name]: name === 'amount' ? (parseFloat(value) || 0) : value }));
    };

    const handleAllocationChange = (invoiceId: string, value: string) => {
        let amount = parseFloat(value) || 0;
        const invoice = openInvoices.find(i => i.id === invoiceId);
        if (!invoice) return;

        const otherPayments = isEditMode ? payments.filter(p => p.id !== paymentId) : payments;
        // FIX: Add explicit type annotation to resolve 'unknown' type error.
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

    // FIX: Add explicit type hint to useMemo and reduce callback to ensure correct type inference.
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
                // FIX: Add explicit type annotation to resolve 'unknown' type error.
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
                // FIX: Add explicit type annotations to resolve 'unknown' type errors for numeric operations.
                const paid: number = calculatePaid(inv.id, newPayments);
                const total: number = calculateTotal(inv.items);
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
        navigate('/payments');
    };

    if (!customer) return <div className="bg-white p-6 rounded-lg shadow-md">Loading or invalid selection...</div>;
    
    const formElementClasses = "block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
    const labelClasses = "block text-sm font-medium leading-6 text-slate-900";


    return (
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
                                {Object.values(PaymentMethod).map(method => <option key={method} value={method}>{method}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="paymentReference" className={labelClasses}>Reference</label>
                        <div className="mt-2"><input type="text" name="reference" id="paymentReference" value={paymentDetails.reference} onChange={handleDetailChange} placeholder="e.g., Bank reference" className={formElementClasses}/></div>
                    </div>
                </div>
            </div>

            <div className="border border-slate-200 rounded-lg">
                <h3 className="text-base font-semibold leading-6 text-slate-900 border-b border-slate-200 px-4 py-3">Allocate Payment to Invoices</h3>
                <div className="p-4">
                {openInvoices.length > 0 ? (
                    <div className="overflow-x-auto max-h-96">
                            <table className="min-w-full divide-y divide-slate-300 text-sm">
                                <thead>
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left font-semibold text-slate-900 sm:pl-0">Invoice #</th>
                                        <th scope="col" className="px-3 py-3.5 text-left font-semibold text-slate-900">Customer</th>
                                        <th scope="col" className="px-3 py-3.5 text-left font-semibold text-slate-900">Date</th>
                                        <th scope="col" className="px-3 py-3.5 text-right font-semibold text-slate-900">Balance Due</th>
                                        <th scope="col" className="px-3 py-3.5 text-right font-semibold text-slate-900 w-1/4">Amount to Apply</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {openInvoices.map(inv => {
                                        const otherPayments = isEditMode ? payments.filter(p => p.id !== paymentId) : payments;
                                        const balance = calculateBalanceDue(inv, otherPayments);
                                        const invCustomer = customers.find(c => c.id === inv.customerId);
                                        return(
                                        <tr key={inv.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 font-medium text-slate-900 sm:pl-0">{inv.invoiceNumber}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-slate-500">{invCustomer?.name ?? 'N/A'}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-slate-500">{inv.date}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-slate-500 text-right">R {balance.toFixed(2)}</td>
                                            <td className="whitespace-nowrap px-3 py-4">
                                                <input type="number" value={allocations[inv.id] || ''} onChange={e => handleAllocationChange(inv.id, e.target.value)} placeholder="0.00" min="0" max={balance.toFixed(2)} step="0.01" className={`${formElementClasses} text-right`}/>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                ) : (
                    <p className="text-slate-600 italic p-4">This customer has no outstanding invoices.</p>
                )}
                </div>
            </div>

            {openInvoices.length > 0 && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 text-center md:text-left">Allocation Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg border text-center">
                            <p className="text-sm font-medium text-slate-600">Total Payment</p>
                            <p className="text-2xl font-bold text-slate-900">R {paymentDetails.amount.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border text-center">
                            <p className="text-sm font-medium text-slate-600">Total Allocated</p>
                            <p className="text-2xl font-bold text-slate-900">R {totalAllocated.toFixed(2)}</p>
                        </div>
                        <div className={`p-4 rounded-lg border text-center ${Math.abs(unallocatedAmount) > 0.005 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                            <p className={`text-sm font-medium ${Math.abs(unallocatedAmount) > 0.005 ? 'text-red-700' : 'text-green-700'}`}>Unallocated Amount</p>
                            <p className={`text-2xl font-bold ${Math.abs(unallocatedAmount) > 0.005 ? 'text-red-800' : 'text-green-800'}`}>R {unallocatedAmount.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
