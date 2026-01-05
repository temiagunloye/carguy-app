// src/shop/placementUtils.js
// Dimension-aware placement utilities for parts on cars

/**
 * Compute normalized scale and default anchor based on vehicle & part dimensions.
 * This is groundwork for both 2D overlay & future 3D mesh placement.
 * 
 * @param {Object} vehicle - Vehicle object with dimensions
 * @param {Object} part - Part object with dimensions
 * @returns {Object} Default placement configuration
 */
export function getDefaultPlacementForPart(vehicle, part) {
  // Default vehicle dimensions (in mm) - fallback to mid-size sedan
  const vLength = vehicle.lengthMm || 4500;
  const vWidth = vehicle.widthMm || 1800;
  const vHeight = vehicle.heightMm || 1400;

  // Part dimensions (in mm)
  const pLength = part.lengthMm || 0;
  const pWidth = part.widthMm || 0;
  const pHeight = part.heightMm || 0;
  const pDiameter = part.diameterMm || 0; // For wheels

  // Determine anchor point based on part category
  let anchor = 'front_bumper';

  switch (part.category) {
    case 'wheels':
    case 'wheels & tires':
      anchor = 'wheel_front_left';
      break;
    case 'front_lip':
    case 'front_bumper':
    case 'splitter':
      anchor = 'front_bumper';
      break;
    case 'rear_spoiler':
    case 'wing':
      anchor = 'rear_trunk';
      break;
    case 'side_skirt':
    case 'side':
      anchor = 'side_left';
      break;
    case 'suspension':
    case 'coilovers':
      anchor = 'wheel_front_left';
      break;
    case 'exhaust':
    case 'catback':
      anchor = 'rear_bumper';
      break;
    case 'diffuser':
      anchor = 'rear_bumper';
      break;
    default:
      anchor = 'front_bumper';
  }

  // Calculate scale based on part-to-vehicle ratio
  // Use the largest dimension ratio to ensure part fits
  let lengthRatio = 0.2; // Default fallback
  let widthRatio = 0.2;
  let heightRatio = 0.2;

  if (pLength && vLength) {
    lengthRatio = Math.min(pLength / vLength, 0.5); // Cap at 50% of vehicle length
  }
  if (pWidth && vWidth) {
    widthRatio = Math.min(pWidth / vWidth, 0.8); // Cap at 80% of vehicle width
  }
  if (pHeight && vHeight) {
    heightRatio = Math.min(pHeight / vHeight, 0.3); // Cap at 30% of vehicle height
  }

  // For wheels, use diameter vs wheel well size (approx 600-700mm)
  if (part.category === 'wheels' && pDiameter) {
    const wheelWellSize = 650; // Average wheel well diameter
    lengthRatio = pDiameter / wheelWellSize;
    widthRatio = lengthRatio; // Wheels are circular
  }

  // Use the maximum ratio to ensure visibility, but keep it reasonable
  const approxScale = Math.max(lengthRatio, widthRatio, heightRatio, 0.1); // Minimum 10% scale

  // Normalized position defaults by anchor point
  // Coordinate system: X = left/right (-1 to 1), Y = front/rear (-1 to 1), Z = up/down (for 3D future)
  const posDefaultsByAnchor = {
    front_bumper: { posX: 0, posY: -0.4, posZ: 0.05 },
    rear_bumper: { posX: 0, posY: 0.4, posZ: 0.05 },
    rear_trunk: { posX: 0, posY: 0.35, posZ: 0.15 },
    side_left: { posX: -0.5, posY: 0, posZ: 0 },
    side_right: { posX: 0.5, posY: 0, posZ: 0 },
    wheel_front_left: { posX: -0.5, posY: -0.15, posZ: 0 },
    wheel_front_right: { posX: 0.5, posY: -0.15, posZ: 0 },
    wheel_rear_left: { posX: -0.5, posY: 0.15, posZ: 0 },
    wheel_rear_right: { posX: 0.5, posY: 0.15, posZ: 0 },
  };

  const defaultPos = posDefaultsByAnchor[anchor] || { posX: 0, posY: 0, posZ: 0 };

  return {
    anchor,
    posX: defaultPos.posX,
    posY: defaultPos.posY,
    posZ: defaultPos.posZ,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    scale: Math.min(approxScale, 0.8), // Cap scale at 80% to prevent oversized parts
    active: true,
  };
}

