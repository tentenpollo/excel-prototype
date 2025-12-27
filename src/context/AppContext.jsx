import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Transform Supabase row format to app format
const transformSupabaseRow = (row, prospectAssets = []) => {
    // Use provided assets or try to parse portfolio_assets
    let assets = prospectAssets && prospectAssets.length > 0 ? prospectAssets : [];
    
    if (assets.length === 0 && row.portfolio_assets) {
        try {
            assets = Array.isArray(row.portfolio_assets) ? row.portfolio_assets : JSON.parse(row.portfolio_assets);
        } catch (e) {
            assets = [];
        }
    }
    
    // Compute per-asset age from year_built if not present
    const currentYear = new Date().getFullYear();
    assets = assets.map(a => ({
        ...a,
        age: a.age ?? (a.year_built ? currentYear - a.year_built : null),
        year_built: a.year_built ?? null
    }));

    // Calculate average age from assets
    const assetsWithAge = assets.filter(a => a.year_built);
    const avgAge = assetsWithAge.length > 0 
        ? Math.round(assetsWithAge.reduce((sum, a) => sum + (a.age || 0), 0) / assetsWithAge.length)
        : null;
    
    // Calculate lead score (0-100)
    // Factors: building age (50%), portfolio size (25%), old buildings count (25%)
    let leadScore = 0;
    
    // Age score: higher age = higher score (50 points max)
    if (avgAge) {
        if (avgAge >= 50) leadScore += 50;
        else if (avgAge >= 40) leadScore += 40;
        else if (avgAge >= 30) leadScore += 30;
        else if (avgAge >= 20) leadScore += 20;
        else leadScore += 10;
    }
    
    // Portfolio size score: more buildings = higher score (25 points max)
    const buildingCount = assets.length;
    if (buildingCount >= 50) leadScore += 25;
    else if (buildingCount >= 20) leadScore += 20;
    else if (buildingCount >= 10) leadScore += 15;
    else if (buildingCount >= 5) leadScore += 10;
    else if (buildingCount > 0) leadScore += 5;
    
    // Old buildings count score (25 points max)
    const oldBuildingsCount = assets.filter(a => a.age && a.age >= 40).length;
    if (oldBuildingsCount >= 20) leadScore += 25;
    else if (oldBuildingsCount >= 10) leadScore += 20;
    else if (oldBuildingsCount >= 5) leadScore += 15;
    else if (oldBuildingsCount > 0) leadScore += 10;
    
    // Determine priority tier
    let priority = 'cold';
    if (leadScore >= 70) priority = 'hot';
    else if (leadScore >= 50) priority = 'warm';
    
    return {
        id: row.id,
        company_name: row.company_name,
        lead_score: leadScore,
        priority: priority,
        contact_person: {
            name: row.contact_name || '',
            title: row.contact_title || ''
        },
        contact_info: {
            email: row.email || '',
            phone: row.phone || '',
            fax: row.fax || ''
        },
        address: {
            city: row.city || '',
            province: row.province || '',
            street: row.street || '',
            postal_code: row.postal_code || '',
            country: row.country || '',
            lat: row.lat,
            lng: row.lng
        },
        status: row.status || 'new',
        portfolio_stats: {
            total_buildings: assets.length || row.portfolio_total_buildings || 0,
            total_units: 0,
            avg_building_age: avgAge,
            assets: assets
        },
        website: row.website || '',
        portfolio_url: row.portfolio_url || '',
        last_contact_date: row.created_at || null,
        raw: row.raw
    };
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // Load prospects from localStorage or start empty (data is hosted remotely)
    const [prospects, setProspects] = useState(() => {
        const saved = localStorage.getItem('prospects');
        return saved ? JSON.parse(saved) : [];
    });

    const [isHydrating, setIsHydrating] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [colorMode, setColorMode] = useState('Status'); // 'Status' or 'Type'
    
    // Theme state (light or dark)
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved;
        // Check system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    // Update document theme
    useEffect(() => {
        const html = document.documentElement;
        if (theme === 'dark') {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const [filters, setFilters] = useState({
        status: 'all',
        searchContext: '',
    });

    const [activityFeed, setActivityFeed] = useState(() => {
        const saved = localStorage.getItem('activityFeed');
        return saved ? JSON.parse(saved) : [];
    });

    const [customLists, setCustomLists] = useState(() => {
        const saved = localStorage.getItem('customLists');
        return saved ? JSON.parse(saved) : [];
    });

    // Hydrate from Supabase on mount
    useEffect(() => {
        async function hydrateFromSupabase() {
            try {
                // Fetch both prospects and assets
                const [prospectsResult, assetsResult] = await Promise.all([
                    supabase.from('prospects').select('*'),
                    supabase.from('assets').select('*')
                ]);

                if (prospectsResult.error) {
                    console.warn('Failed to fetch prospects:', prospectsResult.error);
                    const stored = localStorage.getItem('prospects');
                    if (stored) setProspects(JSON.parse(stored));
                    setIsHydrating(false);
                    return;
                }

                const prospectsData = prospectsResult.data || [];
                const assetsData = assetsResult.data || [];

                if (prospectsData.length > 0) {
                    const transformed = prospectsData.map(prospect => {
                        const prospectAssets = assetsData.filter(asset => asset.prospect_id === prospect.id);
                        return transformSupabaseRow(prospect, prospectAssets);
                    });
                    
                    setProspects(transformed);
                    localStorage.setItem('prospects', JSON.stringify(transformed));
                } else {
                    const stored = localStorage.getItem('prospects');
                    if (stored) setProspects(JSON.parse(stored));
                }
            } catch (err) {
                console.error('Supabase hydration error:', err);
                const stored = localStorage.getItem('prospects');
                if (stored) setProspects(JSON.parse(stored));
            } finally {
                setIsHydrating(false);
            }
        }

        hydrateFromSupabase();
    }, []);

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('prospects', JSON.stringify(prospects));
    }, [prospects]);

    useEffect(() => {
        localStorage.setItem('activityFeed', JSON.stringify(activityFeed));
    }, [activityFeed]);

    useEffect(() => {
        localStorage.setItem('customLists', JSON.stringify(customLists));
    }, [customLists]);

    const addActivity = (message) => {
        const newActivity = {
            id: Date.now(),
            message,
            timestamp: new Date().toISOString(),
        };
        setActivityFeed(prev => [newActivity, ...prev].slice(0, 50));
    };

    const updateProspect = async (id, updates) => {
        try {
            // Transform updates back to Supabase schema
            const supabaseUpdates = {};
            if (updates.company_name !== undefined) supabaseUpdates.company_name = updates.company_name;
            if (updates.status !== undefined) supabaseUpdates.status = updates.status;
            if (updates.priority !== undefined) supabaseUpdates.priority = updates.priority;
            if (updates.contact_person?.name !== undefined) supabaseUpdates.contact_name = updates.contact_person.name;
            if (updates.contact_person?.title !== undefined) supabaseUpdates.contact_title = updates.contact_person.title;
            if (updates.contact_info?.email !== undefined) supabaseUpdates.email = updates.contact_info.email;
            if (updates.contact_info?.phone !== undefined) supabaseUpdates.phone = updates.contact_info.phone;
            if (updates.contact_info?.fax !== undefined) supabaseUpdates.fax = updates.contact_info.fax;
            if (updates.address?.city !== undefined) supabaseUpdates.city = updates.address.city;
            if (updates.address?.province !== undefined) supabaseUpdates.province = updates.address.province;
            if (updates.address?.street !== undefined) supabaseUpdates.street = updates.address.street;
            if (updates.address?.postal_code !== undefined) supabaseUpdates.postal_code = updates.address.postal_code;
            if (updates.address?.lat !== undefined) supabaseUpdates.lat = updates.address.lat;
            if (updates.address?.lng !== undefined) supabaseUpdates.lng = updates.address.lng;
            if (updates.website !== undefined) supabaseUpdates.website = updates.website;
            
            // Handle portfolio assets - update both the JSON field and the assets table
            let assetsToSync = null;
            if (updates.portfolio_stats?.assets) {
                assetsToSync = updates.portfolio_stats.assets;
                supabaseUpdates.portfolio_assets = JSON.stringify(assetsToSync);
                supabaseUpdates.portfolio_total_buildings = assetsToSync.length;
            }

            // Update Supabase prospect table first
            if (Object.keys(supabaseUpdates).length > 0) {
                const { error: prospectError } = await supabase
                    .from('prospects')
                    .update(supabaseUpdates)
                    .eq('id', id);

                if (prospectError) {
                    console.error('Failed to update prospect in Supabase:', prospectError);
                    throw prospectError;
                }
            }

            // If assets were updated, sync them to the assets table
            if (assetsToSync) {
                // Delete existing assets for this prospect
                await supabase
                    .from('assets')
                    .delete()
                    .eq('prospect_id', id);

                // Insert new assets
                if (assetsToSync.length > 0) {
                    const assetsToInsert = assetsToSync.map(asset => ({
                        id: asset.id || `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        prospect_id: id,
                        name: asset.name || asset['Building Name'] || '',
                        address: asset.address || asset.Address || '',
                        lat: asset.lat,
                        lng: asset.lng,
                        raw: JSON.stringify(asset)
                    }));

                    const { error: insertError } = await supabase
                        .from('assets')
                        .insert(assetsToInsert);

                    if (insertError) {
                        console.error('Failed to insert assets:', insertError);
                        throw insertError;
                    }
                }
            }

            // Update local state after successful Supabase update
            setProspects(prev => {
                const newProspects = prev.map(p => {
                    if (p.id === id) {
                        const updated = { ...p, ...updates };
                        addActivity(`Updated ${updated.company_name}`);
                        return updated;
                    }
                    return p;
                });
                
                // Cache to localStorage
                localStorage.setItem('prospects', JSON.stringify(newProspects));
                
                return newProspects;
            });

            return Promise.resolve();
        } catch (error) {
            console.error('Update prospect failed:', error);
            return Promise.reject(error);
        }
    };

    const addProspect = (prospect) => {
        const newProspect = {
            ...prospect,
            id: `pm_${Date.now()}`,
            contact_person: prospect.contact_person || { name: '', title: '' },
            contact_info: prospect.contact_info || { email: '', phone: '' },
            address: prospect.address || { city: '', province: '', lat: 0, lng: 0 },
            status: prospect.status || 'new',
            portfolio_stats: prospect.portfolio_stats || { total_buildings: 0, total_units: 0, assets: [] },
            last_contact_date: null
        };
        setProspects(prev => [...prev, newProspect]);
        addActivity(`Created new prospect: ${newProspect.company_name}`);

        // Transform to Supabase schema for insert
        const supabaseRow = {
            id: newProspect.id,
            company_name: newProspect.company_name,
            contact_name: newProspect.contact_person?.name || '',
            contact_title: newProspect.contact_person?.title || '',
            email: newProspect.contact_info?.email || '',
            phone: newProspect.contact_info?.phone || '',
            city: newProspect.address?.city || '',
            province: newProspect.address?.province || '',
            street: newProspect.address?.street || '',
            postal_code: newProspect.address?.postal_code || '',
            country: newProspect.address?.country || '',
            lat: newProspect.address?.lat || 0,
            lng: newProspect.address?.lng || 0,
            status: newProspect.status || 'new',
            website: newProspect.website || '',
            portfolio_total_buildings: newProspect.portfolio_stats?.total_buildings || 0
        };

        // Async insert to Supabase
        supabase.from('prospects').insert([supabaseRow]).catch(err => {
            console.error('Failed to insert prospect in Supabase:', err);
        });

        return newProspect.id;
    };

    const deleteProspect = (id) => {
        const prospect = prospects.find(p => p.id === id);
        setProspects(prev => prev.filter(p => p.id !== id));
        // Also remove from lists
        setCustomLists(prev => prev.map(list => ({
            ...list,
            prospectIds: list.prospectIds.filter(pid => pid !== id)
        })));
        if (prospect) addActivity(`Deleted prospect: ${prospect.company_name}`);

        // Async delete from Supabase
        supabase.from('prospects').delete().eq('id', id).catch(err => {
            console.error('Failed to delete prospect from Supabase:', err);
        });
    };

    const createList = (name) => {
        const newList = {
            id: `list_${Date.now()}`,
            name,
            prospectIds: []
        };
        setCustomLists(prev => [...prev, newList]);
        addActivity(`Created list: ${name}`);
    };

    const deleteList = (id) => {
        setCustomLists(prev => prev.filter(l => l.id !== id));
        addActivity(`Deleted list`);
    };

    const addProspectToList = (listId, prospectId) => {
        setCustomLists(prev => prev.map(list => {
            if (list.id === listId && !list.prospectIds.includes(prospectId)) {
                return { ...list, prospectIds: [...list.prospectIds, prospectId] };
            }
            return list;
        }));
        addActivity(`Added prospect to list`);
    };

    const removeProspectFromList = (listId, prospectId) => {
        setCustomLists(prev => prev.map(list => {
            if (list.id === listId) {
                return { ...list, prospectIds: list.prospectIds.filter(id => id !== prospectId) };
            }
            return list;
        }));
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-emerald-100 text-emerald-800';
            case 'contacted': return 'bg-blue-100 text-blue-800';
            case 'interested': return 'bg-amber-100 text-amber-800';
            case 'not_interested': return 'bg-slate-100 text-slate-600';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColorMap = () => ({
        'new': '#9CA3AF',       // gray
        'contacted': '#FBBF24', // yellow
        'proposal': '#3B82F6',  // blue
        'sold': '#10B981',      // green
        'lost': '#EF4444'       // red
    });

    // Refresh data from Supabase
    const refreshProspects = async () => {
        try {
            const [prospectsResult, assetsResult] = await Promise.all([
                supabase.from('prospects').select('*'),
                supabase.from('assets').select('*')
            ]);

            if (prospectsResult.error) {
                console.warn('Failed to fetch prospects:', prospectsResult.error);
                return false;
            }

            const prospectsData = prospectsResult.data || [];
            const assetsData = assetsResult.data || [];

            if (prospectsData.length > 0) {
                const transformed = prospectsData.map(prospect => {
                    const prospectAssets = assetsData.filter(asset => asset.prospect_id === prospect.id);
                    return transformSupabaseRow(prospect, prospectAssets);
                });
                
                setProspects(transformed);
                localStorage.setItem('prospects', JSON.stringify(transformed));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Refresh prospects error:', err);
            return false;
        }
    };

    const value = {
        prospects,
        setProspects,
        isHydrating,
        refreshProspects,
        searchQuery,
        setSearchQuery,
        colorMode,
        setColorMode,
        theme,
        toggleTheme,
        filters,
        setFilters,
        updateProspect,
        addProspect,
        deleteProspect,
        customLists,
        createList,
        deleteList,
        addProspectToList,
        removeProspectFromList,
        activityFeed,
        getStatusColor,
        getStatusColorMap,
        addActivity // Exported mainly for manual event log if needed, but updateProspect handles it
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
