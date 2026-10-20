import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as FileSystem from 'expo-file-system';

// Define the themes. Deep teal is the one accent colour: buttons, selected chips, the ribbon,
// progress bars and the tab highlight all use `buttonBackground` / `accent`.
const LightTheme = {
  type: 'light',
  background: '#F3F8F7',
  text: '#10201E',
  card: '#FFFFFF',
  border: 'rgba(15, 118, 110, 0.18)',
  buttonBackground: '#0F766E',
  buttonText: '#FFFFFF',
  accent: '#0F766E',
  accentSoft: 'rgba(15, 118, 110, 0.12)',
  homeCardColor1: '#0F766E',
  homeCardColor2: '#CFE5E1',
  homeCardColor3: '#7FA9A3',
  homeButtonColor1: '#FFFFFF',
  homeButtonColor2: '#34504C',
  homeButtonColor3: '#0F766E',
  homeButtonText1: '#10201E',
  homeButtonText2: '#FFFFFF',
  homeButtonText3: '#FFFFFF',
  homeCardText1: 'white',
  homeCardText2: 'white',
  inactivetint: 'rgba(16, 32, 30, 0.2)',
  logborder: 'rgba(15, 118, 110, 0.18)',
};

const DarkTheme = {
  type: 'dark',
  background: '#0E1514',
  text: '#EAF4F2',
  card: '#16211F',
  border: 'rgba(94, 234, 212, 0.14)',
  buttonBackground: '#2DD4BF',
  buttonText: '#04201D',
  accent: '#2DD4BF',
  accentSoft: 'rgba(45, 212, 191, 0.14)',
  homeCardColor1: '#16211F',
  homeCardColor2: '#16211F',
  homeCardColor3: '#16211F',
  homeButtonColor1: '#2DD4BF',
  homeButtonColor2: '#2DD4BF',
  homeButtonColor3: '#2DD4BF',
  homeButtonText1: '#04201D',
  homeButtonText2: '#04201D',
  homeButtonText3: '#04201D',
  homeCardText1: 'white',
  homeCardText2: 'white',
  inactivetint: 'rgba(234, 244, 242, 0.14)',
  logborder: 'rgba(94, 234, 212, 0.14)',
};

// Context for theme management
const ThemeContext = createContext({
  theme: LightTheme, // Default theme
  toggleTheme: () => {}, // Default placeholder function
});

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState(LightTheme);

  const themeFilePath = `${FileSystem.documentDirectory}theme.json`;

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await FileSystem.readAsStringAsync(themeFilePath);
        setTheme(storedTheme === 'dark' ? DarkTheme : LightTheme);
      } catch {
        // No saved choice yet: Urudhi starts in light mode.
        setTheme(LightTheme);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === LightTheme ? DarkTheme : LightTheme;
    setTheme(newTheme);
    await FileSystem.writeAsStringAsync(themeFilePath, theme === LightTheme ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
