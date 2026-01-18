import { getFirestore } from './_libs/firebaseAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // 1. Cache for 5 minutes (critical for free tier)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    const db = getFirestore();

    // 2. Demo Mode Response
    if (!db) {
        return res.status(200).json({
            mode: 'demo',
            summary: {
                totalSignups: 142,
                conversionRate: 8.5,
                dailySignups: 12,
                currentUsers: 3,
                newUsers24h: 8,
                shareLinks24h: 5
            },
            roles: { 'Enthusiast': 86, 'Shop': 24, 'Dealer': 15, 'Other': 17 },
            sources: { 'Instagram': 45, 'TikTok': 55 },
            recent: []
        });
    }

    // 3. Live Mode (Optimized for reads)
    try {
        // Only fetch metadata/aggregations if available, otherwise minimal count
        // Firestore "count" queries are cheapest (1 read per 1000 index items)
        // but Node SDK might not support count() aggregation efficiently without newer SDK.
        // We will do a snapshot of "signups" (Cost warning: Reads N documents).
        // Optimization: In a real heavy app, we'd increment a 'stats' doc.
        // For MVP waitlist (<10k users), reading all keys is "okay" but risky.
        // Better: Query only necessary fields or use aggregation if available.

        const signupsRef = db.collection('signups');
        const snapshot = await signupsRef.select('role', 'source', 'createdAt').get();

        const totalSignups = snapshot.size;
        const now = new Date();
        const yesterday = new Date(now - 86400000);

        let newUsers24h = 0;
        const roles = {};
        const sources = {};

        // Manual aggregation in memory (OK for <10k docs in serverless function)
        snapshot.forEach(doc => {
            const data = doc.data();

            // Role
            const role = data.role || 'Unknown';
            roles[role] = (roles[role] || 0) + 1;

            // Source
            const source = data.source || 'Direct';
            sources[source] = (sources[source] || 0) + 1;

            // 24h
            if (data.createdAt && new Date(data.createdAt) > yesterday) {
                newUsers24h++;
            }
        });

        // Recent 5 (re-query for sorted 5 to avoid sorting thousands in memory?)
        // Actually we can just query the last 5 by createdAt
        const recentSnapshot = await signupsRef
            .orderBy('createdAt', 'desc')
            .limit(10) // Increased limit for detailed view
            .get();

        const recent = recentSnapshot.docs.map(doc => ({
            email: doc.data().email, // Maybe mask this in production?
            role: doc.data().role,
            date: doc.data().createdAt,
            source: doc.data().source,
            referrer: doc.data().referrer,
            userAgent: doc.data().userAgent, // Exposed for dashboard analysis
            status: doc.data().status || 'new'
        }));

        return res.status(200).json({
            mode: 'live',
            summary: {
                totalSignups,
                conversionRate: 0,
                dailySignups: 0,
                currentUsers: 0,
                newUsers24h,
                shareLinks24h: 0
            },
            roles,
            sources,
            recent
        });

    } catch (error) {
        console.error('Stats Error:', error);
        return res.status(500).json({ mode: 'error' });
    }
}
