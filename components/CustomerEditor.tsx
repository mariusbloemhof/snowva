
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, CustomerType, Address, PaymentTerm } from '../types';
import { customers as allCustomers } from '../constants';
import { products as allProducts } from '../constants';
import { CustomerPricingEditor } from './CustomerPricingEditor';
import { useToast } from '../contexts/ToastContext';

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

type FormErrors = {
    name?: string;
}

const formElementClasses = "block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
const labelClasses = "block text-sm font-medium leading-6 text-slate-900";


const AddressForm: React.FC<{
    address: Partial<Address>;
    onAddressChange: (field: keyof Address, value: string) => void;
    title: string;
}> = ({ address, onAddressChange, title }) => {
    return (
        <div>
            <h3 className="text-base font-semibold leading-7 text-slate-900">{title}</h3>
            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                <div className="col-span-full">
                    <label htmlFor={`${title}-street`} className={labelClasses}>Street Address</label>
                    <div className="mt-2">
                        <input type="text" id={`${title}-street`} placeholder="Street Address" value={address.street || ''} onChange={(e) => onAddressChange('street', e.target.value)} className={formElementClasses} />
                    </div>
                </div>
                 <div className="sm:col-span-2">
                    <label htmlFor={`${title}-city`} className={labelClasses}>City</label>
                    <div className="mt-2">
                        <input type="text" id={`${title}-city`} placeholder="City" value={address.city || ''} onChange={(e) => onAddressChange('city', e.target.value)} className={formElementClasses} />
                    </div>
                </div>
                 <div className="sm:col-span-2">
                    <label htmlFor={`${title}-province`} className={labelClasses}>Province</label>
                    <div className="mt-2">
                        <input type="text" id={`${title}-province`} placeholder="Province" value={address.province || ''} onChange={(e) => onAddressChange('province', e.target.value)} className={formElementClasses} />
                    </div>
                </div>
                 <div className="sm:col-span-2">
                    <label htmlFor={`${title}-postalCode`} className={labelClasses}>Postal Code</label>
                    <div className="mt-2">
                        <input type="text" id={`${title}-postalCode`} placeholder="Postal Code" value={address.postalCode || ''} onChange={(e) => onAddressChange('postalCode', e.target.value)} className={formElementClasses} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const CustomerEditor: React.FC<CustomerEditorProps> = ({ customers, setCustomers, customerId }) => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Omit<Customer, 'id'> & { id?: string }>(emptyCustomer);
    const [activeTab, setActiveTab] = useState<'details' | 'pricing'>('details');
    const [errors, setErrors] = useState<FormErrors>({});
    
    const [billingAddress, setBillingAddress] = useState<Partial<Address>>({});
    const [deliveryAddress, setDeliveryAddress] = useState<Partial<Address>>({});
    
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
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
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

    const validateForm = () => {
        const newErrors: FormErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Customer name is required.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            addToast('Please fix the errors before saving.', 'error');
            return;
        }
        
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
        addToast('Customer saved successfully!', 'success');
        navigate('/customers');
    };

    const parentCompanyCandidates = customers.filter(c => c.type === CustomerType.B2B && !c.parentCompanyId);

    const TabButton: React.FC<{ tab: 'details' | 'pricing', label: string }> = ({ tab, label }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'bg-transparent text-slate-600 hover:text-slate-900'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200">
            <form onSubmit={handleSubmit} noValidate>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-200 pb-4">
                    <div>
                        <h2 className="text-2xl font-semibold leading-6 text-slate-900">{customerId ? 'Edit Customer' : 'Add New Customer'}</h2>
                        <p className="mt-1 text-sm text-slate-600">Manage customer details, addresses, and billing information.</p>
                    </div>
                    <div className="flex items-center justify-end space-x-3 mt-4 sm:mt-0">
                        <button type="button" onClick={() => navigate('/customers')} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
                        <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save Customer</button>
                    </div>
                </div>

                {formData.type === CustomerType.B2B && (
                    <div className="mb-6 p-1 bg-slate-100 rounded-lg flex items-center space-x-1 max-w-xs">
                        <TabButton tab="details" label="Customer Details" />
                        <TabButton tab="pricing" label="Custom Product Pricing" />
                    </div>
                )}
                
                <div className={activeTab === 'details' ? 'block' : 'hidden'}>
                    <div className="space-y-10 divide-y divide-slate-200">
                        <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
                            <div className="px-4 sm:px-0">
                                <h2 className="text-base font-semibold leading-7 text-slate-900">General Information</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600">Basic details for the customer.</p>
                            </div>
                            <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl md:col-span-2">
                                <div className="px-4 py-6 sm:p-8">
                                    <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                                        <div className="sm:col-span-4">
                                            <label htmlFor="name" className={labelClasses}>Customer Name</label>
                                            <div className="mt-2">
                                                <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className={`${formElementClasses} ${errors.name ? 'ring-red-500' : ''}`} />
                                            </div>
                                            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                                        </div>
                                        <div className="sm:col-span-3">
                                            <label htmlFor="type" className={labelClasses}>Customer Type</label>
                                            <div className="mt-2">
                                                <select name="type" id="type" value={formData.type} onChange={handleChange} className={formElementClasses}>
                                                    <option value={CustomerType.B2C}>Consumer</option>
                                                    <option value={CustomerType.B2B}>Retail</option>
                                                </select>
                                            </div>
                                        </div>
                                        {formData.type === CustomerType.B2B && (
                                        <>
                                            <div className="sm:col-span-4">
                                                <label htmlFor="parentCompanyId" className={labelClasses}>Parent Company (optional)</label>
                                                <div className="mt-2">
                                                    <select name="parentCompanyId" id="parentCompanyId" value={formData.parentCompanyId || ''} onChange={handleChange} className={formElementClasses}>
                                                        <option value="">None (Is a Parent Company)</option>
                                                        {parentCompanyCandidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label htmlFor="branchNumber" className={labelClasses}>Branch #</label>
                                                <div className="mt-2">
                                                <input type="text" name="branchNumber" id="branchNumber" value={formData.branchNumber || ''} onChange={handleChange} className={formElementClasses} />
                                                </div>
                                            </div>
                                        </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                         <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
                            <div className="px-4 sm:px-0">
                                <h2 className="text-base font-semibold leading-7 text-slate-900">Contact Information</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600">How to get in touch with the customer.</p>
                            </div>
                            <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl md:col-span-2">
                                <div className="px-4 py-6 sm:p-8">
                                     <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                                        <div className="sm:col-span-3">
                                            <label htmlFor="contactPerson" className={labelClasses}>Contact Person</label>
                                            <div className="mt-2"><input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} className={formElementClasses} /></div>
                                        </div>
                                        <div className="sm:col-span-4">
                                            <label htmlFor="contactEmail" className={labelClasses}>Contact Email</label>
                                            <div className="mt-2"><input type="email" name="contactEmail" id="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} className={formElementClasses} /></div>
                                        </div>
                                        <div className="sm:col-span-3">
                                            <label htmlFor="contactPhone" className={labelClasses}>Contact Telephone</label>
                                            <div className="mt-2"><input type="tel" name="contactPhone" id="contactPhone" value={formData.contactPhone || ''} onChange={handleChange} className={formElementClasses} /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {formData.type === CustomerType.B2B && (
                            <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
                                <div className="px-4 sm:px-0">
                                    <h2 className="text-base font-semibold leading-7 text-slate-900">Billing Information</h2>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">Details for invoicing and payments.</p>
                                </div>
                                <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl md:col-span-2">
                                    <div className="px-4 py-6 sm:p-8">
                                        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                                            <div className="sm:col-span-4">
                                                <label htmlFor="legalEntityName" className={labelClasses}>Bill To (Legal Entity Name)</label>
                                                <div className="mt-2"><input type="text" name="legalEntityName" id="legalEntityName" value={formData.legalEntityName || ''} onChange={handleChange} className={formElementClasses} /></div>
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label htmlFor="vatNumber" className={labelClasses}>VAT Number</label>
                                                <div className="mt-2"><input type="text" name="vatNumber" id="vatNumber" value={formData.vatNumber || ''} onChange={handleChange} className={formElementClasses} /></div>
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label htmlFor="paymentTerm" className={labelClasses}>Payment Terms</label>
                                                <div className="mt-2">
                                                    <select name="paymentTerm" id="paymentTerm" value={formData.paymentTerm || ''} onChange={handleChange} className={formElementClasses}>
                                                        {Object.values(PaymentTerm).map((value) => <option key={value} value={value}>{value}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                             {formData.parentCompanyId && (
                                                <div className="sm:col-span-full">
                                                    <div className="relative flex gap-x-3">
                                                         <div className="flex h-6 items-center">
                                                            <input 
                                                                type="checkbox" 
                                                                name="billToParent"
                                                                id="billToParent"
                                                                checked={formData.billToParent || false} 
                                                                onChange={handleCheckboxChange}
                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                                            />
                                                        </div>
                                                        <div className="text-sm leading-6">
                                                            <label htmlFor="billToParent" className="font-medium text-slate-900">Bill to Parent Company</label>
                                                            <p className="text-slate-500">If checked, all invoices for this branch will be assigned to the parent company.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="col-span-full">
                                                <label htmlFor="defaultInvoiceNotes" className={labelClasses}>Default Invoice Notes/Codes</label>
                                                <div className="mt-2"><textarea name="defaultInvoiceNotes" id="defaultInvoiceNotes" rows={3} value={formData.defaultInvoiceNotes || ''} onChange={handleChange} className={formElementClasses} placeholder="e.g., PO number required for all invoices."></textarea></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
                             <div className="px-4 sm:px-0">
                                <h2 className="text-base font-semibold leading-7 text-slate-900">Addresses</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600">Primary billing and delivery addresses.</p>
                            </div>
                             <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl md:col-span-2">
                                <div className="px-4 py-6 sm:p-8 space-y-8">
                                    <AddressForm
                                        title="Billing Address"
                                        address={billingAddress}
                                        onAddressChange={handleBillingAddressChange}
                                    />
                                    <AddressForm
                                        title="Delivery Address"
                                        address={deliveryAddress}
                                        onAddressChange={handleDeliveryAddressChange}
                                    />
                                </div>
                             </div>
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
