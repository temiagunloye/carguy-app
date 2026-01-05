// src/services/rendering.js
// 3D Car Rendering Service - Frontend Integration with Cloud Functions

import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import { db, functions } from './firebaseConfig';

/**
 * Request 3D reconstruction for a car
 * Calls the Cloud Function to start the photogrammetry process
 * 
 * @param {string} carId - The car document ID
 * @returns {Promise<Object>} - { success, jobId, message }
 */
export const requestCarReconstruction = async (carId) => {
  try {
    const callable = httpsCallable(functions, 'requestCarReconstruction');
    const result = await callable({ carId });
    return result.data;
  } catch (error) {
    console.error('Error requesting car reconstruction:', error);
    throw new Error(error.message || 'Failed to start 3D reconstruction');
  }
};

/**
 * React Hook: Subscribe to car rendering status
 * 
 * Provides real-time updates on the 3D reconstruction progress
 * and access to the generated 3D model and preview renders
 * 
 * @param {string} carId - The car document ID to monitor
 * @returns {Object} - {
 *   status: 'idle' | 'queued' | 'processing' | 'complete' | 'failed',
 *   previewUrl: string | null,
 *   meshUrl: string | null,
 *   previewAngles: Array<{angle: string, url: string}>,
 *   error: string | null,
 *   loading: boolean
 * }
 * 
 * @example
 * const { status, previewUrl, meshUrl } = useCarRendering(carId);
 * 
 * if (status === 'complete') {
 *   // Show 3D model or preview renders
 * }
 */
export const useCarRendering = (carId) => {
  const [rendering, setRendering] = useState({
    status: 'idle',
    previewUrl: null,
    meshUrl: null,
    previewAngles: [],
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!carId) {
      setRendering(prev => ({ ...prev, loading: false }));
      return;
    }

    // Subscribe to car document for real-time updates
    const carRef = doc(db, 'cars', carId);
    const unsubscribe = onSnapshot(
      carRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setRendering({
            status: 'idle',
            previewUrl: null,
            meshUrl: null,
            previewAngles: [],
            error: 'Car not found',
            loading: false,
          });
          return;
        }

        const car = snapshot.data();
        setRendering({
          status: car.renderJobStatus || 'idle',
          previewUrl: car.renderingPreviewUrl || null,
          meshUrl: car.renderMeshUrl || null,
          previewAngles: car.previewAngles || [],
          error: car.renderError || null,
          loading: false,
        });
      },
      (error) => {
        console.error('Error subscribing to car rendering:', error);
        setRendering(prev => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
      }
    );

    return () => unsubscribe();
  }, [carId]);

  return rendering;
};

/**
 * Get the best available car image
 * Priority: rendering preview > main photo > placeholder
 * 
 * @param {Object} car - Car document data
 * @returns {string | null} - Image URL or null
 */
export const getCarDisplayImage = (car) => {
  if (!car) return null;

  // Priority 1: 3D rendered preview (if reconstruction is complete)
  if (car.renderingPreviewUrl) {
    return car.renderingPreviewUrl;
  }

  // Priority 2: Main photo
  if (car.imageUrl) {
    return car.imageUrl;
  }

  // Priority 3: Any angle photo as fallback
  if (car.anglePhotos) {
    const angles = Object.values(car.anglePhotos);
    if (angles.length > 0 && angles[0]) {
      return angles[0];
    }
  }

  return null;
};

/**
 * Get render status display text
 * 
 * @param {string} status - Render job status
 * @returns {Object} - { text: string, color: string, icon: string }
 */
export const getRenderStatusDisplay = (status) => {
  switch (status) {
    case 'queued':
      return {
        text: 'Queued for 3D processing...',
        color: '#f59e0b', // orange
        icon: 'time-outline',
      };
    case 'processing':
      return {
        text: 'Generating 3D model...',
        color: '#4a9eff', // blue
        icon: 'construct-outline',
      };
    case 'complete':
      return {
        text: '3D Model Ready',
        color: '#22c55e', // green
        icon: 'checkmark-circle',
      };
    case 'failed':
      return {
        text: 'Reconstruction failed',
        color: '#ef4444', // red
        icon: 'alert-circle',
      };
    case 'idle':
    default:
      return {
        text: 'Not generated',
        color: '#666',
        icon: 'cube-outline',
      };
  }
};

/**
 * Check if a car is ready for 3D reconstruction
 * 
 * @param {Object} car - Car document data
 * @returns {Object} - { ready: boolean, missingAngles: string[] }
 */
export const isReadyForReconstruction = (car) => {
  if (!car) {
    return { ready: false, missingAngles: [] };
  }

  const requiredAngles = [
    'driver_front',
    'passenger_front',
    'driver_rear',
    'passenger_rear',
    'full_driver_side',
    'full_passenger_side',
    'front_center',
    'rear_center',
    'front_low',
    'rear_low'
  ];

  const anglePhotos = car.anglePhotos || {};
  const missingAngles = requiredAngles.filter(angle => !anglePhotos[angle]);

  return {
    ready: missingAngles.length === 0,
    missingAngles,
  };
};
