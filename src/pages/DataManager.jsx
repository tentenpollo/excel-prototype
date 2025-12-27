import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Plus, Trash2, X, Building, User, Mail, Phone, MapPin } from 'lucide-react';
import clsx from 'clsx';

const DataManager = () => {
    const { prospects, addProspect, deleteProspect, getStatusColor } = useApp();
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [cityFilter, setCityFilter] = useState('all');

    // Derived lists for dropdowns
    const uniqueCities = [...new Set(prospects.map(p => p.address.city))].sort();

    // New Prospect Form State
    const [formData, setFormData] = useState({
        company_name: '',
        contact_person: { name: '', title: '' },
        contact_info: { email: '', phone: '' },
        address: { city: '', province: '', lat: 43.6532, lng: -79.3832 },
        portfolio_stats: { total_buildings: 0, total_units: 0 },
        status: 'new',
        priority: 'medium'
    });

    const filteredProspects = prospects.filter(p => {
        const matchesSearch = p.company_name.toLowerCase().includes(search.toLowerCase()) ||
            p.contact_person.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        const matchesCity = cityFilter === 'all' || p.address.city === cityFilter;
        return matchesSearch && matchesStatus && matchesCity;
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addProspect(formData);
        setIsModalOpen(false);
        setFormData({
            company_name: '',
            contact_person: { name: '', title: '' },
            contact_info: { email: '', phone: '' },
            address: { city: '', province: '', lat: 43.6532, lng: -79.3832 },
            portfolio_stats: { total_buildings: 0, total_units: 0 },
            status: 'new',
            priority: 'medium'
        });
    };

    const handleConfirmDelete = (id, name) => {
        if (window.confirm(`Are you sure you want to permanently delete ${name}?`)) {
            deleteProspect(id);
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 dark:bg-slate-950 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Data Management</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-lg font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Prospect
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 space-y-4 flex flex-col transition-colors">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Search Keywords</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400 dark:text-slate-600" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md leading-5 bg-white dark:bg-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-colors"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-full">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-sm border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md transition-colors"
                    >
                        <option value="all">All Statuses</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="interested">Interested</option>
                        <option value="negotiating">Negotiating</option>
                        <option value="closed">Closed</option>
                        <option value="do_not_contact">Do Not Contact</option>
                    </select>
                </div>

                <div className="w-full">
                    <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                    <select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                    >
                        <option value="all">All Cities</option>
                        {uniqueCities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                <ul className="divide-y divide-slate-200">
                    {filteredProspects.map(p => (
                        <li key={p.id} className="p-4 sm:px-6 hover:bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">{p.company_name}</p>
                                    <div className="flex items-center text-sm text-slate-500 mt-1">
                                        <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                        <span className="truncate mr-4">{p.contact_person.name || 'No Contact'}</span>
                                        <span className={clsx("px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize", getStatusColor(p.status))}>
                                            {p.status.replace('_', ' ')}
                                        </span>
                                        <span className="ml-4 flex items-center text-xs text-slate-400">
                                            <MapPin className="w-3 h-3 mr-1" />
                                            {p.address.city}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <a href={`/prospects/${p.id}`} className="text-slate-400 hover:text-indigo-600 px-3 py-2 text-sm font-medium">Edit</a>
                                <button
                                    onClick={() => handleConfirmDelete(p.id, p.company_name)}
                                    className="text-slate-400 hover:text-rose-600 p-2 rounded-full hover:bg-rose-50"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                    {filteredProspects.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No prospects found.
                        </div>
                    )}
                </ul>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Add New Prospect</h3>
                                <button onClick={() => setIsModalOpen(false)} className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                    <input required type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                        value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                                        <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                            value={formData.contact_person.name} onChange={e => setFormData({ ...formData, contact_person: { ...formData.contact_person, name: e.target.value } })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Title</label>
                                        <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                            value={formData.contact_person.title} onChange={e => setFormData({ ...formData, contact_person: { ...formData.contact_person, title: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">City</label>
                                    <input type="text" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                        value={formData.address.city} onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                                    />
                                </div>
                                <div>
                                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                        Create Prospect
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataManager;
