
import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Invoice, DocumentStatus, Payment, LineItem } from '../types';
import { customers, VAT_RATE } from '../constants';
import { PencilIcon, EyeIcon, PlusIcon, SelectorIcon, SearchIcon } from './Icons';

interface InvoiceListProps {
    invoices: Invoice[];
}

type SortConfig = { key: keyof Invoice | 'customerName' | 'balanceDue'; direction: 'ascending' | 'descending'; } | null;

const calculateTotal = (items: LineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    return subtotal * (1 + VAT_RATE);
};

const calculatePaid = (payments: Payment[]) => (payments || []).reduce((sum, p) => sum + p.amount, 0);

const calculateBalanceDue = (invoice: Invoice) => {
    const total = calculateTotal(invoice.items);
    const paid = calculatePaid(invoice.payments);
    return total - paid;
};


export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'descending' });

    const requestSort = (key: SortConfig['key']) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const processedInvoices = useMemo(() => {
        let filteredInvoices = [...invoices];

        if (statusFilter !== 'all') {
            filteredInvoices = filteredInvoices.filter(inv => inv.status === statusFilter);
        }

        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filteredInvoices = filteredInvoices.filter(inv => {
                const customer = customers.find(c => c.id === inv.customerId);
                return (
                    inv.invoiceNumber.toLowerCase().includes(lowercasedFilter) ||
                    customer?.name.toLowerCase().includes(lowercasedFilter)
                );
            });
        }

        if (sortConfig !== null) {
            filteredInvoices.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'customerName') {
                    aValue = customers.find(c => c.id === a.customerId)?.name || '';
                    bValue = customers.find(c => c.id === b.customerId)?.name || '';
                } else if (sortConfig.key === 'balanceDue') {
                    aValue = calculateBalanceDue(a);
                    bValue = calculateBalanceDue(b);
                } else {
                    aValue = a[sortConfig.key as keyof Invoice];
                    bValue = b[sortConfig.key as keyof Invoice];
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        return filteredInvoices;
    }, [invoices, searchTerm, statusFilter, sortConfig]);

    const SortableHeader: React.FC<{ columnKey: SortConfig['key'], title: string }> = ({ columnKey, title }) => (
        <th className="p-3 text-left font-semibold text-sm cursor-pointer" onClick={() => requestSort(columnKey)}>
            {title}
            {sortConfig?.key === columnKey ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : <SelectorIcon />}
        </th>
    );

    const getStatusClass = (status: DocumentStatus) => {
        switch (status) {
            case DocumentStatus.PAID: return 'bg-green-100 text-green-800';
            case DocumentStatus.PARTIALLY_PAID: return 'bg-orange-100 text-orange-800';
            case DocumentStatus.FINALIZED: return 'bg-yellow-100 text-yellow-800';
            case DocumentStatus.DRAFT: return 'bg-slate-100 text-slate-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-semibold text-text-primary">Invoices</h2>
                <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-auto">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                        <input
                            type="text"
                            placeholder="Search by # or customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-ui-stroke rounded-md w-full md:w-64 focus:ring-snowva-blue focus:border-snowva-blue"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
                        className="px-4 py-2 border border-ui-stroke rounded-md w-full md:w-auto focus:ring-snowva-blue focus:border-snowva-blue"
                    >
                        <option value="all">All Statuses</option>
                        <option value={DocumentStatus.DRAFT}>Draft</option>
                        <option value={DocumentStatus.FINALIZED}>Finalized</option>
                        <option value={DocumentStatus.PARTIALLY_PAID}>Partially Paid</option>
                        <option value={DocumentStatus.PAID}>Paid</option>
                    </select>
                    <button
                        onClick={() => navigate('/invoices/new')}
                        className="flex items-center bg-snowva-orange text-white px-4 py-2 rounded-md hover:bg-snowva-orange-dark transition-colors w-full md:w-auto justify-center">
                        <PlusIcon />
                        <span className="ml-2">New Invoice</span>
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead>
                        <tr className="bg-slate-100">
                            <SortableHeader columnKey="invoiceNumber" title="Invoice #" />
                            <SortableHeader columnKey="customerName" title="Customer" />
                            <SortableHeader columnKey="date" title="Date" />
                            <SortableHeader columnKey="balanceDue" title="Balance Due" />
                            <SortableHeader columnKey="status" title="Status" />
                            <th className="p-3 text-left font-semibold text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedInvoices.map(invoice => (
                            <tr key={invoice.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-medium">
                                    <Link to={`/invoices/${invoice.id}`} className="text-snowva-blue hover:underline">
                                        {invoice.invoiceNumber}
                                    </Link>
                                </td>
                                <td className="p-3">{customers.find(c => c.id === invoice.customerId)?.name || 'N/A'}</td>
                                <td className="p-3">{invoice.date}</td>
                                <td className="p-3">R {calculateBalanceDue(invoice).toFixed(2)}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(invoice.status)}`}>
                                        {invoice.status}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <Link to={`/invoices/${invoice.id}`} className="text-blue-600 hover:text-blue-800">
                                        {invoice.status === DocumentStatus.DRAFT ? <PencilIcon /> : <EyeIcon />}
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
