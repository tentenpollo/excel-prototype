import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, List, Settings, Menu, X, Database, Plus, FolderOpen } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../context/AppContext';
import CreateListModal from './CreateListModal';

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
    const { customLists, createList } = useApp();
    const navigate = useNavigate();

    const navItems = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/map', label: 'Territory Map', icon: MapIcon },
        { to: '/prospects', label: 'Prospect List', icon: List },
        { to: '/manage', label: 'Data Manager', icon: Database },
    ];

    const handleCreateList = (name) => {
        createList(name);
        setIsCreateListModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <CreateListModal
                isOpen={isCreateListModalOpen}
                onClose={() => setIsCreateListModalOpen(false)}
                onCreate={handleCreateList}
            />

            {/* Navbar */}
            <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            {/* Logo */}
                            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
                                <span className="text-xl font-bold text-indigo-600 tracking-tight">Territory<span className="text-slate-900">Intel</span></span>
                            </div>

                            {/* Desktop Nav */}
                            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.to}
                                        to={item.to}
                                        className={({ isActive }) =>
                                            clsx(
                                                'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'border-indigo-500 text-slate-900'
                                                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                            )
                                        }
                                    >
                                        <item.icon className="w-4 h-4 mr-2" />
                                        {item.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>

                        {/* Custom Lists Quick Access (Desktop) */}
                        <div className="hidden md:flex items-center space-x-4 ml-4 border-l pl-4 border-slate-200">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-slate-500 uppercase">My Lists</span>
                                <button onClick={() => setIsCreateListModalOpen(true)} className="p-1 rounded hover:bg-slate-100 text-indigo-600"><Plus className="w-4 h-4" /></button>
                            </div>
                            {customLists.slice(0, 3).map(list => (
                                <NavLink
                                    key={list.id}
                                    to={`/lists/${list.id}`}
                                    className={({ isActive }) =>
                                        clsx("text-sm transition-colors flex items-center", isActive ? "text-indigo-700 font-medium" : "text-slate-500 hover:text-slate-800")
                                    }
                                >
                                    <FolderOpen className="w-3 h-3 mr-1" />
                                    {list.name}
                                </NavLink>
                            ))}
                            {customLists.length > 3 && <span className="text-xs text-slate-400">+{customLists.length - 3} more</span>}
                        </div>

                        {/* Settings & Mobile Menu Button */}
                        <div className="flex items-center ml-auto">
                            <button className="p-2 ml-4 text-slate-400 hover:text-slate-500">
                                <Settings className="w-5 h-5" />
                            </button>
                            <div className="sm:hidden ml-2 flex items-center">
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                                >
                                    {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="sm:hidden bg-white border-b border-slate-200 shadow-lg absolute w-full z-50">
                        <div className="pt-2 pb-3 space-y-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        clsx(
                                            'block pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                                            isActive
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                                : 'border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700'
                                        )
                                    }
                                >
                                    <div className="flex items-center">
                                        <item.icon className="w-5 h-5 mr-3" />
                                        {item.label}
                                    </div>
                                </NavLink>
                            ))}

                            <div className="pt-4 pb-2 px-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Lists</h3>
                                    <button onClick={() => setIsCreateListModalOpen(true)} className="text-indigo-600 p-1"><Plus className="w-4 h-4" /></button>
                                </div>
                                {customLists.map(list => (
                                    <NavLink
                                        key={list.id}
                                        to={`/lists/${list.id}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block py-2 text-sm text-slate-600 hover:text-slate-900"
                                    >
                                        <FolderOpen className="w-4 h-4 inline mr-2" />
                                        {list.name}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
