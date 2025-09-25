import React, { useEffect, useRef, useState } from 'react';
import { useBlocker, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { Address, AppContextType, Customer, CustomerType, PaymentTerm } from '../types';
import { CustomerHistoryTab } from './CustomerHistoryTab';
import { CustomerPricingEditor } from './CustomerPricingEditor';
import { CashIcon, DocumentReportIcon, UsersIcon } from './Icons';

const emptyCustomer: Omit<Customer, 'id'> = {
    name: '',
    type: CustomerType.B2C,
    addresses: [],
};

type FormErrors = {
    name?: string;
}

interface NominatimResult {
    display_name: string;
    address: {
        road?: string;
        house_number?: string;
        suburb?: string;
        city?: string;
        town?: string;
        village?: string;
        state?: string; // Province
        postcode?: string;
        country?: string;
    }
}

interface FormattedAddress {
    displayName: string;
    addressLine1: string;
    addressLine2?: string;
    suburb: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
}


// Real-world address lookup using OpenStreetMap Nominatim API
const addressLookup = async (query: string): Promise<FormattedAddress[]> => {
    if (query.length < 3) return [];
    
    // Prioritize results in South Africa (ZA)
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&countrycodes=ZA&limit=5`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error("Nominatim API request failed");
            return [];
        }
        const results: NominatimResult[] = await response.json();
        
        return results.map(result => {
            const addr = result.address;
            const addressLine1 = [addr.house_number, addr.road].filter(Boolean).join(' ');
            return {
                displayName: result.display_name,
                addressLine1: addressLine1 || '',
                addressLine2: '', // Nominatim doesn't have a clear line 2
                suburb: addr.suburb || '',
                city: addr.city || addr.town || addr.village || '',
                province: addr.state || '',
                postalCode: addr.postcode || '',
                country: addr.country || 'South Africa'
            };
        });
    } catch (error) {
        console.error("Error fetching address suggestions:", error);
        return [];
    }
};


const formElementClasses = "block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
const labelClasses = "block text-sm font-medium leading-6 text-slate-900";


const AddressForm: React.FC<{
    address: Partial<Address>;
    onAddressChange: (field: keyof Address, value: string) => void;
    title: string;
}> = ({ address, onAddressChange, title }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<FormattedAddress[]>([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Debounce search input
    useEffect(() => {
        setIsLoading(true);
        const handler = setTimeout(() => {
            if (searchQuery.length > 2) {
                addressLookup(searchQuery).then(results => {
                    setSuggestions(results);
                    setIsDropdownOpen(results.length > 0);
                    setIsLoading(false);
                });
            } else {
                setSuggestions([]);
                setIsDropdownOpen(false);
                setIsLoading(false);
            }
        }, 300); // 300ms debounce delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    // Handle clicks outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelectSuggestion = (suggestion: FormattedAddress) => {
        onAddressChange('addressLine1', suggestion.addressLine1);
        onAddressChange('suburb', suggestion.suburb);
        onAddressChange('city', suggestion.city);
        onAddressChange('province', suggestion.province);
        onAddressChange('postalCode', suggestion.postalCode);
        onAddressChange('country', suggestion.country);
        setSearchQuery('');
        setSuggestions([]);
        setIsDropdownOpen(false);
    };

    return (
        <div ref={wrapperRef}>
            <h3 className="text-base font-semibold leading-7 text-slate-900">{title}</h3>
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 border-t border-slate-200 pt-10">
                 <div className="sm:col-span-full relative">
                    <label htmlFor={`${title}-search`} className={labelClasses}>Address Search</label>
                    <div className="mt-2 relative">
                        <input
                            type="text"
                            id={`${title}-search`}
                            placeholder="Start typing an address..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={formElementClasses}
                            autoComplete="off"
                        />
                        {isLoading && <div className="absolute inset-y-0 right-0 flex items-center pr-3"><div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div></div>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Address search powered by © OpenStreetMap contributors.</p>
                    {isDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg">
                            <ul className="max-h-60 overflow-y-auto">
                                {suggestions.map((suggestion, index) => (
                                    <li
                                        key={index}
                                        onClick={() => handleSelectSuggestion(suggestion)}
                                        className="px-4 py-2 cursor-pointer text-sm text-slate-700 hover:bg-indigo-600 hover:text-white"
                                    >
                                        {suggestion.displayName}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="sm:col-span-full">
                    <label htmlFor={`${title}-addressLine1`} className={labelClasses}>Address Line 1</label>
                    <div className="mt-2"><input type="text" id={`${title}-addressLine1`} placeholder="Street address" value={address.addressLine1 || ''} onChange={(e) => onAddressChange('addressLine1', e.target.value)} className={formElementClasses} /></div>
                </div>

                <div className="sm:col-span-full">
                    <label htmlFor={`${title}-addressLine2`} className={labelClasses}>Address Line 2 <span className="text-slate-500">(optional)</span></label>
                    <div className="mt-2"><input type="text" id={`${title}-addressLine2`} placeholder="e.g. The Factory, Unit 5" value={address.addressLine2 || ''} onChange={(e) => onAddressChange('addressLine2', e.target.value)} className={formElementClasses} /></div>
                </div>

                <div className="sm:col-span-full">
                    <label htmlFor={`${title}-suburb`} className={labelClasses}>Suburb</label>
                    <div className="mt-2"><input type="text" id={`${title}-suburb`} placeholder="Suburb" value={address.suburb || ''} onChange={(e) => onAddressChange('suburb', e.target.value)} className={formElementClasses} /></div>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor={`${title}-city`} className={labelClasses}>City</label>
                    <div className="mt-2"><input type="text" id={`${title}-city`} placeholder="City" value={address.city || ''} onChange={(e) => onAddressChange('city', e.target.value)} className={formElementClasses} /></div>
                </div>

                <div className="sm:col-span-2">
                    <label htmlFor={`${title}-province`} className={labelClasses}>Province</label>
                    <div className="mt-2"><input type="text" id={`${title}-province`} placeholder="Province" value={address.province || ''} onChange={(e) => onAddressChange('province', e.target.value)} className={formElementClasses} /></div>
                </div>
                 
                <div className="sm:col-span-2">
                    <label htmlFor={`${title}-postalCode`} className={labelClasses}>Postal Code</label>
                    <div className="mt-2"><input type="text" id={`${title}-postalCode`} placeholder="Postal Code" value={address.postalCode || ''} onChange={(e) => onAddressChange('postalCode', e.target.value)} className={formElementClasses} /></div>
                </div>

                <div className="sm:col-span-full">
                    <label htmlFor={`${title}-country`} className={labelClasses}>Country</label>
                    <div className="mt-2"><input type="text" id={`${title}-country`} placeholder="Country" value={address.country || ''} onChange={(e) => onAddressChange('country', e.target.value)} className={formElementClasses} /></div>
                </div>
            </div>
        </div>
    );
};

export const CustomerEditor: React.FC = () => {
    const { id: customerId } = useParams<{ id: string }>();
    const { customers, setCustomers, invoices, quotes, payments, products } = useOutletContext<AppContextType>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Omit<Customer, 'id'> & { id?: string }>(emptyCustomer);
    const [activeTab, setActiveTab] = useState<'details' | 'pricing' | 'history'>('details');
    const [errors, setErrors] = useState<FormErrors>({});
    
    const [isDirty, setIsDirty] = useState(false);
    const [billingAddress, setBillingAddress] = useState<Partial<Address>>({});
    const [deliveryAddress, setDeliveryAddress] = useState<Partial<Address>>({});
    
    const initialState = useRef<string>('');
    const initialDataLoaded = useRef(false);
    const isSaving = useRef(false);
    const [showUnsavedChangesPrompt, setShowUnsavedChangesPrompt] = useState(false);

    // Navigate immediately after save without using state
    const navigateAfterSave = () => {
        // Set flag to bypass blocker
        isSaving.current = true;
        // Navigate immediately
        navigate('/customers');
    };

    // Handle cancel - discard changes and navigate away
    const handleCancel = () => {
        // Reset dirty state first
        setIsDirty(false);
        // Use setTimeout to ensure state update is processed before navigation
        setTimeout(() => {
            navigate('/customers');
        }, 0);
    };

    useEffect(() => {
        // Reset whenever customerId changes to handle navigation between customers
        initialDataLoaded.current = false;
        setIsDirty(false);

        if (customerId) {
            const customerToEdit = customers.find(c => c.id === customerId);
            if (customerToEdit) {
                setFormData(customerToEdit);
                const addresses = Array.isArray(customerToEdit.addresses) ? customerToEdit.addresses : [];
                const primaryBilling = addresses.find(a => a.type === 'billing' && a.isPrimary);
                const primaryDelivery = addresses.find(a => a.type === 'delivery' && a.isPrimary);
                setBillingAddress(primaryBilling || {});
                setDeliveryAddress(primaryDelivery || {});
            } else {
                navigate('/customers');
            }
        } else {
            setFormData(emptyCustomer);
            setBillingAddress({});
            setDeliveryAddress({});
        }
    }, [customerId, customers, navigate]);

    useEffect(() => {
        // After data is set from the effect above, capture the initial state string.
        // This runs after every render, but we only set it once per customer load.
        if (!initialDataLoaded.current && (formData.id || !customerId)) {
            initialState.current = JSON.stringify({ formData, billingAddress, deliveryAddress });
            initialDataLoaded.current = true;
        }

        // Now, check for dirtiness against the captured initial state.
        const currentState = JSON.stringify({ formData, billingAddress, deliveryAddress });
        setIsDirty(currentState !== initialState.current);
        
    }, [formData, billingAddress, deliveryAddress, customerId]);


    const blocker = useBlocker(isDirty && !isSaving.current);

    useEffect(() => {
        if (blocker.state === 'blocked') {
            setShowUnsavedChangesPrompt(true);
        } else {
            setShowUnsavedChangesPrompt(false);
        }
    }, [blocker]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (isDirty) {
                event.preventDefault();
                event.returnValue = ''; // Required for Chrome
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

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

        const finalCustomerData = finalFormData.id ? (finalFormData as Customer) : ({ ...finalFormData, id: `cust_${Date.now()}` } as Customer);
        
        if (customerId) {
            setCustomers(customers.map(c => c.id === finalCustomerData.id ? finalCustomerData : c));
        } else {
            setCustomers([...customers, finalCustomerData]);
        }
        
        addToast('Customer saved successfully!', 'success');

        // Reset dirty state and navigate immediately
        initialState.current = JSON.stringify({ formData: finalCustomerData, billingAddress, deliveryAddress });
        setIsDirty(false);
        
        // Navigate after a brief delay to ensure state is updated
        setTimeout(() => {
            navigateAfterSave();
        }, 0);
    };

    const parentCompanyCandidates = customers.filter(c => c.type === CustomerType.B2B && !c.parentCompanyId);

    const TabButton: React.FC<{ tab: 'details' | 'pricing' | 'history', label: string, icon: React.ReactElement<{ className?: string }> }> = ({ tab, label, icon }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-x-2 whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors duration-200 focus:outline-none ${
                activeTab === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
        >
            {React.cloneElement(icon, { className: 'h-5 w-5' })}
            {label}
        </button>
    );

    return (
        <>
            {showUnsavedChangesPrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        <h3 className="text-lg font-bold mb-2 text-slate-900">Unsaved Changes</h3>
                        <p className="text-sm text-slate-600 mb-4">
                            You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
                        </p>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button onClick={() => blocker.reset?.()} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Stay</button>
                            <button onClick={() => blocker.proceed?.()} className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">Leave</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200">
                <form onSubmit={handleSubmit} noValidate>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-200 pb-4">
                        <div>
                            <h2 className="text-2xl font-semibold leading-6 text-slate-900">{customerId ? 'Edit Customer' : 'Add New Customer'}</h2>
                            <p className="mt-1 text-sm text-slate-600">Manage customer details, addresses, and billing information.</p>
                        </div>
                        <div className="flex items-center justify-end space-x-3 mt-4 sm:mt-0">
                            <button type="button" onClick={handleCancel} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
                            <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save Customer</button>
                        </div>
                    </div>

                    {formData.id && (
                        <div className="mb-8 border-b border-slate-200">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                <TabButton tab="details" label="Customer Details" icon={<UsersIcon />} />
                                {formData.type === CustomerType.B2B && (
                                    <TabButton tab="pricing" label="Custom Product Pricing" icon={<CashIcon />} />
                                )}
                                <TabButton tab="history" label="History" icon={<DocumentReportIcon />} />
                            </nav>
                        </div>
                    )}
                    
                    <div className={activeTab === 'details' ? 'block' : 'hidden'}>
                        <div className="space-y-12">
                            <div className="border-b border-slate-200 pb-12">
                                <h2 className="text-base font-semibold leading-7 text-slate-900">General Information</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600">Basic details for the customer.</p>
                                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                    <div className="sm:col-span-4">
                                        <label htmlFor="name" className={labelClasses}>Customer Name</label>
                                        <div className="mt-2">
                                            <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} required className={`${formElementClasses} ${errors.name ? 'ring-red-500' : ''}`} />
                                        </div>
                                        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                                    </div>
                                    <div className="sm:col-span-4">
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
                                    <div className="sm:col-span-3">
                                        <label htmlFor="parentCompanyId" className={labelClasses}>Parent Company <span className="text-slate-500">(optional)</span></label>
                                        <div className="mt-2">
                                            <select name="parentCompanyId" id="parentCompanyId" value={formData.parentCompanyId || ''} onChange={handleChange} className={formElementClasses}>
                                                <option value="">None (Is a Parent Company)</option>
                                                {parentCompanyCandidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="sm:col-span-3">
                                        <label htmlFor="branchNumber" className={labelClasses}>Branch #</label>
                                        <div className="mt-2">
                                            <input type="text" name="branchNumber" id="branchNumber" value={formData.branchNumber || ''} onChange={handleChange} className={formElementClasses} />
                                        </div>
                                    </div>
                                    </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="border-b border-slate-200 pb-12">
                                <h2 className="text-base font-semibold leading-7 text-slate-900">Contact Information</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600">How to get in touch with the customer.</p>
                                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                    <div className="sm:col-span-4">
                                        <label htmlFor="contactPerson" className={labelClasses}>Contact Person</label>
                                        <div className="mt-2"><input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} className={formElementClasses} /></div>
                                    </div>
                                    <div className="sm:col-span-4">
                                        <label htmlFor="contactEmail" className={labelClasses}>Contact Email</label>
                                        <div className="mt-2"><input type="email" name="contactEmail" id="contactEmail" value={formData.contactEmail || ''} onChange={handleChange} className={formElementClasses} /></div>
                                    </div>
                                    <div className="sm:col-span-4">
                                        <label htmlFor="contactPhone" className={labelClasses}>Contact Telephone</label>
                                        <div className="mt-2"><input type="tel" name="contactPhone" id="contactPhone" value={formData.contactPhone || ''} onChange={handleChange} className={formElementClasses} /></div>
                                    </div>
                                </div>
                            </div>

                            {formData.type === CustomerType.B2B && (
                                <div className="border-b border-slate-200 pb-12">
                                    <h2 className="text-base font-semibold leading-7 text-slate-900">Billing Information</h2>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">Details for invoicing and payments.</p>
                                    <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                        <div className="sm:col-span-4">
                                            <label htmlFor="legalEntityName" className={labelClasses}>Bill To (Legal Entity Name)</label>
                                            <div className="mt-2"><input type="text" name="legalEntityName" id="legalEntityName" value={formData.legalEntityName || ''} onChange={handleChange} className={formElementClasses} /></div>
                                        </div>
                                        <div className="sm:col-span-4">
                                            <label htmlFor="vatNumber" className={labelClasses}>VAT Number</label>
                                            <div className="mt-2"><input type="text" name="vatNumber" id="vatNumber" value={formData.vatNumber || ''} onChange={handleChange} className={formElementClasses} /></div>
                                        </div>
                                        <div className="sm:col-span-4">
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
                                                <input type="checkbox" name="billToParent" id="billToParent" checked={formData.billToParent || false} onChange={handleCheckboxChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                                                </div>
                                                <div className="text-sm leading-6">
                                                <label htmlFor="billToParent" className="font-medium text-slate-900">Bill to Parent Company</label>
                                                <p className="text-slate-500">If checked, all invoices for this branch will be assigned to the parent company.</p>
                                                </div>
                                            </div>
                                        </div>
                                        )}
                                        <div className="sm:col-span-full">
                                            <label htmlFor="defaultInvoiceNotes" className={labelClasses}>Default Invoice Notes/Codes</label>
                                            <div className="mt-2"><textarea name="defaultInvoiceNotes" id="defaultInvoiceNotes" rows={3} value={formData.defaultInvoiceNotes || ''} onChange={handleChange} className={formElementClasses} placeholder="e.g., PO number required for all invoices."></textarea></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <h2 className="text-base font-semibold leading-7 text-slate-900">Addresses</h2>
                                <p className="mt-1 text-sm leading-6 text-slate-600">Primary billing and delivery addresses.</p>
                                <div className="mt-10 space-y-12">
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

                    <div className={activeTab === 'pricing' ? 'block' : 'hidden'}>
                        <CustomerPricingEditor 
                            customer={formData}
                            setCustomer={setFormData}
                            customers={customers}
                            products={products}
                        />
                    </div>
                    <div className={activeTab === 'history' ? 'block' : 'hidden'}>
                        <CustomerHistoryTab
                            customer={formData}
                            customers={customers}
                            invoices={invoices}
                            quotes={quotes}
                            payments={payments}
                        />
                    </div>
                </form>
            </div>
        </>
    );
};
