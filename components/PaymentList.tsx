
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
        <th className="p-3 text-left font-semibold text-sm cursor-pointer" onClick={() => requestSort(columnKey)}>
            {title}
            {sortConfig?.key === columnKey ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : <SelectorIcon />}
        </th>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-semibold text-text-primary">Payments</h2>
                <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-auto">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                        <input
                            type="text"
                            placeholder="Search by customer or reference..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-ui-stroke rounded-md w-full md:w-64 focus:ring-snowva-blue focus:border-snowva-blue"
                        />
                    </div>
                    <button
                        onClick={() => navigate('/payments/new')}
                        className="flex items-center bg-snowva-orange text-white px-4 py-2 rounded-md hover:bg-snowva-orange-dark transition-colors w-full md:w-auto justify-center">
                        <PlusIcon />
                        <span className="ml-2">New Payment</span>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead>
                        <tr className="bg-slate-100">
                            <SortableHeader columnKey="date" title="Payment Date" />
                            <SortableHeader columnKey="customerName" title="Customer" />
                            <SortableHeader columnKey="totalAmount" title="Amount" />
                            <SortableHeader columnKey="method" title="Method" />
                            <th className="p-3 text-left font-semibold text-sm">Reference</th>
                            <th className="p-3 text-left font-semibold text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedPayments.map(payment => (
                            <tr key={payment.id} className="border-b hover:bg-slate-50">
                                <td className="p-3">{payment.date}</td>
                                <td className="p-3 font-medium">{customers.find(c => c.id === payment.customerId)?.name || 'N/A'}</td>
                                <td className="p-3">R {payment.totalAmount.toFixed(2)}</td>
                                <td className="p-3">{payment.method}</td>
                                <td className="p-3">{payment.reference || 'N/A'}</td>
                                <td className="p-3">
                                    <button onClick={() => navigate(`/payments/edit/${payment.id}`)} className="text-blue-600 hover:text-blue-800">
                                        <PencilIcon />
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
    );
};
