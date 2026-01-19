'use client';

import { Bell, Search, User as UserIcon } from 'lucide-react';
import { useAuth } from './AuthProvider';

export function Header() {
    const { user } = useAuth();
    const email = user?.email || 'Guest';

    return (
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
            {/* Search Placeholder */}
            <div className="flex items-center gap-3 bg-zinc-900/50 px-3 py-1.5 rounded-md w-64 border border-zinc-800 focus-within:border-zinc-700 transition-colors">
                <Search size={16} className="text-zinc-500" />
                <input
                    type="text"
                    placeholder="Search admin..."
                    className="bg-transparent border-none outline-none text-sm text-zinc-300 w-full placeholder:text-zinc-600"
                />
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full"></span>
                </button>

                {/* Profile */}
                <div className="flex items-center gap-3 pl-4 border-l border-zinc-900">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-medium text-white">{user?.displayName || 'Admin'}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-[150px]">{email}</div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-zinc-400">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full" />
                        ) : (
                            <UserIcon size={16} />
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
