
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Invoice, Customer, DocumentStatus } from '../types';
import { SearchIcon } from './Icons';

interface PaymentPageProps {
    invoices: Invoice[];
    customers: Customer[];
}

type SearchResult = 
    | { type: 'customer', data: Customer }
    | { type: 'invoice', data: Invoice };

export const PaymentPage: React.FC<PaymentPageProps> = ({ invoices, customers }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const searchResults = useMemo((): SearchResult[] => {
        if (searchTerm.length < 2) return [];

        const lowercasedTerm = searchTerm.toLowerCase();
        
        const customerResults: SearchResult[] = customers
            .filter(c => c.name.toLowerCase().includes(lowercasedTerm))
            .map(c => ({ type: 'customer', data: c }));

        const invoiceResults: SearchResult[] = invoices
            .filter(i => 
                i.invoiceNumber.toLowerCase().includes(lowercasedTerm) &&
                i.status !== DocumentStatus.DRAFT &&
                i.status !== DocumentStatus.PAID
            )
            .map(i => ({ type: 'invoice', data: i }));

        return [...customerResults, ...invoiceResults];
    }, [searchTerm, customers, invoices]);

    const handleSelect = (result: SearchResult) => {
        if (result.type === 'customer') {
            navigate('/payments/record', { state: { customerId: result.data.id } });
        } else {
            navigate('/payments/record', { state: { invoiceId: result.data.id } });
        }
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 max-w-4xl mx-auto">
            <div className="text-center">
                <h2 className="text-2xl font-semibold leading-6 text-slate-900">Record Payment</h2>
                <p className="mt-2 text-sm text-slate-700">Search for a customer or an open invoice number to record and allocate a new payment.</p>
            </div>
            
            <div className="mt-6 max-w-xl mx-auto">
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by customer name or invoice #..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 bg-white py-2.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    />
                </div>
            </div>
            
            {searchTerm.length >= 2 && (
                <div className="mt-6 border rounded-lg max-h-96 overflow-y-auto">
                    {searchResults.length > 0 ? (
                        <ul className="divide-y divide-slate-200">
                            {searchResults.map((result) => (
                                <li 
                                    key={`${result.type}-${result.data.id}`}
                                    onClick={() => handleSelect(result)}
                                    className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            {result.type === 'customer' ? result.data.name : result.data.invoiceNumber}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {result.type === 'invoice' && `Customer: ${customers.find(c => c.id === result.data.customerId)?.name}`}
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${result.type === 'customer' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-green-50 text-green-700 ring-green-600/20'}`}>
                                        {result.type === 'customer' ? 'Customer' : 'Invoice'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            <p>No customers or open invoices found for "{searchTerm}".</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
