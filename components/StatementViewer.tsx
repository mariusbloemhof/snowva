
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Customer, Invoice, Payment, Address, CustomerType } from '../types';
import { getStatementDataForCustomer } from '../utils';
import { MailIcon, PrintIcon, DownloadIcon, CashIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';

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
        
        // 1. Download the PDF
        await handleDownload();

        // 2. Prepare and open mailto link
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

    const { transactions, aging, totalBalance, customer, childCustomers } = statementData;
    const formatCurrency = (amount: number) => `R ${amount.toFixed(2)}`;
    const billingAddress = getPrimaryAddress(customer);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center print:hidden">
                <div>
                    <h2 className="text-2xl font-semibold leading-6 text-slate-900">Statement for {customer.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">Review account history and outstanding balances.</p>
                </div>
                <div className="flex items-center justify-end space-x-3 mt-4 sm:mt-0">
                    <button onClick={() => navigate('/statements')} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm