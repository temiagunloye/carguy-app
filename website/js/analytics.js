/**
 * Car Guy App - Lightweight Analytics
 */

(function () {
    // Analytics Store
    const EVENTS_KEY = 'carguy_analytics_events';

    // Generate simple Session ID
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('analytics_session_id', sessionId);
    }

    // Generate User ID (persistent)
    let userId = localStorage.getItem('analytics_user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('analytics_user_id', userId);
    }

    // Track Event
    window.trackEvent = function (eventName, properties = {}) {
        /*
        // Only log in dev
        if (window.location.hostname === 'localhost') {
            console.log('Analytics Event:', eventName, properties);
        }
        */

        const event = {
            id: 'evt_' + Math.random().toString(36).substr(2, 9),
            name: eventName,
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
            userId: userId,
            url: window.location.href,
            ...properties
        };

        // Store internally (could batch send to API later)
        try {
            const storedEvents = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
            storedEvents.push(event);
            // Cap at 100 events
            if (storedEvents.length > 100) storedEvents.shift();
            localStorage.setItem(EVENTS_KEY, JSON.stringify(storedEvents));
        } catch (e) {
            console.warn('Analytics storage failed', e);
        }

        // Fire GTM/GA if available (placeholder)
        if (window.gtag) {
            window.gtag('event', eventName, properties);
        }
    };

    // Auto-track pageview
    window.trackEvent('page_view');

})();
