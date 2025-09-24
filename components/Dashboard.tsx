
import React from 'react';
import { Link } from 'react-router-dom';
import {
    CollectionIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    UsersIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    PlusIcon,
} from './Icons';
import { invoices, quotes, customers, payments } from '../constants';
import { DocumentStatus } from '../types';
import { calculateTotal, calculateBalanceDue } from '../utils';

const StatCard: React.FC<{
    title: string;
    value: string;
    // FIX: Correctly typed the `icon` prop to allow `className`, resolving an error with React.cloneElement.
    icon: React.ReactElement<{ className?: string }>;
    iconBgColor: string;
    iconColor: string;
    changeValue?: string;
    changeType?: 'up' | 'down';
    linkTo: string;
    linkState?: object;
}> = ({ title, value, icon, iconBgColor, iconColor, changeValue, changeType, linkTo, linkState }) => {
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
            <div className="mt-5">
                <Link to={linkTo} state={linkState} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    View all
                </Link>
            </div>
        </div>
    );
};


export const Dashboard: React.FC = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const openInvoices = invoices.filter(inv => inv.status === DocumentStatus.FINALIZED || inv.status === DocumentStatus.PARTIALLY_PAID);
    
    const totalOutstanding = openInvoices.reduce((sum, inv) => sum + calculateBalanceDue(inv, payments), 0);
    const overdueInvoices = openInvoices.filter(inv => inv.dueDate && inv.dueDate < todayStr);
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + calculateBalanceDue(inv, payments), 0);

    const paidLast30Days = payments
        .filter(p => p.date >= thirtyDaysAgoStr)
        .reduce((sum, p) => sum + p.totalAmount, 0);

    const formatCurrency = (amount: number) => `R ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;
    
    const recentInvoices = [...invoices].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    const recentQuotes = [...quotes].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    
    const atRiskInvoices = overdueInvoices
        .sort((a, b) => (a.dueDate || a.date).localeCompare(b.dueDate || b.date))
        .slice(0, 5);
        
    const getDaysOverdue = (dueDate: string) => {
        const due = new Date(dueDate);
        const today = new Date();
        const diffTime = Math.max(0, today.getTime() - due.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    
    const getStatusClass = (status: DocumentStatus) => {
        switch (status) {
            case DocumentStatus.PAID: return 'bg-green-100 text-green-700';
            case DocumentStatus.PARTIALLY_PAID: return 'bg-orange-100 text-orange-700';
            case DocumentStatus.FINALIZED: return 'bg-yellow-100 text-yellow-800';
            case DocumentStatus.DRAFT: return 'bg-slate-100 text-slate-600';
            case DocumentStatus.ACCEPTED: return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };


    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="mt-1 text-sm text-slate-500">Welcome back! Here's a summary of your business.</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <Link to="/invoices/new" className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                        <PlusIcon className="h-5 w-5" />
                        <span>New Invoice</span>
                    </Link>
                    <Link to="/quotes/new" className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                        New Quote
                    </Link>
                </div>
            </div>

            <div>
                <h2 className="text-base font-semibold text-slate-600">Last 30 days</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Outstanding" value={formatCurrency(totalOutstanding)} icon={<CollectionIcon />} iconBgColor="bg-indigo-100" iconColor="text-indigo-600" changeValue="5.2%" changeType="down" linkTo="/invoices" linkState={{ preFilter: 'open' }} />
                <StatCard title="Total Overdue" value={formatCurrency(totalOverdue)} icon={<ExclamationCircleIcon />} iconBgColor="bg-red-100" iconColor="text-red-600" changeValue="2.1%" changeType="up" linkTo="/invoices" linkState={{ preFilter: 'overdue' }} />
                <StatCard title="Paid" value={formatCurrency(paidLast30Days)} icon={<CheckCircleIcon />} iconBgColor="bg-green-100" iconColor="text-green-600" changeValue="12.5%" changeType="up" linkTo="/payments" />
                <StatCard title="Active Customers" value={customers.length.toString()} icon={<UsersIcon />} iconBgColor="bg-indigo-100" iconColor="text-indigo-600" changeValue="2" changeType="up" linkTo="/customers" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Invoices</h3>
                        <div className="flow-root">
                            <ul className="-my-4 divide-y divide-slate-100">
                                {recentInvoices.map(inv => (
                                <li key={inv.id}>
                                    <Link to={`/invoices/${inv.id}`} className="flex items-center justify-between gap-x-6 py-4 hover:bg-slate-50/80 px-2 -mx-2 rounded-lg">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">{inv.invoiceNumber}</p>
                                            <p className="text-sm text-slate-500 truncate">{customers.find(c => c.id === inv.customerId)?.name}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-medium text-slate-800">{formatCurrency(calculateTotal(inv.items))}</p>
                                             <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Quotes</h3>
                        <div className="flow-root">
                           <ul className="-my-4 divide-y divide-slate-100">
                                {recentQuotes.map(q => (
                                <li key={q.id}>
                                    <Link to={`/quotes/${q.id}`} className="flex items-center justify-between gap-x-6 py-4 hover:bg-slate-50/80 px-2 -mx-2 rounded-lg">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 truncate">{q.quoteNumber}</p>
                                            <p className="text-sm text-slate-500 truncate">{customers.find(c => c.id === q.customerId)?.name}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-medium text-slate-800">{formatCurrency(calculateTotal(q.items))}</p>
                                             <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(q.status)}`}>
                                                {q.status}
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">
                        Attention Required
                    </h3>
                    <div className="flow-root">
                        <ul className="-my-4 divide-y divide-slate-100">
                            {atRiskInvoices.length > 0 ? atRiskInvoices.map(inv => (
                               <li key={inv.id}>
                                    <Link to={`/invoices/${inv.id}`} className="block py-4 hover:bg-slate-50/80 px-2 -mx-2 rounded-lg">
                                        <div className="flex items-center justify-between gap-x-4">
                                            <p className="font-semibold text-slate-800 truncate">{customers.find(c => c.id === inv.customerId)?.name}</p>
                                            <p className="font-medium text-slate-800">{formatCurrency(calculateBalanceDue(inv, payments))}</p>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between gap-x-4 text-sm">
                                            <p className="text-slate-500 truncate">{inv.invoiceNumber}</p>
                                            <p className="font-semibold text-red-500">{getDaysOverdue(inv.dueDate!)} days overdue</p>
                                        </div>
                                    </Link>
                                </li>
                            )) : (
                                <div className="text-center py-8">
                                    <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto"/>
                                    <p className="mt-2 text-sm text-slate-600 font-medium">All Clear!</p>
                                    <p className="mt-1 text-xs text-slate-500">No overdue invoices right now.</p>
                                </div>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
