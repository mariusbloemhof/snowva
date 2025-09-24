
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Customer, Invoice, Payment, Address, CustomerType, Product, StatementTransaction, AgingAnalysis } from '../types';
import { getStatementDataForCustomer, calculateBalanceDue, calculateTotal } from '../utils';
import { MailIcon, PrintIcon, DownloadIcon } from './Icons';
import { useToast } from '../contexts/ToastContext';
import { products } from '../constants';

// Declare global libraries
declare const html2canvas: any;
declare const jspdf: any;

interface StatementTemplateProps {
  statementData: {
    transactions: StatementTransaction[];
    aging: AgingAnalysis;
    totalBalance: number;
    customer: Customer;
  };
}

const formatAmountTemplate = (amount: number) => amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const formatDateTemplate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB').replace(/\//g, '.');

const getPrimaryAddressTemplate = (customer: Customer | null | undefined): Address | undefined => {
    if (!customer) return undefined;
    if (customer.type === CustomerType.B2B) {
      return customer.addresses.find(a => a.type === 'billing' && a.isPrimary) || customer.addresses.find(a => a.isPrimary);
    }
    return customer.addresses.find(a => a.isPrimary);
}

const StatementTemplate: React.FC<StatementTemplateProps> = ({ statementData }) => {
    if (!statementData) return null;

    const { transactions, aging, totalBalance, customer } = statementData;
    const billingAddress = getPrimaryAddressTemplate(customer);

    return (
        <div className="p-10 bg-white font-sans text-black w-[210mm] min-h-[297mm]" style={{ fontSize: '10pt', lineHeight: '1.5' }}>
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="font-bold text-lg mb-2">Snowva™ Trading Pty Ltd</h1>
                    <p>2010/007043/07</p>
                    <p>67 Wildevy Street</p>
                    <p>Lynnwood Manor, Pretoria, 0081</p>
                    <p className="mt-4">VAT #: 4100263500</p>
                </div>
                
                <div className="text-right">
                    <h2 className="text-4xl font-normal text-gray-800 mb-6 tracking-wider">STATEMENT</h2>
                    <div className="grid grid-cols-[max-content,1fr] gap-x-6 text-left">
                        <span className="font-bold">Date:</span><span>{new Date().toLocaleDateString('en-ZA').replace(/-/g, '/')}</span>
                        <span className="font-bold">Customer:</span><span>{customer.name}</span>
                    </div>
                </div>
            </div>

            <div className="mb-10">
                <p className="font-bold mb-1">Bill To:</p>
                <p>{customer.legalEntityName || customer.name}</p>
                {billingAddress && (
                    <>
                        <p>{billingAddress.addressLine1}</p>
                        {billingAddress.addressLine2 && <p>{billingAddress.addressLine2}</p>}
                        <p>{billingAddress.city}, {billingAddress.postalCode}</p>
                    </>
                )}
            </div>
            
            <table className="w-full text-left align-top whitespace-nowrap" style={{ fontSize: '9.5pt' }}>
                <thead>
                    <tr className="bg-gray-200">
                        <th className="p-2 font-normal">Date</th>
                        <th className="p-2 font-normal">Reference</th>
                        <th className="p-2 font-normal">Type</th>
                        <th className="p-2 font-normal text-right">Debit</th>
                        <th className="p-2 font-normal text-right">Credit</th>
                        <th className="p-2 font-normal text-right">Balance</th>
                    </tr>
                </thead>
                <tbody className="leading-relaxed">
                    {transactions.map((tx, index) => (
                        <tr key={`${tx.sourceId}-${index}`}>
                            <td className="p-2">{formatDateTemplate(tx.date)}</td>
                            <td className="p-2">{tx.reference}</td>
                            <td className="p-2">{tx.type}</td>
                            <td className="p-2 text-right">{tx.debit > 0 ? `R ${formatAmountTemplate(tx.debit)}` : ''}</td>
                            <td className="p-2 text-right">{tx.credit > 0 ? `R ${format