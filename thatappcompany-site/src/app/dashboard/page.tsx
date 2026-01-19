"use client";

import { AdminNav } from '@/components/AdminNav';
import { ArcElement, BarController, BarElement, CategoryScale, Chart as ChartJS, DoughnutController, Legend, LinearScale, Tooltip } from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, BarController, DoughnutController);

export default function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const res = await fetch('/api/stats');
            const text = await res.text();
            try {
                const json = JSON.parse(text);
                if (!res.ok) throw new Error(json.error || res.statusText);
                setData(json);
            } catch (jsonError) {
                console.error("Failed to parse JSON", text);
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
        loadData();
        const interval = setInterval(loadData, 60000); // 1m polling
        return () => clearInterval(interval);
    }, []);

    const handleExport = () => {
        if (!data?.recent) return;
        const headers = ["Date", "Email", "Role", "Source", "Status"];
        const rows = data.recent.map((r: any) => [
            r.createdAt || r.date,
            r.email,
            r.role,
            r.source,
            r.status
        ]);
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map((e: any[]) => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `dashboard_export_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Loading Command Center...</div>;
    if (errorMsg) return <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center"><div className="text-red-500 text-xl font-bold mb-2">Error Loading Data</div><div className="text-slate-400 font-mono text-sm bg-white/10 p-4 rounded">{errorMsg}</div></div>;

    const { summary, roles, sources, devices, funnel, acquisition, topPages, recent, mode } = data;

    // Charts Config
    const roleChartData = {
        labels: Object.keys(roles || {}),
        datasets: [{
            data: Object.values(roles || {}),
            backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6', '#6b7280'],
            borderWidth: 0
        }]
    };

    const sourceChartData = {
        labels: Object.keys(sources || {}),
        datasets: [{
            label: 'Signups',
            data: Object.values(sources || {}),
            backgroundColor: '#3b82f6',
            borderRadius: 4
        }]
    };

    const deviceChartData = {
        labels: Object.keys(devices || {}),
        datasets: [{
            data: Object.values(devices || {}),
            backgroundColor: ['#3b82f6', '#10b981'],
            borderWidth: 0
        }]
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-white/10">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
                        <div className="mt-1 text-xs uppercase tracking-wider flex items-center gap-2">
                            Data Source:
                            <span className={`px-2 py-0.5 rounded ${mode === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {mode === 'live' ? 'LIVE (Firebase)' : 'DEMO MODE'}
                            </span>
                        </div>
                    </div>
                    <AdminNav onExport={handleExport} />
                </header>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <KpiCard label="Total Signups" value={summary?.totalSignups} sub="All Time" />
                    <KpiCard label="New Users (24h)" value={summary?.newUsers24h} />
                    <KpiCard label="Conversion Est." value={`${summary?.conversionRate || 0}%`} sub="vs Visitors" />
                    <KpiCard label="TikTok Traffic" value={sources?.['TikTok'] || 0} />
                </div>

                {/* Charts Grid 1 */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <ChartCard title="Signups by Role">
                        <div className="h-64 flex items-center justify-center">
                            <Doughnut data={roleChartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9ca3af' } } } }} />
                        </div>
                    </ChartCard>
                    <ChartCard title="Acquisition Source">
                        <div className="h-64">
                            <Bar data={sourceChartData} options={{ maintainAspectRatio: false, scales: { y: { grid: { color: '#333' } } } }} />
                        </div>
                    </ChartCard>
                </div>

                {/* Charts Grid 2 */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <ChartCard title="Conversion Funnel">
                        <div className="space-y-3 text-center">
                            <div className="bg-white/5 p-3 rounded-lg">
                                <div className="text-xs text-slate-400">Visitors (Est)</div>
                                <div className="font-bold text-lg">{funnel?.visitors || 0}</div>
                            </div>
                            <div className="text-sm text-slate-500">↓</div>
                            <div className="bg-white/10 p-3 rounded-lg">
                                <div className="text-xs text-slate-400">CTA Clicks</div>
                                <div className="font-bold text-lg">{funnel?.ctaClicks || 0}</div>
                            </div>
                            <div className="text-sm text-slate-500">↓</div>
                            <div className="bg-green-500 p-3 rounded-lg text-black">
                                <div className="text-xs font-bold opacity-70">Signups</div>
                                <div className="font-bold text-xl">{funnel?.signups || 0}</div>
                            </div>
                        </div>
                    </ChartCard>

                    <ChartCard title="Top Channels">
                        <ul className="space-y-0 text-sm">
                            {acquisition?.slice(0, 5).map((c: any) => (
                                <li key={c.name} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                                    <span>{c.name}</span>
                                    <span className="text-slate-500">{c.count} ({c.percent}%)</span>
                                </li>
                            ))}
                        </ul>
                    </ChartCard>

                    <ChartCard title="Recent Activity">
                        <div className="overflow-auto max-h-64">
                            <table className="w-full text-left text-sm">
                                <thead className="text-slate-500 text-xs uppercase bg-white/5">
                                    <tr>
                                        <th className="p-2">Time</th>
                                        <th className="p-2">Role</th>
                                        <th className="p-2">Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent?.map((r: any, i: number) => (
                                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="p-2 text-slate-400 font-mono text-xs">{new Date(r.createdAt || r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td className="p-2">{r.role}</td>
                                            <td className="p-2 text-slate-400">{r.source}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </ChartCard>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ label, value, sub }: { label: string, value: any, sub?: string }) {
    return (
        <div className="bg-[#0A0A0B] border border-white/10 rounded-xl p-6">
            <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">{label}</div>
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            {sub && <div className="text-xs text-slate-600 mt-2">{sub}</div>}
        </div>
    );
}

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="bg-[#0A0A0B] border border-white/10 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 border-b border-white/5 pb-2">{title}</h3>
            {children}
        </div>
    );
}
