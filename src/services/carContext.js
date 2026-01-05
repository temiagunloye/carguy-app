// src/services/carContext.js

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Demo mode flag - set to true to skip Firebase entirely
const DEMO_MODE = false; // ✅ FALSE = Use real Firebase Auth (required for Storage uploads!)

const CarContext = createContext(null);

export function CarProvider({ children }) {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState("free");
  const [activeCar, setActiveCarState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [demoCars, setDemoCars] = useState([]);

  useEffect(() => {
    // In demo mode, create a guest user immediately without Firebase
    if (DEMO_MODE) {
      const guestUser = {
        uid: `demo_user_${Date.now()}`,
        email: "demo@carguyapp.com",
        displayName: "Demo User",
        isAnonymous: true,
      };
      setUser(guestUser);
      setIsGuest(true);
      setPlan("free");
      setLoading(false);
      return;
    }

    // If not in demo mode, try Firebase auth
    const initFirebase = async () => {
      try {
        const { onAuthStateChanged, signInAnonymously } = await import("firebase/auth");
        const { auth } = await import("./firebaseConfig");
        const { getActiveCar, setUserPlanIfMissing } = await import("./carService");

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (!fbUser) {
            try {
              await signInAnonymously(auth);
            } catch (error) {
              console.error("Auth error:", error);
              // Fallback to demo mode
              const guestUser = {
                uid: `guest_${Date.now()}`,
                email: null,
                displayName: "Guest User",
                isAnonymous: true,
              };
              setUser(guestUser);
              setIsGuest(true);
              setLoading(false);
            }
            return;
          }

          setLoading(true);
          setUser(fbUser);
          setIsGuest(fbUser.isAnonymous || false);

          try {
            const userData = await setUserPlanIfMissing(fbUser.uid);
            setPlan(userData.plan || "free");
            const car = await getActiveCar(fbUser.uid);
            setActiveCarState(car);
          } catch (error) {
            console.error("Error loading user data:", error);
          }

          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Firebase init error:", error);
        // Fallback to demo mode
        const guestUser = {
          uid: `guest_${Date.now()}`,
          email: null,
          displayName: "Guest User",
          isAnonymous: true,
        };
        setUser(guestUser);
        setIsGuest(true);
        setLoading(false);
      }
    };

    initFirebase();
  }, []);

  // Demo mode: Add car locally
  const addDemoCar = useCallback((carData) => {
    const newCar = {
      id: `car_${Date.now()}`,
      ...carData,
      createdAt: new Date().toISOString(),
      // Initialize with default build structure
      builds: carData.builds || [],
      activeBuildId: carData.activeBuildId || null,
      parts: carData.parts || [],
    };
    setDemoCars(prev => [...prev, newCar]);
    setActiveCarState(newCar);
    return newCar;
  }, []);

  const refreshActiveCar = useCallback(async () => {
    if (DEMO_MODE) {
      // In demo mode, active car is already in state
      return;
    }

    if (!user) return;
    setLoading(true);
    try {
      const { getActiveCar, getUserDoc } = await import("./carService");
      const car = await getActiveCar(user.uid);
      setActiveCarState(car);
      const userData = await getUserDoc(user.uid);
      if (userData && userData.plan) {
        setPlan(userData.plan);
      }
    } catch (error) {
      console.error("Error refreshing car:", error);
    }
    setLoading(false);
  }, [user]);

  // Sync activeCar changes to demoCars array in demo mode
  useEffect(() => {
    if (DEMO_MODE && activeCar) {
      setDemoCars(prev => {
        const existingIndex = prev.findIndex(c => c.id === activeCar.id);
        if (existingIndex >= 0) {
          // Update existing car
          const updated = [...prev];
          updated[existingIndex] = activeCar;
          return updated;
        } else {
          // Add new car (shouldn't happen, but handle it)
          return [...prev, activeCar];
        }
      });
    }
  }, [activeCar, DEMO_MODE]);

  return (
    <CarContext.Provider
      value={{
        user,
        plan,
        activeCar,
        loading,
        isGuest,
        demoCars,
        demoMode: DEMO_MODE,
        refreshActiveCar,
        addDemoCar,
        setActiveCarState,
      }}
    >
      {children}
    </CarContext.Provider>
  );
}

export function useCarContext() {
  return useContext(CarContext);
}
