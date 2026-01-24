/**
 * LocalBuild Service
 * Manages one build per device using IndexedDB
 * Includes image blob storage
 */

const DB_NAME = 'garageManagerDB';
const DB_VERSION = 1;
const STORE_NAME = 'localBuild';
const BUILD_KEY = 'current-build';

class LocalBuildService {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("LocalBuildService: DB error", event);
                reject("Database error");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("LocalBuildService: DB initialized");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    }

    async saveBuild(buildData) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            // Add fixed ID for single build per device policy
            const record = {
                id: BUILD_KEY,
                ...buildData,
                updatedAt: new Date().toISOString()
            };

            const request = store.put(record);

            request.onsuccess = () => {
                console.log("LocalBuildService: Build saved");
                resolve(true);
            };

            request.onerror = (e) => {
                console.error("LocalBuildService: Save failed", e);
                reject(e);
            };
        });
    }

    async loadBuild() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(BUILD_KEY);

            request.onsuccess = (event) => {
                resolve(event.target.result || null);
            };

            request.onerror = (e) => {
                reject(e);
            };
        });
    }

    async clearBuild() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(BUILD_KEY);

            request.onsuccess = () => {
                console.log("LocalBuildService: Build cleared");
                resolve(true);
            };

            request.onerror = (e) => {
                reject(e);
            };
        });
    }
}

export const localBuildService = new LocalBuildService();
