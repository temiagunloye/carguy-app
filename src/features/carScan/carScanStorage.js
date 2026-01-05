// src/features/carScan/carScanStorage.js
// Storage utilities for car scan sessions and shots

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * @typedef {'driver_front' | 'passenger_front' | 'driver_rear' | 'passenger_rear' | 'full_driver_side' | 'full_passenger_side' | 'front_center' | 'rear_center' | 'front_low' | 'rear_low'} ShotId
 */

/**
 * @typedef {Object} CarScanShot
 * @property {ShotId} id
 * @property {string} label
 * @property {string} imageUri - Local file URI
 * @property {number} width
 * @property {number} height
 * @property {string} createdAt - ISO timestamp
 * @property {number} [devicePitch]
 * @property {number} [deviceRoll]
 * @property {number} [deviceYaw]
 * @property {'near' | 'medium' | 'far'} [distanceCategory]
 */

/**
 * @typedef {Object} CarScanSession
 * @property {string} sessionId
 * @property {string} carId
 * @property {string} createdAt - ISO timestamp
 * @property {string} [completedAt] - ISO timestamp
 * @property {CarScanShot[]} shots - Should contain exactly 10 items for complete scan
 */

const STORAGE_KEY_PREFIX = '@carScan:';
const SESSIONS_KEY = `${STORAGE_KEY_PREFIX}sessions`;

/**
 * Start a new car scan session
 * @param {string} carId
 * @returns {Promise<CarScanSession>}
 */
export async function startCarScanSession(carId) {
  const sessionId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const session = {
    sessionId,
    carId,
    createdAt: new Date().toISOString(),
    shots: [],
  };

  const sessions = await getAllSessions();
  sessions.push(session);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

  return session;
}

/**
 * Save a scan shot to a session
 * @param {string} sessionId
 * @param {CarScanShot} shot
 * @returns {Promise<void>}
 */
export async function saveCarScanShot(sessionId, shot) {
  const sessions = await getAllSessions();
  const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);

  if (sessionIndex === -1) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const session = sessions[sessionIndex];
  const existingShotIndex = session.shots.findIndex(s => s.id === shot.id);

  if (existingShotIndex >= 0) {
    // Update existing shot
    session.shots[existingShotIndex] = shot;
  } else {
    // Add new shot
    session.shots.push(shot);
  }

  // Check if all 10 shots are complete
  if (session.shots.length === 10) {
    session.completedAt = new Date().toISOString();
  }

  sessions[sessionIndex] = session;
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

/**
 * Get latest scan session for a car
 * @param {string} carId
 * @returns {Promise<CarScanSession | null>}
 */
export async function getLatestCarScanSession(carId) {
  const sessions = await getAllSessions();
  const carSessions = sessions
    .filter(s => s.carId === carId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return carSessions[0] || null;
}

/**
 * Resume incomplete scan session for a car
 * @param {string} carId
 * @returns {Promise<CarScanSession | null>}
 */
export async function resumeIncompleteCarScanSession(carId) {
  const sessions = await getAllSessions();
  const incompleteSessions = sessions
    .filter(s => s.carId === carId && !s.completedAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return incompleteSessions[0] || null;
}

/**
 * Get all sessions (internal helper)
 * @returns {Promise<CarScanSession[]>}
 */
async function getAllSessions() {
  try {
    const data = await AsyncStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading sessions:', error);
    return [];
  }
}

/**
 * Get all sessions for a car
 * @param {string} carId
 * @returns {Promise<CarScanSession[]>}
 */
export async function getCarScanSessions(carId) {
  const sessions = await getAllSessions();
  return sessions
    .filter(s => s.carId === carId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Delete a scan session
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
export async function deleteCarScanSession(sessionId) {
  const sessions = await getAllSessions();
  const filtered = sessions.filter(s => s.sessionId !== sessionId);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
}


