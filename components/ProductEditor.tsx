

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, Price } from '../types';
import { PlusIcon, SparklesIcon } from './Icons';
import { getCurrentPrice } from '../utils';
import { GoogleGenAI } from "@google/genai";

interface ProductEditorProps {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    productId?: string;
}

const emptyProduct: Omit<Product, 'id'> = {
    name: '',
    itemCode: '',
    description: '',
    prices: [],
    imageUrl: '',
    ecommerceLink: '',
};

const emptyNewPrice = {
    effectiveDate: new Date().toISOString().split('T')[0],
    consumer: 0,
    retail: 0,
};

export const ProductEditor: React.FC<ProductEditorProps> = ({ products, setProducts, productId }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<Omit<Product, 'id'> & {id?: string}>(emptyProduct);
    const [newPrice, setNewPrice] = useState(emptyNewPrice);
    const [isFindingImage, setIsFindingImage] = useState(false);
    
    useEffect(() => {
        if (productId) {
            const productToEdit = products.find(p => p.id === productId);
            if (productToEdit) {
                setFormData(productToEdit);
            } else {
                navigate('/products');
            }
        } else {
            setFormData(emptyProduct);
        }
    }, [productId, products, navigate]);

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.prices.length === 0) {
            alert('Please add at least one price for the product.');
            return;
        }
        if (formData.id) { // Existing product
            setProducts(products.map(p => p.id === formData.id ? (formData as Product) : p));
        } else { // New product
            setProducts([...products, {...formData, id: `prod_${Date.now()}`} as Product]);
        }
        navigate('/products');
    };
    
    const findProductImage = async () => {
        if (!formData.name) {
            alert("Please enter a product name first.");
            return;
        }
        setIsFindingImage(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Search for the main product image for "${formData.name}" on the website snowva.com. Return only the full, direct URL to the image file (e.g., a URL ending in .jpg, .png, or .webp). If you find a relevant product page but not a direct image URL, provide the URL of the most prominent image on that page. If you cannot find a specific image for this product, return the text "NOT_FOUND".`;
            
            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });

            const imageUrl = response.text.trim();

            if (imageUrl && imageUrl !== 'NOT_FOUND' && imageUrl.startsWith('http')) {
                setFormData(prev => ({ ...prev, imageUrl }));
            } else {
                alert(`Could not automatically find an image for "${formData.name}". Please provide a URL manually.`);
            }
        } catch (error) {
            console.error("Error finding product image:", error);
            alert("An error occurred while trying to find the image.");
        } finally {
            setIsFindingImage(false);
        }
    };

    const sortedPrices = [...formData.prices].sort((a,b) => b.effectiveDate.localeCompare(a.effectiveDate));
    const currentPrice = getCurrentPrice(formData as Product);

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit}>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-semibold text-text-primary">{productId ? 'Edit Product' : 'Add New Product'}</h2>
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={() => navigate('/products')} className="px-4 py-2 bg-slate-200 text-text-primary rounded-md hover:bg-slate-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-snowva-orange text-white rounded-md hover:bg-snowva-orange-dark">Save Product</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left column for product info */}
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Product Name</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue"/>
                        </div>
                        <div>
                            <label htmlFor="itemCode" className="block text-sm font-medium text-text-secondary">Item Code</label>
                            <input type="text" name="itemCode" id="itemCode" value={formData.itemCode} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue"/>
                        </div>
                         <div>
                            <label htmlFor="description" className="block text-sm font-medium text-text-secondary">Description</label>
                            <textarea name="description" id="description" rows={4} value={formData.description} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue"></textarea>
                        </div>
                        <fieldset className="border p-4 rounded-md">
                            <legend className="text-lg font-medium text-text-primary px-1">Price Management</legend>
                            <div className="space-y-4 pt-2">
                                {/* Current Price Display */}
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <h4 className="font-semibold text-blue-800">Current Effective Price</h4>
                                    {currentPrice ? (
                                        <div className="flex justify-around mt-2 text-center">
                                            <div>
                                                <p className="text-sm text-slate-500">Consumer (ex. VAT)</p>
                                                <p className="text-2xl font-bold text-slate-800">R {currentPrice.consumer.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-500">Retail (ex. VAT)</p>
                                                <p className="text-2xl font-bold text-slate-800">R {currentPrice.retail.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 mt-2 text-center">No current price is set. Add a price below with an effective date in the past or today.</p>
                                    )}
                                </div>
                                {/* New Price Entry */}
                                <div className="bg-slate-50 p-3 rounded-md">
                                    <h4 className="font-semibold mb-2">Add New Price</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                        <div>
                                            <label htmlFor="effectiveDate" className="block text-sm font-medium text-text-secondary">Effective Date</label>
                                            <input type="date" name="effectiveDate" id="effectiveDate" value={newPrice.effectiveDate} onChange={handleNewPriceChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md"/>
                                        </div>
                                        <div>
                                            <label htmlFor="consumer" className="block text-sm font-medium text-text-secondary">Consumer Price (ex. VAT)</label>
                                            <input type="number" name="consumer" id="consumer" value={newPrice.consumer} onChange={handleNewPriceChange} step="0.01" className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md"/>
                                        </div>
                                        <div>
                                            <label htmlFor="retail" className="block text-sm font-medium text-text-secondary">Retail Price (ex. VAT)</label>
                                            <input type="number" name="retail" id="retail" value={newPrice.retail} onChange={handleNewPriceChange} step="0.01" className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md"/>
                                        </div>
                                        <button type="button" onClick={handleAddPrice} className="flex items-center justify-center bg-snowva-cyan text-white px-4 py-2 rounded-md hover:bg-snowva-blue transition-colors">
                                            <PlusIcon /> <span className="ml-2">Add Price</span>
                                        </button>
                                    </div>
                                </div>
                                {/* Price History */}
                                <div>
                                    <h4 className="font-semibold mb-2 mt-4">Price History</h4>
                                    <div className="overflow-x-auto max-h-60 border rounded-md">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-100 sticky top-0">
                                                <tr>
                                                    <th className="p-2 font-semibold text-sm">Effective Date</th>
                                                    <th className="p-2 font-semibold text-sm text-right">Consumer Price</th>
                                                    <th className="p-2 font-semibold text-sm text-right">Retail Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedPrices.map(price => (
                                                    <tr key={price.id} className="border-b">
                                                        <td className="p-2">{price.effectiveDate}</td>
                                                        <td className="p-2 text-right">R {price.consumer.toFixed(2)}</td>
                                                        <td className="p-2 text-right">R {price.retail.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                {sortedPrices.length === 0 && (
                                                    <tr><td colSpan={3} className="text-center p-4 text-slate-500">No prices added yet.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </fieldset>
                    </div>
                    {/* Right column for image and links */}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-text-secondary">Image URL</label>
                            <div className="flex items-center space-x-2 mt-1">
                                <input type="text" name="imageUrl" id="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} className="block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue"/>
                                <button type="button" onClick={findProductImage} disabled={isFindingImage || !formData.name} className="p-2 bg-snowva-cyan text-white rounded-md hover:bg-snowva-blue disabled:bg-slate-300 disabled:cursor-not-allowed">
                                    {isFindingImage ? (
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                       <SparklesIcon /> 
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-text-secondary mt-1">Or, click the magic wand to find an image automatically.</p>
                        </div>
                        {formData.imageUrl && (
                            <div className="mt-2">
                                <img src={formData.imageUrl} alt="Product Preview" className="w-full h-auto rounded-lg shadow-md object-cover"/>
                            </div>
                        )}
                         <div>
                            <label htmlFor="ecommerceLink" className="block text-sm font-medium text-text-secondary">E-commerce Link</label>
                            <input type="text" name="ecommerceLink" id="ecommerceLink" value={formData.ecommerceLink || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-ui-stroke rounded-md shadow-sm focus:outline-none focus:ring-snowva-blue focus:border-snowva-blue"/>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
