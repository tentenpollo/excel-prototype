import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Building, Plus } from 'lucide-react';
import clsx from 'clsx';

const Calendar = () => {
    const { prospects, addTask } = useApp();
    const navigate = useNavigate();

    const [newTask, setNewTask] = React.useState({ title: '', dueDate: '', prospectId: '' });

    // Get all tasks from all prospects
    const allTasks = useMemo(() => {
        const tasks = [];
        prospects.forEach(p => {
            if (p.tasks) {
                p.tasks.forEach(t => {
                    tasks.push({
                        ...t,
                        prospectId: p.id,
                        companyName: p.company_name
                    });
                });
            }
        });
        return tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    }, [prospects]);

    const upcomingTasks = allTasks.filter(t => t.status === 'pending');
    const pastTasks = allTasks.filter(t => t.status === 'completed');

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 dark:bg-slate-950 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-indigo-500" />
                        Sales Calendar
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your upcoming follow-ups and meetings.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-indigo-500" />
                    Quick Add Task
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Prospect</label>
                        <select
                            value={newTask.prospectId}
                            onChange={(e) => setNewTask(prev => ({ ...prev, prospectId: e.target.value }))}
                            className="w-full text-sm border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                            <option value="">Select a prospect...</option>
                            {prospects.map(p => (
                                <option key={p.id} value={p.id}>{p.company_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Task Description</label>
                        <input
                            type="text"
                            value={newTask.title}
                            onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Follow up call"
                            className="w-full text-sm border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Due Date</label>
                        <input
                            type="date"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full text-sm border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <button
                            onClick={() => {
                                if (newTask.title.trim() && newTask.dueDate && newTask.prospectId) {
                                    addTask(newTask.prospectId, { title: newTask.title, dueDate: newTask.dueDate });
                                    setNewTask({ title: '', dueDate: '', prospectId: '' });
                                }
                            }}
                            disabled={!newTask.title.trim() || !newTask.dueDate || !newTask.prospectId}
                            className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Add Task
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Upcoming Agenda */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h2 className="font-semibold text-slate-900 dark:text-white">Upcoming Tasks</h2>
                            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-bold">
                                {upcomingTasks.length} Total
                            </span>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-700">
                            {upcomingTasks.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                                    <p>No upcoming tasks. Good job!</p>
                                </div>
                            ) : (
                                upcomingTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => navigate(`/prospects/${task.prospectId}`)}
                                        className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">
                                                        {new Date(task.dueDate).toLocaleString('default', { month: 'short' })}
                                                    </span>
                                                    <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                                                        {new Date(task.dueDate).getDate()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                                        {task.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Building className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-sm text-slate-500 dark:text-slate-400">{task.companyName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {new Date(task.dueDate) < new Date() && (
                                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold text-[10px] animate-pulse">
                                                    OVERDUE
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: History/Quick Stats */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Task Completion</h2>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-bold text-indigo-600">{pastTasks.length}</span>
                            <span className="text-sm text-slate-500 mb-1">tasks completed</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-indigo-500 h-full"
                                style={{ width: `${(allTasks.length > 0 ? (pastTasks.length / allTasks.length) : 0) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                            <h2 className="font-semibold text-slate-900 dark:text-white">Recently Finished</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            {pastTasks.slice(0, 5).map(task => (
                                <div key={task.id} className="flex items-center gap-3 opacity-60">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{task.title}</p>
                                        <p className="text-[10px] text-slate-400">Fixed: {new Date(task.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {pastTasks.length === 0 && <p className="text-xs text-slate-500 italic px-2">No history yet.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
