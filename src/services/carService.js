// src/services/carService.js

// Demo mode flag - matches carContext
const DEMO_MODE = true;

// Lazy Firebase imports - only load when actually needed (not in demo mode)
  
  /**
   * USER DOCUMENT:
   * /users/{uid} {
   *   plan: "free" | "pro" | "premium",
   *   activeCarId: string | null,
   *   createdAt,
   *   updatedAt
   * }
   *
   * CAR DOCUMENT:
   * /users/{uid}/cars/{carId} {
   *   nickname,
   *   year,
   *   make,
   *   model,
   *   trim,
   *   drivetrain,
   *   mileage,
   *   paintColor,
   *   dealerImageUrl,
   *   imageUrl, // original hero photo
   *   renderingPreviewUrl, // dealer-style render image
   *   renderMeshUrl, // future: 3D model file
   *   renderJobStatus: 'idle' | 'queued' | 'processing' | 'complete' | 'error',
   *   renderLastUpdatedAt: Timestamp | null,
   *   anglePhotos: {
   *     front34: string | null,
   *     rear34: string | null,
   *     side: string | null,
   *     front: string | null,
   *     rear: string | null,
   *     roof: string | null,
   *     driverSide45: string | null,
   *     passengerSide45: string | null,
   *     lowFront: string | null,
   *     lowRear: string | null,
   *   },
   *   createdAt,
   *   updatedAt
   * }
   */
  
  export async function getUserDoc(uid) {
    if (DEMO_MODE) return null;
    
    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("./firebaseConfig");
    if (!db) return null;
    
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  }
  
  export async function setUserPlanIfMissing(uid, defaultPlan = "free") {
    if (DEMO_MODE) return { plan: defaultPlan };
    
    const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = await import("firebase/firestore");
    const { db } = await import("./firebaseConfig");
    if (!db) return { plan: defaultPlan };
    
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
  
    if (!snap.exists()) {
      const data = {
        plan: defaultPlan,
        activeCarId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, data);
      return data;
    }
  
    const data = snap.data();
    if (!data.plan) {
      await updateDoc(userRef, { plan: defaultPlan, updatedAt: serverTimestamp() });
      return { ...data, plan: defaultPlan };
    }
  
    return data;
  }
  
  export function canUserHaveMultipleCars(plan) {
    return plan === "premium";
  }
  
  export function canUserUseCustomImage(plan) {
    return plan === "pro" || plan === "premium";
  }
  
  export async function getCarCount(uid) {
    if (DEMO_MODE) return 0;
    
    const { collection, query, getDocs } = await import("firebase/firestore");
    const { db } = await import("./firebaseConfig");
    if (!db) return 0;
    
    const carsRef = collection(db, "users", uid, "cars");
    const q = query(carsRef);
    const snap = await getDocs(q);
    return snap.size;
  }
  
  export async function getAllCarsForUser(uid) {
    if (DEMO_MODE) return [];
    
    const { collection, query, getDocs } = await import("firebase/firestore");
    const { db } = await import("./firebaseConfig");
    if (!db) return [];
    
    const carsRef = collection(db, "users", uid, "cars");
    const q = query(carsRef);
    const snap = await getDocs(q);
  
    const cars = [];
    snap.forEach((docSnap) => {
      cars.push({ id: docSnap.id, ...docSnap.data() });
    });
    return cars;
  }
  
  // Initialize default anglePhotos structure
  const getDefaultAnglePhotos = () => ({
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
  });

  export async function saveCarForUser({ uid, carId = null, data }) {
    if (DEMO_MODE) return `car_${Date.now()}`;
    
    const { collection, doc, addDoc, updateDoc, serverTimestamp } = await import("firebase/firestore");
    const { db } = await import("./firebaseConfig");
    if (!db) return `car_${Date.now()}`;
    
    const carsRef = collection(db, "users", uid, "cars");
  
    const carData = {
      nickname: data.nickname || "",
      year: data.year || "",
      make: data.make || "",
      model: data.model || "",
      trim: data.trim || "",
      drivetrain: data.drivetrain || "",
      mileage: data.mileage || "",
      paintColor: data.paintColor || "",
      dealerImageUrl: data.dealerImageUrl || null,
      imageUrl: data.imageUrl || null, // original hero photo
      renderingPreviewUrl: data.renderingPreviewUrl || null,
      renderMeshUrl: data.renderMeshUrl || null,
      renderJobStatus: data.renderJobStatus || 'idle',
      renderLastUpdatedAt: data.renderLastUpdatedAt || null,
      anglePhotos: data.anglePhotos || getDefaultAnglePhotos(),
      updatedAt: serverTimestamp(),
    };
  
    let newId = carId;
  
    if (!carId) {
      carData.createdAt = serverTimestamp();
      const docRef = await addDoc(carsRef, carData);
      newId = docRef.id;
    } else {
      const carRef = doc(db, "users", uid, "cars", carId);
      await updateDoc(carRef, carData);
    }
  
    return newId;
  }

  export async function updateCarAngles(uid, carId, anglePhotos) {
    if (DEMO_MODE) return;
    
    const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
    const { db } = await import("./firebaseConfig");
    if (!db) return;
    
    const carRef = doc(db, "users", uid, "cars", carId);
    await updateDoc(carRef, {
      anglePhotos,
      updatedAt: serverTimestamp(),
    });
  }

  export async function updateCarRendering(uid, carId, renderingData) {
    if (DEMO_MODE) return;
    
    const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
    const { db } = await import("./firebaseConfig");
    if (!db) return;
    
    const carRef = doc(db, "users", uid, "cars", carId);
    await updateDoc(carRef, {
      ...renderingData,
      updatedAt: serverTimestamp(),
    });
  }
  
  export async function uploadCarImage(uid, carId, uri) {
    if (DEMO_MODE || !uri) return uri; // Return local URI in demo mode
    
    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
    const { storage } = await import("./firebaseConfig");
    if (!storage) return uri;
  
    const response = await fetch(uri);
    const blob = await response.blob();
  
    const storageRef = ref(storage, `users/${uid}/cars/${carId || "temp"}/${Date.now()}.jpg`);
  
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  }
  
  export async function setActiveCar(uid, carId) {
    if (DEMO_MODE) return;
    
    const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
    const { db } = await import("./firebaseConfig");
    if (!db) return;
    
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      activeCarId: carId,
      updatedAt: serverTimestamp(),
    });
  }
  
  export async function getActiveCar(uid) {
    if (DEMO_MODE) return null;
    
    const user = await getUserDoc(uid);
    if (!user || !user.activeCarId) return null;
  
    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("./firebaseConfig");
    if (!db) return null;
  
    const carRef = doc(db, "users", uid, "cars", user.activeCarId);
    const snap = await getDoc(carRef);
    if (!snap.exists()) return null;
  
    return { id: snap.id, ...snap.data() };
  }
  