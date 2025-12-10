// src/features/carScan/carScanConfig.js
// Configuration for the 10 mandatory car photo angles

/**
 * @typedef {Object} ShotConfig
 * @property {string} id - Internal ID
 * @property {string} label - Short label for code
 * @property {string} title - User-facing title
 * @property {string} description - Instruction text
 * @property {string} distanceHint - Distance guidance
 * @property {string} heightHint - Phone height guidance
 * @property {string} angleHint - Angle/side guidance
 * @property {'front' | 'rear' | 'side'} type - Shot type
 * @property {'driver' | 'passenger' | 'center'} position - Position relative to car
 * @property {boolean} isLowAngle - Whether this is a low bumper-level shot
 */

/**
 * The 10 mandatory car scan angles in capture order
 * @type {ShotConfig[]}
 */
export const CAR_SCAN_SHOTS = [
  {
    id: 'driver_front',
    label: 'Driver Front',
    title: 'Driver Front (Eye-Level)',
    description: 'Stand at the driver front corner, at eye level, angled toward the front of the car.',
    distanceHint: 'About 10–15 feet away.',
    heightHint: 'Hold your phone at eye level.',
    angleHint: 'Aim at the front of the car from the driver side at a 45° angle.',
    type: 'front',
    position: 'driver',
    isLowAngle: false,
  },
  {
    id: 'passenger_front',
    label: 'Passenger Front',
    title: 'Passenger Front (Eye-Level)',
    description: 'Stand at the passenger front corner, at eye level, angled toward the front of the car.',
    distanceHint: 'About 10–15 feet away.',
    heightHint: 'Hold your phone at eye level.',
    angleHint: 'Aim at the front of the car from the passenger side at a 45° angle.',
    type: 'front',
    position: 'passenger',
    isLowAngle: false,
  },
  {
    id: 'driver_rear',
    label: 'Driver Rear',
    title: 'Driver Rear (Eye-Level)',
    description: 'Stand at the driver rear corner, at eye level, angled toward the back of the car.',
    distanceHint: 'About 10–15 feet away.',
    heightHint: 'Hold your phone at eye level.',
    angleHint: 'Aim at the rear of the car from the driver side at a 45° angle.',
    type: 'rear',
    position: 'driver',
    isLowAngle: false,
  },
  {
    id: 'passenger_rear',
    label: 'Passenger Rear',
    title: 'Passenger Rear (Eye-Level)',
    description: 'Stand at the passenger rear corner, at eye level, angled toward the back of the car.',
    distanceHint: 'About 10–15 feet away.',
    heightHint: 'Hold your phone at eye level.',
    angleHint: 'Aim at the rear of the car from the passenger side at a 45° angle.',
    type: 'rear',
    position: 'passenger',
    isLowAngle: false,
  },
  {
    id: 'full_driver_side',
    label: 'Full Driver Side',
    title: 'Full Driver Side',
    description: 'Move back until the entire driver side of the car fits in the frame.',
    distanceHint: 'About 15–20 feet, enough to see the whole side.',
    heightHint: 'Hold your phone at eye level.',
    angleHint: 'Stand directly beside the driver side of the car.',
    type: 'side',
    position: 'driver',
    isLowAngle: false,
  },
  {
    id: 'full_passenger_side',
    label: 'Full Passenger Side',
    title: 'Full Passenger Side',
    description: 'Move back until the entire passenger side of the car fits in the frame.',
    distanceHint: 'About 15–20 feet, enough to see the whole side.',
    heightHint: 'Hold your phone at eye level.',
    angleHint: 'Stand directly beside the passenger side of the car.',
    type: 'side',
    position: 'passenger',
    isLowAngle: false,
  },
  {
    id: 'front_center',
    label: 'Front Center',
    title: 'Front Center (Eye-Level)',
    description: 'Stand in front of the car, centered, and hold your phone at eye level.',
    distanceHint: 'About 10–12 feet away.',
    heightHint: 'Hold your phone at eye level.',
    angleHint: 'Aim straight at the front of the car.',
    type: 'front',
    position: 'center',
    isLowAngle: false,
  },
  {
    id: 'rear_center',
    label: 'Rear Center',
    title: 'Rear Center (Eye-Level)',
    description: 'Stand behind the car, centered, and hold your phone at eye level.',
    distanceHint: 'About 10–12 feet away.',
    heightHint: 'Hold your phone at eye level.',
    angleHint: 'Aim straight at the rear of the car.',
    type: 'rear',
    position: 'center',
    isLowAngle: false,
  },
  {
    id: 'front_low',
    label: 'Front Low',
    title: 'Front Low (Bumper Level)',
    description: 'Lower your phone toward bumper height and aim at the front of the car.',
    distanceHint: 'About 6–10 feet away.',
    heightHint: 'Hold your phone around bumper or knee height.',
    angleHint: 'Aim slightly upward at the front bumper and lower grille.',
    type: 'front',
    position: 'center',
    isLowAngle: true,
  },
  {
    id: 'rear_low',
    label: 'Rear Low',
    title: 'Rear Low (Bumper Level)',
    description: 'Lower your phone toward bumper height and aim at the rear of the car.',
    distanceHint: 'About 6–10 feet away.',
    heightHint: 'Hold your phone around bumper or knee height.',
    angleHint: 'Aim slightly upward at the rear bumper and diffuser area.',
    type: 'rear',
    position: 'center',
    isLowAngle: true,
  },
];

/**
 * Get shot config by ID
 * @param {string} shotId
 * @returns {ShotConfig | undefined}
 */
export function getShotConfig(shotId) {
  return CAR_SCAN_SHOTS.find(shot => shot.id === shotId);
}

/**
 * Get all shot IDs
 * @returns {string[]}
 */
export function getAllShotIds() {
  return CAR_SCAN_SHOTS.map(shot => shot.id);
}

