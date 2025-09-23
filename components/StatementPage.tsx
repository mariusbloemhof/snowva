

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, CustomerType, Invoice, Payment } from '../types';
import { getStatementDataForCustomer } from '../utils';
import { EyeIcon, SearchIcon } from './Icons';

interface StatementPageProps {
    customers: Customer[];
    invoices: Invoice[];
    payments: Payment[];
}

export const StatementPage: React.FC<StatementPageProps> = ({ customers, invoices, payments }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const statementCustomers = useMemo(() => {
        // Only B2B customers who are not children billing to a parent are eligible for their own statement list entry
        return customers.filter(c => 
            c.type === CustomerType.B2B && !(c.parentCompanyId && c.billToParent)
        );
    }, [customers]);

    const customerStatements = useMemo(() => {
        return statementCustomers
            .map(customer => {
                const statementData = getStatementDataForCustomer(customer.id, customers, invoices, payments);
                // We show customers with a balance due. 0 or credit balances are omitted from this summary view.
                if (!statementData || statementData.totalBalance < 0.01) {
                    return null;
                }
                return { customer, ...statementData };
            })
            .filter((data): data is NonNullable<typeof data> => data !== null)
            .filter(data => {
                if (!searchTerm) return true;
                return data.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => b.totalBalance - a.totalBalance);
    }, [statementCustomers, customers, invoices, payments, searchTerm]);

    const formatCurrency = (amount: number) => `R ${amount.toFixed(2)}`;

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div className="sm:flex-auto">
                    <h2 className="text-2xl font-semibold leading-6 text-slate-900">Customer Statements</h2>
                    <p className="mt-2 text-sm text-slate-700">A summary of all customers with outstanding balances.</p>
                </div>
                 <div className="relative mt-4 sm:mt-0 w-full md:w-80">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="w-5 h-5 text-slate-400"/></span>
                    <input
                        type="text"
                        placeholder="Search customers..."
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
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Customer</th>
                                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">Total Due</th>
                                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">Current</th>
                                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">30 Days</th>
                                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">60 Days</th>
                                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">90+ Days</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0 text-center">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {customerStatements.map(data => (
                                    <tr key={data.customer.id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">{data.customer.name}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 text-right font-bold">{formatCurrency(data.totalBalance)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 text-right">{formatCurrency(data.aging.current)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-orange-600 text-right">{formatCurrency(data.aging.days30)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-red-600 text-right">{formatCurrency(data.aging.days60)}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-red-800 font-bold text-right">{formatCurrency(data.aging.days90 + data.aging.days120plus)}</td>
                                        <td className="whitespace-nowrap py-4 pl-3 pr-4 text-center text-sm font-medium">
                                            <button onClick={() => navigate(`/statements/${data.customer.id}`)} className="text-indigo-600 hover:text-indigo-900" title="View Statement">
                                                <EyeIcon className="w-5 h-5"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {customerStatements.length === 0 && (
                            <div className="text-center p-8 text-slate-500">
                                {searchTerm 
                                    ? `No customers matching "${searchTerm}" found.`
                                    : "No customers with outstanding balances."
                                }
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
