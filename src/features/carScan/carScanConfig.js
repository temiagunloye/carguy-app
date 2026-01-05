// src/features/carScan/carScanConfig.js
// Configuration for the 10 mandatory car photo angles

/**
 * 3D RENDERING PIPELINE INTEGRATION
 * ==================================
 * 
 * This configuration defines the 10 mandatory photo angles required for photogrammetry-based
 * 3D car reconstruction. The angles are specifically chosen to provide comprehensive coverage
 * needed for neural radiance fields (NeRF) or structure-from-motion (SfM) algorithms.
 * 
 * ACCURACY OVER SPEED:
 * These 10 angles represent the minimum viable dataset for creating an accurate 3D model.
 * While fewer angles could work, 10 provides redundancy and better geometric coverage,
 * especially for capturing undercarriage details and complex body curves.
 * 
 * PIPELINE STAGES:
 * 1. Image Capture (this config) → 10 photos with metadata
 * 2. Preprocessing → Scale normalization, color correction, EXIF extraction
 * 3. Feature Detection → SIFT/ORB keypoints across all views
 * 4. Sparse Reconstruction → Camera pose estimation via SfM
 * 5. Dense Reconstruction → Multi-view stereo (MVS) or NeRF training
 * 6. Mesh Generation → Poisson surface reconstruction or marching cubes
 * 7. Texture Mapping → UV unwrapping with photo-realistic textures
 * 8. Optimization → Mesh simplification, material baking
 * 
 * METADATA REQUIREMENTS FOR 3D PIPELINE:
 * - image_uri: Full resolution image (minimum 1920x1080 recommended)
 * - angle_id: Maps to known 3D space coordinate system
 * - capture_timestamp: For temporal consistency checks
 * - device_orientation: Accelerometer data for initial pose estimation
 * - focal_length: Camera intrinsic parameters (from EXIF or defaults)
 * - gps_location: Optional - helps with scale estimation in outdoor captures
 * 
 * ANGLE SELECTION RATIONALE:
 * - 4 corners (45° angles): Capture 3D depth and body curves
 * - 2 full sides: Complete profile geometry, important for wheelbase
 * - 2 center views (front/rear): Symmetry validation, grille/tail details
 * - 2 low angles: Undercarriage, bumper details, ground clearance
 * 
 * FUTURE ENHANCEMENTS:
 * - Add roof/overhead angle for convertibles and roof racks
 * - Interior angles for cabin reconstruction
 * - Detail shots (wheels, badges) for high-res texture inpainting
 * 
 * DATA CONSUMPTION:
 * The 3D rendering service will consume this data as:
 * ```json
 * {
 *   "session_id": "uuid",
 *   "car_metadata": { "year": "2023", "make": "BMW", "model": "M4" },
 *   "shots": [
 *     {
 *       "angle_id": "driver_front",
 *       "image_url": "https://...",
 *       "camera_height": 1.5,
 *       "camera_distance": 4.5,
 *       "timestamp": "2024-01-01T12:00:00Z"
 *     },
 *     ...
 *   ]
 * }
 * ```
 */

/**
 * @typedef {Object} ShotConfig
 * @property {string} id - Internal ID (maps to 3D coordinate system anchor points)
 * @property {string} label - Short label for code
 * @property {string} title - User-facing title
 * @property {string} description - Instruction text
 * @property {string} distanceHint - Distance guidance (critical for scale consistency)
 * @property {string} heightHint - Phone height guidance (camera elevation)
 * @property {string} angleHint - Angle/side guidance (azimuth/elevation hints)
 * @property {'front' | 'rear' | 'side'} type - Shot type (categorizes viewing direction)
 * @property {'driver' | 'passenger' | 'center'} position - Position relative to car
 * @property {boolean} isLowAngle - Whether this is a low bumper-level shot (for undercarriage)
 */

/**
 * The 10 mandatory car scan angles in capture order
 * Ordered for ergonomic user flow: front corners → rear corners → sides → center → low angles
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


