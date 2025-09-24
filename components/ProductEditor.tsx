import React, { useState, useEffect } from 'react';
import { useNavigate, useBlocker, useParams, useOutletContext } from 'react-router-dom';
import { Product, Price, AppContextType } from '../types';
import { PlusIcon, SparklesIcon } from './Icons';
import { getCurrentPrice } from '../utils';
import { GoogleGenAI } from "@google/genai";
import { useToast } from '../contexts/ToastContext';

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

type FormErrors = {
    name?: string;
    itemCode?: string;
}

export const ProductEditor: React.FC = () => {
    const { id: productId } = useParams<{ id: string }>();
    const { products, setProducts } = useOutletContext<AppContextType>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Omit<Product, 'id'> & {id?: string}>(emptyProduct);
    const [newPrice, setNewPrice] = useState(emptyNewPrice);
    const [isFindingImage, setIsFindingImage] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const initialState = React.useRef<string>('');
    const initialDataLoaded = React.useRef(false);
    const [showUnsavedChangesPrompt, setShowUnsavedChangesPrompt] = useState(false);

    // FIX: Defer navigation to a useEffect to prevent race condition with useBlocker
    const [shouldNavigate, setShouldNavigate] = useState(false);
    useEffect(() => {
        // Only navigate after the component has re-rendered with isSaving = true.
        if (shouldNavigate && isSaving) {
            navigate('/products');
        }
    }, [shouldNavigate, isSaving, navigate]);

    useEffect(() => {
        // Reset on ID change
        initialDataLoaded.current = false;
        setIsDirty(false);

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
        setNewPrice(emptyNewPrice);
    }, [productId, products, navigate]);
    
    useEffect(() => {
        if (!initialDataLoaded.current && (formData.id || !productId)) {
            initialState.current = JSON.stringify({ formData, newPrice });
            initialDataLoaded.current = true;
        }

        const currentState = JSON.stringify({ formData, newPrice });
        setIsDirty(currentState !== initialState.current);
    }, [formData, newPrice, productId]);

    const blocker = useBlocker(isDirty && !isSaving);

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
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const formElementClasses = "block w-full rounded-md border-0 py-1.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6";
    const labelClasses = "block text-sm font-medium leading-6 text-slate-900";


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
         if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleNewPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewPrice(prev => ({ ...prev, [name]: name === 'effectiveDate' ? value : parseFloat(value) || 0 }));
    };

    const handleAddPrice = () => {
        if (!newPrice.effectiveDate) {
            addToast('Please select an effective date.', 'error');
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
    
    const validateForm = () => {
        const newErrors: FormErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Product name is required.';
        if (!formData.itemCode.trim()) newErrors.itemCode = 'Item code is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            addToast('Please fix the validation errors.', 'error');
            return;
        }
        if (formData.prices.length === 0) {
            addToast('Please add at least one price for the product.', 'error');
            return;
        }

        setIsSaving(true);

        if (formData.id) { // Existing product
            setProducts(products.map(p => p.id === formData.id ? (formData as Product) : p));
        } else { // New product
            setProducts([...products, {...formData, id: `prod_${Date.now()}`} as Product]);
        }
        addToast('Product saved successfully!', 'success');
        // FIX: Trigger navigation via useEffect
        setShouldNavigate(true);
    };
    
    const findProductImage = async () => {
        if (!formData.name) {
            addToast("Please enter a product name first.", 'error');
            return;
        }
        setIsFindingImage(true);
        addToast('Searching for product image...', 'info');
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
                addToast('Image found and updated!', 'success');
            } else {
                addToast(`Could not automatically find an image for "${formData.name}".`, 'error');
            }
        } catch (error) {
            console.error("Error finding product image:", error);
            addToast("An error occurred while trying to find the image.", 'error');
        } finally {
            setIsFindingImage(false);
        }
    };

    const sortedPrices = [...formData.prices].sort((a,b) => b.effectiveDate.localeCompare(a.effectiveDate));
    const currentPrice = getCurrentPrice(formData as Product);

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
                            <h2 className="text-2xl font-semibold leading-6 text-slate-900">{productId ? 'Edit Product' : 'Add New Product'}</h2>
                            <p className="mt-1 text-sm text-slate-600">Manage product details, pricing, and media.</p>
                        </div>
                        <div className="flex items-center justify-end space-x-3 mt-4 sm:mt-0">
                            <button type="button" onClick={() => navigate('/products')} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Cancel</button>
                            <button type="submit" className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Save Product</button>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <div className="border-b border-slate-200 pb-12">
                            <h2 className="text-base font-semibold leading-7 text-slate-900">Product Details</h2>
                            <p className="mt-1 text-sm leading-6 text-slate-600">Basic information including name, item code, and description.</p>
                            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                <div className="sm:col-span-4">
                                    <label htmlFor="name" className={labelClasses}>Product Name</label>
                                    <div className="mt-2">
                                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={`${formElementClasses} ${errors.name ? 'ring-red-500' : ''}`}/>
                                    </div>
                                    {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                                </div>
                                <div className="sm:col-span-4">
                                    <label htmlFor="itemCode" className={labelClasses}>Item Code</label>
                                    <div className="mt-2">
                                        <input type="text" name="itemCode" id="itemCode" value={formData.itemCode} onChange={handleChange} required className={`${formElementClasses} ${errors.itemCode ? 'ring-red-500' : ''}`}/>
                                    </div>
                                    {errors.itemCode && <p className="text-sm text-red-600 mt-1">{errors.itemCode}</p>}
                                </div>
                                <div className="sm:col-span-full">
                                    <label htmlFor="description" className={labelClasses}>Description</label>
                                    <div className="mt-2">
                                        <textarea name="description" id="description" rows={4} value={formData.description} onChange={handleChange} className={formElementClasses}></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="border-b border-slate-200 pb-12">
                            <h2 className="text-base font-semibold leading-7 text-slate-900">Pricing</h2>
                            <p className="mt-1 text-sm leading-6 text-slate-600">Manage the product's price points and their effective dates.</p>
                            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8">
                                <div className="space-y-4">
                                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                                            <h4 className="font-semibold text-indigo-800">Current Effective Price</h4>
                                            {currentPrice ? (
                                                <div className="flex justify-around mt-2 text-center">
                                                    <div>
                                                        <p className="text-sm text-slate-600">Consumer (ex. VAT)</p>
                                                        <p className="text-2xl font-bold text-slate-800">R {currentPrice.consumer.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-600">Retail (ex. VAT)</p>
                                                        <p className="text-2xl font-bold text-slate-800">R {currentPrice.retail.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-slate-500 mt-2 text-center">No current price is set. Add a price below.</p>
                                            )}
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-slate-800 mb-2">Add New Price</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                                                <div className="md:col-span-2">
                                                    <label htmlFor="effectiveDate" className={`${labelClasses} text-xs`}>Effective Date</label>
                                                    <input type="date" name="effectiveDate" id="effectiveDate" value={newPrice.effectiveDate} onChange={handleNewPriceChange} className={`${formElementClasses} mt-1`}/>
                                                </div>
                                                <div>
                                                    <label htmlFor="consumer" className={`${labelClasses} text-xs`}>Consumer</label>
                                                    <input type="number" name="consumer" id="consumer" value={newPrice.consumer} onChange={handleNewPriceChange} step="0.01" className={`${formElementClasses} mt-1`}/>
                                                </div>
                                                <div>
                                                    <label htmlFor="retail" className={`${labelClasses} text-xs`}>Retail</label>
                                                    <input type="number" name="retail" id="retail" value={newPrice.retail} onChange={handleNewPriceChange} step="0.01" className={`${formElementClasses} mt-1`}/>
                                                </div>
                                                <div className="md:col-span-4">
                                                <button type="button" onClick={handleAddPrice} className="inline-flex items-center justify-center w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                                                    <PlusIcon className="w-5 h-5 mr-2" /> Add Price
                                                </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-800 mb-2 mt-4">Price History</h4>
                                            <div className="overflow-x-auto max-h-60 border rounded-md">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-slate-100 sticky top-0">
                                                        <tr>
                                                            <th className="p-2 font-semibold">Effective Date</th>
                                                            <th className="p-2 font-semibold text-right">Consumer Price</th>
                                                            <th className="p-2 font-semibold text-right">Retail Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-200">
                                                        {sortedPrices.map(price => (
                                                            <tr key={price.id}>
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
                            </div>
                        </div>
                        
                        <div>
                            <h2 className="text-base font-semibold leading-7 text-slate-900">Media & Links</h2>
                            <p className="mt-1 text-sm leading-6 text-slate-600">Add a product image and a link to the e-commerce page.</p>
                            <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                <div className="sm:col-span-4">
                                    <label htmlFor="imageUrl" className={labelClasses}>Image URL</label>
                                    <div className="mt-2">
                                        <div className="relative rounded-md shadow-sm">
                                            <input type="text" name="imageUrl" id="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} className={`${formElementClasses} pr-14`} placeholder="https://..."/>
                                            <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                                                <button type="button" onClick={findProductImage} disabled={isFindingImage || !formData.name} className="inline-flex items-center rounded-md px-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:bg-transparent">
                                                    {isFindingImage ? (
                                                    <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : (
                                                <SparklesIcon className="w-5 h-5"/> 
                                                )}
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">Click the magic wand to find an image automatically.</p>
                                        {formData.imageUrl && (
                                            <div className="mt-4">
                                                <img src={formData.imageUrl} alt="Product Preview" className="w-full h-auto max-w-xs rounded-lg shadow-md object-cover border border-slate-200"/>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="sm:col-span-4">
                                    <label htmlFor="ecommerceLink" className={labelClasses}>E-commerce Link</label>
                                    <div className="mt-2">
                                        <input type="text" name="ecommerceLink" id="ecommerceLink" value={formData.ecommerceLink || ''} onChange={handleChange} className={formElementClasses}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};
