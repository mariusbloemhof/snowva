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
                return { ...localOverride, status: 'overridden', parentPrice };
            } else {
                return { ...parentPrice, status: 'inherited' };
            }
        });

        localPricingMap.forEach(localPrice => {
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
            case 'inherited': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">Inherited</span>;
            case 'overridden': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Overridden</span>;
            case 'local': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Custom</span>;
        }
    };
    
    return (
        <div className="space-y-4">
             <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-left">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-3 font-semibold text-sm">Product</th>
                            <th className="p-3 font-semibold text-sm">Custom Price (Retail)</th>
                            <th className="p-3 font-semibold text-sm">Status</th>
                            <th className="p-3 font-semibold text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    {mergedPricing.map(priceInfo => {
                        const product = products.find(p => p.id === priceInfo.productId);
                        const currentCustomPrice = getCurrentPrice({prices: priceInfo.prices});
                        return (
                             <tr key={priceInfo.id} className="border-b last:border-0 hover:bg-slate-50">
                                <td className="p-3 font-medium">{product?.name || 'Unknown Product'}</td>
                                <td className="p-3">R {currentCustomPrice?.retail.toFixed(2) || 'N/A'}</td>
                                <td className="p-3">{getStatusBadge(priceInfo.status)}</td>
                                <td className="p-3">
                                    <div className="flex space-x-2">
                                    {priceInfo.status === 'inherited' && (
                                        <button type="button" onClick={() => handleSelectProductToAdd(product!)} className="text-sm text-blue-600 hover:underline">Override</button>
                                    )}
                                    {priceInfo.status === 'overridden' && (
                                        <>
                                            <button type="button" onClick={() => setEditingPrice(priceInfo)} className="text-blue-600 hover:text-blue-800"><PencilIcon/></button>
                                            <button type="button" onClick={() => handleRestoreToParent(priceInfo.productId)} className="text-sm text-slate-600 hover:underline">Restore</button>
                                        </>
                                    )}
                                     {priceInfo.status === 'local' && (
                                        <>
                                            <button type="button" onClick={() => setEditingPrice(priceInfo)} className="text-blue-600 hover:text-blue-800"><PencilIcon/></button>
                                            <button type="button" onClick={() => handleRemoveLocal(priceInfo.id)} className="text-red-600 hover:text-red-800"><TrashIcon /></button>
                                        </>
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

             {isAdding && (
                <div className="p-2 border border-ui-stroke rounded-md">
                    <label className="block text-sm font-medium text-text-secondary mb-2" htmlFor="product-selector-override">Select a product to add an override:</label>
                    <ProductSelector id="product-selector-override" products={products} onSelectProduct={handleSelectProductToAdd} />
                </div>
             )}

             <button type="button" onClick={() => setIsAdding(!isAdding)} className="flex items-center text-snowva-cyan hover:text-snowva-blue font-semibold">
                <PlusIcon /> <span className="ml-1">{isAdding ? 'Cancel' : 'Add Product Price Override'}</span>
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