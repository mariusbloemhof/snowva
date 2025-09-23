
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer, CustomerType } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, ChevronRightIcon, ChevronDownIcon, SelectorIcon, SearchIcon, CashIcon } from './Icons';

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

interface CustomerListProps {
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers, setCustomers }) => {
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
    
    const toggleRow = (customerId: string) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(customerId)) {
            newExpandedRows.delete(customerId);
        } else {
            newExpandedRows.add(customerId);
        }
        setExpandedRows(newExpandedRows);
    };

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
        
        return getNestedCustomers(filteredCustomers);

    }, [customers, searchTerm, filterType, sortConfig]);

    const SortableHeader: React.FC<{ columnKey: keyof Customer, title: string }> = ({ columnKey, title }) => (
        <th className="p-3 text-left font-semibold text-sm cursor-pointer" onClick={() => requestSort(columnKey)}>
            {title}
            {sortConfig?.key === columnKey && <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>}
            {sortConfig?.key !== columnKey && <SelectorIcon />}
        </th>
    );
    
    const CustomerRow: React.FC<{customer: Customer & { children: Customer[]}, level: number}> = ({ customer, level }) => {
       const isExpanded = expandedRows.has(customer.id);
       const hasChildren = customer.children.length > 0;
       const primaryAddress = customer.addresses.find(a => a.isPrimary);
       const hasCustomPricing = customer.customProductPricing && customer.customProductPricing.length > 0;

       return (
        <>
            <tr className="border-b border-ui-stroke hover:bg-slate-50">
                <td className="p-3">
                    <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
                       {hasChildren ? (
                         <button onClick={() => toggleRow(customer.id)} className="mr-2">
                            {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                         </button>
                       ) : (
                         <span className="w-8 inline-block"></span>
                       )}
                        <span className="font-medium">{customer.name}</span>
                        {hasCustomPricing && <CashIcon className="w-4 h-4 text-snowva-orange inline-block ml-2" title="This customer has custom pricing" />}
                    </div>
                </td>
                <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        customer.type === CustomerType.B2B ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                        {customer.type}
                    </span>
                </td>
                <td className="p-3 text-text-secondary">{primaryAddress?.city || 'N/A'}</td>
                <td className="p-3 text-text-secondary">{customer.contactEmail || 'N/A'}</td>
                <td className="p-3">
                  <div className="flex space-x-2">
                    <button onClick={() => handleEdit(customer)} className="text-blue-600 hover:text-blue-800"><PencilIcon /></button>
                    <button className="text-red-600 hover:text-red-800"><TrashIcon /></button>
                  </div>
                </td>
              </tr>
              {isExpanded && customer.children.map(child => <CustomerRow key={child.id} customer={child as Customer & { children: Customer[] }} level={level + 1}/>)}
        </>
       )
    }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h2 className="text-2xl font-semibold text-text-primary">Customers</h2>
        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-auto">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon/></span>
                <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-ui-stroke rounded-md w-full md:w-64 focus:ring-snowva-blue focus:border-snowva-blue"
                />
            </div>
            <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as CustomerType | 'all')}
                className="px-4 py-2 border border-ui-stroke rounded-md w-full md:w-auto focus:ring-snowva-blue focus:border-snowva-blue"
            >
                <option value="all">All Types</option>
                <option value={CustomerType.B2B}>Retail</option>
                <option value={CustomerType.B2C}>Consumer</option>
            </select>
            <button onClick={handleAddNew} className="flex items-center bg-snowva-orange text-white px-4 py-2 rounded-md hover:bg-snowva-orange-dark transition-colors w-full md:w-auto justify-center">
              <PlusIcon />
              <span className="ml-2">Add Customer</span>
            </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-100">
            <tr>
              <SortableHeader columnKey="name" title="Name" />
              <SortableHeader columnKey="type" title="Type" />
              <th className="p-3 text-left font-semibold text-sm">Location</th>
              <th className="p-3 text-left font-semibold text-sm">Contact Email</th>
              <th className="p-3 text-left font-semibold text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {processedCustomers.map(customer => (
                <CustomerRow key={customer.id} customer={customer} level={0}/>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};