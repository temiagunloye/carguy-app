import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebaseConfig.js";

const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");

if (statusDot && statusText) {
    // Check connection by listening to a metadata document or just verifying connection state
    try {
        // We'll listen to a dummy doc 'system/status' or just rely on online state
        // Simplest health check: is window.navigator.onLine? 
        // Better: Firestore connection.

        const connectedRef = doc(db, "system", "status");
        onSnapshot(connectedRef, (doc) => {
            // If we get an update, we are connected
            statusDot.style.backgroundColor = "#10b981"; // Green
            statusText.textContent = "System Operational";
        }, (error) => {
            console.warn("Health check warning", error);
            statusDot.style.backgroundColor = "#f59e0b"; // Yellow/Orange
            statusText.textContent = "Connecting...";
        });

    } catch (e) {
        console.error("Health check failed", e);
        statusDot.style.backgroundColor = "#ef4444"; // Red
        statusText.textContent = "Offline";
    }
}
