import React from 'react';
import { ThemeContext, useThemeLogic } from '../../hooks/useTheme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const themeLogic = useThemeLogic();

  return (
    <ThemeContext.Provider value={themeLogic}>
      {children}
    </ThemeContext.Provider>
  );
};
