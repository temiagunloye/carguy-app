'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function UpdatesPage() {
    const [isPosting, setIsPosting] = useState(false);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">App Updates</h2>
                    <p className="text-zinc-500">Manage release notes and status updates.</p>
                </div>
                <button
                    onClick={() => setIsPosting(!isPosting)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                >
                    <Plus size={18} /> New Update
                </button>
            </div>

            {isPosting && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-semibold text-white">Post New Update</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <select className="bg-black border border-zinc-800 rounded-md px-3 py-2 text-zinc-300">
                            <option>Select Platform...</option>
                            <option value="thatappcompany">ThatAppCompany</option>
                            <option value="garagemanager">GarageManager</option>
                        </select>
                        <input type="text" placeholder="Version (e.g. 1.0.4)" className="bg-black border border-zinc-800 rounded-md px-3 py-2 text-zinc-300" />
                    </div>
                    <input type="text" placeholder="Title / Headline" className="w-full bg-black border border-zinc-800 rounded-md px-3 py-2 text-zinc-300" />
                    <textarea placeholder="Summary of changes..." rows={4} className="w-full bg-black border border-zinc-800 rounded-md px-3 py-2 text-zinc-300"></textarea>

                    <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setIsPosting(false)} className="text-zinc-400 hover:text-white px-4 py-2">Cancel</button>
                        <button className="bg-white text-black font-medium px-4 py-2 rounded-md hover:bg-zinc-200">Post Update</button>
                    </div>
                </div>
            )}

            {/* Feed Placeholder */}
            <div className="space-y-4">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded text-xs font-medium">GarageManager</span>
                            <span className="text-zinc-500 text-xs">2 days ago</span>
                        </div>
                        <h4 className="font-semibold text-white text-lg">v1.2.0 - Analytics Dashboard</h4>
                        <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
                            Deployed the new comprehensive analytics dashboard with real-time Firebase integration, visitor tracking, and event logging.
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
