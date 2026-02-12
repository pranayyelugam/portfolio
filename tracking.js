(function() {
    const INGESTER_URL = 'http://localhost:8090/api/track';
    
    // Generate or retrieve a persistent visitor ID
    let visitorId = localStorage.getItem('uforwarder_visitor_id');
    if (!visitorId) {
        visitorId = 'v-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
        localStorage.setItem('uforwarder_visitor_id', visitorId);
    }

    const trackPageView = () => {
        const payload = {
            visitor_id: visitorId,
            page: window.location.pathname
        };

        fetch(INGESTER_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).catch(err => console.warn('[uForwarder] Tracking failed:', err));
    };

    // Track on load
    if (document.readyState === 'complete') {
        trackPageView();
    } else {
        window.addEventListener('load', trackPageView);
    }
})();
