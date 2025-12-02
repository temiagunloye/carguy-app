// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your config
const firebaseConfig = {
  apiKey: "AIzaSyCEFvcV4MKlxtXOiZXRFTL8xVSGuKsPme8",
  authDomain: "carguy-app-demo.firebaseapp.com",
  projectId: "carguy-app-demo",
  storageBucket: "carguy-app-demo.firebasestorage.app",
  messagingSenderId: "869343833766",
  appId: "1:869343833766:web:d80b4034b146525a588e67",
  measurementId: "G-VK9ENC9J54"
};

// Initialize core Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore + Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
