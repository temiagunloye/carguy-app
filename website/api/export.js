import { getFirestore } from './_libs/firebaseAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const db = getFirestore();

    if (!db) {
        return res.status(500).json({ error: 'Database not connected (Demo Mode)' });
    }

    try {
        const signupsRef = db.collection('signups');
        const snapshot = await signupsRef.orderBy('createdAt', 'desc').get();

        // CSV Header
        let csv = 'Date,Email,Role,Plan,Idea,Source,Referrer,Status\n';

        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.createdAt ? new Date(data.createdAt).toISOString() : '';

            // CSV Safe String
            const safe = (str) => `"${(str || '').replace(/"/g, '""')}"`;

            const row = [
                date,
                data.email,
                data.role,
                data.planInterest || '',
                data.carBuild || '',
                data.source || '',
                data.referrer || '',
                data.status || 'new'
            ].map(safe).join(',');

            csv += row + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=garagemanager_leads_${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);

    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
}
