"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [userId, setUserId] = useState('');

    useEffect(() => {
        // Simple anonymous ID
        let uid = localStorage.getItem('site_uid');
        if (!uid) {
            uid = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('site_uid', uid);
        }
        setUserId(uid);
    }, []);

    useEffect(() => {
        if (!userId) return;

        const trackPage = async () => {
            try {
                await fetch('/api/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'pageview',
                        path: pathname,
                        userId,
                        referrer: document.referrer
                    })
                });
            } catch (e) {
                // Silent fail
            }
        };

        // Debounce slightly to avoid double firing in dev strict mode if possible, or just accept it
        const t = setTimeout(trackPage, 500);
        return () => clearTimeout(t);

    }, [pathname, searchParams, userId]);

    return null;
}
