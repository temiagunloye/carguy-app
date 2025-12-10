// src/services/rendering.js
// Rendering pipeline helpers for car 3D rendering

import { updateCarRendering } from "./carService";

/**
 * Request car rendering to start
 * For now, this is a client-side mock that simulates the rendering process
 * Later, this should call a Cloud Function: startCarRenderJob
 */
export const requestCarRendering = async (userId, carId, carData) => {
  try {
    // Update status to 'queued'
    await updateCarRendering(userId, carId, {
      renderJobStatus: 'queued',
    });

    // Simulate processing (in production, this would be handled by Cloud Function)
    // For now, we'll use the first available angle photo as a placeholder
    const anglePhotos = carData.anglePhotos || {};
    const firstAvailablePhoto = 
      anglePhotos.front34 || 
      anglePhotos.side || 
      anglePhotos.front || 
      anglePhotos.rear34 ||
      anglePhotos.driverSide45 ||
      anglePhotos.passengerSide45 ||
      anglePhotos.lowFront ||
      anglePhotos.lowRear ||
      anglePhotos.rear ||
      anglePhotos.roof ||
      null;

    if (firstAvailablePhoto) {
      // Simulate processing delay
      setTimeout(async () => {
        await updateCarRendering(userId, carId, {
          renderJobStatus: 'processing',
        });

        // After another delay, mark as complete with placeholder
        setTimeout(async () => {
          await updateCarRendering(userId, carId, {
            renderJobStatus: 'complete',
            renderingPreviewUrl: firstAvailablePhoto, // Placeholder - would be actual render
            renderLastUpdatedAt: new Date(),
          });
        }, 2000);
      }, 1000);
    } else {
      // No photos available
      await updateCarRendering(userId, carId, {
        renderJobStatus: 'error',
      });
    }
  } catch (error) {
    console.error("Error requesting rendering:", error);
    await updateCarRendering(userId, carId, {
      renderJobStatus: 'error',
    });
  }
};

/**
 * Listen to rendering status changes for a car
 * @param {string} userId - The user ID
 * @param {string} carId - The car ID
 * @param {function} callback - Callback with { status, previewUrl }
 * @param {boolean} demoMode - Whether we're in demo mode
 * @returns {function} Unsubscribe function
 */
export const listenToRenderStatus = async (userId, carId, callback, demoMode = false) => {
  // In demo mode, don't try to connect to Firebase
  if (demoMode) {
    // Return a no-op unsubscribe function
    return () => {};
  }

  try {
    // Dynamically import Firebase only when not in demo mode
    const { doc, onSnapshot } = await import("firebase/firestore");
    const { db } = await import("./firebaseConfig");
    
    const carRef = doc(db, "users", userId, "cars", carId);
    
    return onSnapshot(carRef, (snap) => {
      if (!snap.exists()) {
        callback({ status: 'idle', previewUrl: null });
        return;
      }

      const data = snap.data();
      callback({
        status: data.renderJobStatus || 'idle',
        previewUrl: data.renderingPreviewUrl || null,
        meshUrl: data.renderMeshUrl || null,
      });
    });
  } catch (error) {
    console.error("Error setting up render status listener:", error);
    // Return no-op unsubscribe on error
    return () => {};
  }
};

/**
 * Check if all required angles are captured
 */
export const areAllAnglesCaptured = (anglePhotos) => {
  if (!anglePhotos) return false;
  
  const requiredAngles = [
    'front34',
    'rear34',
    'side',
    'front',
    'rear',
    'roof',
    'driverSide45',
    'passengerSide45',
    'lowFront',
    'lowRear',
  ];

  return requiredAngles.every(angle => anglePhotos[angle] !== null && anglePhotos[angle] !== undefined);
};

