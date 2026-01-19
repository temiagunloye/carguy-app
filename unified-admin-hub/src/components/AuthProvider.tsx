'use client';

import { auth } from '@/lib/firebase/client';
import { GoogleAuthProvider, User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    error: null,
    signInWithGoogle: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Allowlist Security Check
                const allowedEmails = [
                    'alex@thatappcompany.com',
                    'temi@thatappcompany.com',
                    'alexjblackwell001@gmail.com'
                ];

                if (process.env.NEXT_PUBLIC_ADMIN_EMAILS) {
                    allowedEmails.push(...process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(','));
                }

                const isAllowed = user.email && allowedEmails.includes(user.email);

                if (!isAllowed) {
                    console.error('Access Denied: Email not allowlisted');
                    await signOut(auth);
                    setError('Access Denied: You are not authorized.');
                    setUser(null);
                    setLoading(false);
                    if (pathname !== '/login') router.push('/login');
                    return;
                }

                setUser(user);
                setError(null);
                if (pathname === '/login') router.push('/');
            } else {
                setUser(null);
                if (pathname !== '/login') router.push('/login');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [pathname, router]);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            setError(null);
            await signInWithPopup(auth, provider);
        } catch (error: any) {
            console.error('Login Failed', error);
            setError(error.message);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout Failed', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, signInWithGoogle, logout }}>
            {!loading ? children : <div className="h-screen w-screen flex items-center justify-center bg-black text-white">Loading Command Center...</div>}
        </AuthContext.Provider>
    );
}
