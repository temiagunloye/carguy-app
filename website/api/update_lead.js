import crypto from 'crypto';
import { getFirestore } from './_libs/firebaseAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { email, status, notes, value } = req.body;

        if (!email) {
            return res.status(400).json({ ok: false, message: 'Email required' });
        }

        const db = getFirestore();
        if (!db) {
            return res.status(200).json({ ok: true, mode: 'demo', message: 'Update simulated' });
        }

        const docId = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
        const docRef = db.collection('signups').doc(docId);

        const updates = {
            updatedAt: new Date().toISOString()
        };

        if (status) updates.status = status;
        if (notes !== undefined) updates.salesNotes = notes;
        if (value !== undefined) updates.estimatedValue = value;

        await docRef.set(updates, { merge: true });

        return res.status(200).json({ ok: true });

    } catch (error) {
        console.error('Update Lead Error:', error);
        return res.status(500).json({ ok: false, error: 'Database error' });
    }
}
