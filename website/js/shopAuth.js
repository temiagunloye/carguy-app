// MOCK AUTH SERVICE - BYPASSING FIREBASE FOR DEMO
// Reason: API Key issues blocking access. User requested to skip password lock.

// Mock Persistence
const SESSION_KEY = 'carguy_mock_session'; // stores boolean

export async function signUp(email, password) {
    console.log("Mock SignUp:", email);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: email, uid: 'mock-uid-' + Date.now() }));
    return { email, uid: 'mock-new-user' };
}

export async function signIn(email, password) {
    console.log("Mock SignIn:", email);
    // Always succeed
    const user = {
        email: email || 'demo@carguy.app',
        uid: 'demo-admin-uid',
        displayName: 'Demo Admin'
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return { user };
}

export async function signOut() {
    console.log("Mock SignOut");
    localStorage.removeItem(SESSION_KEY);
    return Promise.resolve();
}

export function checkAuth() {
    return new Promise((resolve) => {
        // Auto-login / Bypass check
        // If we want to strictly skip lock, we can just always return a user.
        // But let's check localStorage so SignOut actually works (for UX demo purposes).
        // If user is locked out, they can just click "Login" and it will work instantly.

        try {
            const session = localStorage.getItem(SESSION_KEY);
            if (session) {
                resolve(JSON.parse(session));
            } else {
                // Not logged in. 
                // Redirect if protected page.
                if (!window.location.href.includes('login.html')) {
                    // For "Skip Password Lock" request:
                    // We could auto-login here, OR just redirect.
                    // Let's Redirect, but `login.html` will have a helper to strictly bypass.
                    window.location.href = '/shop/login.html';
                }
                resolve(null);
            }
        } catch (e) {
            resolve(null);
        }
    });
}

export function getCurrentUser() {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    } catch (e) { return null; }
}

// Force a demo session if needed (call from console window.forceDemo())
window.forceDemo = () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email: 'demo@carguy.app', uid: 'demo' }));
    location.href = '/shop/dashboard.html';
};
