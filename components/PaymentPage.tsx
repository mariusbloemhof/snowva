
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
        <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-text-primary mb-4">Record Payment</h2>
            <p className="text-text-secondary mb-6">Search for a customer or an open invoice number to record and allocate a new payment.</p>
            
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><SearchIcon className="w-6 h-6 text-gray-400"/></span>
                <input
                    type="text"
                    placeholder="Search by customer name or invoice #..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 border border-ui-stroke rounded-md w-full text-lg focus:ring-snowva-blue focus:border-snowva-blue"
                />
            </div>
            
            {searchTerm.length >= 2 && (
                <div className="mt-4 border rounded-md max-h-96 overflow-y-auto">
                    {searchResults.length > 0 ? (
                        <ul>
                            {searchResults.map((result) => (
                                <li 
                                    key={`${result.type}-${result.data.id}`}
                                    onClick={() => handleSelect(result)}
                                    className="p-4 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium text-text-primary">
                                            {result.type === 'customer' ? result.data.name : result.data.invoiceNumber}
                                        </p>
                                        <p className="text-sm text-text-secondary">
                                            {result.type === 'invoice' && `Customer: ${customers.find(c => c.id === result.data.customerId)?.name}`}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${result.type === 'customer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                        {result.type === 'customer' ? 'Customer' : 'Invoice'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-text-secondary">
                            <p>No customers or open invoices found for "{searchTerm}".</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
