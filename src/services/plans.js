// src/services/plans.js
// Plan configuration and limit helpers

export const getPlanConfig = (plan) => {
  switch (plan) {
    case 'free':
      return { maxCars: 1, hasRendering: false };
    case 'pro':
      return { maxCars: 1, hasRendering: true };
    case 'premium':
      return { maxCars: 10, hasRendering: true }; // configurable upper bound
    default:
      return { maxCars: 1, hasRendering: false };
  }
};

export const canAddCar = (plan, currentCarCount) => {
  const { maxCars } = getPlanConfig(plan);
  return currentCarCount < maxCars;
};

export const canUseRendering = (plan) => {
  const { hasRendering } = getPlanConfig(plan);
  return hasRendering;
};

