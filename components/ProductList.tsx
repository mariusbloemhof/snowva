

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { PencilIcon, TrashIcon, PlusIcon } from './Icons';
import { getCurrentPrice } from '../utils';

interface ProductListProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const ProductList: React.FC<ProductListProps> = ({ products, setProducts }) => {
  const navigate = useNavigate();

  const handleDelete = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
       <div className="sm:flex sm:items-center sm:justify-between mb-6">
            <div className="sm:flex-auto">
                <h2 className="text-2xl font-semibold leading-6 text-slate-900">Products</h2>
                <p className="mt-2 text-sm text-slate-700">A list of all products including their name and current pricing.</p>
            </div>
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                <button 
                    onClick={() => navigate('/products/new')}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Product
                </button>
            </div>
        </div>
      <div className="mt-8 flow-root">
         <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-slate-300">
                <thead>
                    <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">Image</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Consumer Price (ex. VAT)</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Retail Price (ex. VAT)</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Edit</span>
                    </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {products.map(product => {
                    const currentPrice = getCurrentPrice(product);
                    return (
                    <tr key={product.id} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">
                        <img src={product.imageUrl || 'https://picsum.photos/seed/placeholder/50'} alt={product.name} className="w-12 h-12 rounded-md object-cover"/>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-900 font-medium">{product.name}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">R {currentPrice ? currentPrice.consumer.toFixed(2) : 'N/A'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">R {currentPrice ? currentPrice.retail.toFixed(2) : 'N/A'}</td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-4">
                            <button onClick={() => navigate(`/products/${product.id}`)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleDelete(product.id)} className="text-slate-400 hover:text-red-600"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                        </td>
                    </tr>
                    )})}
                </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};
