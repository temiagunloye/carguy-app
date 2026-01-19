import crypto from 'crypto';
import { getFirestore } from './_libs/firebaseAdmin.js';

// Rate limiting map (in-memory, resets on function cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_IP = 5;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, message: 'Method not allowed' });
    }

    try {
        const {
            type, // bodyshop | dealer | client_quote
            email,
            businessName,
            contactName,
            phone,
            location,
            specialty,
            message,
            vehicle,
        } = req.body;

        // Get IP for rate limiting
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        // Rate limiting check
        const now = Date.now();
        const ipKey = ipHash.substring(0, 16);
        const submissions = rateLimitMap.get(ipKey) || [];
        const recentSubmissions = submissions.filter(time => now - time < RATE_LIMIT_WINDOW);

        if (recentSubmissions.length >= MAX_SUBMISSIONS_PER_IP) {
            return res.status(429).json({
                ok: false,
                message: 'Too many submissions. Please try again later.',
            });
        }

        // Update rate limit map
        recentSubmissions.push(now);
        rateLimitMap.set(ipKey, recentSubmissions);

        // Validate required fields
        if (!email || !email.includes('@')) {
            return res.status(400).json({ ok: false, message: 'Valid email is required' });
        }

        if (!type || !['bodyshop', 'dealer', 'client_quote'].includes(type)) {
            return res.status(400).json({ ok: false, message: 'Invalid lead type' });
        }

        // Get Firestore
        const db = getFirestore();

        // Demo mode fallback
        if (!db) {
            console.log('[DEMO MODE] Body Shop Lead:', { type, email, businessName });
            return res.status(200).json({ ok: true, mode: 'demo' });
        }

        // Create lead document
        const leadId = crypto.randomUUID();
        const leadData = {
            id: leadId,
            type,
            email: email.toLowerCase().trim(),
            contactName: contactName || '',
            phone: phone || '',
            location: location || '',
            message: message || '',
            source: 'website',
            status: 'new',
            ipHash,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Add type-specific fields
        if (type === 'bodyshop' || type === 'dealer') {
            leadData.businessName = businessName || '';
            leadData.specialty = specialty || '';
        }

        if (type === 'client_quote') {
            leadData.vehicle = vehicle || '';
        }

        // Save to Firestore
        await db.collection('bodyshopLeads').doc(leadId).set(leadData);

        // Send Slack notification
        if (process.env.SLACK_WEBHOOK_URL) {
            try {
                const icon = type === 'bodyshop' ? '🏭' : type === 'dealer' ? '💼' : '🚗';
                const title = type === 'bodyshop' ? 'Partner Application' : type === 'dealer' ? 'Dealer Signup' : 'Quote Request';

                let slackMessage = `${icon} *New ${title}*\n`;
                slackMessage += `*Email:* ${leadData.email}\n`;
                if (leadData.contactName) slackMessage += `*Contact:* ${leadData.contactName}\n`;
                if (leadData.businessName) slackMessage += `*Business:* ${leadData.businessName}\n`;
                if (leadData.location) slackMessage += `*Location:* ${leadData.location}\n`;
                if (leadData.specialty) slackMessage += `*Specialty:* ${leadData.specialty}\n`;
                if (leadData.vehicle) slackMessage += `*Vehicle:* ${leadData.vehicle}\n`;
                if (leadData.message) slackMessage += `*Message:* ${leadData.message.substring(0, 200)}...\n`;

                await fetch(process.env.SLACK_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: slackMessage }),
                });
            } catch (err) {
                console.error('Slack notification failed:', err);
            }
        }

        // TODO: Send to CRM via adapter (future implementation)
        // await crmAdapter.createLead(leadData);

        return res.status(200).json({ ok: true, mode: 'live', leadId });

    } catch (error) {
        console.error('Body Shop Leads API Error:', error);
        return res.status(500).json({ ok: false, message: 'Internal server error' });
    }
}
