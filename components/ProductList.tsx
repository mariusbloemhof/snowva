

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
    <div className="bg-white p-6 rounded-lg shadow-md">
       <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Products</h2>
        <button 
          onClick={() => navigate('/products/new')}
          className="flex items-center bg-snowva-orange text-white px-4 py-2 rounded-md hover:bg-snowva-orange-dark transition-colors"
        >
          <PlusIcon />
          <span className="ml-2">Add Product</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-100">
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Consumer Price (ex. VAT)</th>
              <th className="p-3">Retail Price (ex. VAT)</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => {
              const currentPrice = getCurrentPrice(product);
              return (
              <tr key={product.id} className="border-b hover:bg-slate-50">
                <td className="p-3">
                  <img src={product.imageUrl || 'https://picsum.photos/seed/placeholder/50'} alt={product.name} className="w-12 h-12 rounded-md object-cover"/>
                </td>
                <td className="p-3 font-medium">{product.name}</td>
                <td className="p-3">R {currentPrice ? currentPrice.consumer.toFixed(2) : 'N/A'}</td>
                <td className="p-3">R {currentPrice ? currentPrice.retail.toFixed(2) : 'N/A'}</td>
                <td className="p-3">
                   <div className="flex space-x-2">
                    <button onClick={() => navigate(`/products/${product.id}`)} className="text-blue-600 hover:text-blue-800"><PencilIcon /></button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800"><TrashIcon /></button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
};
