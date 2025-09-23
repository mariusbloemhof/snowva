



import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Invoice, DocumentStatus, Payment } from '../types';
import { customers } from '../constants';
import { PencilIcon, EyeIcon, PlusIcon, SelectorIcon, SearchIcon } from './Icons';
import { calculateBalanceDue } from '../utils';

interface InvoiceListProps {
    invoices: Invoice[];
    payments: Payment[];
}

type SortConfig = { key: keyof Invoice | 'customerName' | 'balanceDue'; direction: 'ascending' | 'descending'; } | null;

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, payments }) => {
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
                    aValue = calculateBalanceDue(a, payments);
                    bValue = calculateBalanceDue(b, payments);
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
    }, [invoices, searchTerm, statusFilter, sortConfig, payments]);

    const SortableHeader: React.FC<{ columnKey: SortConfig['key'], title: string }> = ({ columnKey, title }) => (
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 cursor-pointer" onClick={() => requestSort(columnKey)}>
             <div className="flex items-center">
                <span>{title}</span>
                {sortConfig?.key === columnKey ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : <SelectorIcon />}
            </div>
        </th>
    );

    const getStatusClass = (status: DocumentStatus) => {
        switch (status) {
            case DocumentStatus.PAID: return 'bg-green-50 text-green-700 ring-green-600/20';
            case DocumentStatus.PARTIALLY_PAID: return 'bg-orange-50 text-orange-700 ring-orange-600/20';
            case DocumentStatus.FINALIZED: return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
            case DocumentStatus.DRAFT: return 'bg-slate-50 text-slate-600 ring-slate-500/20';
            default: return 'bg-gray-50 text-gray-600 ring-gray-500/20';
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div className="sm:flex-auto">
                    <h2 className="text-2xl font-semibold leading-6 text-slate-900">Invoices</h2>
                    <p className="mt-2 text-sm text-slate-700">A list of all invoices including customer, dates, and payment status.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        onClick={() => navigate('/invoices/new')}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        New Invoice
                    </button>
                </div>
            </div>
             <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="relative w-full md:w-80">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="w-5 h-5 text-slate-400"/></span>
                    <input
                        type="text"
                        placeholder="Search by # or customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
                    className="block w-full md:w-auto rounded-md border-0 py-1.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                    <option value="all">All Statuses</option>
                    <option value={DocumentStatus.DRAFT}>Draft</option>
                    <option value={DocumentStatus.FINALIZED}>Finalized</option>
                    <option value={DocumentStatus.PARTIALLY_PAID}>Partially Paid</option>
                    <option value={DocumentStatus.PAID}>Paid</option>
                </select>
            </div>
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-slate-300">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Invoice #</th>
                                    <SortableHeader columnKey="customerName" title="Customer" />
                                    <SortableHeader columnKey="date" title="Date" />
                                    <SortableHeader columnKey="balanceDue" title="Balance Due" />
                                    <SortableHeader columnKey="status" title="Status" />
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Edit</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {processedInvoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">
                                            <Link to={`/invoices/${invoice.id}`} className="text-indigo-600 hover:text-indigo-900">
                                                {invoice.invoiceNumber}
                                            </Link>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{customers.find(c => c.id === invoice.customerId)?.name || 'N/A'}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{invoice.date}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">R {calculateBalanceDue(invoice, payments).toFixed(2)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusClass(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                            <Link to={`/invoices/${invoice.id}`} className="text-indigo-600 hover:text-indigo-900">
                                                {invoice.status === DocumentStatus.DRAFT ? <PencilIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
