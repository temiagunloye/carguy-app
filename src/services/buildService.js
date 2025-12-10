// src/services/buildService.js
// Build management service - handles builds, folders, and inventory organization

// Demo mode flag - matches carContext
const DEMO_MODE = true;

/**
 * Create a new build for a vehicle
 * @param {string} userId
 * @param {string} vehicleId
 * @param {string} name - Build name (defaults to vehicle nickname or "Main build")
 * @returns {Promise<string>} Build ID
 */
export async function createBuild(userId, vehicleId, name = null) {
  if (DEMO_MODE) return `build_${Date.now()}`;
  
  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
  const { db } = await import("./firebaseConfig");
  if (!db) return `build_${Date.now()}`;
  
  const buildsRef = collection(db, "users", userId, "builds");
  
  const buildData = {
    vehicleId,
    name: name || "Main build",
    isActive: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(buildsRef, buildData);
  return docRef.id;
}

/**
 * Get all builds for a vehicle
 * @param {string} userId
 * @param {string} vehicleId
 * @returns {Promise<Array>}
 */
export async function getBuildsForVehicle(userId, vehicleId) {
  if (DEMO_MODE) return [];
  
  const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore");
  const { db } = await import("./firebaseConfig");
  if (!db) return [];
  
  const buildsRef = collection(db, "users", userId, "builds");
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
 * Get active build for a vehicle
 * @param {string} userId
 * @param {string} vehicleId
 * @returns {Promise<Object|null>}
 */
export async function getActiveBuild(userId, vehicleId) {
  const builds = await getBuildsForVehicle(userId, vehicleId);
  return builds.find(b => b.isActive) || builds[0] || null;
}

/**
 * Set a build as active
 * @param {string} userId
 * @param {string} buildId
 * @returns {Promise<void>}
 */
export async function setActiveBuild(userId, buildId) {
  if (DEMO_MODE) return;
  
  const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
  const { db } = await import("./firebaseConfig");
  if (!db) return;
  
  const buildRef = doc(db, "users", userId, "builds", buildId);
  await updateDoc(buildRef, {
    isActive: true,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Create an inventory folder for a build
 * @param {string} userId
 * @param {string} buildId
 * @param {string} name - Folder name (e.g., "Engine parts", "Exhaust")
 * @returns {Promise<string>} Folder ID
 */
export async function createInventoryFolder(userId, buildId, name) {
  if (DEMO_MODE) return `folder_${Date.now()}`;
  
  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
  const { db } = await import("./firebaseConfig");
  if (!db) return `folder_${Date.now()}`;
  
  const foldersRef = collection(db, "users", userId, "builds", buildId, "folders");
  
  const folderData = {
    name: name.trim(),
    sortOrder: 0,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(foldersRef, folderData);
  return docRef.id;
}

/**
 * Get all folders for a build
 * @param {string} userId
 * @param {string} buildId
 * @returns {Promise<Array>}
 */
export async function getFoldersForBuild(userId, buildId) {
  if (DEMO_MODE) return [];
  
  const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
  const { db } = await import("./firebaseConfig");
  if (!db) return [];
  
  const foldersRef = collection(db, "users", userId, "builds", buildId, "folders");
  const q = query(foldersRef, orderBy("sortOrder"));
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get or create folder by name (helper)
 * @param {string} userId
 * @param {string} buildId
 * @param {string} folderName
 * @returns {Promise<string>} Folder ID
 */
export async function getOrCreateFolder(userId, buildId, folderName) {
  const folders = await getFoldersForBuild(userId, buildId);
  const existing = folders.find(f => f.name.toLowerCase() === folderName.toLowerCase());
  
  if (existing) {
    return existing.id;
  }
  
  return await createInventoryFolder(userId, buildId, folderName);
}

/**
 * Map category to default folder name
 * @param {string} category
 * @returns {string} Folder name
 */
export function categoryToFolderName(category) {
  const mapping = {
    "wheels": "Wheels & Tires",
    "wheels & tires": "Wheels & Tires",
    "suspension": "Suspension",
    "exhaust": "Exhaust",
    "engine": "Engine Parts",
    "exterior": "Body & Aero",
    "interior": "Interior",
    "performance": "Performance",
    "electronics": "Electronics",
    "maintenance": "Maintenance",
    "other": "Other",
  };
  
  return mapping[category?.toLowerCase()] || "Other";
}

