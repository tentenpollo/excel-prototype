import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MapPin, Upload, Plus, Trash2, Clock, ArrowLeft, Building } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { supabase } from '../lib/supabaseClient';
import L from 'leaflet';

// Fix leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const BuildingDetail = () => {
    const { buildingId, prospectId } = useParams();
    const navigate = useNavigate();
    const { prospects } = useApp();

    const [building, setBuilding] = useState(null);
    const [notes, setNotes] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('info'); // info, photos, notes

    useEffect(() => {
        loadBuildingData();
    }, [buildingId, prospectId]);

    const loadBuildingData = async () => {
        // Find building from prospects
        let found = null;
        let parentProspect = null;
        prospects.forEach(prospect => {
            if (prospect.id === prospectId && prospect.portfolio_stats?.assets) {
                found = prospect.portfolio_stats.assets.find(a => a.id === buildingId);
                if (found) {
                    parentProspect = prospect;
                }
            }
        });

        console.log('Loading building data:', { prospectId, buildingId, found });

        if (found) {
            const currentYear = new Date().getFullYear();
            const age = found.age || (found.year_built ? currentYear - found.year_built : null);
            
            // Use building coordinates or fallback to HQ coordinates
            const lat = found.lat || found.latitude || parentProspect?.address?.lat || null;
            const lng = found.lng || found.longitude || parentProspect?.address?.lng || null;
            
            setBuilding({
                ...found,
                age: age,
                prospect_id: prospectId,
                latitude: lat,
                longitude: lng
            });

            // Load notes and photos from Supabase
            await loadNotes(buildingId);
            await loadPhotos(buildingId);
        } else {
            console.error('Building not found in prospects data');}
    };

    const loadNotes = async (assetId) => {
        const { data, error } = await supabase
            .from('asset_notes')
            .select('*')
            .eq('asset_id', assetId)
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error loading notes:', error);
        } else if (data) {
            setNotes(data);
        }
    };

    const loadPhotos = async (assetId) => {
        // List files in Supabase storage
        const { data, error } = await supabase.storage
            .from('building-photos')
            .list(`asset_${assetId}`);
        
        console.log('Loading photos for asset:', assetId, { data, error });
        
        if (data && !error) {
            const photoUrls = data
                .filter(file => file.name !== '.emptyFolderPlaceholder') // Filter out placeholder
                .map(file => ({
                    name: file.name,
                    url: supabase.storage
                        .from('building-photos')
                        .getPublicUrl(`asset_${assetId}/${file.name}`).data.publicUrl
                }));
            console.log('Photo URLs:', photoUrls);
            setPhotos(photoUrls);
        } else if (error) {
            console.error('Error loading photos:', error);
        }
    };

    const addNote = async () => {
        if (!newNote.trim() || !building) return;

        console.log('Adding note for building:', building.id);

        const { data, error } = await supabase.from('asset_notes').insert([
            {
                asset_id: building.id,
                content: newNote
            }
        ]).select();

        if (error) {
            console.error('Error adding note:', error);
            alert(`Failed to add note: ${error.message}`);
        } else {
            setNewNote('');
            await loadNotes(building.id);
        }
    };

    const deleteNote = async (noteId) => {
        await supabase.from('asset_notes').delete().eq('id', noteId);
        await loadNotes(building.id);
    };

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length || !building) return;

        console.log('Uploading photos for building:', building.id);
        setUploading(true);
        
        for (const file of files) {
            const fileName = `${Date.now()}-${file.name}`;
            console.log('Uploading file:', fileName);
            
            const { data, error } = await supabase.storage
                .from('building-photos')
                .upload(`asset_${building.id}/${fileName}`, file);

            if (error) {
                console.error('Photo upload error:', error);
                alert(`Failed to upload photo: ${error.message}. Make sure the 'building-photos' bucket exists in Supabase Storage.`);
            } else {
                console.log('Photo uploaded successfully:', data);
            }
        }
        
        await loadPhotos(building.id);
        setUploading(false);
    };

    const deletePhoto = async (photoName) => {
        const { error } = await supabase.storage
            .from('building-photos')
            .remove([`asset_${building.id}/${photoName}`]);

        if (!error) {
            await loadPhotos(building.id);
        }
    };

    if (!building) {
        return (
            <div className="w-full px-4 py-8 dark:bg-slate-950 min-h-screen">
                <p className="text-slate-500 dark:text-slate-400">Building not found</p>
            </div>
        );
    }

    const prospect = prospects.find(p => p.id === prospectId);

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 dark:bg-slate-950 min-h-screen">
            {/* Header with Profile Photo */}
            <div className="flex items-start justify-between mb-6 gap-6">
                <div className="flex items-start gap-4 flex-1">
                    <button
                        onClick={() => navigate('/buildings')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors mt-1"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    
                    {/* Profile Photo */}
                    {photos.length > 0 ? (
                        <div className="relative group flex-shrink-0">
                            <img
                                src={photos[0].url}
                                alt={building.name}
                                className="w-24 h-24 rounded-lg object-cover border-2 border-slate-200 shadow-sm"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                <span className="text-white text-xs font-medium">Profile Photo</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0">
                            <Building className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                        </div>
                    )}
                    
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{building.name || 'Untitled Building'}</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{building.address}</p>
                    </div>
                </div>
                {building.latitude && building.longitude ? (
                    <button
                        onClick={() => navigate(`/map?latitude=${building.latitude}&longitude=${building.longitude}&zoom=16&buildingId=${building.id}`)}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <MapPin className="w-4 h-4 mr-2" />
                        View on Interactive Map
                    </button>
                ) : (
                    <button
                        disabled
                        className="inline-flex items-center px-4 py-2 bg-slate-300 text-slate-500 rounded-lg cursor-not-allowed"
                        title="No location data available"
                    >
                        <MapPin className="w-4 h-4 mr-2" />
                        No Location Data
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
                {['info', 'photos', 'notes', 'map'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                            activeTab === tab
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Info Tab */}
            {activeTab === 'info' && (
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">Building Name</p>
                            <p className="text-lg text-slate-900 dark:text-white font-medium mt-1">{building.name || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">Address</p>
                            <p className="text-lg text-slate-900 dark:text-white font-medium mt-1">{building.address || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">Year Built</p>
                            <p className="text-lg text-slate-900 dark:text-white font-medium mt-1">{building.year_built || 'Unknown'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">Age</p>
                            <p className="text-lg text-slate-900 dark:text-white font-medium mt-1">
                                {building.age ? `${building.age} years` : '-'}
                            </p>
                        </div>
                        {building.year_built_source && (
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">Year Source</p>
                                <p className="text-lg text-slate-900 dark:text-white font-medium mt-1">{building.year_built_source}</p>
                            </div>
                        )}
                        {building.year_built_confidence && (
                            <div>
                                <p className="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">Confidence</p>
                                <p className="text-lg text-slate-900 dark:text-white font-medium mt-1">
                                    {(building.year_built_confidence * 100).toFixed(0)}%
                                </p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 uppercase font-semibold">Prospect</p>
                            <p className="text-lg text-slate-900 font-medium mt-1">{prospect?.company_name || '-'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
                <div>
                    <div className="mb-6">
                        <label className="block">
                            <div className="flex items-center justify-center w-full px-6 py-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 cursor-pointer transition-colors">
                                <div className="text-center">
                                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-slate-600">Click to upload photos</p>
                                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                                </div>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    disabled={uploading}
                                    className="hidden"
                                />
                            </div>
                        </label>
                    </div>

                    {uploading && (
                        <div className="text-center text-slate-600 py-4">
                            <p>Uploading photos...</p>
                        </div>
                    )}

                    {photos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {photos.map(photo => (
                                <div key={photo.name} className="relative group">
                                    <img
                                        src={photo.url}
                                        alt={photo.name}
                                        className="w-full h-48 object-cover rounded-lg"
                                    />
                                    <button
                                        onClick={() => deletePhoto(photo.name)}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <p>No photos uploaded yet</p>
                        </div>
                    )}
                </div>
            )}

            {/* Notes Tab */}
            {activeTab === 'notes' && (
                <div>
                    <div className="mb-6">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Add a note..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={4}
                        />
                        <button
                            onClick={addNote}
                            disabled={!newNote.trim()}
                            className="mt-3 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Note
                        </button>
                    </div>

                    <div className="space-y-4">
                        {notes.length > 0 ? (
                            notes.map(note => (
                                <div key={note.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                    <div className="flex justify-between items-start">
                                        <p className="text-slate-900 flex-1">{note.content}</p>
                                        <button
                                            onClick={() => deleteNote(note.id)}
                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                                        <Clock className="w-3 h-3" />
                                        {new Date(note.created_at).toLocaleDateString()} {new Date(note.created_at).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-500">
                                <p>No notes yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Map Tab */}
            {activeTab === 'map' && (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    {building.latitude && building.longitude ? (
                        <MapContainer
                            center={[building.latitude, building.longitude]}
                            zoom={15}
                            style={{ height: '500px', width: '100%' }}
                        >
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; OpenStreetMap contributors'
                            />
                            <Marker position={[building.latitude, building.longitude]}>
                                <Popup>
                                    <div>
                                        <p className="font-semibold">{building.name}</p>
                                        <p className="text-sm text-slate-600">{building.address}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <div className="h-96 flex items-center justify-center text-slate-500">
                            <p>No location data available for this building</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BuildingDetail;
