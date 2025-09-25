import React, { useMemo } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { SNOWVA_DETAILS } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { Address, AppContextType } from '../types';
import { getStatementDataForCustomer } from '../utils';
import { DownloadIcon, MailIcon, PrintIcon } from './Icons';

// Declare global libraries
declare const jspdf: any;

export const StatementViewer: React.FC = () => {
    const { id: customerId } = useParams<{ id: string }>();
    const { customers, invoices, payments } = useOutletContext<AppContextType>();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const statementData = useMemo(() => {
        if (!customerId) return null;
        return getStatementDataForCustomer(customerId, customers, invoices, payments);
    }, [customerId, customers, invoices, payments]);

    const customer = statementData?.customer;
    
    const billToCustomer = useMemo(() => {
        if (!customer) return null;
        const isBilledToParent = customer.billToParent && customer.parentCompanyId;
        return isBilledToParent ? customers.find(c => c.id === customer.parentCompanyId) : customer;
    }, [customer, customers]);

    const billingAddress = useMemo((): Address | undefined => {
        if (!billToCustomer || !Array.isArray(billToCustomer.addresses)) return undefined;
        return billToCustomer.addresses.find(a => a.type === 'billing' && a.isPrimary) || billToCustomer.addresses.find(a => a.isPrimary);
    }, [billToCustomer]);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        // Correct for timezone offset before formatting
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() + userTimezoneOffset).toLocaleDateString('en-CA'); // YYYY-MM-DD
    };

    const formatCurrency = (amount: number) => {
        return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    const generatePdf = async () => {
        if (!customer || !billToCustomer || !statementData) {
            addToast("Customer or statement data not found.", "error");
            return null;
        }
        addToast("Generating statement PDF...", "info");
        const { jsPDF } = jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const margin = 20;
        const pageWidth = pdf.internal.pageSize.getWidth();
        let yPos = 20;

        // --- HEADER ---
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text(SNOWVA_DETAILS.name, margin, yPos);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        yPos += 5;
        pdf.text(SNOWVA_DETAILS.regNo, margin, yPos);
        yPos += 5;
        pdf.text(SNOWVA_DETAILS.address[0], margin, yPos);
        yPos += 4;
        pdf.text(SNOWVA_DETAILS.address[1], margin, yPos);
        yPos += 4;
        pdf.text(SNOWVA_DETAILS.address[2], margin, yPos);
        yPos += 8;
        pdf.text(`VAT #: ${SNOWVA_DETAILS.vatNo}`, margin, yPos);

        // Right side header
        yPos = 25;
        pdf.setFontSize(24);
        pdf.setFont("helvetica", "bold");
        pdf.text("STATEMENT", pageWidth - margin, yPos, { align: "right" });

        yPos += 15;
        const detailsX = pageWidth - margin - 70;
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text("Date:", detailsX, yPos);
        pdf.text("Customer:", detailsX, yPos + 5);
        pdf.text(new Date().toLocaleDateString('en-ZA'), detailsX + 25, yPos);
        pdf.text(customer.name, detailsX + 25, yPos + 5);

        yPos += 15;
        pdf.setFont("helvetica", "bold");
        pdf.text("Bill To:", margin, yPos);
        pdf.setFont("helvetica", "normal");
        const billToAddressLines = [
            billToCustomer.legalEntityName || billToCustomer.name,
            billingAddress?.addressLine1,
            billingAddress?.addressLine2,
            `${billingAddress?.city || ''} ${billingAddress?.postalCode || ''}`.trim()
        ].filter(Boolean);
        pdf.text(billToAddressLines, margin + 25, yPos);
        
        yPos += (billToAddressLines.length * 5) + 5;
        if(billToCustomer.vatNumber) {
            pdf.text("VAT #:", margin, yPos);
            pdf.text(billToCustomer.vatNumber, margin + 25, yPos);
        }
        
        // --- TABLE ---
        const tableStartY = Math.max(yPos, 65) + 15;
        const chronologicalTransactions = [...statementData.transactions].reverse();
        const tableBody = chronologicalTransactions.map(tx => [
            formatDate(tx.date).replace(/-/g, '.'),
            tx.reference,
            tx.type,
            tx.debit > 0 ? formatCurrency(tx.debit) : '',
            tx.credit > 0 ? formatCurrency(tx.credit) : '',
            formatCurrency(tx.balance)
        ]);
        

        (pdf as any).autoTable({
            startY: tableStartY,
            head: [['Date', 'Reference', 'Type', 'Debit', 'Credit', 'Balance']],
            body: tableBody,
            theme: 'grid',
            headStyles: {
                fillColor: [220, 220, 220],
                textColor: [50, 50, 50],
                fontStyle: 'normal'
            },
            columnStyles: {
                3: { halign: 'right' }, // Debit
                4: { halign: 'right' }, // Credit
                5: { halign: 'right' }, // Balance
            },
            margin: { left: margin, right: margin }
        });

        // --- FOOTER & TOTALS ---
        const finalY = (pdf as any).autoTable.previous.finalY;
        let footerY = finalY + 10;
        
        pdf.setLineWidth(0.5);
        pdf.line(pageWidth / 2, footerY, pageWidth - margin, footerY);
        footerY += 5;
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("TOTAL DUE", pageWidth / 2, footerY);
        pdf.setFont("helvetica", "normal");
        pdf.text("(VAT incl)", pageWidth / 2 + 25, footerY);

        const totalValue = formatCurrency(statementData.totalBalance);
        const totalValueX = pageWidth - margin;
        pdf.text("R", totalValueX - (pdf.getStringUnitWidth(totalValue) * 3) - 4 , footerY); // position currency symbol
        pdf.text(totalValue, totalValueX, footerY, { align: 'right' });


        footerY += 10;
         if (footerY > 260) {
            pdf.addPage();
            footerY = 30;
        }

        // Banking Details
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("Banking details:", margin, footerY);
        pdf.setFont("helvetica", "normal");
        footerY += 5;
        pdf.text(SNOWVA_DETAILS.name, margin, footerY);
        footerY += 5;
        pdf.text(SNOWVA_DETAILS.banking.bankName, margin, footerY);
        footerY += 5;
        pdf.text(`Branch code ${SNOWVA_DETAILS.banking.branchCode}`, margin, footerY);
        footerY += 5;
        pdf.text(`Account number ${SNOWVA_DETAILS.banking.accountNumber}`, margin, footerY);

        return pdf;
    };
    
    const handleDownload = async () => {
        const pdf = await generatePdf();
        if(pdf) pdf.save(`Statement-${customer?.name}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const handlePrint = async () => {
        try {
            const pdf = await generatePdf();
            if (!pdf) return;
            const dataUri = pdf.output('datauristring');
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = dataUri;
            document.body.appendChild(iframe);
            iframe.onload = () => {
                setTimeout(() => {
                    iframe.contentWindow?.print();
                    setTimeout(() => document.body.removeChild(iframe), 100);
                }, 1);
            };
        } catch (error) {
            console.error("Error during print preparation:", error);
            addToast("An error occurred while preparing the document for printing.", "error");
        }
    };
    
    const handleEmail = () => {
         if (!billToCustomer?.contactEmail) {
            addToast("Billing contact has no email address on file.", "error");
            return;
        }
        const subject = `Your Statement from ${SNOWVA_DETAILS.name}`;
        const body = `Dear ${billToCustomer.name},\n\nPlease find your latest statement attached.\n\nTotal Due: R ${statementData?.totalBalance.toFixed(2)}\n\nKind regards,\nThe Snowva Team`;
        window.location.href = `mailto:${billToCustomer.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        addToast("Please download the PDF and attach it to the email.", "info");
    };


    if (!customer || !statementData) return <div className="p-4">Customer or statement data not found.</div>;

    return (
        <>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
                <div className="sm:flex sm:items-center sm:justify-between mb-6 border-b border-slate-200 pb-4">
                    <div className="sm:flex-auto">
                        <h2 className="text-2xl font-semibold leading-6 text-slate-900">Statement for {customer.name}</h2>
                        <p className="mt-2 text-sm text-slate-700">A transaction history of all invoices and payments.</p>
                    </div>
                    <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-2">
                        <button onClick={handleDownload} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                           <DownloadIcon className="w-5 h-5"/> Download
                        </button>
                        <button onClick={handlePrint} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                           <PrintIcon className="w-5 h-5"/> Print
                        </button>
                        <button onClick={handleEmail} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                           <MailIcon className="w-5 h-5"/> Email
                        </button>
                    </div>
                </div>

                <div className="mt-8 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-slate-300">
                                <thead>
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Date</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Reference</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Type</th>
                                        <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">Debit</th>
                                        <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">Credit</th>
                                        <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {statementData.transactions.map(tx => (
                                        <tr key={`${tx.type}-${tx.sourceId}`} className="hover:bg-slate-50">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-slate-500 sm:pl-0">{formatDate(tx.date)}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                                                {tx.type === 'Invoice' ? (
                                                     <button onClick={() => navigate(`/invoices/${tx.sourceId}`)} className="text-indigo-600 hover:underline">{tx.reference}</button>
                                                ) : tx.type === 'Payment' ? (
                                                     <button onClick={() => navigate(`/payments/edit/${tx.sourceId}`)} className="text-indigo-600 hover:underline">{tx.reference}</button>
                                                ) : (
                                                    <span className="text-slate-700">{tx.reference}</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{tx.type}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 text-right">{tx.debit > 0 ? `R ${formatCurrency(tx.debit)}` : '-'}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 text-right">{tx.credit > 0 ? `R ${formatCurrency(tx.credit)}` : '-'}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-700 font-medium text-right">R {formatCurrency(tx.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={5} className="pt-4 pr-3 text-right font-bold text-slate-900">Total Due</td>
                                        <td className="pt-4 px-3 text-right font-bold text-slate-900 border-t-2 border-slate-900">R {formatCurrency(statementData.totalBalance)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};