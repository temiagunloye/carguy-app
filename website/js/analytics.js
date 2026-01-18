/**
 * Garage Manager - Lightweight Analytics
 */

(function () {
    // Analytics Store
    const EVENTS_KEY = 'garagemanager_analytics_events';

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
        const event = {
            event: eventName,
            id: 'evt_' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
            userId: userId,
            url: window.location.href,
            ...properties
        };

        // 1. Push to GTM Data Layer (Priority)
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(event);

        // 2. Store locally (Backup/Debug)
        try {
            const storedEvents = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
            storedEvents.push(event);
            if (storedEvents.length > 100) storedEvents.shift();
            localStorage.setItem(EVENTS_KEY, JSON.stringify(storedEvents));
        } catch (e) {
            console.warn('Analytics storage failed', e);
        }

        // 3. Dev Logging
        if (window.location.hostname === 'localhost') {
            console.log('📊 Analytics:', eventName, properties);
        }
    };

    // Auto-track pageview
    window.trackEvent('page_view', {
        page_title: document.title,
        page_path: window.location.pathname
    });

})();
