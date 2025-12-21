import React, { useState, useMemo, useCallback, memo } from 'react';
import Map, { Source, Layer, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Building2, ExternalLink, X, ArrowRight, Search, Home, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';

const TerritoryMap = () => {
    const [filterType, setFilterType] = useState('all'); // 'all', 'HQ', 'Building'
    const [selectedFeature, setSelectedFeature] = useState(null); // The clicked feature
    const [localSearchQuery, setLocalSearchQuery] = useState(''); // Local search state

    const [viewState, setViewState] = useState({
        longitude: -79.3832,
        latitude: 43.6532,
        zoom: 11,
        pitch: 45,
        bearing: 0
    });

    const [hoverInfo, setHoverInfo] = useState(null);

    const { prospects, colorMode, getStatusColorMap } = useApp();

    // Memoize status colors to prevent recalculation
    const statusColors = useMemo(() => getStatusColorMap(), [colorMode]);

    // Transform Data to GeoJSON
    // We export this logic to a stable variable or memoized function to avoid expensive re-calcs
    const territoryData = useMemo(() => {
        const features = [];

        // Filter by search query
        const filtered = localSearchQuery 
            ? (prospects || []).filter(lead => {
                const searchLower = localSearchQuery.toLowerCase();
                const name = (lead.company_name || lead.companyName || lead.name || '').toLowerCase();
                const city = (lead.address?.city || '').toLowerCase();
                const province = (lead.address?.province || '').toLowerCase();
                return name.includes(searchLower) || city.includes(searchLower) || province.includes(searchLower);
            })
            : (prospects || []);

        // prospects may come from mock data, localStorage, or remote DB; be defensive
        filtered.forEach((lead) => {
            // 1. Process Head Office (HQ)
            const lat = lead.address?.lat;
            const lng = lead.address?.lng;
            if (lat && lng) {
                const hqId = `hq-${lead.id}`;
                features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    properties: {
                        id: hqId,
                        prospectId: lead.id,
                        type: 'HQ',
                        status: lead.status || 'new',
                        name: lead.company_name || lead.companyName || lead.name || 'Company',
                        buildingsCount: lead.portfolio_stats?.assets?.length || 0,
                        address: `${lead.address?.city ?? ''}, ${lead.address?.province ?? ''}`
                    }
                });

                // Assets (buildings)
                const assets = lead.portfolio_stats?.assets || lead.portfolio_assets || [];
                assets.forEach((asset, assetIndex) => {
                    let assetLng = asset.lng ?? asset.longitude ?? null;
                    let assetLat = asset.lat ?? asset.latitude ?? null;

                    // If missing coords, jitter around HQ to avoid overlap
                    if ((assetLng === null || assetLat === null) && lng !== undefined && lat !== undefined) {
                        const JITTER_AMOUNT = 0.0005;
                        assetLng = assetLng ?? lng + (Math.random() - 0.5) * JITTER_AMOUNT;
                        assetLat = assetLat ?? lat + (Math.random() - 0.5) * JITTER_AMOUNT;
                    }

                    // Only include if we have coordinates
                    if (assetLng !== null && assetLat !== null) {
                        features.push({
                            type: 'Feature',
                            geometry: { type: 'Point', coordinates: [assetLng, assetLat] },
                            properties: {
                                id: `asset-${lead.id}-${assetIndex}`,
                                type: 'Building',
                                status: lead.status || 'new',
                                name: asset['Building Name'] ?? asset.name ?? 'Unknown Building',
                                parentCompany: lead.company_name ?? lead.companyName ?? 'Company',
                                address: asset.Address ?? asset.address ?? lead.address?.city ?? '',
                                units: asset.units ?? 0,
                                parentId: hqId,
                                parentLng: lng,
                                parentLat: lat
                            }
                        });
                    }
                });
            }
        });

        return {
            type: 'FeatureCollection',
            features
        };
    }, [prospects, localSearchQuery]);

    // Calculate Connections (Spider Web)
    const connectionsData = useMemo(() => {
        if (!selectedFeature) return null;

        const lines = [];

        // Case 1: HQ is selected - draw lines to all its buildings
        if (selectedFeature.properties.type === 'HQ') {
            const hqLng = selectedFeature.geometry.coordinates[0];
            const hqLat = selectedFeature.geometry.coordinates[1];
            const hqId = selectedFeature.properties.id;

            // Loop through the processed features to find children of this HQ
            (territoryData.features || []).forEach(f => {
                if (f.properties.parentId === hqId) {
                    lines.push({
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [hqLng, hqLat],
                                f.geometry.coordinates
                            ]
                        }
                    });
                }
            });
        }
        // Case 2: Building is selected - draw line to its parent HQ
        else if (selectedFeature.properties.type === 'Building') {
            const parentLng = selectedFeature.properties.parentLng;
            const parentLat = selectedFeature.properties.parentLat;
            const buildingLng = selectedFeature.geometry.coordinates[0];
            const buildingLat = selectedFeature.geometry.coordinates[1];

            if (parentLng !== undefined && parentLat !== undefined) {
                lines.push({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [parentLng, parentLat],
                            [buildingLng, buildingLat]
                        ]
                    }
                });
            }
        }

        return lines.length > 0 ? {
            type: 'FeatureCollection',
            features: lines
        } : null;
    }, [selectedFeature, territoryData]);


    // Layer Styles with Status-based coloring    
    const buildingLayer = useMemo(() => ({
        id: 'buildings-layer',
        type: 'circle',
        paint: {
            'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                11, 2,
                13, 4,
                16, 7
            ],
            'circle-color': [
                'match',
                ['get', 'status'],
                'sold', statusColors.sold,
                'lost', statusColors.lost,
                'proposal', statusColors.proposal,
                'contacted', statusColors.contacted,
                statusColors.new
            ],
            'circle-stroke-color': '#000000',
            'circle-stroke-width': 0.5,
            'circle-opacity': 0.7
        },
        filter: filterType === 'all' || filterType === 'Building' ? ['==', 'type', 'Building'] : ['==', 'type', 'none'],
        minzoom: 11
    }), [statusColors, filterType]);

    const hqLayer = useMemo(() => ({
        id: 'hqs-layer',
        type: 'circle',
        paint: {
            'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                9, 3,
                11, 5,
                15, 10
            ],
            'circle-color': [
                'match',
                ['get', 'status'],
                'sold', statusColors.sold,
                'lost', statusColors.lost,
                'proposal', statusColors.proposal,
                'contacted', statusColors.contacted,
                statusColors.new
            ],
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-opacity': 0.95
        },
        filter: filterType === 'all' || filterType === 'HQ' ? ['==', 'type', 'HQ'] : ['==', 'type', 'none']
    }), [statusColors, filterType]);

    const connectionLayer = {
        id: 'connections-layer',
        type: 'line',
        paint: {
            'line-color': '#fbbf24',
            'line-width': 2,
            'line-opacity': 0.5,
            'line-dasharray': [2, 2]
        }
    };

    const onClick = useCallback(event => {
        const feature = event.features && event.features[0];
        if (feature) {
            // center map on feature (optional)
            /* 
            setViewState(prev => ({
                ...prev,
                longitude: feature.geometry.coordinates[0],
                latitude: feature.geometry.coordinates[1],
                zoom: 13,
                transitionDuration: 500
            }));
            */
            setSelectedFeature(feature);
        } else {
            setSelectedFeature(null);
        }
    }, []);

    const onHover = useCallback(event => {
        const { features, point } = event;
        const hoveredFeature = features && features[0];
        const mapCanvas = event.target.getCanvas();
        
        if (mapCanvas) {
            mapCanvas.style.cursor = hoveredFeature ? 'pointer' : 'default';
        }

        // Batch state update to prevent rapid re-renders
        requestAnimationFrame(() => {
            if (hoveredFeature) {
                setHoverInfo({
                    feature: hoveredFeature,
                    x: point.x,
                    y: point.y
                });
            } else {
                setHoverInfo(null);
            }
        });
    }, []);

    return (
        <div className="relative w-full h-[calc(100vh-64px)] bg-slate-900 overflow-hidden">
            {/* Search Bar & Filters */}
            <div className="absolute top-4 left-4 z-30 flex gap-3 items-center">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search company or city..."
                        value={localSearchQuery}
                        onChange={(e) => setLocalSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-slate-800 text-white placeholder-slate-400 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                </div>
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-1.5 rounded-xl shadow-2xl flex gap-1.5">
                    <button onClick={() => setFilterType('all')} className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filterType === 'all' ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800")}>All</button>
                    <button onClick={() => setFilterType('HQ')} className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filterType === 'HQ' ? "bg-amber-500/20 text-amber-400 border border-amber-500/50" : "text-slate-400 hover:bg-slate-800")}>HQs</button>
                    <button onClick={() => setFilterType('Building')} className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filterType === 'Building' ? "bg-sky-500/20 text-sky-400 border border-sky-500/50" : "text-slate-400 hover:bg-slate-800")}>Assets</button>
                </div>
            </div>

            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                interactiveLayerIds={['buildings-layer', 'hqs-layer']}
                onMouseMove={onHover}
                onClick={onClick}
            >
                <Source id="real-data" type="geojson" data={territoryData}>
                    <Layer {...buildingLayer} />
                    <Layer {...hqLayer} />
                </Source>

                {/* Connection Lines Source */}
                {connectionsData && (
                    <Source id="connections-data" type="geojson" data={connectionsData}>
                        <Layer {...connectionLayer} />
                    </Source>
                )}

                <NavigationControl position="bottom-right" />
                <FullscreenControl position="bottom-right" />
                <ScaleControl position="bottom-left" />

                {/* Tooltip (Hover) */}
                {hoverInfo && !selectedFeature && (
                    <div
                        className="absolute z-50 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white p-3 rounded-xl shadow-2xl transform -translate-x-1/2 -translate-y-full mt-[-12px] min-w-[180px]"
                        style={{ left: hoverInfo.x, top: hoverInfo.y }}
                    >
                        <h4 className="font-semibold text-sm text-slate-100">{hoverInfo.feature.properties.name}</h4>
                        <div className="text-slate-400 text-xs">{hoverInfo.feature.properties.type}</div>
                    </div>
                )}
            </Map>

            {/* Selection Modal */}
            {selectedFeature && (
                <div className="absolute top-6 right-6 z-20 w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Header Image/Color */}
                    <div className={clsx("h-2 w-full", selectedFeature.properties.type === 'HQ' ? "bg-amber-500" : "bg-sky-500")}></div>

                    <button
                        onClick={() => setSelectedFeature(null)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            {selectedFeature.properties.type === 'HQ' ? (
                                <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-1 rounded-md border border-amber-500/30 uppercase tracking-widest flex items-center">
                                    <Home className="w-3 h-3 mr-1" /> Headquarters
                                </span>
                            ) : (
                                <span className="bg-sky-500/20 text-sky-400 text-xs font-bold px-2 py-1 rounded-md border border-sky-500/30 uppercase tracking-widest flex items-center">
                                    <Building2 className="w-3 h-3 mr-1" /> Asset
                                </span>
                            )}
                        </div>

                        <h2 className="text-xl font-bold text-white leading-tight mb-2">
                            {selectedFeature.properties.name}
                        </h2>

                        <p className="text-sm text-slate-400 mb-6 flex items-start">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0 opacity-50" />
                            {selectedFeature.properties.address}
                        </p>

                        {/* Specific Content based on Type */}
                        {selectedFeature.properties.type === 'HQ' ? (
                            <div className="space-y-4">
                                <div className="bg-slate-800 rounded-lg p-4 text-center">
                                    <div className="text-3xl font-bold text-slate-200">
                                        {selectedFeature.properties.buildingsCount}
                                    </div>
                                    <div className="text-[11px] uppercase text-slate-500 font-semibold tracking-wider mt-1">Properties</div>
                                </div>

                                <Link
                                    to={`/prospects/${selectedFeature.properties.prospectId}`}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    Open Company Profile
                                    <ExternalLink className="w-4 h-4 ml-2" />
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Owned By</div>
                                    <div
                                        className="text-indigo-400 font-medium hover:text-indigo-300 cursor-pointer flex items-center"
                                        onClick={() => {
                                            // Find HQ feature and select it
                                            const parentId = selectedFeature.properties.parentId;
                                            const hqFeature = territoryData.features.find(f => f.properties.id === parentId);
                                            if (hqFeature) {
                                                setSelectedFeature(hqFeature);
                                                // Fly to it
                                                setViewState(prev => ({
                                                    ...prev,
                                                    longitude: hqFeature.geometry.coordinates[0],
                                                    latitude: hqFeature.geometry.coordinates[1],
                                                    zoom: 12
                                                }));
                                            }
                                        }}
                                    >
                                        {selectedFeature.properties.parentCompany}
                                        <ArrowRight className="w-3 h-3 ml-1" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-slate-400 text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest font-mono pointer-events-none flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Live Data • {territoryData.features.length.toLocaleString()} Locations Mapped
            </div>
        </div>
    );
};

export default TerritoryMap;
