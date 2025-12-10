// src/features/carScan/angleMapping.js
// Maps old shot IDs to new anglePhotos structure

/**
 * Maps old shot IDs to new anglePhotos keys
 */
export const mapShotIdToAngleKey = (shotId) => {
  const mapping = {
    'driver_front': 'driverSide45',
    'passenger_front': 'passengerSide45',
    'driver_rear': 'driverSide45', // Can use same key or differentiate
    'passenger_rear': 'passengerSide45',
    'full_driver_side': 'side',
    'full_passenger_side': 'side', // Both map to 'side'
    'front_center': 'front',
    'rear_center': 'rear',
    'front_low': 'lowFront',
    'rear_low': 'lowRear',
  };
  
  return mapping[shotId] || null;
};

/**
 * Maps shot IDs to specific angle keys (more precise mapping)
 */
export const mapShotToAnglePhotos = (shots) => {
  const anglePhotos = {
    front34: null,
    rear34: null,
    side: null,
    front: null,
    rear: null,
    roof: null,
    driverSide45: null,
    passengerSide45: null,
    lowFront: null,
    lowRear: null,
  };

  // Map shots to anglePhotos
  shots.forEach(shot => {
    const imageUrl = shot.imageUri; // Will be uploaded to Firebase Storage
    
    switch(shot.id) {
      case 'driver_front':
        anglePhotos.driverSide45 = imageUrl;
        anglePhotos.front34 = imageUrl; // Use as front34 if not set
        break;
      case 'passenger_front':
        anglePhotos.passengerSide45 = imageUrl;
        if (!anglePhotos.front34) anglePhotos.front34 = imageUrl;
        break;
      case 'driver_rear':
        if (!anglePhotos.driverSide45) anglePhotos.driverSide45 = imageUrl;
        if (!anglePhotos.rear34) anglePhotos.rear34 = imageUrl;
        break;
      case 'passenger_rear':
        if (!anglePhotos.passengerSide45) anglePhotos.passengerSide45 = imageUrl;
        if (!anglePhotos.rear34) anglePhotos.rear34 = imageUrl;
        break;
      case 'full_driver_side':
      case 'full_passenger_side':
        anglePhotos.side = imageUrl;
        break;
      case 'front_center':
        anglePhotos.front = imageUrl;
        if (!anglePhotos.front34) anglePhotos.front34 = imageUrl;
        break;
      case 'rear_center':
        anglePhotos.rear = imageUrl;
        if (!anglePhotos.rear34) anglePhotos.rear34 = imageUrl;
        break;
      case 'front_low':
        anglePhotos.lowFront = imageUrl;
        break;
      case 'rear_low':
        anglePhotos.lowRear = imageUrl;
        break;
    }
  });

  return anglePhotos;
};