/**
 * Validate if adding another active part is allowed under tier limits
 * @param {Array} currentPlacements - Current part placements
 * @param {Object} tierLimits - Tier limits object with maxActiveParts
 * @returns {boolean}
 */
export function isWithinActivePartLimit(currentPlacements, tierLimits) {
  const activeCount = currentPlacements.filter((p) => p.active).length;
  return activeCount < tierLimits.maxActiveParts;
}

/**
 * Calculate pixel scale for 2D overlay based on vehicle and part dimensions
 * @param {Object} vehicle - Vehicle object
 * @param {Object} part - Part object
 * @param {number} imageWidth - Width of car image in pixels
 * @param {number} imageHeight - Height of car image in pixels
 * @returns {Object} Scale and position in pixels
 */
export function calculate2DOverlayScale(vehicle, part, imageWidth, imageHeight) {
  const placement = getDefaultPlacementForPart(vehicle, part);
  
  // Assume car image represents the vehicle at its actual dimensions
  const vLength = vehicle.lengthMm || 4500;
  const vWidth = vehicle.widthMm || 1800;
  
  // Calculate pixels per mm
  const pixelsPerMmLength = imageWidth / vLength;
  const pixelsPerMmWidth = imageHeight / vWidth;
  const pixelsPerMm = Math.min(pixelsPerMmLength, pixelsPerMmWidth);
  
  // Calculate part size in pixels
  const partLengthMm = part.lengthMm || 0;
  const partWidthMm = part.widthMm || 0;
  const partHeightMm = part.heightMm || 0;
  
  const partWidthPx = partWidthMm * pixelsPerMm * placement.scale;
  const partHeightPx = Math.max(partHeightMm, partLengthMm) * pixelsPerMm * placement.scale;
  
  // Calculate position in pixels (normalized to image dimensions)
  const posXPx = (placement.posX + 1) / 2 * imageWidth; // Convert -1..1 to 0..width
  const posYPx = (placement.posY + 1) / 2 * imageHeight; // Convert -1..1 to 0..height
  
  return {
    width: partWidthPx,
    height: partHeightPx,
    x: posXPx - partWidthPx / 2, // Center the part
    y: posYPx - partHeightPx / 2,
    scale: placement.scale,
    anchor: placement.anchor,
  };
}

/**
 * Validate part dimensions against vehicle for warnings
 * @param {Object} vehicle - Vehicle object
 * @param {Object} part - Part object
 * @returns {Object} Validation result with warnings
 */
export function validatePartDimensions(vehicle, part) {
  const warnings = [];
  
  const vLength = vehicle.lengthMm || 4500;
  const vWidth = vehicle.widthMm || 1800;
  const vHeight = vehicle.heightMm || 1400;
  
  const pLength = part.lengthMm || 0;
  const pWidth = part.widthMm || 0;
  const pHeight = part.heightMm || 0;
  
  // Check if part seems too large
  if (pLength > vLength * 0.8) {
    warnings.push('Part length is very large relative to vehicle');
  }
  if (pWidth > vWidth * 0.9) {
    warnings.push('Part width is very large relative to vehicle');
  }
  if (pHeight > vHeight * 0.5) {
    warnings.push('Part height is very large relative to vehicle');
  }
  
  // Check if part seems too small
  if (pLength > 0 && pLength < 50) {
    warnings.push('Part length seems unusually small');
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
  };
}


