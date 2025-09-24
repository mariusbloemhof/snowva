import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Customer, Invoice, Quote, Payment, DocumentStatus } from '../types';
import { calculateTotal } from '../utils';
import { EyeIcon } from './Icons';

interface CustomerHistoryTabProps {
    customer: Omit<Customer, 'id'> & { id?: string };
    customers: Customer[];
    invoices: Invoice[];
    quotes: Quote[];
    payments: Payment[];
}

interface DisplayTransaction {
    id: string;
    date: string;
    type: 'Invoice' | 'Quote' | 'Payment';
    reference: string;
    amount: number;
    status: string;
    link: string;
}

export const CustomerHistoryTab: React.FC<CustomerHistoryTabProps> = ({ customer, customers, invoices, quotes, payments }) => {
    
    const transactions = useMemo<DisplayTransaction[]>(() => {
        if (!customer.id) return [];

        const relevantCustomerIds = new Set<string>([customer.id]);
        customers.forEach(c => {
            if (c.parentCompanyId === customer.id) {
                relevantCustomerIds.add(c.id);
            }
        });

        const customerInvoices: DisplayTransaction[] = invoices
            .filter(i => relevantCustomerIds.has(i.customerId))
            .map(i => ({
                id: i.id,
                date: i.date,
                type: 'Invoice',
                reference: i.invoiceNumber,
                amount: calculateTotal(i.items),
                status: i.status,
                link: `/invoices/${i.id}`
            }));

        const customerPayments: DisplayTransaction[] = payments
            .filter(p => p.customerId === customer.id)
            .map(p => ({
                id: p.id,
                date: p.date,
                type: 'Payment',
                reference: p.reference || `PAY-${p.id.slice(-4)}`,
                amount: p.totalAmount,
                status: 'Completed',
                link: `/payments/edit/${p.id}`
            }));

        const customerQuotes: DisplayTransaction[] = quotes
            .filter(q => relevantCustomerIds.has(q.customerId))
            .map(q => ({
                id: q.id,
                date: q.date,
                type: 'Quote',
                reference: q.quoteNumber,
                amount: calculateTotal(q.items),
                status: q.status,
                link: `/quotes/${q.id}`
            }));

        const allTransactions = [...customerInvoices, ...customerPayments, ...customerQuotes];
        return allTransactions.sort((a, b) => b.date.localeCompare(a.date));
    }, [customer, customers, invoices, payments, quotes]);

    const getStatusClass = (status: string) => {
        switch (status) {
            case DocumentStatus.PAID:
            case 'Completed':
            case DocumentStatus.ACCEPTED:
                return 'bg-green-50 text-green-700 ring-green-600/20';
            case DocumentStatus.PARTIALLY_PAID: return 'bg-orange-50 text-orange-700 ring-orange-600/20';
            case DocumentStatus.FINALIZED: return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
            case DocumentStatus.DRAFT: return 'bg-slate-50 text-slate-600 ring-slate-500/20';
            default: return 'bg-gray-50 text-gray-600 ring-gray-500/20';
        }
    };

    return (
        <div>
            <h2 className="text-base font-semibold leading-7 text-slate-900">Transaction History</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">A complete record of all activities for this customer.</p>

            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-slate-300">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Date</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Type</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Reference #</th>
                                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">Amount</th>
                                    <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-slate-900">Status</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">View</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {transactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-slate-500 sm:pl-0">{tx.date}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{tx.type}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900">{tx.reference}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 text-right">R {tx.amount.toFixed(2)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClass(tx.status)}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                            <Link to={tx.link} className="text-indigo-600 hover:text-indigo-900">
                                                <EyeIcon className="w-5 h-5"/>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {transactions.length === 0 && (
                            <div className="text-center p-8 text-slate-500">
                                No transactions found for this customer.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
