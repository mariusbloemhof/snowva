
import React, { useMemo, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Customer, Invoice, Payment, Address, CustomerType } from '../types';
import { getStatementDataForCustomer } from '../utils';
import { MailIcon, PrintIcon, DownloadIcon, CashIcon } from './Icons';

// Declare global libraries
declare const html2canvas: any;
declare const jspdf: any;

interface StatementViewerProps {
    customers: Customer[];
    invoices: Invoice[];
    payments: Payment[];
}

const getPrimaryAddress = (customer: Customer | null | undefined): Address | undefined => {
    if (!customer) return undefined;
    if (customer.type === CustomerType.B2B) {
      return customer.addresses.find(a => a.type === 'billing' && a.isPrimary) || customer.addresses.find(a => a.isPrimary);
    }
    return customer.addresses.find(a => a.isPrimary);
}

export const StatementViewer: React.FC<StatementViewerProps> = ({ customers, invoices, payments }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const statementRef = useRef<HTMLDivElement>(null);

    const statementData = useMemo(() => {
        if (!id) return null;
        return getStatementDataForCustomer(id, customers, invoices, payments);
    }, [id, customers, invoices, payments]);

    const generatePdf = async (options: { autoPrint?: boolean } = {}) => {
        const input = statementRef.current;
        if (!input) return null;

        const canvas = await html2canvas(input, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jspdf.jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        if (options.autoPrint) {
          pdf.autoPrint();
        }
        return pdf;
    };
  
    const handleDownload = async () => {
        const pdf = await generatePdf();
        if (pdf) {
          pdf.save(`Statement-${statementData?.customer.name}.pdf`);
        }
    };
  
    const handlePrint = async () => {
        try {
            const pdf = await generatePdf({ autoPrint: true });
            if (!pdf) {
                alert("Failed to generate the statement PDF.");
                return;
            }
            const blob = pdf.output('blob');
            const url = URL.createObjectURL(blob);
            window.open(url);
        } catch (error) {
            console.error("Error during print preparation:", error);
            alert("An error occurred while preparing the document for printing.");
        }
    };


    if (!statementData) {
        return <div className="bg-white p-6 rounded-lg shadow-md">Loading statement or customer not found...</div>;
    }

    const { transactions, aging, totalBalance, customer, childCustomers } = statementData;
    const formatCurrency = (amount: number) => `R ${amount.toFixed(2)}`;
    const billingAddress = getPrimaryAddress(customer);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-5xl mx-auto">
            <div className="flex justify-end space-x-4 mb-4 print:hidden">
                <button onClick={() => navigate('/statements')} className="px-4 py-2 bg-slate-200 text-text-primary rounded-md hover:bg-slate-300">Back to List</button>
                <button onClick={() => navigate('/payments/record', { state: { customerId: customer.id }})} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                    <CashIcon /> <span className="ml-2">Record Payment</span>
                </button>
                <button onClick={handleDownload} className="flex items-center bg-snowva-orange text-white px-4 py-2 rounded-md hover:bg-snowva-orange-dark">
                  <DownloadIcon /> <span className="ml-2">Download</span>
                </button>
                <button onClick={handlePrint} className="flex items-center bg-slate-500 text-white px-4 py-2 rounded-md hover:bg-slate-600">
                  <PrintIcon /> <span className="ml-2">Print</span>
               </button>
                <button className="flex items-center bg-snowva-cyan text-white px-4 py-2 rounded-md hover:bg-snowva-blue">
                  <MailIcon/> <span className="ml-2">Email</span>
               </button>
            </div>
            
            <div ref={statementRef} className="border border-gray-300 bg-white p-8">
                <div className="flex justify-between items-start pb-4 border-b">
                    <div>
                        <h1 className="text-2xl font-bold text-snowva-blue">Snowva™ Trading Pty Ltd</h1>
                        <p className="text-sm text-gray-600">2010/007043/07</p>
                        <p className="text-sm text-gray-600">67 Wildevy Street, Lynnwood Manor, Pretoria</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-light text-gray-600 tracking-widest">STATEMENT</h2>
                        <p className="mt-2"><span className="font-bold text-gray-700">Date:</span> {new Date().toISOString().split('T')[0]}</p>
                        <p><span className="font-bold text-gray-700">Account:</span> {customer.name}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 py-6">
                     <div>
                        <h3 className="font-bold text-gray-700 mb-1">Statement For:</h3>
                         <div className="text-sm text-gray-600">
                            <p className="font-bold text-base text-gray-800">{customer.legalEntityName || customer.name}</p>
                            {billingAddress && (
                                <>
                                <p>{billingAddress.street}</p>
                                <p>{billingAddress.city}, {billingAddress.province}, {billingAddress.postalCode}</p>
                                </>
                            )}
                         </div>
                         {childCustomers.length > 0 && (
                             <div className="text-xs mt-2 text-gray-500 italic">
                                <p>This statement includes transactions for associated branches: {childCustomers.map(c => c.name).join(', ')}.</p>
                             </div>
                         )}
                    </div>
                </div>

                 <div className="my-8 p-4 bg-slate-50 rounded-lg grid grid-cols-2 md:grid-cols-6 gap-4 text-center border">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Total Balance</p>
                        <p className="text-xl font-bold text-slate-800">{formatCurrency(totalBalance)}</p>
                    </div>
                    <div className="border-l">
                        <p className="text-sm font-medium text-slate-500">Current</p>
                        <p className="text-lg font-semibold text-slate-700">{formatCurrency(aging.current)}</p>
                    </div>
                     <div className="border-l">
                        <p className="text-sm font-medium text-orange-500">30 Days</p>
                        <p className="text-lg font-semibold text-orange-600">{formatCurrency(aging.days30)}</p>
                    </div>
                    <div className="border-l">
                        <p className="text-sm font-medium text-red-500">60 Days</p>
                        <p className="text-lg font-semibold text-red-600">{formatCurrency(aging.days60)}</p>
                    </div>
                     <div className="border-l">
                        <p className="text-sm font-medium text-red-700">90 Days</p>
                        <p className="text-lg font-semibold text-red-700">{formatCurrency(aging.days90)}</p>
                    </div>
                     <div className="border-l">
                        <p className="text-sm font-medium text-red-800">120+ Days</p>
                        <p className="text-lg font-semibold text-red-900">{formatCurrency(aging.days120plus)}</p>
                    </div>
                 </div>

                <table className="w-full my-8">
                    <thead>
                        <tr className="bg-slate-700 text-white">
                            <th className="p-3 text-left font-semibold text-sm w-28">Date</th>
                            <th className="p-3 text-left font-semibold text-sm">Transaction Details</th>
                            <th className="p-3 text-right font-semibold text-sm w-32">Debit</th>
                            <th className="p-3 text-right font-semibold text-sm w-32">Credit</th>
                            <th className="p-3 text-right font-semibold text-sm w-32">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {transactions.map((tx, index) => (
                            <tr key={`${tx.sourceId}-${index}`} className="border-b last:border-b-0">
                                <td className="p-2">{tx.date}</td>
                                <td className="p-2">
                                    <Link to={`/${tx.type === 'Invoice' ? 'invoices' : 'payments/edit'}/${tx.sourceId}`} className="text-snowva-blue hover:underline" title={`View ${tx.type}`}>
                                        {tx.reference}
                                    </Link>
                                </td>
                                <td className="p-2 text-right">{tx.debit > 0 ? formatCurrency(tx.debit) : ''}</td>
                                <td className="p-2 text-right text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit) : ''}</td>
                                <td className="p-2 text-right">{formatCurrency(tx.balance)}</td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr><td colSpan={5} className="h-24 text-center text-slate-500">No transactions in this period.</td></tr>
                        )}
                    </tbody>
                </table>

                 <div className="w-1/2 text-xs text-gray-600 pt-8 border-t">
                    <h4 className="font-bold mb-1 text-sm">Banking details for EFT payments:</h4>
                    <p>Bank: First National Bank</p>
                    <p>Account Holder: Snowva Pty Ltd</p>
                    <p>Account Number: 62264885082</p>
                    <p>Branch Code: 250 655</p>
                    <p>Please use your account name as reference.</p>
                </div>
            </div>
        </div>
    );
};
