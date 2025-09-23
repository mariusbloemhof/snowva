
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Payment, Customer } from '../types';
import { PencilIcon, PlusIcon, SelectorIcon, SearchIcon } from './Icons';

interface PaymentListProps {
    payments: Payment[];
    customers: Customer[];
}

type SortConfig = { key: keyof Payment | 'customerName'; direction: 'ascending' | 'descending'; } | null;

export const PaymentList: React.FC<PaymentListProps> = ({ payments, customers }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'descending' });

    const requestSort = (key: SortConfig['key']) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const processedPayments = useMemo(() => {
        let filteredPayments = [...payments];

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filteredPayments = filteredPayments.filter(p => {
                const customer = customers.find(c => c.id === p.customerId);
                return (
                    customer?.name.toLowerCase().includes(lowercasedFilter) ||
                    p.reference?.toLowerCase().includes(lowercasedFilter)
                );
            });
        }

        if (sortConfig !== null) {
            filteredPayments.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'customerName') {
                    aValue = customers.find(c => c.id === a.customerId)?.name || '';
                    bValue = customers.find(c => c.id === b.customerId)?.name || '';
                } else {
                    aValue = a[sortConfig.key as keyof Payment];
                    bValue = b[sortConfig.key as keyof Payment];
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return filteredPayments;
    }, [payments, searchTerm, sortConfig, customers]);

    const SortableHeader: React.FC<{ columnKey: SortConfig['key'], title: string }> = ({ columnKey, title }) => (
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 cursor-pointer" onClick={() => requestSort(columnKey)}>
            <div className="flex items-center">
                <span>{title}</span>
                {sortConfig?.key === columnKey ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : <SelectorIcon />}
            </div>
        </th>
    );

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div className="sm:flex-auto">
                    <h2 className="text-2xl font-semibold leading-6 text-slate-900">Payments</h2>
                    <p className="mt-2 text-sm text-slate-700">A list of all payments received from customers.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                     <button
                        onClick={() => navigate('/payments/new')}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        New Payment
                    </button>
                </div>
            </div>
             <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                 <div className="relative w-full md:w-80">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="w-5 h-5 text-slate-400"/></span>
                    <input
                        type="text"
                        placeholder="Search by customer or reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                </div>
            </div>
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-slate-300">
                            <thead>
                                <tr>
                                    <SortableHeader columnKey="date" title="Payment Date" />
                                    <SortableHeader columnKey="customerName" title="Customer" />
                                    <SortableHeader columnKey="totalAmount" title="Amount" />
                                    <SortableHeader columnKey="method" title="Method" />
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Reference</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Edit</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {processedPayments.map(payment => (
                                    <tr key={payment.id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{payment.date}</td>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">{customers.find(c => c.id === payment.customerId)?.name || 'N/A'}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">R {payment.totalAmount.toFixed(2)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{payment.method}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{payment.reference || 'N/A'}</td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                            <button onClick={() => navigate(`/payments/edit/${payment.id}`)} className="text-indigo-600 hover:text-indigo-900">
                                                <PencilIcon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {processedPayments.length === 0 && (
                            <div className="text-center p-8 text-slate-500">
                                No payments found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
