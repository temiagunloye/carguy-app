'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function ClientShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user, loading } = useAuth();

    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return <main>{children}</main>;
    }

    // Optional: Prevent flash of unstyled content if loading/not authed
    // But AuthProvider handles redirect, so here we might just show nothing or loading
    if (loading) return null;
    if (!user) return null; // AuthProvider will redirect

    return (
        <div className="flex h-screen bg-black">
            <Sidebar />
            <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
                <Header />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
