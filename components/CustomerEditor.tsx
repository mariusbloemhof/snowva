

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, CustomerType, Address, PaymentTerm } from '../types';
import { customers as allCustomers } from '../constants';
import { products as allProducts } from '../constants';
import { CustomerPricingEditor } from './CustomerPricingEditor';

interface CustomerEditorProps {
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    customerId?: string;
}

const emptyCustomer: Omit<Customer, 'id'> = {
    name: '',
    type: CustomerType.B2C,
    addresses: [],
};

const AddressForm: React.FC<{
    address: Partial<Address>;
    onAddressChange: (field: keyof Address, value: string) => void;
    title: string;
    isSameAs: boolean;
    onSameAsChange: (checked: boolean) => void;
    sameAsLabel: string;
}> = ({ address, onAddressChange, title, isSameAs, onSameAsChange, sameAsLabel }) => {
    return (
        <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-medium text-text-primary px-1 flex justify-between items-center w-full">
                {title}
                <label className="flex items-center space-x-2 text-sm font-normal">
                    <input type="checkbox" checked={isSameAs} onChange={(e) => onSameAsChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-snowva-blue focus:ring-snowva-blue" />
                    <span>{sameAsLabel}</span>
                </label>
            </legend>
            <div className="space-y-2 pt-2">
                <input type="text" placeholder="Street Address" value={address.street || ''} onChange={(e) => onAddressChange('street', e.target.value)} disabled={isSameAs} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm disabled:bg-slate-100 focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input type="text" placeholder="City" value={address.city || ''} onChange={(e) => onAddressChange('city', e.target.value)} disabled={isSameAs} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm disabled:bg-slate-100 focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" />
                    <input type="text" placeholder="Province" value={address.province || ''} onChange={(e) => onAddressChange('province', e.target.value)} disabled={isSameAs} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm disabled:bg-slate-100 focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" />
                    <input type="text" placeholder="Postal Code" value={address.postalCode || ''} onChange={(e) => onAddressChange('postalCode', e.target.value)} disabled={isSameAs} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm disabled:bg-slate-100 focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" />
                </div>
            </div>
        </fieldset>
    );
};

export const CustomerEditor: React.FC<CustomerEditorProps> = ({ customers, setCustomers, customerId }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<Omit<Customer, 'id'> & { id?: string }>(emptyCustomer);
    const [activeTab, setActiveTab] = useState<'details' | 'pricing'>('details');
    
    const [billingAddress, setBillingAddress] = useState<Partial<Address>>({});
    const [deliveryAddress, setDeliveryAddress] = useState<Partial<Address>>({});
    const [billingSameAsDelivery, setBillingSameAsDelivery] = useState(false);
    const [deliverySameAsBilling, setDeliverySameAsBilling] = useState(false);

    useEffect(() => {
        if (customerId) {
            const customerToEdit = customers.find(c => c.id === customerId);
            if (customerToEdit) {
                setFormData(customerToEdit);
                const primaryBilling = customerToEdit.addresses.find(a => a.type === 'billing' && a.isPrimary);
                const primaryDelivery = customerToEdit.addresses.find(a => a.type === 'delivery' && a.isPrimary);
                setBillingAddress(primaryBilling || {});
                setDeliveryAddress(primaryDelivery || {});
            } else {
                navigate('/customers');
            }
        } else {
            setFormData(emptyCustomer);
        }
    }, [customerId, customers, navigate]);
    
    useEffect(() => {
        if(billingSameAsDelivery) {
            setDeliverySameAsBilling(false);
            setBillingAddress({ ...deliveryAddress, id: billingAddress.id || `addr_${Date.now()}`, type: 'billing' });
        }
    }, [billingSameAsDelivery, deliveryAddress]);

    useEffect(() => {
        if(deliverySameAsBilling) {
            setBillingSameAsDelivery(false);
            setDeliveryAddress({ ...billingAddress, id: deliveryAddress.id || `addr_${Date.now()}`, type: 'delivery' });
        }
    }, [deliverySameAsBilling, billingAddress]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'type') {
                if (value === CustomerType.B2B && !newState.paymentTerm) {
                    newState.paymentTerm = PaymentTerm.DAYS_30;
                } else if (value === CustomerType.B2C) {
                    delete newState.paymentTerm;
                    newState.billToParent = false;
                }
            }
            if (name === 'parentCompanyId' && !value) {
                // If parent company is removed, can't bill to parent
                newState.billToParent = false;
            }
            return newState;
        });
    };
    
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({...prev, [name]: checked}));
    };

    const handleBillingAddressChange = (field: keyof Address, value: string) => {
        setBillingAddress(prev => ({ ...prev, [field]: value }));
    };

    const handleDeliveryAddressChange = (field: keyof Address, value: string) => {
        setDeliveryAddress(prev => ({ ...prev, [field]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const otherAddresses = (formData.addresses || []).filter(a => !a.isPrimary);
        const newAddresses = [...otherAddresses];

        if (Object.values(billingAddress).some(val => val)) {
            newAddresses.push({ ...(billingAddress as Address), isPrimary: true, type: 'billing', id: billingAddress.id || `addr_${Date.now()}` });
        }
        if (Object.values(deliveryAddress).some(val => val)) {
            newAddresses.push({ ...(deliveryAddress as Address), isPrimary: true, type: 'delivery', id: deliveryAddress.id || `addr_${Date.now()}` });
        }

        const finalFormData = { ...formData, addresses: newAddresses };

        if (finalFormData.id) { // Existing customer
            setCustomers(customers.map(c => c.id === finalFormData.id ? (finalFormData as Customer) : c));
        } else { // New customer
            setCustomers([...customers, { ...finalFormData, id: `cust_${Date.now()}` } as Customer]);
        }
        navigate('/customers');
    };

    const parentCompanyCandidates = customers.filter(c => c.type === CustomerType.B2B && !c.parentCompanyId);

    const TabButton: React.FC<{ tab: 'details' | 'pricing', label: string }> = ({ tab, label }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === tab ? 'bg-white border-ui-stroke border-t border-x -mb-px' : 'bg-slate-100 text-text-secondary'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit}>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-semibold text-text-primary">{customerId ? 'Edit Customer' : 'Add New Customer'}</h2>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={() => navigate('/customers')} className="px-4 py-2 bg-slate-200 text-text-primary rounded-md hover:bg-slate-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-snowva-orange text-white rounded-md hover:bg-snowva-orange-dark">Save Customer</button>
                    </div>
                </div>

                {formData.type === CustomerType.B2B && (
                    <div className="border-b border-ui-stroke mb-6">
                        <TabButton tab="details" label="Customer Details" />
                        <TabButton tab="pricing" label="Custom Product Pricing" />
                    </div>
                )}
                
                <div className={activeTab === 'details' ? 'block' : 'hidden'}>
                    <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Customer Name</label>
                                <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" />
                            </div>
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-text-secondary">Customer Type</label>
                                <select name="type" id="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue">
                                    <option value={CustomerType.B2C}>Consumer</option>
                                    <option value={CustomerType.B2B}>Retail</option>
                                </select>
                            </div>
                        </div>

                        {formData.type === CustomerType.B2B && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="parentCompanyId" className="block text-sm font-medium text-text-secondary">Parent Company (optional)</label>
                                    <select name="parentCompanyId" id="parentCompanyId" value={formData.parentCompanyId || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue">
                                        <option value="">None (Is a Parent Company)</option>
                                        {parentCompanyCandidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="branchNumber" className="block text-sm font-medium text-text-secondary">Branch #</label>
                                    <input type="text" name="branchNumber" id="branchNumber" value={formData.branchNumber || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" />
                                </div>
                            </div>
                        )}

                        <fieldset className="border p-4 rounded-md">
                            <legend className="text-lg font-medium text-text-primary px-1">Contact Information</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div>
                                    <label htmlFor="contactPerson" className="block text-sm font-medium text-text-secondary">Contact Person</label>
                                    <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" />
                                </div>
                                <div>
                                    <label htmlFor="contactEmail" className="block text-sm font-medium text-text-secondary">Contact Email</label>
                                    <input type="email" name="contactEmail" id="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" />
                                </div>
                                <div>
                                    <label htmlFor="contactPhone" className="block text-sm font-medium text-text-secondary">Contact Telephone</label>
                                    <input type="tel" name="contactPhone" id="contactPhone" value={formData.contactPhone || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" />
                                </div>
                            </div>
                        </fieldset>

                        {formData.type === CustomerType.B2B && (
                            <fieldset className="border p-4 rounded-md">
                                <legend className="text-lg font-medium text-text-primary px-1">Billing Information</legend>
                                <div className="space-y-4 pt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="legalEntityName" className="block text-sm font-medium text-text-secondary">Bill To (Legal Entity Name)</label>
                                            <input type="text" name="legalEntityName" id="legalEntityName" value={formData.legalEntityName || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" />
                                        </div>
                                        <div>
                                            <label htmlFor="vatNumber" className="block text-sm font-medium text-text-secondary">VAT Number</label>
                                            <input type="text" name="vatNumber" id="vatNumber" value={formData.vatNumber || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" />
                                        </div>
                                    </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="paymentTerm" className="block text-sm font-medium text-text-secondary">Payment Terms</label>
                                            <select name="paymentTerm" id="paymentTerm" value={formData.paymentTerm || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue">
                                                {Object.values(PaymentTerm).map((value) => <option key={value} value={value}>{value}</option>)}
                                            </select>
                                        </div>
                                        {formData.parentCompanyId && (
                                            <div className="flex items-end pb-2">
                                                <label className="flex items-center space-x-3">
                                                    <input 
                                                        type="checkbox" 
                                                        name="billToParent" 
                                                        checked={formData.billToParent || false} 
                                                        onChange={handleCheckboxChange}
                                                        className="h-5 w-5 rounded border-gray-300 text-snowva-blue focus:ring-snowva-blue"
                                                    />
                                                    <span className="text-sm font-medium text-text-secondary">Bill to Parent Company</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="defaultInvoiceNotes" className="block text-sm font-medium text-text-secondary">Default Invoice Notes/Codes</label>
                                        <textarea name="defaultInvoiceNotes" id="defaultInvoiceNotes" rows={3} value={formData.defaultInvoiceNotes || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue" placeholder="e.g., PO number required for all invoices."></textarea>
                                    </div>
                                </div>
                            </fieldset>
                        )}
                        
                        <div className="space-y-4">
                            <AddressForm
                                title="Billing Address"
                                address={billingAddress}
                                onAddressChange={handleBillingAddressChange}
                                isSameAs={billingSameAsDelivery}
                                onSameAsChange={setBillingSameAsDelivery}
                                sameAsLabel="Same as Delivery"
                            />
                            <AddressForm
                                title="Delivery Address"
                                address={deliveryAddress}
                                onAddressChange={handleDeliveryAddressChange}
                                isSameAs={deliverySameAsBilling}
                                onSameAsChange={setDeliverySameAsBilling}
                                sameAsLabel="Same as Billing"
                            />
                        </div>
                    </div>
                </div>

                <div className={activeTab === 'pricing' ? 'block' : 'hidden'}>
                    <CustomerPricingEditor 
                        customer={formData}
                        setCustomer={setFormData}
                        customers={allCustomers}
                        products={allProducts}
                    />
                </div>
            </form>
        </div>
    );
};