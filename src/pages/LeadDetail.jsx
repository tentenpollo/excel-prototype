import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Save, Building, Phone, Mail, MapPin, Clock, AlertTriangle, Plus, Pencil, Trash2, Globe } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import clsx from 'clsx';
import 'leaflet/dist/leaflet.css';
import BuildingModal from '../components/BuildingModal';

const LeadDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { prospects, updateProspect, getStatusColor } = useApp();

    const [data, setData] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
    const [validationErrors, setValidationErrors] = useState({});
    const [showMap, setShowMap] = useState(false);

    // Building Modal State
    const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
    const [editingBuildingIndex, setEditingBuildingIndex] = useState(null);

    // Portfolio full-width modal
    const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);

    useEffect(() => {
        const found = prospects.find(p => p.id === id);
        if (found) {
            setData(JSON.parse(JSON.stringify(found)));
        }
    }, [id, prospects]);

    if (!data) {
        if (!prospects.length) return <div className="p-8">Loading...</div>;
        return (
            <div className="max-w-4xl mx-auto mt-20 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Prospect Not Found</h2>
                <button onClick={() => navigate('/prospects')} className="text-indigo-600 hover:text-indigo-800 font-medium">
                    &larr; Return to List
                </button>
            </div>
        );
    }

    const handleChange = (section, field, value) => {
        setData(prev => {
            const newData = { ...prev };
            if (section) {
                newData[section][field] = value;
            } else {
                newData[field] = value;
            }
            return newData;
        });
        setIsDirty(true);
        setSaveStatus('idle');
        // Clear validation error for this field
        setValidationErrors(prev => {
            const key = section ? `${section}.${field}` : field;
            const newErrors = { ...prev };
            delete newErrors[key];
            return newErrors;
        });
    };

    const handleSave = async () => {
        // Validation
        const errors = {};
        
        if (!data.company_name || data.company_name.trim() === '') {
            errors.company_name = 'Company name is required';
        }
        
        if (!data.contact_person.name || data.contact_person.name.trim() === '') {
            errors['contact_person.name'] = 'Contact name is required';
        }
        
        if (data.contact_info.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.contact_info.email)) {
                errors['contact_info.email'] = 'Invalid email format';
            }
        }
        
        if (data.contact_info.phone) {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(data.contact_info.phone)) {
                errors['contact_info.phone'] = 'Invalid phone format';
            }
        }

        if (data.address && data.address.city && !data.address.city.trim()) {
            errors['address.city'] = 'City cannot be empty';
        }
        
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
            return;
        }

        // Save
        setSaveStatus('saving');
        setValidationErrors({});
        
        try {
            await updateProspect(data.id, data);
            setIsDirty(false);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Save failed:', error);
            setSaveStatus('error');
            setValidationErrors({ _general: 'Failed to save changes. Please try again.' });
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    // Building Handlers
    const handleAddBuilding = () => {
        setEditingBuildingIndex(null);
        setIsBuildingModalOpen(true);
    };

    const handleEditBuilding = (index) => {
        setEditingBuildingIndex(index);
        setIsBuildingModalOpen(true);
    };

    const handleDeleteBuilding = (index) => {
        if (window.confirm('Are you sure you want to delete this building?')) {
            setData(prev => {
                const newData = { ...prev };
                const assets = [...(newData.portfolio_stats.assets || [])];
                const deletedUnits = assets[index].units || 0;

                assets.splice(index, 1);

                newData.portfolio_stats.assets = assets;
                // Update total stats mostly for display consistency, though user might manually edit them too?
                // Let's auto-update stats if they seem derived.
                // Or better, just trust the assets array length for count, but user can edit total_buildings separately.
                // The current data model has `total_buildings` as a number. Let's sync it.
                newData.portfolio_stats.total_buildings = assets.length;
                newData.portfolio_stats.total_units = (newData.portfolio_stats.total_units || 0) - deletedUnits;

                return newData;
            });
            setIsDirty(true);
        }
    };

    const handleSaveBuilding = (building) => {
        setData(prev => {
            const newData = { ...prev };
            const assets = [...(newData.portfolio_stats.assets || [])];

            if (editingBuildingIndex !== null) {
                // Formatting update: maintain previous units diff
                const oldUnits = assets[editingBuildingIndex].units || 0;
                assets[editingBuildingIndex] = building;
                newData.portfolio_stats.total_units = (newData.portfolio_stats.total_units || 0) - oldUnits + building.units;
            } else {
                assets.push(building);
                newData.portfolio_stats.total_buildings = assets.length;
                newData.portfolio_stats.total_units = (newData.portfolio_stats.total_units || 0) + building.units;
            }

            newData.portfolio_stats.assets = assets;
            return newData;
        });
        setIsDirty(true);
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            <BuildingModal
                isOpen={isBuildingModalOpen}
                onClose={() => setIsBuildingModalOpen(false)}
                onSave={handleSaveBuilding}
                initialData={editingBuildingIndex !== null ? data.portfolio_stats.assets[editingBuildingIndex] : null}
            />

            {/* Portfolio Full-Width Modal */}
            {isPortfolioModalOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-start justify-center p-6">
                    <div className="bg-white rounded-2xl w-full max-w-6xl h-[85vh] overflow-auto shadow-2xl relative">
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h3 className="text-lg font-semibold">Portfolio — {data.company_name}</h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsPortfolioModalOpen(false)}
                                    className="text-slate-500 hover:text-slate-700 px-3 py-2 rounded-md"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-slate-500">{data.portfolio_stats.total_buildings || 0} Buildings</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddBuilding}
                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                                    >
                                        <Plus className="w-3 h-3 mr-2" /> Add Building
                                    </button>
                                </div>
                            </div>

                            {/* Reuse same table layout but full width */}
                            {data.portfolio_stats.assets && data.portfolio_stats.assets.length > 0 ? (
                                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                                    <table className="min-w-full divide-y divide-slate-300">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="py-2 pl-4 pr-3 text-left text-xs font-medium text-slate-500 uppercase">Property Name</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Address</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Units</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 bg-white">
                                            {data.portfolio_stats.assets.map((asset, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50">
                                                    <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-slate-900">{asset.name}</td>
                                                    <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-500">{asset.address}</td>
                                                    <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-500">{asset.units}</td>
                                                    <td className="whitespace-nowrap px-3 py-3 text-right text-sm">
                                                        <button onClick={() => { handleEditBuilding(idx); setIsPortfolioModalOpen(false); }} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteBuilding(idx)} className="text-rose-600 hover:text-rose-900">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                                    <Building className="mx-auto h-8 w-8 text-slate-400" />
                                    <p className="mt-2 text-sm text-slate-500">No buildings listed.</p>
                                    <button
                                        onClick={() => { handleAddBuilding(); setIsPortfolioModalOpen(false); }}
                                        className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                    >
                                        Add your first building
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full hover:bg-slate-100 text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">{data.company_name}</h1>
                        <div className="flex items-center mt-2 space-x-4">
                            <select
                                value={data.status}
                                onChange={(e) => handleChange(null, 'status', e.target.value)}
                                className={clsx("text-sm font-semibold rounded-full px-3 py-1 border-0 cursor-pointer capitalize focus:ring-2 ring-offset-1 focus:ring-indigo-500", getStatusColor(data.status))}
                            >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="interested">Interested</option>
                                <option value="negotiating">Negotiating</option>
                                <option value="not_interested">Not Interested</option>
                            </select>

                            {data.lead_score !== undefined && (
                                <span className={clsx(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold",
                                    data.priority === 'hot' ? "bg-red-100 text-red-800" :
                                    data.priority === 'warm' ? "bg-orange-100 text-orange-800" :
                                    "bg-blue-100 text-blue-800"
                                )}>
                                    {data.priority === 'hot' ? '🔥' : data.priority === 'warm' ? '⚡' : '❄️'}
                                    Lead Score: <span className="font-bold">{data.lead_score}/100</span>
                                </span>
                            )}

                            <label className="flex items-center space-x-2 text-sm text-slate-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.priority === 'high'}
                                    onChange={(e) => handleChange(null, 'priority', e.target.checked ? 'high' : 'low')}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>High Priority</span>
                            </label>
                        </div>
                    </div>
                </div>

                {(isDirty || saveStatus === 'saved' || saveStatus === 'error') && (
                    <div className="flex flex-col items-end gap-2">
                        <button
                            onClick={handleSave}
                            disabled={saveStatus === 'saved' || saveStatus === 'saving'}
                            className={clsx(
                                "inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all",
                                saveStatus === 'saved' && "bg-emerald-600",
                                saveStatus === 'saving' && "bg-indigo-400 cursor-wait",
                                saveStatus === 'error' && "bg-red-600",
                                (saveStatus === 'idle' && isDirty) && "bg-indigo-600 hover:bg-indigo-700"
                            )}
                        >
                            {saveStatus === 'saved' && '✓ Saved!'}
                            {saveStatus === 'saving' && 'Saving...'}
                            {saveStatus === 'error' && '✗ Save Failed'}
                            {saveStatus === 'idle' && isDirty && 'Save Changes'}
                            {saveStatus === 'idle' && isDirty && <Save className="ml-2 w-4 h-4" />}
                        </button>
                        {validationErrors._general && (
                            <p className="text-sm text-red-600">{validationErrors._general}</p>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Contact Info & Map */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Contact Name</label>
                                <input
                                    type="text"
                                    value={data.contact_person.name}
                                    onChange={(e) => handleChange('contact_person', 'name', e.target.value)}
                                    className={clsx(
                                        "block w-full text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500",
                                        validationErrors['contact_person.name'] ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-300"
                                    )}
                                />
                                {validationErrors['contact_person.name'] && (
                                    <p className="mt-1 text-xs text-red-600">{validationErrors['contact_person.name']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={data.contact_person.title}
                                    onChange={(e) => handleChange('contact_person', 'title', e.target.value)}
                                    className="block w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        value={data.contact_info.email}
                                        onChange={(e) => handleChange('contact_info', 'email', e.target.value)}
                                        className={clsx(
                                            "block w-full pl-10 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500",
                                            validationErrors['contact_info.email'] ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-300"
                                        )}
                                    />
                                </div>
                                {validationErrors['contact_info.email'] && (
                                    <p className="mt-1 text-xs text-red-600">{validationErrors['contact_info.email']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={data.contact_info.phone}
                                        onChange={(e) => handleChange('contact_info', 'phone', e.target.value)}
                                        className={clsx(
                                            "block w-full pl-10 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500",
                                            validationErrors['contact_info.phone'] ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-300"
                                        )}
                                    />
                                </div>
                                {validationErrors['contact_info.phone'] && (
                                    <p className="mt-1 text-xs text-red-600">{validationErrors['contact_info.phone']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Website</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Globe className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="url"
                                        value={data.website || ''}
                                        onChange={(e) => handleChange(null, 'website', e.target.value)}
                                        placeholder="https://example.com"
                                        className="block w-full pl-10 text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Address</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Street</label>
                                <input
                                    type="text"
                                    value={data.address?.street || ''}
                                    onChange={(e) => handleChange('address', 'street', e.target.value)}
                                    className="block w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                                <input
                                    type="text"
                                    value={data.address?.city || ''}
                                    onChange={(e) => handleChange('address', 'city', e.target.value)}
                                    className={clsx(
                                        "block w-full text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500",
                                        validationErrors['address.city'] ? "border-red-300 focus:ring-red-500 focus:border-red-500" : "border-slate-300"
                                    )}
                                />
                                {validationErrors['address.city'] && (
                                    <p className="mt-1 text-xs text-red-600">{validationErrors['address.city']}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Province</label>
                                <input
                                    type="text"
                                    value={data.address?.province || ''}
                                    onChange={(e) => handleChange('address', 'province', e.target.value)}
                                    className="block w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Postal Code</label>
                                <input
                                    type="text"
                                    value={data.address?.postal_code || ''}
                                    onChange={(e) => handleChange('address', 'postal_code', e.target.value)}
                                    className="block w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-64 relative z-0">
                        {!showMap ? (
                            <div 
                                className="h-full w-full flex items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                                onClick={() => setShowMap(true)}
                            >
                                <div className="text-center">
                                    <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                                    <p className="text-sm text-slate-600 font-medium">Click to load map</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {data.address.city}, {data.address.province}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <MapContainer
                                center={[data.address.lat, data.address.lng]}
                                zoom={13}
                                scrollWheelZoom={false}
                                className="h-full w-full"
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[data.address.lat, data.address.lng]} />
                            </MapContainer>
                        )}
                    </div>
                </div>

                {/* Right Col: Portfolio & Notes */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                                <Building className="w-5 h-5 mr-2 text-indigo-500" />
                                Portfolio
                            </h3>
                            <div className="flex items-center space-x-2">
                                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">
                                    {data.portfolio_stats.total_buildings || 0} Bldgs
                                </span>
                                {(() => {
                                    const oldBuildings = (data.portfolio_stats.assets || []).filter(asset => asset.age && asset.age >= 40).length;
                                    if (oldBuildings > 0) {
                                        return (
                                            <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mr-2">
                                                {oldBuildings} Need Reno
                                            </span>
                                        );
                                    }
                                })()}
                                <button
                                    onClick={handleAddBuilding}
                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add
                                </button>
                            </div>
                        </div>

                        {data.portfolio_stats.assets && data.portfolio_stats.assets.length > 0 ? (
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                                <table className="min-w-full divide-y divide-slate-300">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="py-2 pl-4 pr-3 text-left text-xs font-medium text-slate-500 uppercase">Property Name</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Address</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Year Built</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Age</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Units</th>
                                            <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {data.portfolio_stats.assets.map((asset, idx) => (
                                            <tr key={idx} className={clsx(asset.age && asset.age >= 50 ? "bg-red-50" : asset.age && asset.age >= 40 ? "bg-orange-50" : "")}>
                                                <td className="whitespace-nowrap py-3 pl-4 pr-3 text-sm font-medium text-slate-900">{asset.name}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-500">{asset.address}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-500">{asset.year_built || '-'}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm">
                                                    {asset.age ? (
                                                        <span className={clsx(
                                                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                                            asset.age >= 50 ? "bg-red-100 text-red-800" :
                                                            asset.age >= 40 ? "bg-orange-100 text-orange-800" :
                                                            asset.age >= 30 ? "bg-yellow-100 text-yellow-800" :
                                                            "bg-green-100 text-green-800"
                                                        )}>
                                                            {asset.age} yrs
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-slate-500">{asset.units}</td>
                                                <td className="whitespace-nowrap px-3 py-3 text-right text-sm">
                                                    <button onClick={() => handleEditBuilding(idx)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteBuilding(idx)} className="text-rose-600 hover:text-rose-900">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                                <Building className="mx-auto h-8 w-8 text-slate-400" />
                                <p className="mt-2 text-sm text-slate-500">No buildings listed.</p>
                                <button
                                    onClick={handleAddBuilding}
                                    className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Add your first building
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Sales Notes</h3>
                        <textarea
                            rows={5}
                            value={data.notes}
                            onChange={(e) => handleChange(null, 'notes', e.target.value)}
                            className="shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-slate-300 rounded-md p-3"
                            placeholder="Add notes about specific HVAC opportunities..."
                        />
                        <div className="mt-2 text-xs text-slate-400 flex justify-between">
                            <span>Last modified: {data.last_contact_date ? new Date(data.last_contact_date).toLocaleString() : 'Never'}</span>
                            {(!data.last_contact_date || new Date(data.last_contact_date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) && (
                                <span className="text-amber-600 flex items-center">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> Needs Follow-up
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadDetail;
