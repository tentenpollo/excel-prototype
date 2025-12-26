import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Search, Download, ArrowUpDown, ArrowUp, ArrowDown, Building, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import clsx from 'clsx';

const BuildingsList = () => {
    const { prospects } = useApp();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;
    
    // Filters
    const [ageFilter, setAgeFilter] = useState('all'); // all, under-20, 20-30, 30-50, 50plus
    const [yearDataFilter, setYearDataFilter] = useState('all'); // all, with-data, no-data
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        minAge: '',
        maxAge: '',
        minYear: '',
        maxYear: '',
        prospect: ''
    });

    // Flatten all buildings from all prospects
    const allBuildings = useMemo(() => {
        const buildings = [];
        const currentYear = new Date().getFullYear();
        prospects.forEach(prospect => {
            if (prospect.portfolio_stats?.assets && Array.isArray(prospect.portfolio_stats.assets)) {
                prospect.portfolio_stats.assets.forEach(asset => {
                    const age = asset.age || (asset.year_built ? currentYear - asset.year_built : null);
                    buildings.push({
                        ...asset,
                        age: age,
                        prospect_id: prospect.id,
                        prospect_name: prospect.company_name,
                        prospect_city: prospect.address.city
                    });
                });
            }
        });
        return buildings;
    }, [prospects]);

    const filteredData = useMemo(() => {
        let data = [...allBuildings];

        // Text search
        if (search) {
            const lowerSearch = search.toLowerCase();
            data = data.filter(b =>
                (b.name && b.name.toLowerCase().includes(lowerSearch)) ||
                (b.address && b.address.toLowerCase().includes(lowerSearch)) ||
                (b.prospect_name && b.prospect_name.toLowerCase().includes(lowerSearch))
            );
        }

        // Age filter
        if (filters.minAge) {
            const minAge = parseInt(filters.minAge);
            data = data.filter(b => b.age !== null && b.age >= minAge);
        }
        if (filters.maxAge) {
            const maxAge = parseInt(filters.maxAge);
            data = data.filter(b => b.age !== null && b.age <= maxAge);
        }

        // Year built filter
        if (filters.minYear) {
            const minYear = parseInt(filters.minYear);
            data = data.filter(b => b.year_built !== null && b.year_built >= minYear);
        }
        if (filters.maxYear) {
            const maxYear = parseInt(filters.maxYear);
            data = data.filter(b => b.year_built !== null && b.year_built <= maxYear);
        }

        // Prospect filter
        if (filters.prospect) {
            data = data.filter(b => b.prospect_id === filters.prospect);
        }

        // Sort
        if (sortConfig.key) {
            data.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle null values
                if (aValue == null && bValue == null) return 0;
                if (aValue == null) return 1;
                if (bValue == null) return -1;

                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [allBuildings, search, sortConfig, filters]);

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

    const hasActiveFilters = filters.minAge || filters.maxAge || filters.minYear || filters.maxYear || filters.prospect;

    const clearFilters = () => {
        setFilters({ minAge: '', maxAge: '', minYear: '', maxYear: '', prospect: '' });
        setCurrentPage(1);
    };

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const handleExport = () => {
        const headers = ["Building Name", "Address", "Year Built", "Age (Years)", "Prospect", "City"];
        const csvRows = [
            headers.join(','),
            ...filteredData.map(b => [
                `"${b.name || ''}"`,
                `"${b.address || ''}"`,
                b.year_built || '',
                b.age || '',
                `"${b.prospect_name || ''}"`,
                `"${b.prospect_city || ''}"`
            ].join(','))
        ];
        const csv = csvRows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `buildings-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const getAgeColor = (age) => {
        if (!age) return 'text-slate-500';
        if (age >= 50) return 'text-red-600 font-semibold';
        if (age >= 30) return 'text-orange-600 font-medium';
        if (age >= 20) return 'text-yellow-600 font-medium';
        return 'text-green-600';
    };

    const getAgeBackground = (age) => {
        if (!age) return 'bg-slate-50';
        if (age >= 50) return 'bg-red-50';
        if (age >= 30) return 'bg-orange-50';
        if (age >= 20) return 'bg-yellow-50';
        return 'bg-green-50';
    };

    // Pagination calculations
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <Building className="w-8 h-8 text-indigo-600" />
                    <h1 className="text-2xl font-bold text-slate-900">Buildings Directory</h1>
                </div>

                <div className="flex w-full sm:w-auto gap-4">
                    <div className="relative flex-1 sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Search buildings..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={clsx(
                            "inline-flex items-center px-4 py-2 border shadow-sm text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
                            hasActiveFilters
                                ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filters {hasActiveFilters && `(${Object.values(filters).filter(v => v).length})`}
                    </button>
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-900">Filter Buildings</h3>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="text-slate-400 hover:text-slate-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Min Age</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="e.g., 20"
                                value={filters.minAge}
                                onChange={(e) => {
                                    setFilters({ ...filters, minAge: e.target.value });
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Max Age</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="e.g., 80"
                                value={filters.maxAge}
                                onChange={(e) => {
                                    setFilters({ ...filters, maxAge: e.target.value });
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Min Year Built</label>
                            <input
                                type="number"
                                min="1000"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="e.g., 1990"
                                value={filters.minYear}
                                onChange={(e) => {
                                    setFilters({ ...filters, minYear: e.target.value });
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Max Year Built</label>
                            <input
                                type="number"
                                min="1000"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="e.g., 2020"
                                value={filters.maxYear}
                                onChange={(e) => {
                                    setFilters({ ...filters, maxYear: e.target.value });
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Prospect</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={filters.prospect}
                                onChange={(e) => {
                                    setFilters({ ...filters, prospect: e.target.value });
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">All Prospects</option>
                                {prospects.map(p => (
                                    <option key={p.id} value={p.id}>{p.company_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {hasActiveFilters && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                            <button
                                onClick={clearFilters}
                                className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Total Buildings</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{allBuildings.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Filtered Results</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{filteredData.length}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-semibold">With Year Data</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                        {allBuildings.filter(b => b.year_built).length}
                    </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-semibold">50+ Years Old</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                        {allBuildings.filter(b => b.age && b.age >= 50).length}
                    </p>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                                    onClick={() => requestSort('name')}
                                >
                                    <div className="flex items-center">Building {getSortIcon('name')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                                    onClick={() => requestSort('address')}
                                >
                                    <div className="flex items-center">Address {getSortIcon('address')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                                    onClick={() => requestSort('year_built')}
                                >
                                    <div className="flex items-center">Year Built {getSortIcon('year_built')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                                    onClick={() => requestSort('age')}
                                >
                                    <div className="flex items-center">Age {getSortIcon('age')}</div>
                                </th>
                                <th
                                    className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700"
                                    onClick={() => requestSort('prospect_name')}
                                >
                                    <div className="flex items-center">Prospect {getSortIcon('prospect_name')}</div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    City
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredData.map((building, idx) => (
                                <tr key={`${building.prospect_id}-${idx}`} className="hover:bg-indigo-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => navigate(`/buildings/${building.prospect_id}/${building.id}`)}
                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                                        >
                                            {building.name || '-'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-slate-600 max-w-xs truncate">{building.address || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                        {building.year_built || '-'}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getAgeColor(building.age)}`}>
                                        <span className={`px-3 py-1 rounded-full ${getAgeBackground(building.age)}`}>
                                            {building.age ? `${building.age} years` : '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                        {building.prospect_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {building.prospect_city}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredData.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            {allBuildings.length === 0 ? 'No buildings found. Add some prospects first.' : 'No buildings matching your search.'}
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-slate-500">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} buildings
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={clsx(
                                    "px-3 py-2 text-sm font-medium rounded-lg border",
                                    currentPage === page
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BuildingsList;
