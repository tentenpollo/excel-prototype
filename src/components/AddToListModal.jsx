import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AddToListModal = ({ isOpen, onClose, selectedProspectIds, onClearSelection }) => {
    const { customLists, createList, addProspectToList } = useApp();
    const [activeTab, setActiveTab] = useState('existing'); // 'existing' or 'new'
    const [newListName, setNewListName] = useState('');

    if (!isOpen) return null;

    const handleAddToExisting = (listId) => {
        selectedProspectIds.forEach(pid => addProspectToList(listId, pid));
        onClearSelection();
        onClose();
        alert(`Added ${selectedProspectIds.length} prospects to list.`);
    };

    const handleCreateAndAdd = (e) => {
        e.preventDefault();
        if (newListName.trim()) {
            createList(newListName);
            // We need the ID of the new list. Since createList doesn't return it currently, 
            // we'll rely on a small heuristic or assume syncing. 
            // To make this robust, we should actually update AppContext to return the ID.
            // For now, let's just close and let the user know, or update AppContext in the next step.
            // *Self-correction*: I should update AppContext to return the new list ID.
            // But for this step, I'll update the logic later. Let's do a workaround:
            // Actually, let's just create the list first, then finding it might be tricky without ID.
            // I'll update AppContext in the next step to return the ID.

            // Wait, I can do it right now by generating ID here if I change logic, 
            // but let's stick to the separation. 

            // Workaround: generate ID here if possible, but context owns it.
            // Let's just create it and say "List created. Please select it from the list." or improving the UX.
            // Better: Upgrade AppContext in the next tool call.

            createList(newListName);
            onClose();
            // Since we can't immediately add without the ID, we'll just close for now.
            // Re-opening the modal would show the new list. 
            alert(`List "${newListName}" created. Please select it to add prospects.`);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">Add to List</h3>
                        <button onClick={onClose} className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="mb-4">
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                <button
                                    onClick={() => setActiveTab('existing')}
                                    className={`${activeTab === 'existing' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    Existing List
                                </button>
                                <button
                                    onClick={() => setActiveTab('new')}
                                    className={`${activeTab === 'new' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    New List
                                </button>
                            </nav>
                        </div>
                    </div>

                    {activeTab === 'existing' ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {customLists.length === 0 ? (
                                <p className="text-sm text-gray-500 py-4 italic">No custom lists found.</p>
                            ) : (
                                customLists.map(list => (
                                    <button
                                        key={list.id}
                                        onClick={() => handleAddToExisting(list.id)}
                                        className="w-full text-left px-4 py-3 border rounded-md hover:bg-indigo-50 hover:border-indigo-200 focus:outline-none flex items-center group"
                                    >
                                        <FolderPlus className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 mr-3" />
                                        <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">{list.name}</span>
                                        <span className="ml-auto text-xs text-gray-400">{list.prospectIds.length} items</span>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleCreateAndAdd} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">List Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                    placeholder="e.g., Hot Leads"
                                    value={newListName}
                                    onChange={e => setNewListName(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm">
                                Create List
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddToListModal;
