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
                <h3 className="text-2xl font-bold mb-4 text-text-primary">Edit Custom Price</h3>
                <p className="mb-6 text-text-secondary">for <span className="font-semibold text-snowva-blue">{product.name}</span></p>
                
                <div className="space-y-6">
                    <div>
                        <label htmlFor="customItemCode" className="block text-sm font-medium text-text-secondary">Custom Item Code</label>
                        <input type="text" name="customItemCode" id="customItemCode" value={formData.customItemCode || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue"/>
                    </div>
                     <div>
                        <label htmlFor="customDescription" className="block text-sm font-medium text-text-secondary">Custom Description</label>
                        <textarea name="customDescription" id="customDescription" rows={3} value={formData.customDescription || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue"></textarea>
                    </div>

                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-lg font-medium text-text-primary px-1">Price Management</legend>
                        <div className="space-y-4 pt-2">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <h4 className="font-semibold text-blue-800">Current Effective Custom Price</h4>
                                {currentPrice ? (
                                    <p className="text-2xl font-bold text-slate-800 text-center py-2">R {currentPrice.retail.toFixed(2)}</p>
                                ) : (
                                    <p className="text-slate-500 mt-2 text-center">No current price is set.</p>
                                )}
                            </div>

                            <div className="bg-slate-50 p-3 rounded-md">
                                <h4 className="font-semibold mb-2">Add New Price</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label htmlFor="effectiveDate" className="block text-sm font-medium text-text-secondary">Effective Date</label>
                                        <input type="date" name="effectiveDate" id="effectiveDate" value={newPrice.effectiveDate} onChange={handleNewPriceChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md"/>
                                    </div>
                                    <div>
                                        <label htmlFor="retail" className="block text-sm font-medium text-text-secondary">Retail Price (ex. VAT)</label>
                                        <input type="number" name="retail" id="retail" value={newPrice.retail} onChange={handleNewPriceChange} step="0.01" className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md"/>
                                    </div>
                                    <button type="button" onClick={handleAddPrice} className="flex items-center justify-center bg-snowva-cyan text-white px-4 py-2 rounded-md hover:bg-snowva-blue transition-colors">
                                        <PlusIcon /> <span className="ml-2">Add</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold mb-2 mt-4">Price History</h4>
                                <div className="overflow-x-auto max-h-48 border rounded-md">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-100 sticky top-0">
                                            <tr>
                                                <th className="p-2 font-semibold text-sm">Effective Date</th>
                                                <th className="p-2 font-semibold text-sm text-right">Retail Price</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedPrices.map(price => (
                                                <tr key={price.id} className="border-b">
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
                    </fieldset>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-text-primary rounded-md hover:bg-slate-300">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-snowva-orange text-white rounded-md hover:bg-snowva-orange-dark">Save Changes</button>
                </div>
            </div>
        </div>
    );
};