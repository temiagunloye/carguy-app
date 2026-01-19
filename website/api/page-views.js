import { getFirestore } from './_libs/firebaseAdmin.js';

export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const db = getFirestore();

    // If Firebase not configured, silently succeed (analytics optional)
    if (!db) {
        return res.status(200).json({ success: true, mode: 'demo' });
    }

    // Rate Limiting (Basic IP-based)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    // In memory store for demo purposes (serverless functions are ephemeral, so this is per-instance)
    // For robust rate limiting in Vercel, typically use KV or Upstash, but this provides basic flood protection
    if (global.rateLimit && global.rateLimit[ip] && now - global.rateLimit[ip] < 100) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    global.rateLimit = global.rateLimit || {};
    global.rateLimit[ip] = now;

    try {
        const { url, path, referrer, sessionId, userId, utmSource, utmMedium, utmCampaign, device, browser } = req.body;

        // Validate required fields
        if (!url || !sessionId || !userId) {
            return res.status(400).json({ error: 'Missing required fields: url, sessionId, userId' });
        }

        // Create page view document
        const pageViewData = {
            url: url.substring(0, 500), // Limit length
            path: path || new URL(url).pathname,
            referrer: referrer ? referrer.substring(0, 500) : null,
            sessionId,
            userId,
            utmSource: utmSource || null,
            utmMedium: utmMedium || null,
            utmCampaign: utmCampaign || null,
            device: device || 'unknown',
            browser: browser || 'unknown',
            timestamp: new Date().toISOString(),
            timeOnPage: 0 // Will be updated on next page view
        };

        // Store in Firestore
        await db.collection('pageViews').add(pageViewData);

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Page view tracking error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
