// src/shop/subscriptionLimits.js
// Subscription tier limits for The Shop feature

/**
 * Get tier limits for The Shop feature
 * @param {string} tier - 'free' | 'pro' | 'premium'
 * @returns {Object} Limits object
 */
export function getTierLimits(tier) {
  switch (tier) {
    case 'premium':
      return {
        maxBuilds: 3,
        maxActiveParts: 8,
      };
    case 'pro':
      return {
        maxBuilds: 3,
        maxActiveParts: 5,
      };
    case 'free':
    default:
      return {
        maxBuilds: 3,
        maxActiveParts: 2,
      };
  }
}

/**
 * Check if user can create another build
 * @param {number} currentBuildCount
 * @param {string} tier
 * @returns {boolean}
 */
export function canCreateBuild(currentBuildCount, tier) {
  const limits = getTierLimits(tier);
  return currentBuildCount < limits.maxBuilds;
}

/**
 * Check if user can add another active part
 * @param {number} currentActiveParts
 * @param {string} tier
 * @returns {boolean}
 */
export function canAddActivePart(currentActiveParts, tier) {
  const limits = getTierLimits(tier);
  return currentActiveParts < limits.maxActiveParts;
}

