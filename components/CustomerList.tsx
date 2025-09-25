import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { AppContextType, Customer, CustomerType } from '../types';
import { CashIcon, ChevronDownIcon, ChevronRightIcon, PencilIcon, PlusIcon, SearchIcon, SelectorIcon, TrashIcon } from './Icons';

type SortConfig = { key: keyof Customer; direction: 'ascending' | 'ascending'; } | null;

const getNestedCustomers = (customers: Customer[]) => {
    const customerMap = new Map(customers.map(c => [c.id, { ...c, children: [] as Customer[] }]));
    const roots: (Customer & { children: Customer[] })[] = [];

    customers.forEach(customer => {
        const mappedCustomer = customerMap.get(customer.id)!;
        if (customer.parentCompanyId) {
            const parent = customerMap.get(customer.parentCompanyId);
            parent?.children.push(mappedCustomer);
        } else {
            roots.push(mappedCustomer);
        }
    });
    return roots;
};

export const CustomerList: React.FC = () => {
    const { customers, setCustomers } = useOutletContext<AppContextType>();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<CustomerType | 'all'>('all');
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const handleAddNew = () => {
        navigate('/customers/new');
    };

    const handleEdit = (customer: Customer) => {
        navigate(`/customers/${customer.id}`);
    };
    
    const toggleRow = useCallback((customerId: string) => {
        // Different approach: Use CSS containment to prevent layout shifts
        const tableBody = document.querySelector('tbody');
        const buttonElement = document.querySelector(`[data-customer-id="${customerId}"]`);
        
        if (tableBody && buttonElement) {
            // Get current button position relative to viewport
            const buttonRect = buttonElement.getBoundingClientRect();
            const beforeTop = buttonRect.top + window.scrollY;
            

            
            // Temporarily fix the table height to prevent layout shift
            const currentHeight = tableBody.scrollHeight;
            tableBody.style.minHeight = `${currentHeight}px`;
            
            setExpandedRows(prev => {
                const newSet = new Set(prev);
                if (newSet.has(customerId)) {
                    newSet.delete(customerId);
                } else {
                    newSet.add(customerId);
                }
                return newSet;
            });
            
            // After React updates, remove height constraint and adjust scroll
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    // Remove height constraint
                    tableBody.style.minHeight = '';
                    
                    // Check new button position and adjust if needed
                    const afterRect = buttonElement.getBoundingClientRect();
                    const afterTop = afterRect.top + window.scrollY;
                    const diff = afterTop - beforeTop;
                    
                    if (Math.abs(diff) > 1) {
                        const newScrollY = window.scrollY - diff;
                        window.scrollTo(0, Math.max(0, newScrollY));
                    }
                });
            });
        } else {
            // Fallback if elements not found
            setExpandedRows(prev => {
                const newSet = new Set(prev);
                if (newSet.has(customerId)) {
                    newSet.delete(customerId);
                } else {
                    newSet.add(customerId);
                }
                return newSet;
            });
        }
    }, []);

    // Create a stable toggle handler that doesn't change on re-renders
    const handleToggle = useCallback((customerId: string) => {
        toggleRow(customerId);
    }, []);

    const requestSort = (key: keyof Customer) => {
        let direction: 'ascending' | 'ascending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'ascending';
        }
        setSortConfig({ key, direction });
    };

    const processedCustomers = useMemo(() => {
        let filteredCustomers = customers.filter(customer => {
            const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.vatNumber?.includes(searchTerm);
            const matchesType = filterType === 'all' || customer.type === filterType;
            return matchesSearch && matchesType;
        });

        if (sortConfig !== null) {
            filteredCustomers.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === undefined || aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (bValue === undefined || aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        
        const nested = getNestedCustomers(filteredCustomers);
        return nested;

    }, [customers, searchTerm, filterType, sortConfig]);



    const SortableHeader: React.FC<{ columnKey: keyof Customer, title: string }> = ({ columnKey, title }) => (
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900 cursor-pointer" onClick={() => requestSort(columnKey)}>
            <div className="flex items-center">
                <span>{title}</span>
                {sortConfig?.key === columnKey && <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>}
                {sortConfig?.key !== columnKey && <SelectorIcon />}
            </div>
        </th>
    );
    
    // Add render tracking
    const renderCountRef = useRef(0);
    renderCountRef.current++;

    const CustomerRow: React.FC<{
        customer: Customer & { children: Customer[]}, 
        level: number,
        isExpanded: boolean,
        hasChildren: boolean,
        onToggle: (customerId: string) => void
    }> = ({ customer, level, isExpanded, hasChildren, onToggle }) => {
       const primaryAddress = Array.isArray(customer.addresses) ? customer.addresses.find(a => a.isPrimary) : null;
       const hasCustomPricing = Array.isArray(customer.customProductPricing) && customer.customProductPricing.length > 0;

       return (
        <>
            <tr 
                className="hover:bg-slate-50"
            >
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                    <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
                       {hasChildren ? (
                         <button 
                           onClick={() => onToggle(customer.id)} 
                           className="mr-2 p-1 rounded-full hover:bg-slate-200"
                           data-customer-id={customer.id}
                         >
                            {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                         </button>
                       ) : (
                         <span className="w-8 inline-block"></span>
                       )}
                        <Link to={`/customers/${customer.id}`} className="font-medium text-slate-900 hover:text-indigo-600">{customer.name}</Link>
                        {hasCustomPricing && <CashIcon className="w-4 h-4 text-yellow-500 inline-block ml-2" title="This customer has custom pricing" />}
                    </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        customer.type === CustomerType.B2B ? 'bg-blue-50 text-blue-700 ring-blue-600/20' : 'bg-green-50 text-green-700 ring-green-600/20'
                    }`}>
                        {customer.type}
                    </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{primaryAddress?.city || 'N/A'}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">{customer.contactEmail || 'N/A'}</td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-4">
                    <button onClick={() => handleEdit(customer)} className="text-indigo-600 hover:text-indigo-900"><PencilIcon className="w-5 h-5" /></button>
                    <button className="text-slate-400 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
                  </div>
                </td>
              </tr>
              {/* Children are now rendered separately in the main table body to avoid nested component issues */}
        </>
       );
    };

    // Create a flat list of all visible customers
    const flatCustomers = useMemo(() => {
        const flat: Array<{customer: Customer & { children: Customer[] }, level: number}> = [];
        
        const addCustomersToFlat = (customers: (Customer & { children: Customer[] })[], level: number) => {
            customers.forEach(customer => {
                flat.push({customer, level});
                if (expandedRows.has(customer.id) && customer.children?.length > 0) {
                    addCustomersToFlat(customer.children as (Customer & { children: Customer[] })[], level + 1);
                }
            });
        };
        
        addCustomersToFlat(processedCustomers, 0);
        return flat;
    }, [processedCustomers, expandedRows]);



  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div className="sm:flex-auto">
            <h2 className="text-2xl font-semibold leading-6 text-slate-900">Customers</h2>
            <p className="mt-2 text-sm text-slate-700">A list of all the customers in your account including their name, type, and location.</p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <button onClick={handleAddNew} className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              <PlusIcon className="w-5 h-5 mr-2" />
              Add Customer
            </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon className="w-5 h-5 text-slate-400"/></span>
            <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
        </div>
        <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as CustomerType | 'all')}
            className="block w-full md:w-auto rounded-md border-0 py-1.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        >
            <option value="all">All Types</option>
            <option value={CustomerType.B2B}>Retail</option>
            <option value={CustomerType.B2C}>Consumer</option>
        </select>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-slate-300">
                    <thead>
                        <tr>
                        <SortableHeader columnKey="name" title="Name" />
                        <SortableHeader columnKey="type" title="Type" />
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Location</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Contact Email</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                            <span className="sr-only">Edit</span>
                        </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {flatCustomers.map(({customer, level}) => (
                            <CustomerRow 
                                key={customer.id} 
                                customer={customer} 
                                level={level} 
                                isExpanded={expandedRows.has(customer.id)}
                                hasChildren={Array.isArray(customer.children) && customer.children.length > 0}
                                onToggle={handleToggle}
                            />
                        ))}
                    </tbody>
                </table>
             </div>
         </div>
      </div>
    </div>
  );
};
