import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Building, ArrowRight, MoreVertical, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import clsx from 'clsx';

const Pipeline = () => {
    const { prospects, PIPELINE_STAGES, updateProspect } = useApp();
    const navigate = useNavigate();

    const [columnFilters, setColumnFilters] = useState({});
    const [columnPages, setColumnPages] = useState({});
    const ITEMS_PER_PAGE = 6;

    const boards = useMemo(() => {
        const groups = {};
        PIPELINE_STAGES.forEach(stage => {
            const stageLeads = prospects.filter(p => p.status === stage.id);
            const filter = columnFilters[stage.id]?.toLowerCase() || '';
            const filtered = stageLeads.filter(p =>
                p.company_name.toLowerCase().includes(filter) ||
                p.contact_person?.name?.toLowerCase().includes(filter)
            );

            const page = columnPages[stage.id] || 1;
            const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

            groups[stage.id] = {
                all: stageLeads,
                filtered: filtered,
                paginated: paginated,
                total: filtered.length,
                totalPages: Math.ceil(filtered.length / ITEMS_PER_PAGE)
            };
        });
        return groups;
    }, [prospects, PIPELINE_STAGES, columnFilters, columnPages]);

    const handleMove = (prospectId, newStatus) => {
        updateProspect(prospectId, { status: newStatus });
    };

    const handleSearchChange = (stageId, value) => {
        setColumnFilters(prev => ({ ...prev, [stageId]: value }));
        setColumnPages(prev => ({ ...prev, [stageId]: 1 }));
    };

    const handlePageChange = (stageId, newPage) => {
        setColumnPages(prev => ({ ...prev, [stageId]: newPage }));
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-10 py-8 dark:bg-slate-950 min-h-screen transition-all">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sales Pipeline</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your leads through the conversion funnel.</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 uppercase tracking-wider font-bold">
                    <span>Total leads: {prospects.length}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>Scroll horizontal to see more stages</span>
                </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar scroll-smooth">
                {PIPELINE_STAGES.map(stage => {
                    const stageData = boards[stage.id];
                    const currentPage = columnPages[stage.id] || 1;

                    return (
                        <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-slate-700 dark:text-slate-300">{stage.label}</h3>
                                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                        {stageData.filtered.length}
                                    </span>
                                </div>
                                <div className={clsx("w-full h-1 absolute top-0 left-0", stage.color.split(' ')[0])}></div>
                            </div>

                            {/* Column Search */}
                            <div className="mb-3 px-1">
                                <div className="relative group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder={`Search ${stage.label}...`}
                                        value={columnFilters[stage.id] || ''}
                                        onChange={(e) => handleSearchChange(stage.id, e.target.value)}
                                        className="w-full pl-9 pr-8 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-indigo-500/20 transition-all outline-none"
                                    />
                                    {(columnFilters[stage.id]) && (
                                        <button
                                            onClick={() => handleSearchChange(stage.id, '')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                                        >
                                            <X className="w-3 h-3 text-slate-400" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 bg-slate-100/50 dark:bg-slate-900/50 rounded-xl p-3 min-h-[500px] border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col">
                                <div className="flex-1 space-y-3">
                                    {stageData.paginated.map(prospect => (
                                        <div
                                            key={prospect.id}
                                            onClick={() => navigate(`/prospects/${prospect.id}`)}
                                            className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md transition-shadow group relative"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={clsx("p-1.5 rounded-md", stage.color)}>
                                                        <Building className="w-3.5 h-3.5" />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                                                        {prospect.company_name}
                                                    </h4>
                                                </div>
                                                <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex -space-x-1">
                                                    <span className={clsx(
                                                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                                        prospect.priority === 'hot' ? "bg-red-100 text-red-600" :
                                                            prospect.priority === 'warm' ? "bg-orange-100 text-orange-600" :
                                                                "bg-blue-100 text-blue-600"
                                                    )}>
                                                        {prospect.lead_score} pts
                                                    </span>
                                                </div>

                                                <div className="flex gap-1">
                                                    {PIPELINE_STAGES.indexOf(stage) > 0 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMove(prospect.id, PIPELINE_STAGES[PIPELINE_STAGES.indexOf(stage) - 1].id);
                                                            }}
                                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400"
                                                            title="Move back"
                                                        >
                                                            <ArrowRight className="w-3 h-3 rotate-180" />
                                                        </button>
                                                    )}
                                                    {PIPELINE_STAGES.indexOf(stage) < PIPELINE_STAGES.length - 1 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMove(prospect.id, PIPELINE_STAGES[PIPELINE_STAGES.indexOf(stage) + 1].id);
                                                            }}
                                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-indigo-500"
                                                            title="Move forward"
                                                        >
                                                            <ArrowRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {prospect.tasks?.filter(t => t.status === 'pending').length > 0 && (
                                                <div className="mt-2 flex items-center gap-1.5 grayscale opacity-70">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    <span className="text-[10px] text-slate-500 font-medium">
                                                        {prospect.tasks.filter(t => t.status === 'pending').length} tasks pending
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {stageData.filtered.length === 0 && (
                                        <div className="h-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                                            <span className="text-xs text-slate-400">{columnFilters[stage.id] ? 'No results' : 'Empty'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Column Pagination */}
                                {stageData.totalPages > 1 && (
                                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                        <button
                                            onClick={() => handlePageChange(stage.id, Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                            className="p-1 disabled:opacity-30 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                            Page {currentPage} of {stageData.totalPages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(stage.id, Math.min(stageData.totalPages, currentPage + 1))}
                                            disabled={currentPage === stageData.totalPages}
                                            className="p-1 disabled:opacity-30 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Pipeline;
