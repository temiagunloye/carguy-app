import { getAdminDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";

import { LAUNCH_TIMESTAMP } from "@/lib/config";

export const dynamic = 'force-dynamic'; // Disable caching heavily for live stats

export async function GET() {
    const db = getAdminDb();

    // 1. Check if DB is available (Demo Mode Logic replication)
    if (!db) {
        return NextResponse.json({
            mode: 'demo',
            summary: {
                totalSignups: 0,
                conversionRate: 0,
                dailySignups: 0,
                currentUsers: 0,
                newUsers24h: 0,
                shareLinks24h: 0,
                totalPageViews: 0,
                uniqueVisitors: 0
            },
            roles: {},
            sources: {},
            devices: {},
            acquisition: [],
            funnel: { visitors: 0, ctaClicks: 0, signups: 0 },
            topPages: [],
            recent: []
        });
    }

    try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 86400000);

        // collection signups - FILTERED by Launch Date AND Source (Agency Only)
        const signupsRef = db.collection('signups');
        const snapshot = await signupsRef
            .where('createdAt', '>=', LAUNCH_TIMESTAMP)
            .where('source', '==', 'thatappcompany.co')
            .orderBy('createdAt', 'desc')
            .get();

        let totalSignups = 0;
        let newUsers24h = 0;
        const roles: Record<string, number> = {};
        const sources: Record<string, number> = {};
        const devices: Record<string, number> = { 'Mobile': 0, 'Desktop': 0 };

        snapshot.forEach(doc => {
            const data = doc.data();
            totalSignups++;

            // Role
            const role = data.role || 'Unknown';
            roles[role] = (roles[role] || 0) + 1;

            // Source
            const source = data.source || 'Direct';
            sources[source] = (sources[source] || 0) + 1;

            // Device (if accurate userAgent is stored)
            if (data.userAgent && /mobile|android|iphone/i.test(data.userAgent)) {
                devices['Mobile']++;
            } else {
                devices['Desktop']++;
            }

            // 24h
            if (data.createdAt && new Date(data.createdAt) > yesterday) {
                newUsers24h++;
            }
        });

        // Mock funnel/pageViews if not tracking properly yet, or implement check
        // For parity, if collections missing, handle gracefully
        // We will stick to signups logs first as that's the core request

        const acquisition = Object.entries(sources).map(([name, count]) => ({
            name,
            count,
            percent: totalSignups > 0 ? Math.round((count / totalSignups) * 100) : 0
        })).sort((a: any, b: any) => b.count - a.count);

        return NextResponse.json({
            mode: 'live',
            summary: {
                totalSignups,
                newUsers24h,
                conversionRate: 0, // Placeholder
                dailySignups: 0,
                currentUsers: 0
            },
            roles,
            sources,
            devices,
            acquisition,
            funnel: {
                visitors: 0,
                ctaClicks: 0,
                signups: totalSignups
            },
            recent: snapshot.docs.slice(0, 10).map(d => ({ ...d.data(), id: d.id })) // Simple recent, sort handled if needed
        });

    } catch (e: any) {
        return NextResponse.json({ mode: 'error', error: e.message }, { status: 500 });
    }
}
