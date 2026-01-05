// src/services/plans.js
// Plan configuration and limit helpers

/**
 * PLAN TIERS:
 * 
 * FREE:
 * - 1 car maximum
 * - 1 build per car
 * - 10-angle scan allowed (for future 3D)
 * - No 3D rendering preview
 * - Basic parts tracking
 * 
 * PRO:
 * - 1 car maximum (must match user's real car)
 * - 1 build per car (the actual car setup)
 * - 10-angle scan + 3D rendering preview
 * - Enhanced part visualization
 * - Real car verification (VIN/photo match)
 * 
 * PREMIUM:
 * - 10 cars maximum
 * - Unlimited builds per car
 * - Full 3D rendering for all cars
 * - Multiple "what-if" builds per car
 * - Advanced features unlocked
 */

export const getPlanConfig = (plan) => {
  switch (plan) {
    case 'free':
      return {
        maxCars: 1,
        hasRendering: false,
        maxBuildsPerCar: 1,
        requiresRealCarMatch: false,
        displayName: 'Free',
      };
    case 'pro':
      return {
        maxCars: 1,
        hasRendering: true,
        maxBuildsPerCar: 1,
        requiresRealCarMatch: true, // Pro users track their actual car only
        displayName: 'Pro',
      };
    case 'premium':
      return {
        maxCars: 10,
        hasRendering: true,
        maxBuildsPerCar: Infinity,
        requiresRealCarMatch: false,
        displayName: 'Premium',
      };
    default:
      return {
        maxCars: 1,
        hasRendering: false,
        maxBuildsPerCar: 1,
        requiresRealCarMatch: false,
        displayName: 'Free',
      };
  }
};

export const canAddCar = (plan, currentCarCount) => {
  const { maxCars } = getPlanConfig(plan);
  return currentCarCount < maxCars;
};

export const canAddBuild = (plan, currentBuildCountForCar) => {
  const { maxBuildsPerCar } = getPlanConfig(plan);
  return currentBuildCountForCar < maxBuildsPerCar;
};

export const canUseRendering = (plan) => {
  const { hasRendering } = getPlanConfig(plan);
  return hasRendering;
};

export const getPlanLimitMessage = (plan, feature) => {
  const config = getPlanConfig(plan);

  if (feature === 'car') {
    return `Your ${config.displayName} plan allows ${config.maxCars} car${config.maxCars === 1 ? '' : 's'}. Upgrade to add more vehicles.`;
  }

  if (feature === 'build') {
    if (config.maxBuildsPerCar === Infinity) {
      return 'You can create unlimited builds with your Premium plan.';
    }
    return `Your ${config.displayName} plan allows ${config.maxBuildsPerCar} build${config.maxBuildsPerCar === 1 ? '' : 's'} per car. Upgrade for multiple build configurations.`;
  }

  if (feature === 'rendering') {
    return `3D rendering is available on Pro and Premium plans. Upgrade to generate photorealistic previews of your car.`;
  }

  return `This feature requires a plan upgrade.`;
};

