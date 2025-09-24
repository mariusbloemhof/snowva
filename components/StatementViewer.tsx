
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Customer, Invoice, Payment, Address, CustomerType, Product } from '../types';
import { getStatementDataForCustomer, calculateBalanceDue, calculateTotal } from '../utils';
import { MailIcon, PrintIcon, DownloadIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { products } from '../constants';

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
    const { addToast } = useToast();
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

    const statementData = useMemo(() => {
        if (!id) return null;
        return getStatementDataForCustomer(id, customers, invoices, payments);
    }, [id, customers, invoices, payments]);

    const outstandingInvoices = useMemo(() => {
        if (!statementData) return [];
        const { customer, childCustomers } = statementData;
        
        const relevantCustomerIds = new Set<string>([customer.id]);
        const billToParentChildren = customers.filter(c => c.parentCompanyId === customer.id && c.billToParent);
        billToParentChildren.forEach(c => relevantCustomerIds.add(c.id));
        
        return invoices
            .filter(inv => relevantCustomerIds.has(inv.customerId))
            .filter(inv => calculateBalanceDue(inv, payments) > 0.005)
            .sort((a, b) => a.date.localeCompare(b.date) || a.invoiceNumber.localeCompare(b.invoiceNumber));
    }, [statementData, invoices, payments, customers]);


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
        addToast("Generating PDF...", "info");
        const pdf = await generatePdf();
        if (pdf) {
          pdf.save(`Statement-${statementData?.customer.name}.pdf`);
        } else {
            addToast("Failed to generate PDF.", "error");
        }
    };
  
    const handlePrint = async () => {
        try {
            const pdf = await generatePdf({ autoPrint: true });
            if (!pdf) {
                addToast("Failed to generate the statement PDF.", "error");
                return;
            }
            const blob = pdf.output('blob');
            const url = URL.createObjectURL(blob);
            window.open(url);
        } catch (error) {
            console.error("Error during print preparation:", error);
            addToast("An error occurred while preparing the document for printing.", "error");
        }
    };
    
    const handleEmailButtonClick = () => {
        if (!customer || !customer.contactEmail) {
            addToast("This customer does not have an email address on file.", "error");
            return;
        }
        setIsEmailModalOpen(true);
    };
    
    const handleProceedWithEmail = async () => {
        if (!customer || !customer.contactEmail) return;
        
        await handleDownload();

        const subject = `Statement for ${customer.name} as of ${new Date().toISOString().split('T')[0]}`;
        const body = `Dear ${customer.contactPerson || customer.name},\n\nPlease find your latest account statement attached.\n\nIf you have any questions, please don't hesitate to contact us.\n\nKind regards,\nThe Snowva™ Team`;
        const mailtoLink = `mailto:${customer.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        try {
            window.location.href = mailtoLink;
        } catch (error) {
            addToast("Could not open email client.", "error");
            console.error("Mailto link error:", error);
        }

        setIsEmailModalOpen(false);
    };


    if (!statementData) {
        return <div className="bg-white p-6 rounded-lg shadow-md">Loading statement or customer not found...</div>;
    }

    const { totalBalance, customer } = statementData;
    const formatAmount = (amount: number) => amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB').replace(/\//g, '.');
    const billingAddress = getPrimaryAddress(customer);
    const lastInvoice = outstandingInvoices.length > 0 ? outstandingInvoices[outstandingInvoices.length - 1] : null;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center print:hidden">
                <div>
                    <h2 className="text-2xl font-semibold leading-6 text-slate-900">Statement for {customer.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">Review account history and outstanding balances.</p>
                </div>
                <div className="flex items-center justify-end space-x-3 mt-4 sm:mt-0">
                    <button onClick={() => navigate('/statements')} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Back to List</button>
                    <button onClick={handleDownload} className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                        <DownloadIcon className="w-5 h-5"/> <span>Download</span>
                    </button>
                    <button onClick={handlePrint} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                        <PrintIcon className="w-5 h-5"/> <span>Print</span>
                    </button>
                    <button onClick={handleEmailButtonClick} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                        <MailIcon className="w-5 h-5"/> <span>Email</span>
                    </button>
                </div>
            </div>

            <div ref={statementRef} className="p-12 bg-white font-sans text-black" style={{ fontSize: '10pt', lineHeight: '1.5' }} id="statement-to-print">
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h1 className="font-bold text-lg mb-2">Snowva™ Trading Pty Ltd</h1>
                        <p>2010/007043/07</p>
                        <p>67 Wildevy Street</p>
                        <p>Lynnwood Manor</p>
                        <p>Pretoria</p>
                        <p className="mt-4">VAT #: 4100263500</p>
                    </div>
                    
                    <div className="text-right">
                        <h2 className="text-4xl font-normal text-gray-800 mb-6 tracking-wider">STATEMENT</h2>
                        <div className="grid grid-cols-[max-content,1fr] gap-x-6 text-left">
                            <span className="font-bold">Date:</span><span>{new Date().toLocaleDateString('en-ZA').replace(/-/g, '/')}</span>
                            <span className="font-bold">Invoice #:</span><span>{lastInvoice?.invoiceNumber || ''}</span>
                            <span className="font-bold">Customer:</span><span>{customer.name}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-start mb-10">
                    <div>
                        <p className="font-bold mb-1">Bill To:</p>
                        <p>{customer.legalEntityName || customer.name}</p>
                        {billingAddress && (
                            <>
                                <p>{billingAddress.addressLine1}</p>
                                {billingAddress.addressLine2 && <p>{billingAddress.addressLine2}</p>}
                                <p>{billingAddress.suburb}</p>
                                <p>{billingAddress.city}, {billingAddress.postalCode}</p>
                                <p>{billingAddress.province}</p>
                                <p>{billingAddress.country}</p>
                            </>
                        )}
                    </div>
                    <div>
                        <div className="grid grid-cols-[max-content,1fr] gap-x-6 text-left">
                            <span className="font-bold">VAT #:</span><span>{customer.vatNumber}</span>
                            <span className="font-bold">Terms:</span><span>{customer.paymentTerm}</span>
                        </div>
                    </div>
                </div>
                
                <table className="w-full text-left align-top whitespace-nowrap" style={{ fontSize: '9.5pt' }}>
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2 font-normal w-[10%]">Date</th>
                            <th className="p-2 font-normal w-[10%]">Invoice #</th>
                            <th className="p-2 font-normal w-[10%]">Order #</th>
                            <th className="p-2 font-normal w-[25%]">Branch</th>
                            <th className="p-2 font-normal w-[20%]">Description</th>
                            <th className="p-2 font-normal w-[10%]">Item Code</th>
                            <th className="p-2 font-normal w-[15%] text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="leading-relaxed">
                        {outstandingInvoices.map(inv => {
                            const invCustomer = customers.find(c => c.id === inv.customerId);
                            const firstItem = inv.items[0];
                            const product = firstItem ? products.find(p => p.id === firstItem.productId) : null;
                            const totalAmount = calculateTotal(inv.items);
                            const itemCode = product?.itemCode || ''; 
                            return (
                                <tr key={inv.id}>
                                    <td className="p-2">{formatDate(inv.date)}</td>
                                    <td className="p-2">{inv.invoiceNumber}</td>
                                    <td className="p-2">{inv.orderNumber || ''}</td>
                                    <td className="p-2">{invCustomer?.name || ''}</td>
                                    <td className="p-2">{firstItem?.description || ''}</td>
                                    <td className="p-2">{itemCode}</td>
                                    <td className="p-2 text-right">R {formatAmount(totalAmount)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                <div className="flex justify-between items-end mt-8 mb-12">
                    <div className="w-1/2">
                        <p className="font-bold" style={{ fontSize: '10pt' }}>Age Analysis:</p>
                        <table className="w-full text-left mt-1" style={{ fontSize: '9.5pt' }}>
                            <thead>
                                <tr className="border-b border-t border-gray-400">
                                    <th className="p-1 font-normal text-right">Current</th>
                                    <th className="p-1 font-normal text-right">30 Days</th>
                                    <th className="p-1 font-normal text-right">60 Days</th>
                                    <th className="p-1 font-normal text-right">90+ Days</th>
                                </tr>
                            </thead>
                            <tbody className="border-b border-gray-400">
                                <tr>
                                    <td className="p-1 text-right">R {formatAmount(statementData.aging.current)}</td>
                                    <td className="p-1 text-right">R {formatAmount(statementData.aging.days30)}</td>
                                    <td className="p-1 text-right">R {formatAmount(statementData.aging.days60)}</td>
                                    <td className="p-1 text-right">R {formatAmount(statementData.aging.days90 + statementData.aging.days120plus)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="w-2/5">
                        <div className="flex justify-between p-2 border-t-2 border-b-2 border-black font-bold">
                            <span>TOTAL DUE</span>
                            <span>(VAT incl)</span>
                            <span className="text-right">R {formatAmount(totalBalance)}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <p className="font-bold">Banking details:</p>
                    <p>Snowva Pty Ltd</p>
                    <p>First National Bank</p>
                    <p>Branch code 250 655</p>
                    <p>Account number 62264885082</p>
                </div>
            </div>

            {isEmailModalOpen && customer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h3 className="text-lg font-bold mb-2 text-slate-900">Confirm Email</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            This will download the statement as a PDF and open your default email client. Please attach the downloaded file to the email before sending.
                        </p>
                        <p className="text-sm text-slate-600 mb-4">
                            Recipient: <span className="font-semibold text-indigo-600">{customer.contactEmail}</span>
                        </p>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button onClick={() => setIsEmailModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
                            <button onClick={handleProceedWithEmail} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">Proceed</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
