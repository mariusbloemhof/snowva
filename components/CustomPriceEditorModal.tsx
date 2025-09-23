
import React, { useState } from 'react';
import { Product, CustomerProductPrice, Price } from '../types';
import { PlusIcon } from './Icons';
import { getCurrentPrice } from '../utils';

interface CustomPriceEditorModalProps {
    product: Product;
    customerPrice: CustomerProductPrice;
    onSave: (updatedPrice: CustomerProductPrice) => void;
    onClose: () => void;
}

const emptyNewPrice = {
    effectiveDate: new Date().toISOString().split('T')[0],
    retail: 0,
    consumer: 0, // Not used for B2B custom pricing but part of the type
};

export const CustomPriceEditorModal: React.FC<CustomPriceEditorModalProps> = ({ product, customerPrice, onSave, onClose }) => {
    const [formData, setFormData] = useState<CustomerProductPrice>(customerPrice);
    const [newPrice, setNewPrice] = useState(emptyNewPrice);

    const formElementClasses = "block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
    const labelClasses = "block text-sm font-medium leading-6 text-slate-900";


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewPrice(prev => ({ ...prev, [name]: name === 'effectiveDate' ? value : parseFloat(value) || 0 }));
    };

    const handleAddPrice = () => {
        if (!newPrice.effectiveDate) {
            alert('Please select an effective date.');
            return;
        }
        const newPriceWithId: Price = {
            ...newPrice,
            id: `price_${Date.now()}`
        };
        setFormData(prev => ({
            ...prev,
            prices: [...prev.prices, newPriceWithId]
        }));
        setNewPrice(emptyNewPrice); // Reset for next entry
    };

    const handleSubmit = () => {
        if (formData.prices.length === 0) {
            alert('Please add at least one price.');
            return;
        }
        onSave(formData);
    };

    const sortedPrices = [...formData.prices].sort((a,b) => b.effectiveDate.localeCompare(a.effectiveDate));
    const currentPrice = getCurrentPrice({ prices: formData.prices });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold mb-2 text-slate-900">Edit Custom Price</h3>
                <p className="mb-6 text-slate-600">for <span className="font-semibold text-indigo-600">{product.name}</span></p>
                
                <div className="space-y-6">
                    <div>
                        <label htmlFor="customItemCode" className={labelClasses}>Custom Item Code</label>
                        <div className="mt-2">
                          <input type="text" name="customItemCode" id="customItemCode" value={formData.customItemCode || ''} onChange={handleChange} className={formElementClasses}/>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="customDescription" className={labelClasses}>Custom Description</label>
                         <div className="mt-2">
                            <textarea name="customDescription" id="customDescription" rows={3} value={formData.customDescription || ''} onChange={handleChange} className={formElementClasses}></textarea>
                         </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg">
                         <h3 className="text-base font-semibold leading-6 text-slate-900 border-b border-slate-200 px-4 py-3">Price Management</h3>
                        <div className="p-4 space-y-4">
                            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                <h4 className="font-semibold text-indigo-800">Current Effective Custom Price</h4>
                                {currentPrice ? (
                                    <p className="text-2xl font-bold text-slate-800 text-center py-2">R {currentPrice.retail.toFixed(2)}</p>
                                ) : (
                                    <p className="text-slate-500 mt-2 text-center">No current price is set.</p>
                                )}
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-slate-800 mb-2">Add New Price</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label htmlFor="effectiveDate" className={`${labelClasses} text-xs`}>Effective Date</label>
                                        <input type="date" name="effectiveDate" id="effectiveDate" value={newPrice.effectiveDate} onChange={handleNewPriceChange} className={`${formElementClasses} mt-1`}/>
                                    </div>
                                    <div>
                                        <label htmlFor="retail" className={`${labelClasses} text-xs`}>Retail Price</label>
                                        <input type="number" name="retail" id="retail" value={newPrice.retail} onChange={handleNewPriceChange} step="0.01" className={`${formElementClasses} mt-1`}/>
                                    </div>
                                    <button type="button" onClick={handleAddPrice} className="inline-flex items-center justify-center w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                                        <PlusIcon className="w-5 h-5 mr-2" /> Add
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-2 mt-4">Price History</h4>
                                <div className="overflow-x-auto max-h-48 border rounded-md">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-100 sticky top-0">
                                            <tr>
                                                <th className="p-2 font-semibold">Effective Date</th>
                                                <th className="p-2 font-semibold text-right">Retail Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {sortedPrices.map(price => (
                                                <tr key={price.id}>
                                                    <td className="p-2">{price.effectiveDate}</td>
                                                    <td className="p-2 text-right">R {price.retail.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {sortedPrices.length === 0 && (
                                                <tr><td colSpan={2} className="text-center p-4 text-slate-500">No prices added yet.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                    <button onClick={onClose} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
                    <button onClick={handleSubmit} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save Changes</button>
                </div>
            </div>
        </div>
    );
};
