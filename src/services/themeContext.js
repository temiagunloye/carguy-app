// src/services/themeContext.js

import React, { createContext, useContext, useState, useCallback } from "react";

// Professional automotive theme matching product photos
export const themes = {
  dark: {
    name: "dark",
    background: "#000000", // Pure black
    surface: "#0a0a0a", // Slightly lighter for cards
    surfaceLight: "#111111", // For elevated surfaces
    primary: "#22c55e", // Green accent for active states (matching photos)
    primaryDark: "#16a34a",
    text: "#ffffff", // Pure white
    textSecondary: "#a0a0a0", // Light gray for secondary text
    textMuted: "#666666", // Muted gray
    border: "#1a1a1a", // Subtle borders
    borderLight: "#2a2a2a",
    success: "#22c55e", // Green
    warning: "#f59e0b",
    error: "#ef4444",
    tabBar: "#000000",
    tabBarBorder: "#1a1a1a",
    // Additional colors for professional look
    accent: "#22c55e", // Green for toggles/active
    divider: "#1a1a1a",
    overlay: "rgba(0, 0, 0, 0.8)",
  },
  light: {
    name: "light",
    background: "#ffffff",
    surface: "#f5f5f5",
    surfaceLight: "#ffffff",
    primary: "#22c55e",
    primaryDark: "#16a34a",
    text: "#000000",
    textSecondary: "#666666",
    textMuted: "#999999",
    border: "#e5e5e5",
    borderLight: "#d5d5d5",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    tabBar: "#ffffff",
    tabBarBorder: "#e5e5e5",
    accent: "#22c55e",
    divider: "#e5e5e5",
    overlay: "rgba(255, 255, 255, 0.9)",
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const theme = isDarkMode ? themes.dark : themes.light;

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  const setDarkMode = useCallback((value) => {
    setIsDarkMode(value);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        toggleTheme,
        setDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
