
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
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div className="sm:flex-auto">
                    <h2 className="text-2xl font-semibold leading-6 text-slate-900">Quotes</h2>
                     <p className="mt-2 text-sm text-slate-700">A list of all quotes that have been generated.</p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    <button
                        onClick={() => navigate('/quotes/new')}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        New Quote
                    </button>
                </div>
            </div>
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-slate-300">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Quote #</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Customer</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Date</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Total</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Edit</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {quotes.map(quote => (
                                    <tr key={quote.id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">{quote.quoteNumber}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{customers.find(c => c.id === quote.customerId)?.name}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{quote.date}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">R {calculateTotal(quote.items).toFixed(2)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                quote.status === DocumentStatus.ACCEPTED ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                quote.status === DocumentStatus.REJECTED ? 'bg-red-50 text-red-700 ring-red-600/20' : 'bg-slate-50 text-slate-600 ring-slate-500/20'
                                            }`}>{quote.status}</span>
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                            <button onClick={() => navigate(`/quotes/${quote.id}`)} className="text-indigo-600 hover:text-indigo-900">
                                                {quote.status === DocumentStatus.DRAFT ? <PencilIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                                            </button>
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
