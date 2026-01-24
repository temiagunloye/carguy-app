'use client';

import { db } from '@/lib/firebase/client';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { Car, Loader2, Plus, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Vehicle {
    id: string;
    make: string;
    model: string;
    variant: string;
    year?: number;
    photoPackStatus: 'complete' | 'partial' | 'missing';
    angleCount: number;
}

export default function VehicleLibraryPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        try {
            const q = query(collection(db, 'vehicles'), orderBy('make'), orderBy('model'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Vehicle[];
            setVehicles(data);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importUrl) return;

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'importJobs'), {
                url: importUrl,
                status: 'pending',
                createdAt: serverTimestamp()
            });
            alert("Import job started! Tracking in Import Jobs tab.");
            setImportUrl('');
            setIsImportModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Failed to start import job.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'complete': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'partial': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'missing': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto relative">

            {/* Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl w-full max-w-md space-y-4 shadow-2xl relative">
                        <button onClick={() => setIsImportModalOpen(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                                <Upload size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Import from URL</h3>
                                <p className="text-sm text-zinc-500">Scrape vehicle data from listing.</p>
                            </div>
                        </div>

                        <form onSubmit={handleImport} className="space-y-4">
                            <div>
                                <label className="text-xs text-zinc-400 font-medium uppercase mb-1 block">Listing URL</label>
                                <input
                                    type="url"
                                    required
                                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-red-600 transition-colors"
                                    placeholder="https://dealer.com/inventory/..."
                                    value={importUrl}
                                    onChange={e => setImportUrl(e.target.value)}
                                />
                            </div>
                            <div className="pt-2">
                                <button disabled={isSubmitting} type="submit" className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50">
                                    {isSubmitting ? 'Starting Job...' : 'Start Import Job'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Car className="text-red-500" />
                        Vehicle Library
                    </h1>
                    <p className="text-zinc-400 mt-1">Manage standard vehicles and photo packs.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-zinc-300 rounded-md hover:bg-zinc-800 border border-zinc-800 transition-colors text-sm"
                    >
                        <Upload size={16} />
                        Import from URL
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium shadow-lg shadow-red-900/20">
                        <Plus size={16} />
                        Add Vehicle
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-red-500" size={32} />
                </div>
            ) : vehicles.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                    <Car className="mx-auto text-zinc-600 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-white">No vehicles found</h3>
                    <p className="text-zinc-500 mt-2">Seed the database or add your first vehicle.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 hover:border-zinc-700 transition-all hover:shadow-lg group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{vehicle.make} {vehicle.model}</h3>
                                    <p className="text-sm text-zinc-400">{vehicle.year} • {vehicle.variant}</p>
                                </div>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(vehicle.photoPackStatus)}`}>
                                    {vehicle.photoPackStatus}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-zinc-500 mt-4 pt-4 border-t border-zinc-900">
                                <span>{vehicle.angleCount} angles available</span>
                                <span className="text-zinc-700 group-hover:text-red-500 transition-colors">ID: {vehicle.id.slice(0, 8)}...</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
