
import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { AppContextType, CustomerType } from '../types';
import { getStatementDataForCustomer } from '../utils';
import { ArrowDownIcon, ArrowLeftIcon, ArrowUpIcon, CheckCircleIcon, CollectionIcon, ExclamationCircleIcon, EyeIcon, SearchIcon, UsersIcon } from './Icons';

const StatCard: React.FC<{
    title: string;
    value: string;
    // FIX: Correctly typed the `icon` prop to allow `className`, resolving an error with React.cloneElement.
    icon: React.ReactElement<{ className?: string }>;
    iconBgColor: string;
    iconColor: string;
    changeValue?: string;
    changeType?: 'up' | 'down';
}> = ({ title, value, icon, iconBgColor, iconColor, changeValue, changeType }) => {
    const changeColor = changeType === 'up' ? 'text-green-500' : 'text-red-500';

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
            <div className="flex-1">
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center h-11 w-11 rounded-lg ${iconBgColor}`}>
                        {React.cloneElement(icon, { className: `h-6 w-6 ${iconColor}` })}
                    </div>
                </div>
                <div className="mt-3">
                    <p className="text-sm font-medium text-slate-600">{title}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900">{value}</span>
                         {changeValue && (
                            <span className={`inline-flex items-center text-sm font-semibold ${changeColor}`}>
                                {changeType === 'up' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                                {changeValue}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


export const StatementPage: React.FC = () => {
    const { customers, invoices, payments } = useOutletContext<AppContextType>();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const statementCustomers = useMemo(() => {
        return customers.filter(c => 
            c.type === CustomerType.B2B && !(c.parentCompanyId && c.billToParent)
        );
    }, [customers]);

    const allStatementsData = useMemo(() => {
        return statementCustomers
            .map(customer => {
                const statementData = getStatementDataForCustomer(customer.id, customers, invoices, payments);
                if (!statementData || statementData.totalBalance < 0.01) {
                    return null;
                }
                return { customer, ...statementData };
            })
            .filter((data): data is NonNullable<typeof data> => data !== null);
    }, [statementCustomers, customers, invoices, payments]);

    const summaryData = useMemo(() => {
        return allStatementsData.reduce((acc, statement) => {
            const isOverdue = statement.aging.days30 > 0 || statement.aging.days60 > 0 || statement.aging.days90 > 0 || statement.aging.days120plus > 0;
            
            acc.totalOutstanding += statement.totalBalance;
            acc.totalCurrent += statement.aging.current;
            
            if (isOverdue) {
                acc.customersOverdue += 1;
                acc.totalOverdue += statement.aging.days30 + statement.aging.days60 + statement.aging.days90 + statement.aging.days120plus;
            }
            return acc;
        }, {
            totalOutstanding: 0,
            customersOverdue: 0,
            totalCurrent: 0,
            totalOverdue: 0,
        });
    }, [allStatementsData]);

    const filteredStatements = useMemo(() => {
        return allStatementsData
            .filter(data => {
                if (!searchTerm) return true;
                return data.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => b.totalBalance - a.totalBalance);
    }, [allStatementsData, searchTerm]);

    const formatCurrency = (amount: number) => `R ${amount.toFixed(2)}`;

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="sm:flex sm:items-center sm:justify-between mb-6">
                <div className="sm:flex-auto">
                    <div className="flex items-center gap-x-3">
                        <button 
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center rounded-md p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-2xl font-semibold leading-6 text-slate-900">Customer Statements</h2>
                            <p className="mt-2 text-sm text-slate-700">A summary of all customers with outstanding balances.</p>
                        </div>
                    </div>
                </div>
                 <div className="relative mt-4 sm:mt-0 w-full md:w-80">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="w-5 h-5 text-slate-400"/></span>
                    <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input pl-10"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Outstanding" value={formatCurrency(summaryData.totalOutstanding)} icon={<CollectionIcon />} iconBgColor="bg-indigo-100" iconColor="text-indigo-600" changeValue="R 1.2k" changeType="up" />
                <StatCard title="Customers Overdue" value={summaryData.customersOverdue.toString()} icon={<UsersIcon />} iconBgColor="bg-yellow-100" iconColor="text-yellow-600" changeValue="1" changeType="down" />
                <StatCard title="Total Current" value={formatCurrency(summaryData.totalCurrent)} icon={<CheckCircleIcon />} iconBgColor="bg-green-100" iconColor="text-green-600" />
                <StatCard title="Total Overdue" value={formatCurrency(summaryData.totalOverdue)} icon={<ExclamationCircleIcon />} iconBgColor="bg-red-100" iconColor="text-red-600" />
            </div>
            
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="table-base">
                            <thead className="table-header">
                                <tr>
                                    <th scope="col" className="py-3 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Customer</th>
                                    <th scope="col" className="px-3 py-3 text-right text-sm font-semibold text-slate-900">Total Due</th>
                                    <th scope="col" className="px-3 py-3 text-right text-sm font-semibold text-slate-900">Current</th>
                                    <th scope="col" className="px-3 py-3 text-right text-sm font-semibold text-slate-900">30 Days</th>
                                    <th scope="col" className="px-3 py-3 text-right text-sm font-semibold text-slate-900">60 Days</th>
                                    <th scope="col" className="px-3 py-3 text-right text-sm font-semibold text-slate-900">90+ Days</th>
                                    <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-0 text-center">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredStatements.map(data => (
                                    <tr key={data.customer.id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">
                                            <Link to={`/customers/${data.customer.id}`} className="text-indigo-600 hover:text-indigo-900">
                                                {data.customer.name}
                                            </Link>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-500 text-right font-bold">{formatCurrency(data.totalBalance)}</td>
                                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-slate-500 text-right">{formatCurrency(data.aging.current)}</td>
                                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-orange-600 text-right">{formatCurrency(data.aging.days30)}</td>
                                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-red-600 text-right">{formatCurrency(data.aging.days60)}</td>
                                        <td className="whitespace-nowrap px-3 py-3.5 text-sm text-red-800 font-bold text-right">{formatCurrency(data.aging.days90 + data.aging.days120plus)}</td>
                                        <td className="whitespace-nowrap py-3.5 pl-3 pr-4 text-center text-sm font-medium">
                                            <Link to={`/statements/${data.customer.id}`} className="text-indigo-600 hover:text-indigo-900" title="View Statement">
                                                <EyeIcon className="w-5 h-5"/>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {allStatementsData.length === 0 ? (
                             <div className="text-center p-8 text-slate-500">
                                No customers with outstanding balances.
                            </div>
                        ) : filteredStatements.length === 0 && (
                            <div className="text-center p-8 text-slate-500">
                                No customers matching "{searchTerm}" found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
