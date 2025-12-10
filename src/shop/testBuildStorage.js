// src/shop/testBuildStorage.js
// Storage utilities for test builds (product tester)

// Demo mode flag
const DEMO_MODE = true;

/**
 * @typedef {Object} PartPlacement
 * @property {string} partId
 * @property {string} anchor - 'front_bumper' | 'rear_bumper' | 'side_left' | etc.
 * @property {number} posX - Normalized -1..1
 * @property {number} posY - Normalized -1..1
 * @property {number} posZ - For 3D future
 * @property {number} rotX
 * @property {number} rotY
 * @property {number} rotZ
 * @property {number} scale - 1 = true scale from dimensions
 * @property {boolean} active
 */

/**
 * @typedef {Object} TestFitBuild
 * @property {string} id
 * @property {string} ownerId
 * @property {string} vehicleId
 * @property {string} name
 * @property {boolean} isCurrent
 * @property {PartPlacement[]} placements
 * @property {string[]} viewSnapshots - URLs to rendered previews
 * @property {number} createdAt
 * @property {number} updatedAt
 */

/**
 * Create a new test build
 * @param {string} userId
 * @param {string} vehicleId
 * @param {string} name
 * @returns {Promise<string>} Build ID
 */
export async function createTestBuild(userId, vehicleId, name = null) {
  if (DEMO_MODE) return `testbuild_${Date.now()}`;
  
  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
  const { db } = await import("../services/firebaseConfig");
  if (!db) return `testbuild_${Date.now()}`;
  
  const buildsRef = collection(db, "users", userId, "testFits");
  
  const buildData = {
    ownerId: userId,
    vehicleId,
    name: name || `Build ${Date.now()}`,
    isCurrent: false,
    placements: [],
    viewSnapshots: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(buildsRef, buildData);
  return docRef.id;
}

/**
 * Get all test builds for a vehicle
 * @param {string} userId
 * @param {string} vehicleId
 * @returns {Promise<TestFitBuild[]>}
 */
export async function getTestBuilds(userId, vehicleId) {
  if (DEMO_MODE) return [];
  
  const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore");
  const { db } = await import("../services/firebaseConfig");
  if (!db) return [];
  
  const buildsRef = collection(db, "users", userId, "testFits");
  const q = query(
    buildsRef,
    where("vehicleId", "==", vehicleId),
    orderBy("createdAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get current test build for a vehicle
 * @param {string} userId
 * @param {string} vehicleId
 * @returns {Promise<TestFitBuild | null>}
 */
export async function getCurrentTestBuild(userId, vehicleId) {
  const builds = await getTestBuilds(userId, vehicleId);
  return builds.find(b => b.isCurrent) || builds[0] || null;
}

/**
 * Update test build
 * @param {string} userId
 * @param {string} buildId
 * @param {Partial<TestFitBuild>} updates
 * @returns {Promise<void>}
 */
export async function updateTestBuild(userId, buildId, updates) {
  if (DEMO_MODE) return;
  
  const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
  const { db } = await import("../services/firebaseConfig");
  if (!db) return;
  
  const buildRef = doc(db, "users", userId, "testFits", buildId);
  await updateDoc(buildRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Set a build as current (and unset others)
 * @param {string} userId
 * @param {string} vehicleId
 * @param {string} buildId
 * @returns {Promise<void>}
 */
export async function setCurrentTestBuild(userId, vehicleId, buildId) {
  if (DEMO_MODE) return;
  
  // Get all builds for this vehicle
  const builds = await getTestBuilds(userId, vehicleId);
  
  const { doc, updateDoc } = await import("firebase/firestore");
  const { db } = await import("../services/firebaseConfig");
  if (!db) return;
  
  // Update all builds: set isCurrent based on buildId
  const updates = builds.map(build => 
    updateDoc(
      doc(db, "users", userId, "testFits", build.id),
      { isCurrent: build.id === buildId }
    )
  );
  
  await Promise.all(updates);
}

/**
 * Delete a test build
 * @param {string} userId
 * @param {string} buildId
 * @returns {Promise<void>}
 */
export async function deleteTestBuild(userId, buildId) {
  if (DEMO_MODE) return;
  
  const { doc, deleteDoc } = await import("firebase/firestore");
  const { db } = await import("../services/firebaseConfig");
  if (!db) return;
  
  const buildRef = doc(db, "users", userId, "testFits", buildId);
  await deleteDoc(buildRef);
}

/**
 * Add or update a part placement in a build
 * @param {string} userId
 * @param {string} buildId
 * @param {PartPlacement} placement
 * @returns {Promise<void>}
 */
export async function updatePartPlacement(userId, buildId, placement) {
  const build = await getTestBuilds(userId, null).then(builds => 
    builds.find(b => b.id === buildId)
  );
  
  if (!build) throw new Error("Build not found");
  
  const placements = build.placements || [];
  const existingIndex = placements.findIndex(p => p.partId === placement.partId);
  
  if (existingIndex >= 0) {
    placements[existingIndex] = placement;
  } else {
    placements.push(placement);
  }
  
  await updateTestBuild(userId, buildId, { placements });
}

