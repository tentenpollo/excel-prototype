import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown, ListPlus, CheckSquare, Square } from 'lucide-react';
import clsx from 'clsx';
import AddToListModal from '../components/AddToListModal';

const ProspectList = () => {
    const { prospects, getStatusColor } = useApp();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Selection State
    const [selectedIds, setSelectedIds] = useState([]);
    const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);

    const filteredData = useMemo(() => {
        let data = [...prospects];

        // Filter
        if (search) {
            const lowerSearch = search.toLowerCase();
            data = data.filter(p =>
                p.company_name.toLowerCase().includes(lowerSearch) ||
                p.contact_person.name.toLowerCase().includes(lowerSearch)
            );
        }

        // Sort
        if (sortConfig.key) {
            data.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle nested properties for specific keys
                if (sortConfig.key === 'portfolio_size') {
                    aValue = a.portfolio_stats.total_buildings;
                    bValue = b.portfolio_stats.total_buildings;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [prospects, search, sortConfig]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4 ml-1 text-slate-300" />;
        return sortConfig.direction === 'asc'
            ? <ArrowUp className="w-4 h-4 ml-1 text-indigo-500" />
            : <ArrowDown className="w-4 h-4 ml-1 text-indigo-500" />;
    };

    const handleExport = () => {
        const headers = ["ID", "Company", "Contact", "Email", "Phone", "City", "Buildings", "Status"];
        const csvRows = [
            headers.join(','),
            ...filteredData.map(p => [
                p.id,
                `"${p.company_name}"`,
                `"${p.contact_person.name}"`,
                p.contact_info.email,
                p.contact_info.phone,
                p.address.city,
                p.portfolio_stats.total_buildings,
                p.status
            ].join(','))
        ];

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "prospects_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredData.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredData.map(p => p.id));
        }
    };

    const handleSelectRow = (id, e) => {
        e.stopPropagation();
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(mid => mid !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AddToListModal
                isOpen={isAddToListModalOpen}
                onClose={() => setIsAddToListModalOpen(false)}
                selectedProspectIds={selectedIds}
                onClearSelection={() => setSelectedIds([])}
            />

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Prospect Intelligence</h1>

                <div className="flex w-full sm:w-auto gap-4">
                    {/* Action Bar for Selection */}
                    {selectedIds.length > 0 && (
                        <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="text-sm text-slate-500 font-medium bg-slate-100 px-3 py-2 rounded-full">
                                {selectedIds.length} selected
                            </span>
                            <button
                                onClick={() => setIsAddToListModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                <ListPlus className="w-4 h-4 mr-2" />
                                Add to List
                            </button>
                        </div>
                    )}

                    <div className="relative flex-1 sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Search companies or contacts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 w-4">
                                    <div className="flex items-center">
                                        <button onClick={handleSelectAll} className="text-slate-400 hover:text-indigo-600 focus:outline-none">
                                            {selectedIds.length === filteredData.length && filteredData.length > 0 ? (
                                                <CheckSquare className="w-5 h-5 text-indigo-600" />
                                            ) : (
                                                <Square className="w-5 h-5" />
                                            )}
                                        </button>
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                                    onClick={() => requestSort('status')}
                                >
                                    <div className="flex items-center">Status {getSortIcon('status')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                                    onClick={() => requestSort('company_name')}
                                >
                                    <div className="flex items-center">Company {getSortIcon('company_name')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                                    onClick={() => requestSort('address')}
                                >
                                    <div className="flex items-center">City</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                                    onClick={() => requestSort('portfolio_size')}
                                >
                                    <div className="flex items-center">Portfolio {getSortIcon('portfolio_size')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                                    onClick={() => requestSort('avg_age')}
                                >
                                    <div className="flex items-center">Avg Age {getSortIcon('avg_age')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                                >
                                    Last Contact
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredData.map((prospect) => {
                                const isSelected = selectedIds.includes(prospect.id);
                                return (
                                    <tr
                                        key={prospect.id}
                                        onClick={() => navigate(`/prospects/${prospect.id}`)}
                                        className={clsx(
                                            "cursor-pointer transition-colors",
                                            isSelected ? "bg-indigo-50 hover:bg-indigo-100" : "hover:bg-indigo-50/50"
                                        )}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={(e) => handleSelectRow(prospect.id, e)}
                                                className="focus:outline-none"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare className="w-5 h-5 text-indigo-600 mb-0.5" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-300 hover:text-slate-400 mb-0.5" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={clsx("px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize", getStatusColor(prospect.status))}>
                                                {prospect.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{prospect.company_name}</div>
                                            <div className="text-sm text-slate-500">{prospect.contact_person.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {prospect.address.city}, {prospect.address.province}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {prospect.portfolio_stats.total_buildings} bldgs
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {prospect.portfolio_stats.avg_building_age ? `${prospect.portfolio_stats.avg_building_age} yrs` : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {prospect.last_contact_date ? new Date(prospect.last_contact_date).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {filteredData.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No prospects found matching your search.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProspectList;
