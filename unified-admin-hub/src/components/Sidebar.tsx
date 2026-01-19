'use client';

import { clsx } from 'clsx';
import { Globe, Home, Layers, LogOut, Settings, Wrench } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

const navItems = [
    { label: 'Overview', icon: Home, href: '/' },
    { label: 'ThatAppCompany', icon: Globe, href: '/apps/thatappcompany' },
    { label: 'GarageManager', icon: Wrench, href: '/apps/garagemanager' },
    { label: 'Updates', icon: Layers, href: '/updates' },
    { label: 'Tools', icon: Wrench, href: '/tools' },
    { label: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <aside className="w-64 bg-zinc-950 border-r border-zinc-900 hidden md:flex flex-col h-screen fixed left-0 top-0 z-50">
            <div className="p-6 border-b border-zinc-900">
                <h1 className="text-xl font-bold tracking-tight text-white">
                    <span className="text-red-600">Unified</span>Hub
                </h1>
                <p className="text-xs text-zinc-500 mt-1">Command Center</p>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                                isActive
                                    ? 'bg-red-600/10 text-red-500'
                                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                            )}
                        >
                            <Icon size={18} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-900">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white w-full rounded-md hover:bg-zinc-900 transition-colors"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
