import React from 'react';
import { ChartBarIcon, DocumentTextIcon, UsersIcon, CollectionIcon } from './Icons';
import { invoices, quotes, customers } from '../constants';
import { DocumentStatus } from '../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string; iconColor: string; }> = ({ title, value, icon, color, iconColor }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center">
    <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg mr-4 ${color} ${iconColor}`}>
      {/* FIX: Cast the icon to a ReactElement that accepts a className prop to resolve the TypeScript error with React.cloneElement. */}
      {/* The generic React.ReactNode type for the icon prop doesn't provide enough information for TypeScript to know that 'className' is a valid prop. */}
      {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-6 w-6" })}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const totalRevenue = invoices
    .filter(inv => inv.status === DocumentStatus.PAID)
    .reduce((sum, inv) => sum + inv.items.reduce((itemSum, item) => itemSum + item.quantity * item.unitPrice, 0), 0)
    .toFixed(2);
    
  const draftQuotes = quotes.filter(q => q.status === DocumentStatus.DRAFT).length;
  const openInvoices = invoices.filter(inv => inv.status === DocumentStatus.FINALIZED || inv.status === DocumentStatus.PARTIALLY_PAID).length;
  const totalCustomers = customers.length;

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue (Paid)" value={`R ${totalRevenue}`} icon={<ChartBarIcon />} color="bg-green-100" iconColor="text-green-600" />
        <StatCard title="Active Customers" value={totalCustomers} icon={<UsersIcon />} color="bg-blue-100" iconColor="text-blue-600" />
        <StatCard title="Draft Quotes" value={draftQuotes} icon={<DocumentTextIcon />} color="bg-yellow-100" iconColor="text-yellow-600" />
        <StatCard title="Open Invoices" value={openInvoices} icon={<CollectionIcon />} color="bg-red-100" iconColor="text-red-600" />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Invoices</h3>
          <ul className="divide-y divide-slate-200">
            {invoices.slice(0, 5).map(inv => (
              <li key={inv.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-800">{customers.find(c => c.id === inv.customerId)?.name}</p>
                  <p className="text-sm text-slate-500">{inv.invoiceNumber}</p>
                </div>
                 <span className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center ${
                    inv.status === DocumentStatus.PAID ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' :
                    inv.status === DocumentStatus.FINALIZED ? 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20' : 
                    inv.status === DocumentStatus.PARTIALLY_PAID ? 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20' : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20'
                }`}>{inv.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Quotes</h3>
            <ul className="divide-y divide-slate-200">
                {quotes.slice(0, 5).map(quote => (
                <li key={quote.id} className="py-3 flex justify-between items-center">
                    <div>
                    <p className="font-medium text-slate-800">{customers.find(c => c.id === quote.customerId)?.name}</p>
                    <p className="text-sm text-slate-500">{quote.quoteNumber}</p>
                    </div>
                     <span className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center ${
                        quote.status === DocumentStatus.ACCEPTED ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' :
                        quote.status === DocumentStatus.REJECTED ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' : 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20'
                    }`}>{quote.status}</span>
                </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
};