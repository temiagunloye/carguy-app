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
            acquisition: [
                { name: 'TikTok', count: 55, percent: 39 },
                { name: 'Instagram', count: 45, percent: 32 },
                { name: 'Direct', count: 42, percent: 29 }
            ],
            funnel: {
                visitors: 1500,
                ctaClicks: 350,
                signups: 142
            },
            recent: []
        });
    }

    // 3. Live Mode
    try {
        const signupsRef = db.collection('signups');
        const snapshot = await signupsRef.select('role', 'source', 'createdAt').get();

        const totalSignups = snapshot.size;
        const now = new Date();
        const yesterday = new Date(now - 86400000);

        let newUsers24h = 0;
        const roles = {};
        const sources = {};

        snapshot.forEach(doc => {
            const data = doc.data();

            // Role
            const role = data.role || 'Unknown';
            roles[role] = (roles[role] || 0) + 1;

            // Source
            const source = data.source || 'Direct';
            // Normalize source?
            sources[source] = (sources[source] || 0) + 1;

            // 24h
            if (data.createdAt && new Date(data.createdAt) > yesterday) {
                newUsers24h++;
            }
        });

        const acquisition = Object.entries(sources).map(([name, count]) => ({
            name,
            count,
            percent: totalSignups > 0 ? Math.round((count / totalSignups) * 100) : 0
        })).sort((a, b) => b.count - a.count);

        const funnel = {
            visitors: 1000,
            ctaClicks: Math.round(totalSignups * 4),
            signups: totalSignups
        };

        const recentSnapshot = await signupsRef
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        const recent = recentSnapshot.docs.map(doc => ({
            email: doc.data().email,
            role: doc.data().role,
            date: doc.data().createdAt,
            source: doc.data().source,
            referrer: doc.data().referrer,
            userAgent: doc.data().userAgent,
            status: doc.data().status || 'new'
        }));

        return res.status(200).json({
            mode: 'live',
            summary: {
                totalSignups,
                conversionRate: funnel.visitors > 0 ? ((totalSignups / funnel.visitors) * 100).toFixed(1) : 0,
                dailySignups: 0,
                currentUsers: 0,
                newUsers24h,
                shareLinks24h: 0
            },
            roles,
            sources,
            acquisition,
            funnel,
            recent
        });

    } catch (error) {
        console.error('Stats Error:', error);
        return res.status(500).json({ mode: 'error' });
    }
}
