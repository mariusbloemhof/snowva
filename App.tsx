
import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  HomeIcon, UsersIcon, CubeIcon, DocumentTextIcon,
  DocumentReportIcon, MenuIcon, XIcon, CollectionIcon, CashIcon
} from './components/Icons';
import { customers as allCustomers, products as allProducts, invoices as allInvoices, payments as allPayments, quotes as allQuotes } from './constants';
import { Customer, Product, Invoice, Payment, Quote, AppContextType } from './types';

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>(allCustomers);
  const [products, setProducts] = useState<Product[]>(allProducts);
  const [invoices, setInvoices] = useState<Invoice[]>(allInvoices);
  const [payments, setPayments] = useState<Payment[]>(allPayments);
  const [quotes, setQuotes] = useState<Quote[]>(allQuotes);

  const navItems = [
    { to: "/", icon: <HomeIcon className="h-5 w-5" />, label: "Dashboard" },
    { to: "/customers", icon: <UsersIcon className="h-5 w-5" />, label: "Customers" },
    { to: "/products", icon: <CubeIcon className="h-5 w-5" />, label: "Products" },
    { to: "/quotes", icon: <DocumentTextIcon className="h-5 w-5" />, label: "Quotes" },
    { to: "/invoices", icon: <CollectionIcon className="h-5 w-5" />, label: "Invoices" },
    { to: "/payments", icon: <CashIcon className="h-5 w-5" />, label: "Payments" },
    { to: "/statements", icon: <DocumentReportIcon className="h-5 w-5" />, label: "Statements" },
  ];

  const outletContext: AppContextType = {
    customers, setCustomers,
    products, setProducts,
    invoices, setInvoices,
    payments, setPayments,
    quotes, setQuotes
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <aside className={`bg-white text-slate-700 transition-all duration-300 border-r border-slate-200 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between p-4 h-16 border-b border-slate-200">
          {isSidebarOpen && <span className="text-xl font-bold text-slate-800">SNOWVA</span>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {isSidebarOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
        <nav className="mt-4 px-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end // Use `end` for the dashboard link to be exactly "/"
              className={({ isActive }) =>
                `flex items-center gap-x-3 py-2.5 px-4 my-1 rounded-md text-sm font-medium transition-colors duration-200 ${isSidebarOpen ? '' : 'justify-center'} ${isActive ? 'bg-slate-100 text-indigo-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
              }
            >
              <span className={`${isSidebarOpen ? '' : 'h-6 w-6'}`}>{item.icon}</span>
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
          <h1 className="text-xl font-semibold text-slate-900">Business Hub</h1>
           <div className="flex items-center space-x-4">
              <div className="relative">
                  <img className="h-10 w-10 rounded-full object-cover" src="https://picsum.photos/100" alt="User"/>
              </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6 lg:p-8">
          <Outlet context={outletContext} />
        </main>
      </div>
    </div>
  );
};

export default App;
