// firebaseConfig.js - Firebase initialization for ThatAppCompany hub
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { addDoc, collection, getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCEFvcV4MKlxtXOiZXRFTL8xVSGuKsPme8",
    authDomain: "carguy-app-demo.firebaseapp.com",
    projectId: "carguy-app-demo",
    storageBucket: "carguy-app-demo.firebasestorage.app",
    messagingSenderId: "869343833766",
    appId: "1:869343833766:web:d80b4034b146525a588e67",
    measurementId: "G-VK9ENC9J54"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { addDoc, collection, db };

