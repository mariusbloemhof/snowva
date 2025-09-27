
import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    CashIcon,
    CollectionIcon,
    CubeIcon,
    DocumentReportIcon,
    DocumentTextIcon,
    HomeIcon,
    MenuIcon,
    SparklesIcon,
    UsersIcon,
    XIcon
} from './components/Icons';
import ThemeToggle from './components/ThemeToggle';
import { useFirebase } from './contexts/FirebaseContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/index.css';
import { AppContextType, Customer, Invoice, Payment, Product, Quote } from './types';

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  // Get Firebase data - but keep local state for compatibility
  const {
    customers: firebaseCustomers, 
    products: firebaseProducts, 
    invoices: firebaseInvoices, 
    payments: firebasePayments, 
    quotes: firebaseQuotes,
    loading
  } = useFirebase();

  // Local state that syncs with Firebase
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  // Sync Firebase data to local state when it changes
  useEffect(() => {
    if (!loading.customers) setCustomers(firebaseCustomers);
  }, [firebaseCustomers, loading.customers]);

  useEffect(() => {
    if (!loading.products) setProducts(firebaseProducts);
  }, [firebaseProducts, loading.products]);

  useEffect(() => {
    if (!loading.invoices) setInvoices(firebaseInvoices);
  }, [firebaseInvoices, loading.invoices]);

  useEffect(() => {
    if (!loading.payments) setPayments(firebasePayments);
  }, [firebasePayments, loading.payments]);

  useEffect(() => {
    if (!loading.quotes) setQuotes(firebaseQuotes);
  }, [firebaseQuotes, loading.quotes]);

  const navItems = [
    { to: "/", icon: <HomeIcon className="h-5 w-5" />, label: "Dashboard" },
    { to: "/customers", icon: <UsersIcon className="h-5 w-5" />, label: "Customers" },
    { to: "/products", icon: <CubeIcon className="h-5 w-5" />, label: "Products" },
    { to: "/quotes", icon: <DocumentTextIcon className="h-5 w-5" />, label: "Quotes" },
    { to: "/invoices", icon: <CollectionIcon className="h-5 w-5" />, label: "Invoices" },
    { to: "/payments", icon: <CashIcon className="h-5 w-5" />, label: "Payments" },
    { to: "/statements", icon: <DocumentReportIcon className="h-5 w-5" />, label: "Statements" },
    { to: "/firebase-admin", icon: <SparklesIcon className="h-5 w-5" />, label: "Firebase Admin" },
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
        <nav className="nav-primary">
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
              <ThemeToggle variant="icon" size="medium" />
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

// Wrap App with ThemeProvider
const ThemedApp: React.FC = () => {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
};

export default ThemedApp;
