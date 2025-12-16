import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Trash2, MapPin, Building } from 'lucide-react';
import clsx from 'clsx';

const CustomList = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { customLists, prospects, removeProspectFromList, getStatusColor, deleteList } = useApp();

    const list = customLists.find(l => l.id === id);

    if (!list) {
        return (
            <div className="max-w-4xl mx-auto mt-20 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">List Not Found</h2>
                <button onClick={() => navigate('/')} className="text-indigo-600 hover:text-indigo-800 font-medium">
                    &larr; Go Home
                </button>
            </div>
        );
    }

    const listProspects = prospects.filter(p => list.prospectIds.includes(p.id));

    const handleDeleteList = () => {
        if (window.confirm('Are you sure you want to delete this list?')) {
            deleteList(id);
            navigate('/');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <button onClick={() => navigate('/')} className="mr-4 p-2 rounded-full hover:bg-slate-100 text-slate-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">{list.name}</h1>
                    <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {list.prospectIds.length} items
                    </span>
                </div>
                <button
                    onClick={handleDeleteList}
                    className="inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm leading-4 font-medium rounded-md text-rose-700 bg-white hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete List
                </button>
            </div>

            <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
                <ul className="divide-y divide-slate-200">
                    {listProspects.map(p => (
                        <li key={p.id} className="p-4 sm:px-6 hover:bg-slate-50 flex items-center justify-between">
                            <div className="flex-1 min-w-0 pointer-events-none sm:pointer-events-auto" onClick={() => navigate(`/prospects/${p.id}`)}>
                                <div className="flex justify-between">
                                    <p className="text-sm font-medium text-indigo-600 truncate cursor-pointer hover:underline">{p.company_name}</p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <p className={clsx("px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize", getStatusColor(p.status))}>
                                            {p.status.replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 flex justify-between">
                                    <div className="sm:flex">
                                        <div className="mr-6 flex items-center text-sm text-slate-500">
                                            <Building className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                            {p.portfolio_stats.total_buildings} buildings
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-slate-500 sm:mt-0">
                                            <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" />
                                            {p.address.city}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                <button
                                    onClick={() => removeProspectFromList(id, p.id)}
                                    className="text-slate-400 hover:text-rose-600 p-2"
                                    title="Remove from list"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                    {listProspects.length === 0 && (
                        <div className="p-12 text-center">
                            <p className="text-slate-500 text-sm">This list is empty.</p>
                            <button onClick={() => navigate('/prospects')} className="mt-4 text-indigo-600 font-medium hover:underline text-sm">
                                Browse prospects to add →
                            </button>
                        </div>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default CustomList;
