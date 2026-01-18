import crypto from 'crypto';
import { getFirestore } from './_libs/firebaseAdmin.js';

export default async function handler(req, res) {
    // CORS / Methods
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, message: 'Method not allowed' });
    }

    try {
        const { email, role, phone, carBuild, planInterest, source, referrer, medium, campaign, term, content, pagePath } = req.body;
        const userAgent = req.headers['user-agent'] || '';

        // IP Hash
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        // Basic Validation
        if (!email || !email.includes('@')) {
            return res.status(400).json({ ok: false, message: 'Valid email is required' });
        }

        const emailLower = email.toLowerCase().trim();

        // Check Firebase
        const db = getFirestore();

        // Demo Mode Fallback
        if (!db) {
            // Simulate success for Demo Mode
            return res.status(200).json({ ok: true, mode: 'demo' });
        }

        // Live Mode: Firestore Write
        const docId = crypto.createHash('sha256').update(emailLower).digest('hex');
        const docRef = db.collection('signups').doc(docId);

        const doc = await docRef.get();
        const now = new Date().toISOString();

        if (doc.exists) {
            // Check cooldown (prevent spamming upgrades)
            const data = doc.data();
            const lastSubmit = new Date(data.lastSubmittedAt || 0).getTime();
            const oneDay = 24 * 60 * 60 * 1000;

            if (Date.now() - lastSubmit < oneDay) {
                // Silently succeed to prevent probing
                return res.status(200).json({ ok: true, mode: 'live', message: 'Already registered' });
            }
        }

        const payload = {
            email: emailLower,
            role: role || 'Unknown',
            planInterest: planInterest || '',
            phone: phone || '',
            carBuild: carBuild || '',
            source: source || 'direct',
            medium: medium || '',
            campaign: campaign || '',
            term: term || '',
            content: content || '',
            pagePath: pagePath || '/',
            referrer: referrer || '',
            userAgent,
            ipHash,
            lastSubmittedAt: now
        };

        if (!doc.exists) {
            payload.createdAt = now;
            payload.status = 'new';
        }

        await docRef.set(payload, { merge: true });

        // Slack Notification
        if (process.env.SLACK_WEBHOOK_URL) {
            try {
                // Determine icon based on role
                const icon = role === 'Shop' ? '🏭' : role === 'Dealer' ? '💼' : '🏎️';

                await fetch(process.env.SLACK_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `${icon} *New Waitlist Signup*\n*Email:* ${emailLower}\n*Role:* ${role}\n*Plan:* ${planInterest || 'Unspecified'}\n*Source:* ${source || 'Direct'}\n*Idea:* ${carBuild || 'None'}`
                    })
                });
            } catch (err) {
                console.error('Slack Notification Failed:', err);
                // Don't block response
            }
        }

        return res.status(200).json({ ok: true, mode: 'live' });

    } catch (error) {
        console.error('Signup API Error:', error);
        return res.status(200).json({ ok: false, mode: 'error' });
    }
}
