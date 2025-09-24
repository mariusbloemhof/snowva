
import React, { useState, useMemo } from 'react';
import { Customer, Product, CustomerProductPrice, Price } from '../types';
import { ProductSelector } from './ProductSelector';
import { PlusIcon, TrashIcon, PencilIcon } from './Icons';
import { getCurrentPrice } from '../utils';
import { CustomPriceEditorModal } from './CustomPriceEditorModal';

interface CustomerPricingEditorProps {
    customer: Omit<Customer, 'id'> & { id?: string };
    setCustomer: React.Dispatch<React.SetStateAction<Omit<Customer, 'id'> & { id?: string }>>;
    customers: Customer[];
    products: Product[];
}

type MergedPriceInfo = CustomerProductPrice & {
    status: 'inherited' | 'overridden' | 'local';
    parentPrice?: CustomerProductPrice;
};


export const CustomerPricingEditor: React.FC<CustomerPricingEditorProps> = ({ customer, setCustomer, customers, products }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingPrice, setEditingPrice] = useState<CustomerProductPrice | null>(null);

    const parent = useMemo(() => {
        if (!customer.parentCompanyId) return null;
        return customers.find(c => c.id === customer.parentCompanyId);
    }, [customer.parentCompanyId, customers]);

    const mergedPricing = useMemo((): MergedPriceInfo[] => {
        const parentPricing = parent?.customProductPricing || [];
        const localPricing = customer.customProductPricing || [];
        const localPricingMap = new Map(localPricing.map(p => [p.productId, p]));

        const merged: MergedPriceInfo[] = parentPricing.map(parentPrice => {
            const localOverride = localPricingMap.get(parentPrice.productId);
            if (localOverride) {
                localPricingMap.delete(parentPrice.productId);
                // FIX: Replaced Object.assign with spread syntax for better type inference.
                return { ...localOverride, status: 'overridden', parentPrice: parentPrice };
            } else {
                return { ...parentPrice, status: 'inherited' };
            }
        });

        localPricingMap.forEach(localPrice => {
            // FIX: Replaced Object.assign with spread syntax to resolve incorrect type inference.
            merged.push({ ...localPrice, status: 'local' });
        });

        return merged.sort((a,b) => products.find(p=>p.id===a.productId)!.name.localeCompare(products.find(p=>p.id===b.productId)!.name));
    }, [parent, customer.customProductPricing, products]);

    const handleSelectProductToAdd = (product: Product) => {
        const standardPrice = getCurrentPrice(product);
        const newCustomPrice: CustomerProductPrice = {
            id: `cpp_${Date.now()}`,
            productId: product.id,
            customItemCode: product.itemCode,
            customDescription: product.description,
            prices: standardPrice ? [{...standardPrice, id: `price_${Date.now()}`}] : [],
        };
        const updatedPricing = [...(customer.customProductPricing || []), newCustomPrice];
        setCustomer(prev => ({ ...prev, customProductPricing: updatedPricing }));
        setIsAdding(false);
    };
    
    const handleRestoreToParent = (productId: string) => {
        const updatedPricing = (customer.customProductPricing || []).filter(p => p.productId !== productId);
        setCustomer(prev => ({ ...prev, customProductPricing: updatedPricing }));
    };

    const handleRemoveLocal = (priceId: string) => {
        const updatedPricing = (customer.customProductPricing || []).filter(p => p.id !== priceId);
        setCustomer(prev => ({ ...prev, customProductPricing: updatedPricing }));
    };

    const handleSaveCustomPrice = (updatedPrice: CustomerProductPrice) => {
        const updatedPricing = (customer.customProductPricing || []).map(p => 
            p.id === updatedPrice.id ? updatedPrice : p
        );
        setCustomer(prev => ({ ...prev, customProductPricing: updatedPricing }));
        setEditingPrice(null); // Close modal
    };

    const getStatusBadge = (status: MergedPriceInfo['status']) => {
        switch (status) {
            case 'inherited': return <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">Inherited</span>;
            case 'overridden': return <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Overridden</span>;
            case 'local': return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Custom</span>;
        }
    };
    
    return (
        <div className="space-y-4">
             <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-slate-300">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Product</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Custom Price (Retail)</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                            {mergedPricing.map(priceInfo => {
                                const product = products.find(p => p.id === priceInfo.productId);
                                const currentCustomPrice = getCurrentPrice({prices: priceInfo.prices});
                                return (
                                    <tr key={priceInfo.id} className="hover:bg-slate-50">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">{product?.name || 'Unknown Product'}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">R {currentCustomPrice?.retail.toFixed(2) || 'N/A'}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{getStatusBadge(priceInfo.status)}</td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-4">
                                            {priceInfo.status === 'inherited' && (
                                                <button type="button" onClick={() => handleSelectProductToAdd(product!)} className="text-indigo-600 hover:text-indigo-900">Override</button>
                                            )}
                                            {(priceInfo.status === 'overridden' || priceInfo.status === 'local') && (
                                                <button type="button" onClick={() => setEditingPrice(priceInfo)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="w-5 h-5"/></button>
                                            )}
                                            {priceInfo.status === 'overridden' && (
                                                <button type="button" onClick={() => handleRestoreToParent(priceInfo.productId)} className="text-slate-600 hover:text-slate-900">Restore</button>
                                            )}
                                            {priceInfo.status === 'local' && (
                                                <button type="button" onClick={() => handleRemoveLocal(priceInfo.id)} className="text-slate-400 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                                            )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {mergedPricing.length === 0 && !isAdding && (
                                <tr><td colSpan={4} className="text-center p-4 text-slate-500">No custom prices defined for this customer.</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>

             {isAdding && (
                <div className="p-4 border border-slate-200 rounded-md">
                    <label className="block text-sm font-medium text-slate-900 mb-2" htmlFor="product-selector-override">Select a product to add an override:</label>
                    <ProductSelector id="product-selector-override" products={products} onSelectProduct={handleSelectProductToAdd} />
                </div>
             )}

             <button type="button" onClick={() => setIsAdding(!isAdding)} className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                <PlusIcon className="w-5 h-5" /> <span>{isAdding ? 'Cancel' : 'Add Product Price Override'}</span>
            </button>

            {editingPrice && (
                <CustomPriceEditorModal
                    product={products.find(p => p.id === editingPrice.productId)!}
                    customerPrice={editingPrice}
                    onSave={handleSaveCustomPrice}
                    onClose={() => setEditingPrice(null)}
                />
            )}
        </div>
    )
}
