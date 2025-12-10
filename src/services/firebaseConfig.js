// src/services/firebaseConfig.js

// Demo mode flag - set to true to skip Firebase entirely
const DEMO_MODE = true;

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
    const { initializeApp } = require("firebase/app");
    const { initializeAuth, getReactNativePersistence } = require("firebase/auth");
    const { getFirestore } = require("firebase/firestore");
    const { getStorage: getFirebaseStorage } = require("firebase/storage");
    const ReactNativeAsyncStorage = require("@react-native-async-storage/async-storage").default;

    // TODO: replace with YOUR Firebase config values
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_PROJECT_ID.appspot.com",
      messagingSenderId: "YOUR_SENDER_ID",
      appId: "YOUR_APP_ID",
    };

    firebaseState.app = initializeApp(firebaseConfig);
    firebaseState.auth = initializeAuth(firebaseState.app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
    firebaseState.db = getFirestore(firebaseState.app);
    firebaseState.storage = getFirebaseStorage(firebaseState.app);

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
