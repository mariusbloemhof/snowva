

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
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h2 className="text-2xl font-semibold text-text-primary">Customer Statements</h2>
                <div className="relative w-full md:w-auto">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon/></span>
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-ui-stroke rounded-md w-full md:w-64 focus:ring-snowva-blue focus:border-snowva-blue"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-3 font-semibold text-sm">Customer</th>
                            <th className="p-3 font-semibold text-sm text-right">Total Due</th>
                            <th className="p-3 font-semibold text-sm text-right">Current</th>
                            <th className="p-3 font-semibold text-sm text-right">30 Days</th>
                            <th className="p-3 font-semibold text-sm text-right">60 Days</th>
                            <th className="p-3 font-semibold text-sm text-right">90+ Days</th>
                            <th className="p-3 font-semibold text-sm text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customerStatements.map(data => (
                            <tr key={data.customer.id} className="border-b hover:bg-slate-50">
                                <td className="p-3 font-medium">{data.customer.name}</td>
                                <td className="p-3 text-right font-bold">{formatCurrency(data.totalBalance)}</td>
                                <td className="p-3 text-right">{formatCurrency(data.aging.current)}</td>
                                <td className="p-3 text-right text-orange-600">{formatCurrency(data.aging.days30)}</td>
                                <td className="p-3 text-right text-red-600">{formatCurrency(data.aging.days60)}</td>
                                <td className="p-3 text-right text-red-800 font-bold">{formatCurrency(data.aging.days90 + data.aging.days120plus)}</td>
                                <td className="p-3 text-center">
                                    <button onClick={() => navigate(`/statements/${data.customer.id}`)} className="text-blue-600 hover:text-blue-800" title="View Statement">
                                        <EyeIcon />
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
    );
};
