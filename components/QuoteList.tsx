
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { quotes, customers, VAT_RATE } from '../constants';
import { DocumentStatus } from '../types';
import { PencilIcon, EyeIcon, PlusIcon } from './Icons';

export const QuoteList: React.FC = () => {
    const navigate = useNavigate();

    const calculateTotal = (items: any[]) => {
        const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        return subtotal * (1 + VAT_RATE);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Quotes</h2>
                <button
                    onClick={() => navigate('/quotes/new')}
                    className="flex items-center bg-snowva-orange text-white px-4 py-2 rounded-md hover:bg-snowva-orange-dark transition-colors">
                    <PlusIcon />
                    <span className="ml-2">New Quote</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="p-3">Quote #</th>
                            <th className="p-3">Customer</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Total</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotes.map(quote => (
                            <tr key={quote.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-medium">{quote.quoteNumber}</td>
                                <td className="p-3">{customers.find(c => c.id === quote.customerId)?.name}</td>
                                <td className="p-3">{quote.date}</td>
                                <td className="p-3">R {calculateTotal(quote.items).toFixed(2)}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        quote.status === DocumentStatus.ACCEPTED ? 'bg-green-100 text-green-800' :
                                        quote.status === DocumentStatus.REJECTED ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                                    }`}>{quote.status}</span>
                                </td>
                                <td className="p-3">
                                    <div className="flex space-x-2">
                                        <button onClick={() => navigate(`/quotes/${quote.id}`)} className="text-blue-600 hover:text-blue-800">
                                            {quote.status === DocumentStatus.DRAFT ? <PencilIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};