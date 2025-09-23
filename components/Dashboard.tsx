
import React from 'react';
import { ChartBarIcon, DocumentTextIcon, UsersIcon, CollectionIcon } from './Icons';
import { invoices, quotes, customers } from '../constants';
import { DocumentStatus } from '../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
    <div className={`p-3 rounded-full mr-4 ${color}`}>
      {icon}
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
  const openInvoices = invoices.filter(inv => inv.status === DocumentStatus.FINALIZED).length;
  const totalCustomers = customers.length;

  return (
    <div>
      <h2 className="text-3xl font-semibold text-slate-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue (Paid)" value={`R ${totalRevenue}`} icon={<ChartBarIcon />} color="bg-green-100 text-green-600" />
        <StatCard title="Active Customers" value={totalCustomers} icon={<UsersIcon />} color="bg-blue-100 text-blue-600" />
        <StatCard title="Draft Quotes" value={draftQuotes} icon={<DocumentTextIcon />} color="bg-yellow-100 text-yellow-600" />
        <StatCard title="Open Invoices" value={openInvoices} icon={<CollectionIcon />} color="bg-red-100 text-red-600" />
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Recent Invoices</h3>
          <ul className="divide-y divide-slate-200">
            {invoices.slice(0, 5).map(inv => (
              <li key={inv.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{customers.find(c => c.id === inv.customerId)?.name}</p>
                  <p className="text-sm text-slate-500">{inv.invoiceNumber}</p>
                </div>
                 <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    inv.status === DocumentStatus.PAID ? 'bg-green-100 text-green-800' :
                    inv.status === DocumentStatus.FINALIZED ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'
                }`}>{inv.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Recent Quotes</h3>
            <ul className="divide-y divide-slate-200">
                {quotes.slice(0, 5).map(quote => (
                <li key={quote.id} className="py-3 flex justify-between items-center">
                    <div>
                    <p className="font-medium">{customers.find(c => c.id === quote.customerId)?.name}</p>
                    <p className="text-sm text-slate-500">{quote.quoteNumber}</p>
                    </div>
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        quote.status === DocumentStatus.ACCEPTED ? 'bg-green-100 text-green-800' :
                        quote.status === DocumentStatus.REJECTED ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                    }`}>{quote.status}</span>
                </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
};
