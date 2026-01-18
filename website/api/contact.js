import crypto from 'crypto';
import { getFirestore } from './_libs/firebaseAdmin.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { name, email, subject, message } = req.body;
        const userAgent = req.headers['user-agent'] || '';

        if (!email || !message) {
            return res.status(400).json({ ok: false, message: 'Email and message required' });
        }

        const db = getFirestore();
        if (!db) {
            return res.status(200).json({ ok: true, mode: 'demo' });
        }

        // Logic: If it's a "Dealer" or "Billing" inquiry, treat as high priority or Lead
        const isSalesInquiry = ['dealer', 'billing', 'feature'].includes(subject);

        const now = new Date().toISOString();

        // 1. Save to Messages Collection
        await db.collection('messages').add({
            name,
            email,
            subject,
            message,
            userAgent,
            createdAt: now,
            status: 'new'
        });

        // 2. If Sales Inquiry, UPSERT into Signups/Leads
        if (isSalesInquiry) {
            const docId = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
            const roleMap = {
                'dealer': 'Dealer',
                'billing': 'Enthusiast', // Likely existing
                'feature': 'Enthusiast'
            };

            await db.collection('signups').doc(docId).set({
                email: email.toLowerCase().trim(),
                role: roleMap[subject] || 'Other',
                source: 'Contact Form',
                campaign: subject,
                content: message.substring(0, 100), // snippet
                lastSubmittedAt: now,
                // Only set createdAt if new
                ...(await db.collection('signups').doc(docId).get()).exists ? {} : { createdAt: now, status: 'new' }
            }, { merge: true });
        }

        // Slack Notify (Optional)
        if (process.env.SLACK_WEBHOOK_URL) {
            // ... (Slack logic similar to signup.js)
        }

        return res.status(200).json({ ok: true });

    } catch (error) {
        console.error('Contact API Error:', error);
        return res.status(500).json({ ok: false, error: 'Server error' });
    }
}
