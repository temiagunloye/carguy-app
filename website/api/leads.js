import { getFirestore } from './_libs/firebaseAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const db = getFirestore();

    // Demo Mode
    if (!db) {
        return res.status(200).json({
            mode: 'demo',
            leads: [
                { email: 'demo@example.com', role: 'Enthusiast', planInterest: 'Pro', carBuild: 'Turbo K24 Civic', source: 'instagram', createdAt: new Date().toISOString() },
                { email: 'shop@example.com', role: 'Shop', planInterest: 'Premium', carBuild: 'Client builds', source: 'direct', createdAt: new Date(Date.now() - 86400000).toISOString() }
            ]
        });
    }

    try {
        const limit = parseInt(req.query.limit) || 100;
        const signupsRef = db.collection('signups');

        // Simple fetch of last N leads
        const snapshot = await signupsRef.orderBy('createdAt', 'desc').limit(limit).get();

        const leads = [];
        snapshot.forEach(doc => {
            leads.push(doc.data());
        });

        return res.status(200).json({
            mode: 'live',
            leads
        });

    } catch (error) {
        console.error('Leads API Error:', error);
        return res.status(500).json({ error: 'Failed to fetch leads' });
    }
}
