
import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { SearchIcon } from './Icons';

interface ProductSelectorProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  initialProductId?: string;
  id?: string;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({ products, onSelectProduct, initialProductId, id }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const selectedProduct = products.find(p => p.id === initialProductId);

  useEffect(() => {
    if (selectedProduct) {
      setSearchTerm(selectedProduct.name);
    } else {
      setSearchTerm('');
    }
  }, [selectedProduct]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (selectedProduct) {
            setSearchTerm(selectedProduct.name);
        } else {
            setSearchTerm('');
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, selectedProduct]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.itemCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    setSearchTerm(product.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) {
        setIsOpen(true);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="h-4 w-4 text-gray-400" />
        </span>
        <input
          type="text"
          id={id}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Search products..."
          className="block w-full rounded-md border-0 py-1.5 pl-9 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          autoComplete="off"
        />
      </div>
      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <li
                key={product.id}
                onClick={() => handleSelect(product)}
                className="px-4 py-2 cursor-pointer text-sm text-slate-700 hover:bg-indigo-600 hover:text-white"
              >
                {product.name}
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-sm text-slate-500">No products found</li>
          )}
        </ul>
      )}
    </div>
  );
};
