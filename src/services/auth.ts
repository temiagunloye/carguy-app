// src/services/auth.ts
// Authentication service with tier initialization

import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    signInWithEmailAndPassword,
    User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

export interface SignUpData {
    email: string;
    password: string;
}

/**
 * Sign up new user and initialize tier data
 */
export async function signUp({ email, password }: SignUpData): Promise<User> {
    if (!auth || !db) {
        throw new Error('Firebase not initialized');
    }

    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Initialize user document with free tier
    await setDoc(doc(db, 'users', user.uid), {
        tier: 'free',
        extraVehicleSlots: 0,
        email: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    console.log('[Auth] User created with tier=free:', user.uid);
    return user;
}

/**
 * Sign in existing user
 */
export async function signIn({ email, password }: SignUpData): Promise<User> {
    if (!auth) {
        throw new Error('Firebase not initialized');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
    if (!auth) {
        throw new Error('Firebase not initialized');
    }

    await firebaseSignOut(auth);
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
    return auth?.currentUser || null;
}

/**
 * Check if user document exists, create if missing
 */
export async function ensureUserDocument(uid: string): Promise<void> {
    if (!db) return;

    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
        await setDoc(userRef, {
            tier: 'free',
            extraVehicleSlots: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        console.log('[Auth] Created missing user document:', uid);
    }
}
