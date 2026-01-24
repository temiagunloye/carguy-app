'use client';

import { db } from '@/lib/firebase/client';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { ExternalLink, FileDown, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ImportJob {
    id: string;
    url: string;
    status: 'pending' | 'processing' | 'complete' | 'failed';
    createdAt: any; // Timestamp
    error?: string;
}

export default function ImportJobsPage() {
    const [jobs, setJobs] = useState<ImportJob[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const q = query(collection(db, 'importJobs'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as ImportJob[];
                setJobs(data);
            } catch (error) {
                // Silently failing for empty collection to avoid errors during initial load
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'complete': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">Complete</span>;
            case 'processing': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse">Processing</span>;
            case 'failed': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">Failed</span>;
            default: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">Pending</span>;
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FileDown className="text-red-500" />
                    Import Jobs
                </h1>
                <p className="text-zinc-400 mt-1">Track scraping and vehicle import tasks.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-red-500" size={32} />
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                    <FileDown className="mx-auto text-zinc-600 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-white">No import jobs</h3>
                    <p className="text-zinc-500 mt-2">Start a new import from the Vehicle Library.</p>
                </div>
            ) : (
                <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-900">
                            <tr>
                                <th className="px-6 py-3 font-medium">Job ID</th>
                                <th className="px-6 py-3 font-medium">Source URL</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900">
                            {jobs.map((job) => (
                                <tr key={job.id} className="hover:bg-zinc-900/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-zinc-500">{job.id.slice(0, 8)}</td>
                                    <td className="px-6 py-4">
                                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                                            {job.url.length > 40 ? job.url.slice(0, 40) + '...' : job.url}
                                            <ExternalLink size={12} />
                                        </a>
                                        {job.error && <p className="text-red-400 text-xs mt-1">{job.error}</p>}
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                                    <td className="px-6 py-4 text-zinc-400">
                                        {job.createdAt?.toDate ? job.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
