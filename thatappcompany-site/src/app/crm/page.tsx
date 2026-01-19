"use client";

import { useEffect, useState } from 'react';

export default function CRM() {
    const [leads, setLeads] = useState<any[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ actionNeeded: 0, won: 0, active: 0 });

    const [filters, setFilters] = useState({ search: '', role: 'all', plan: 'all' });

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const loadLeads = async () => {
        try {
            const res = await fetch('/api/leads?limit=200');
            const text = await res.text();
            try {
                const json = JSON.parse(text);
                if (!res.ok) throw new Error(json.error || res.statusText);
                if (json.leads) {
                    setLeads(json.leads);
                }
            } catch (jsonError) {
                throw new Error(`API Response Invalid: ${text.substring(0, 50)}...`);
            }
        } catch (e: any) {
            console.error(e);
            setErrorMsg(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeads();
    }, []);

    // Filter Logic
    useEffect(() => {
        let temp = [...leads];
        const { search } = filters;

        if (search) {
            const low = search.toLowerCase();
            temp = temp.filter(l => (l.email?.toLowerCase().includes(low)));
        }

        setFilteredLeads(temp);

        // Update Stats
        let actionNeeded = 0;
        let won = 0;
        let active = 0;

        temp.forEach(l => {
            const s = l.status || 'new';
            if (s === 'new') actionNeeded++;
            if (s === 'won') won++;
            if (s !== 'lost' && s !== 'won' && s !== 'Archived') active++;
        });
        setStats({ actionNeeded, won, active });

    }, [leads, filters]);


    const updateStatus = async (email: string, newStatus: string) => {
        // Optimistic Update
        const updated = leads.map(l => l.email === email ? { ...l, status: newStatus } : l);
        setLeads(updated);

        try {
            await fetch('/api/update_lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, status: newStatus })
            });
            console.log(`Updated ${email} to ${newStatus}`);
        } catch (e) {
            console.error("Failed to update status", e);
            // Revert if needed (omitted for brevity)
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
            <div className="mx-auto max-w-[1400px]">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-white/10">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Lead CRM</h1>
                        <p className="opacity-60 text-sm mt-1">Manage and track signups</p>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-900/20" onClick={() => alert('Exporting CSV...')}>⬇ Export CSV</button>
                        <a href="/dashboard" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium">Back to Dashboard</a>
                    </div>
                </header>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Search emails..."
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>

                {/* Stats */}
                <div className="flex gap-4 mb-6">
                    <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <div className="text-xs text-yellow-300 uppercase tracking-widest">New / Action Needed</div>
                        <div className="text-2xl font-bold text-white">{stats.actionNeeded}</div>
                    </div>
                    <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                        <div className="text-xs text-green-300 uppercase tracking-widest">Won Projects</div>
                        <div className="text-2xl font-bold text-white">{stats.won}</div>
                    </div>
                    <div className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <div className="text-xs text-blue-300 uppercase tracking-widest">Active Conversations</div>
                        <div className="text-2xl font-bold text-white">{stats.active}</div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white/5 rounded-xl overflow-hidden border border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/5 text-slate-400 uppercase text-xs">
                                <tr>
                                    <th className="p-4 font-normal">Date</th>
                                    <th className="p-4 font-normal">Status</th>
                                    <th className="p-4 font-normal">Email</th>
                                    <th className="p-4 font-normal">Source</th>
                                    <th className="p-4 font-normal text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                                {loading ? (
                                    <tr><td colSpan={8} className="p-8 text-center text-slate-500">Loading leads...</td></tr>
                                ) : filteredLeads.length === 0 ? (
                                    <tr><td colSpan={8} className="p-8 text-center text-slate-500">No matching leads found</td></tr>
                                ) : (
                                    filteredLeads.map((lead, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition">
                                            <td className="p-4 whitespace-nowrap text-slate-500 text-xs text-mono">
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    className="bg-black/30 border border-white/10 rounded text-xs py-1 px-2 focus:outline-none focus:border-blue-500"
                                                    value={lead.status || 'new'}
                                                    onChange={(e) => updateStatus(lead.email, e.target.value)}
                                                >
                                                    <option value="new">🔵 New</option>
                                                    <option value="contacted">🟡 Contacted</option>
                                                    <option value="qualified">🟣 Qualified</option>
                                                    <option value="won">🟢 Won</option>
                                                    <option value="lost">❌ Lost</option>
                                                </select>
                                            </td>
                                            <td className="p-4 font-medium text-white">{lead.email}</td>
                                            <td className="p-4 text-xs">
                                                <div className="font-bold text-slate-300">{lead.source || 'Direct'}</div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <a href={`mailto:${lead.email}`} className="text-xl hover:scale-110 inline-block transition">✉️</a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-4 text-right text-xs text-slate-600">
                    Showing {filteredLeads?.length || 0} leads
                </div>

            </div>
        </div>
    );
}
