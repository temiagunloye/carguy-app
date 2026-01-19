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
    if (global.rateLimit && global.rateLimit[ip] && now - global.rateLimit[ip] < 100) {
        return res.status(429).json({ error: 'Too many requests' });
    }
    global.rateLimit = global.rateLimit || {};
    global.rateLimit[ip] = now;

    try {
        const { eventName, sessionId, userId, properties, url } = req.body;

        // Validate required fields
        if (!eventName || !sessionId || !userId) {
            return res.status(400).json({ error: 'Missing required fields: eventName, sessionId, userId' });
        }

        // Create event document
        const eventData = {
            eventName,
            sessionId,
            userId,
            properties: properties || {},
            url: url || null,
            timestamp: new Date().toISOString()
        };

        // Store in Firestore
        await db.collection('events').add(eventData);

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('Event tracking error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
