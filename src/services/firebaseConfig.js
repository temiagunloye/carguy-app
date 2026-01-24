// src/services/firebaseConfig.js

// Demo mode flag - set to true to skip Firebase entirely
const DEMO_MODE = false; // ✅ Changed to false - Firebase is now ENABLED

// Use a closure to store Firebase instances
const firebaseState = {
  app: null,
  auth: null,
  db: null,
  storage: null,
};

// Lazy initialization - only initialize Firebase when actually needed (not in demo mode)
const initializeFirebase = () => {
  if (DEMO_MODE) {
    // Return null objects in demo mode
    return {
      auth: null,
      db: null,
      storage: null,
    };
  }

  if (firebaseState.app) {
    // Already initialized
    return { auth: firebaseState.auth, db: firebaseState.db, storage: firebaseState.storage };
  }

  try {
    const { initializeApp, getApps } = require("firebase/app");
    const { initializeAuth, getReactNativePersistence, connectAuthEmulator } = require("firebase/auth");
    const { initializeFirestore, connectFirestoreEmulator } = require("firebase/firestore");
    const { getStorage: getFirebaseStorage, connectStorageEmulator } = require("firebase/storage");
    const ReactNativeAsyncStorage = require("@react-native-async-storage/async-storage").default;
    const Constants = require("expo-constants").default;

    // Firebase configuration from carguy-app-demo project
    const firebaseConfig = {
      apiKey: "AIzaSyCEFvcV4MKlxtXOiZXRFTL8xVSGuKsPme8",
      authDomain: "carguy-app-demo.firebaseapp.com",
      projectId: "carguy-app-demo",
      storageBucket: "carguy-app-demo.firebasestorage.app",
      messagingSenderId: "869343833766",
      appId: "1:869343833766:web:d80b4034b146525a588e67",
      measurementId: "G-VK9ENC9J54"
    };

    if (getApps().length === 0) {
      firebaseState.app = initializeApp(firebaseConfig);
      firebaseState.auth = initializeAuth(firebaseState.app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
      // Force long polling to fix "transport errored" on React Native
      firebaseState.db = initializeFirestore(firebaseState.app, {
        experimentalForceLongPolling: true,
      });
      firebaseState.storage = getFirebaseStorage(firebaseState.app);

      // Connect to emulators if in DEV mode
      // Connect to emulators if in DEV mode
      if (__DEV__) {
        console.log("🔥 Connecting to Firebase Emulators...");
        // Dynamically detect host IP for physical devices
        // FALLBACK: We detected 192.168.5.55, hardcoding it for stability.
        const debuggerHost = "192.168.5.55:8081";
        const localhost = debuggerHost.split(":")[0];

        console.log(`📡 Detected Host IP: ${localhost}`);

        try {
          // Note: On physical iOS/Android, you MUST use the LAN IP, not localhost.
          // If you see "Network request failed", it means the phone can't reach this IP.
          connectAuthEmulator(firebaseState.auth, `http://${localhost}:9099`);
          connectFirestoreEmulator(firebaseState.db, localhost, 8080);
          connectStorageEmulator(firebaseState.storage, localhost, 9199);
          console.log(`✅ Emulators connected at ${localhost}`);
        } catch (e) {
          console.warn("Error connecting to emulators:", e);
        }
      }
    } else {
      // App already initialized - recover instances
      firebaseState.app = getApps()[0];
      const { getAuth } = require("firebase/auth");
      const { getFirestore } = require("firebase/firestore");
      firebaseState.auth = getAuth(firebaseState.app);
      firebaseState.db = getFirestore(firebaseState.app);
      firebaseState.storage = getFirebaseStorage(firebaseState.app);
    }

    return { auth: firebaseState.auth, db: firebaseState.db, storage: firebaseState.storage };
  } catch (error) {
    console.error("Firebase initialization error:", error);
    return { auth: null, db: null, storage: null };
  }
};

// Export getters that lazy-initialize
export const getAuth = () => {
  if (DEMO_MODE) return null;
  if (!firebaseState.auth) initializeFirebase();
  return firebaseState.auth;
};

export const getDb = () => {
  if (DEMO_MODE) return null;
  if (!firebaseState.db) initializeFirebase();
  return firebaseState.db;
};

export const getStorageInstance = () => {
  if (DEMO_MODE) return null;
  if (!firebaseState.storage) initializeFirebase();
  return firebaseState.storage;
};

// For backward compatibility, export as lazy getters
// In demo mode, these are always null
// In non-demo mode, they lazy-initialize when accessed
export const auth = DEMO_MODE ? null : getAuth();
export const db = DEMO_MODE ? null : getDb();
export const storage = DEMO_MODE ? null : getStorageInstance();
