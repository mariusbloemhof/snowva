
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider, useParams, useOutletContext } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ToastContainer';
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
import { DocumentStatus } from './types';
import { AppContextType } from './types';

const InvoicePageWrapper = () => {
  const { id } = useParams<{ id: string }>();
  const { invoices } = useOutletContext<AppContextType>();
  if (!id) return <div>Invalid Invoice ID</div>;

  const invoice = invoices.find(inv => inv.id === id);
  if (!invoice) return <div>Invoice not found</div>;

  return invoice.status === DocumentStatus.DRAFT ? <InvoiceEditor /> : <InvoiceViewer />;
};

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/customers", element: <CustomerList /> },
      { path: "/customers/new", element: <CustomerEditor /> },
      { path: "/customers/:id", element: <CustomerEditor /> },
      { path: "/products", element: <ProductList /> },
      { path: "/products/new", element: <ProductEditor /> },
      { path: "/products/:id", element: <ProductEditor /> },
      { path: "/quotes", element: <QuoteList /> },
      { path: "/quotes/new", element: <QuoteEditor /> },
      { path: "/quotes/:id", element: <QuoteEditor /> },
      { path: "/invoices", element: <InvoiceList /> },
      { path: "/invoices/new", element: <InvoiceEditor /> },
      { path: "/invoices/:id", element: <InvoicePageWrapper /> },
      { path: "/payments", element: <PaymentList /> },
      { path: "/payments/new", element: <PaymentPage /> },
      { path: "/payments/record", element: <PaymentRecorder /> },
      { path: "/payments/edit/:id", element: <PaymentRecorder /> },
      { path: "/statements", element: <StatementPage /> },
      { path: "/statements/:id", element: <StatementViewer /> },
    ]
  }
]);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
      <ToastContainer />
    </ToastProvider>
  </React.StrictMode>
);
