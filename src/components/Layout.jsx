import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map as MapIcon, List, Settings, Menu, X, Database, Plus, FolderOpen, Building, Moon, Sun, Bell, Columns, Calendar } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../context/AppContext';
import CreateListModal from './CreateListModal';

const Layout = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { customLists, createList, theme, toggleTheme } = useApp();
    const navigate = useNavigate();

    const navItems = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/pipeline', label: 'Pipeline', icon: Columns },
        { to: '/calendar', label: 'Calendar', icon: Calendar },
        { to: '/map', label: 'Territory Map', icon: MapIcon },
        { to: '/prospects', label: 'Prospect List', icon: List },
        { to: '/buildings', label: 'Buildings', icon: Building },
        { to: '/manage', label: 'Data Manager', icon: Database },
    ];

    const handleCreateList = (name) => {
        createList(name);
        setIsCreateListModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
            <CreateListModal
                isOpen={isCreateListModalOpen}
                onClose={() => setIsCreateListModalOpen(false)}
                onCreate={handleCreateList}
            />

            {/* Navbar */}
            <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 transition-colors duration-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex">
                            {/* Logo */}
                            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/')}>
                                <span className="text-xl font-bold text-indigo-600 tracking-tight">Territory<span className="text-slate-900 dark:text-white">Intel</span></span>
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
                                                    ? 'border-indigo-500 text-slate-900 dark:text-white'
                                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300'
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
                        <div className="hidden md:flex items-center space-x-4 ml-4 border-l dark:border-slate-700 pl-4 border-slate-200">
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">My Lists</span>
                                <button onClick={() => setIsCreateListModalOpen(true)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600"><Plus className="w-4 h-4" /></button>
                            </div>
                            {customLists.slice(0, 3).map(list => (
                                <NavLink
                                    key={list.id}
                                    to={`/lists/${list.id}`}
                                    className={({ isActive }) =>
                                        clsx("text-sm transition-colors flex items-center", isActive ? "text-indigo-700 dark:text-indigo-400 font-medium" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200")
                                    }
                                >
                                    <FolderOpen className="w-3 h-3 mr-1" />
                                    {list.name}
                                </NavLink>
                            ))}
                            {customLists.length > 3 && <span className="text-xs text-slate-400 dark:text-slate-600">+{customLists.length - 3} more</span>}
                        </div>

                        {/* Settings & Mobile Menu Button */}
                        <div className="flex items-center ml-auto relative">
                            <button
                                className="p-2 ml-2 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 transition-colors relative"
                                title="Notifications"
                            >
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className="p-2 ml-2 text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
                                title="Toggle theme"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {/* Settings Dropdown */}
                            {isSettingsOpen && (
                                <div className="absolute right-0 top-16 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                                    <button
                                        onClick={() => {
                                            toggleTheme();
                                            setIsSettingsOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center"
                                    >
                                        {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                    </button>
                                </div>
                            )}

                            <div className="sm:hidden ml-2 flex items-center">
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="p-2 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
                                >
                                    {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="sm:hidden bg-white dark:bg-slate-800 border-b dark:border-slate-700 border-slate-200 shadow-lg absolute w-full z-50 transition-colors duration-200">
                        <div className="pt-2 pb-3 space-y-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={({ isActive }) =>
                                        clsx(
                                            'block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors',
                                            isActive
                                                ? 'bg-indigo-50 dark:bg-slate-700 border-indigo-500 text-indigo-700 dark:text-indigo-400'
                                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-300'
                                        )
                                    }
                                >
                                    <div className="flex items-center">
                                        <item.icon className="w-5 h-5 mr-3" />
                                        {item.label}
                                    </div>
                                </NavLink>
                            ))}

                            <div className="pt-4 pb-2 px-4 border-t dark:border-slate-700 border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">My Lists</h3>
                                    <button onClick={() => setIsCreateListModalOpen(true)} className="text-indigo-600 dark:text-indigo-400 p-1"><Plus className="w-4 h-4" /></button>
                                </div>
                                {customLists.map(list => (
                                    <NavLink
                                        key={list.id}
                                        to={`/lists/${list.id}`}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
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
