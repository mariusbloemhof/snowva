
import React, { useState } from 'react';
import { HashRouter, Routes, Route, NavLink, useParams } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { CustomerList } from './components/CustomerList';
import { ProductList } from './components/ProductList';
import { InvoiceList } from './components/InvoiceList';
import { QuoteList } from './components/QuoteList';
import { StatementPage } from './components/StatementPage';
import { PaymentList } from './components/PaymentList';
import { PaymentPage } from './components/PaymentPage';
import { PaymentRecorder } from './components/PaymentRecorder';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoiceViewer } from './components/InvoiceViewer';
import { QuoteEditor } from './components/QuoteEditor';
import { CustomerEditor } from './components/CustomerEditor';
import { ProductEditor } from './components/ProductEditor';
import { StatementViewer } from './components/StatementViewer';
import {
  HomeIcon, ChartBarIcon, UsersIcon, CubeIcon, DocumentTextIcon,
  DocumentReportIcon, MenuIcon, XIcon, CollectionIcon, CashIcon
} from './components/Icons';
import { customers as allCustomers, products as allProducts, invoices as allInvoices, payments as allPayments } from './constants';
import { Customer, Product, Invoice, DocumentStatus, Payment } from './types';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ToastContainer';

const App: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>(allCustomers);
  const [products, setProducts] = useState<Product[]>(allProducts);
  const [invoices, setInvoices] = useState<Invoice[]>(allInvoices);
  const [payments, setPayments] = useState<Payment[]>(allPayments);

  const navItems = [
    { to: "/", icon: <HomeIcon className="h-5 w-5" />, label: "Dashboard" },
    { to: "/customers", icon: <UsersIcon className="h-5 w-5" />, label: "Customers" },
    { to: "/products", icon: <CubeIcon className="h-5 w-5" />, label: "Products" },
    { to: "/quotes", icon: <DocumentTextIcon className="h-5 w-5" />, label: "Quotes" },
    { to: "/invoices", icon: <CollectionIcon className="h-5 w-5" />, label: "Invoices" },
    { to: "/payments", icon: <CashIcon className="h-5 w-5" />, label: "Payments" },
    { to: "/statements", icon: <DocumentReportIcon className="h-5 w-5" />, label: "Statements" },
  ];

  const InvoicePageWrapper = () => {
    const { id } = useParams<{ id: string }>();
    if (!id) return <div>Invalid Invoice ID</div>;

    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) return <div>Invoice not found</div>;

    if (invoice.status === DocumentStatus.DRAFT) {
        return <InvoiceEditor invoices={invoices} setInvoices={setInvoices} customers={customers} invoiceId={id} />;
    } else {
        return <InvoiceViewer invoice={invoice} invoices={invoices} setInvoices={setInvoices} payments={payments} setPayments={setPayments} customers={customers} />;
    }
  };

  const QuoteEditorWrapper = () => {
    const { id } = useParams<{ id: string }>();
    return <QuoteEditor quoteId={id} customers={customers} />;
  };

  const CustomerEditorWrapper = () => {
    const { id } = useParams<{ id: string }>();
    return <CustomerEditor customers={customers} setCustomers={setCustomers} customerId={id} />;
  };

  const ProductEditorWrapper = () => {
    const { id } = useParams<{ id: string }>();
    return <ProductEditor products={products} setProducts={setProducts} productId={id} />;
  };
  
  const PaymentRecorderWrapper = () => {
    const { id } = useParams<{ id: string }>();
    return <PaymentRecorder customers={customers} invoices={invoices} setInvoices={setInvoices} payments={payments} setPayments={setPayments} paymentId={id} />;
  };
  
  const StatementViewerWrapper = () => {
    return <StatementViewer customers={customers} invoices={invoices} payments={payments} />;
  };


  return (
    <ToastProvider>
      <HashRouter>
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
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/customers" element={<CustomerList customers={customers} setCustomers={setCustomers} />} />
                <Route path="/customers/new" element={<CustomerEditor customers={customers} setCustomers={setCustomers} />} />
                <Route path="/customers/:id" element={<CustomerEditorWrapper />} />
                <Route path="/products" element={<ProductList products={products} setProducts={setProducts} />} />
                <Route path="/products/new" element={<ProductEditor products={products} setProducts={setProducts} />} />
                <Route path="/products/:id" element={<ProductEditorWrapper />} />
                <Route path="/quotes" element={<QuoteList />} />
                <Route path="/quotes/new" element={<QuoteEditor customers={customers} />} />
                <Route path="/quotes/:id" element={<QuoteEditorWrapper />} />
                <Route path="/invoices" element={<InvoiceList invoices={invoices} payments={payments} />} />
                <Route path="/invoices/new" element={<InvoiceEditor invoices={invoices} setInvoices={setInvoices} customers={customers} />} />
                <Route path="/invoices/:id" element={<InvoicePageWrapper />} />
                <Route path="/payments" element={<PaymentList customers={customers} payments={payments} />} />
                <Route path="/payments/new" element={<PaymentPage invoices={invoices} customers={customers} />} />
                <Route path="/payments/record" element={<PaymentRecorder customers={customers} invoices={invoices} setInvoices={setInvoices} payments={payments} setPayments={setPayments} />} />
                <Route path="/payments/edit/:id" element={<PaymentRecorderWrapper />} />
                <Route path="/statements" element={<StatementPage customers={customers} invoices={invoices} payments={payments} />} />
                <Route path="/statements/:id" element={<StatementViewerWrapper />} />
              </Routes>
            </main>
          </div>
        </div>
      </HashRouter>
      <ToastContainer />
    </ToastProvider>
  );
};

export default App;
