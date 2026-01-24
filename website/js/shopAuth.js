import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { signOut as firebaseSignOut, getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Init Firebase (Using same placeholder config, ensures separate instance if needed or reuse)
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "carguy-app-v1.firebaseapp.com",
    projectId: "carguy-app-v1",
    storageBucket: "carguy-app-v1.appspot.com",
    messagingSenderId: "123456789",
    appId: "..."
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

export function signOut() {
    return firebaseSignOut(auth);
}

export function checkAuth() {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            if (user) {
                resolve(user);
            } else {
                // Redirect if not on login page
                if (!window.location.href.includes('login.html')) {
                    window.location.href = '/shop/login.html';
                }
                resolve(null);
            }
        });
    });
}

export function getCurrentUser() {
    return auth.currentUser;
}
