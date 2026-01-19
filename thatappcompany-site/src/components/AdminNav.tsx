"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ onExport }: { onExport?: () => void }) {
    const pathname = usePathname();
    const isDashboard = pathname === '/dashboard';
    const isCRM = pathname === '/crm';

    return (
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg border transition text-sm font-medium ${isDashboard ? 'bg-white text-slate-900 border-white' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
            >
                📊 Dashboard
            </Link>
            <Link
                href="/crm"
                className={`px-4 py-2 rounded-lg border transition text-sm font-medium ${isCRM ? 'bg-white text-slate-900 border-white' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'}`}
            >
                📇 CRM
            </Link>

            {onExport && (
                <button
                    onClick={onExport}
                    className="px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-500/50 hover:bg-blue-600/30 text-blue-300 transition text-sm font-medium"
                >
                    ⬇ Export CSV
                </button>
            )}

            <div className="w-px bg-white/10 mx-2" />

            <a href="/" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium text-slate-400">
                Exit to Site
            </a>
        </div>
    );
}
