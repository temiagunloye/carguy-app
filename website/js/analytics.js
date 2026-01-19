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

    // Extract UTM parameters
    function getUTMParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            utmSource: params.get('utm_source') || null,
            utmMedium: params.get('utm_medium') || null,
            utmCampaign: params.get('utm_campaign') || null
        };
    }

    // Detect device type
    function getDeviceType() {
        return /mobile|android|iphone|ipad|tablet/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    }

    // Get browser name
    function getBrowserName() {
        const ua = navigator.userAgent;
        if (ua.indexOf('Firefox') > -1) return 'Firefox';
        if (ua.indexOf('Chrome') > -1) return 'Chrome';
        if (ua.indexOf('Safari') > -1) return 'Safari';
        if (ua.indexOf('Edge') > -1) return 'Edge';
        return 'Other';
    }

    // Send page view to backend
    function sendPageView() {
        const utm = getUTMParams();
        const pageViewData = {
            url: window.location.href,
            path: window.location.pathname,
            referrer: document.referrer || null,
            sessionId,
            userId,
            ...utm,
            device: getDeviceType(),
            browser: getBrowserName()
        };

        // Send to backend (non-blocking)
        fetch('/api/page-views', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pageViewData)
        }).catch(err => {
            // Silently fail - analytics is optional
            if (window.location.hostname === 'localhost') {
                console.log('📊 Page view tracking (backend unavailable):', pageViewData);
            }
        });
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

        // 3. Send to backend (non-blocking)
        fetch('/api/track-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventName,
                sessionId,
                userId,
                properties,
                url: window.location.href
            })
        }).catch(err => {
            // Silently fail - analytics is optional
            if (window.location.hostname === 'localhost') {
                console.log('📊 Event tracking (backend unavailable):', eventName, properties);
            }
        });

        // 4. Dev Logging
        if (window.location.hostname === 'localhost') {
            console.log('📊 Analytics:', eventName, properties);
        }
    };

    // Auto-track pageview
    window.trackEvent('page_view', {
        page_title: document.title,
        page_path: window.location.pathname
    });

    // Send page view to backend
    sendPageView();

})();
