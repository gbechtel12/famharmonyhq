import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  // Check localStorage or default to 'light'
  const storedTheme = localStorage.getItem('themeMode');
  const [themeMode, setThemeMode] = useState(storedTheme || 'light');

  // Toggle theme function
  const toggleThemeMode = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  const value = {
    themeMode,
    toggleThemeMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
} 