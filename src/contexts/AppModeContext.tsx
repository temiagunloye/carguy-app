// src/contexts/AppModeContext.tsx
// Demo/Live mode management for app-wide feature gating

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type AppMode = 'live' | 'demo';

interface AppModeContextType {
    mode: AppMode;
    isDemoSession: boolean;
    setMode: (mode: AppMode) => void;
    toggleMode: () => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

const APP_MODE_KEY = '@app_mode';

interface Props {
    children: ReactNode;
}

export function AppModeProvider({ children }: Props) {
    const [mode, setModeState] = useState<AppMode>('live');
    const [isLoading, setIsLoading] = useState(true);

    // Load persisted mode on mount
    useEffect(() => {
        loadMode();
    }, []);

    const loadMode = async () => {
        try {
            const stored = await AsyncStorage.getItem(APP_MODE_KEY);
            if (stored === 'demo' || stored === 'live') {
                setModeState(stored);
            }
        } catch (error) {
            console.warn('Failed to load app mode:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setMode = async (newMode: AppMode) => {
        try {
            await AsyncStorage.setItem(APP_MODE_KEY, newMode);
            setModeState(newMode);
        } catch (error) {
            console.error('Failed to save app mode:', error);
        }
    };

    const toggleMode = () => {
        const newMode = mode === 'live' ? 'demo' : 'live';
        setMode(newMode);
    };

    const value: AppModeContextType = {
        mode,
        isDemoSession: mode === 'demo',
        setMode,
        toggleMode,
    };

    if (isLoading) {
        return null; // Or loading spinner
    }

    return (
        <AppModeContext.Provider value={value}>
            {children}
        </AppModeContext.Provider>
    );
}

export function useAppMode(): AppModeContextType {
    const context = useContext(AppModeContext);
    if (!context) {
        throw new Error('useAppMode must be used within AppModeProvider');
    }
    return context;
}
