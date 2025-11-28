"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ColorTheme = 'yellow' | 'blue' | 'red' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan';

interface ColorThemeContextType {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

// Color configurations for each theme
const colorConfigs: Record<ColorTheme, {
  light: {
    primary: string;
    primaryForeground: string;
    ring: string;
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarRing: string;
  };
  dark: {
    primary: string;
    primaryForeground: string;
    ring: string;
    chart1: string;
    chart2: string;
    chart3: string;
    chart4: string;
    chart5: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarRing: string;
  };
}> = {
  yellow: {
    light: {
      primary: 'oklch(0.852 0.199 91.936)',
      primaryForeground: 'oklch(0.421 0.095 57.708)',
      ring: 'oklch(0.852 0.199 91.936)',
      chart1: 'oklch(0.905 0.182 98.111)',
      chart2: 'oklch(0.795 0.184 86.047)',
      chart3: 'oklch(0.681 0.162 75.834)',
      chart4: 'oklch(0.554 0.135 66.442)',
      chart5: 'oklch(0.476 0.114 61.907)',
      sidebarPrimary: 'oklch(0.681 0.162 75.834)',
      sidebarPrimaryForeground: 'oklch(0.987 0.026 102.212)',
      sidebarRing: 'oklch(0.852 0.199 91.936)',
    },
    dark: {
      primary: 'oklch(0.795 0.184 86.047)',
      primaryForeground: 'oklch(0.421 0.095 57.708)',
      ring: 'oklch(0.421 0.095 57.708)',
      chart1: 'oklch(0.905 0.182 98.111)',
      chart2: 'oklch(0.795 0.184 86.047)',
      chart3: 'oklch(0.681 0.162 75.834)',
      chart4: 'oklch(0.554 0.135 66.442)',
      chart5: 'oklch(0.476 0.114 61.907)',
      sidebarPrimary: 'oklch(0.795 0.184 86.047)',
      sidebarPrimaryForeground: 'oklch(0.987 0.026 102.212)',
      sidebarRing: 'oklch(0.421 0.095 57.708)',
    },
  },
  blue: {
    light: {
      primary: 'oklch(0.623 0.214 259.815)',
      primaryForeground: 'oklch(0.985 0.016 286.375)',
      ring: 'oklch(0.623 0.214 259.815)',
      chart1: 'oklch(0.7 0.18 250)',
      chart2: 'oklch(0.623 0.214 259.815)',
      chart3: 'oklch(0.55 0.2 265)',
      chart4: 'oklch(0.45 0.18 270)',
      chart5: 'oklch(0.4 0.15 275)',
      sidebarPrimary: 'oklch(0.55 0.2 265)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.623 0.214 259.815)',
    },
    dark: {
      primary: 'oklch(0.7 0.18 250)',
      primaryForeground: 'oklch(0.21 0.034 265)',
      ring: 'oklch(0.5 0.15 260)',
      chart1: 'oklch(0.75 0.15 245)',
      chart2: 'oklch(0.7 0.18 250)',
      chart3: 'oklch(0.6 0.2 260)',
      chart4: 'oklch(0.5 0.18 265)',
      chart5: 'oklch(0.45 0.15 270)',
      sidebarPrimary: 'oklch(0.7 0.18 250)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.5 0.15 260)',
    },
  },
  red: {
    light: {
      primary: 'oklch(0.637 0.237 25.331)',
      primaryForeground: 'oklch(0.985 0.016 286.375)',
      ring: 'oklch(0.637 0.237 25.331)',
      chart1: 'oklch(0.75 0.2 20)',
      chart2: 'oklch(0.637 0.237 25.331)',
      chart3: 'oklch(0.55 0.22 30)',
      chart4: 'oklch(0.45 0.2 35)',
      chart5: 'oklch(0.4 0.18 40)',
      sidebarPrimary: 'oklch(0.55 0.22 30)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.637 0.237 25.331)',
    },
    dark: {
      primary: 'oklch(0.704 0.191 22.216)',
      primaryForeground: 'oklch(0.21 0.034 25)',
      ring: 'oklch(0.5 0.18 25)',
      chart1: 'oklch(0.75 0.18 18)',
      chart2: 'oklch(0.704 0.191 22.216)',
      chart3: 'oklch(0.6 0.2 28)',
      chart4: 'oklch(0.5 0.18 32)',
      chart5: 'oklch(0.45 0.15 36)',
      sidebarPrimary: 'oklch(0.704 0.191 22.216)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.5 0.18 25)',
    },
  },
  green: {
    light: {
      primary: 'oklch(0.723 0.219 149.579)',
      primaryForeground: 'oklch(0.21 0.034 150)',
      ring: 'oklch(0.723 0.219 149.579)',
      chart1: 'oklch(0.8 0.18 145)',
      chart2: 'oklch(0.723 0.219 149.579)',
      chart3: 'oklch(0.6 0.2 155)',
      chart4: 'oklch(0.5 0.18 160)',
      chart5: 'oklch(0.45 0.15 165)',
      sidebarPrimary: 'oklch(0.6 0.2 155)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.723 0.219 149.579)',
    },
    dark: {
      primary: 'oklch(0.696 0.17 162.48)',
      primaryForeground: 'oklch(0.21 0.034 150)',
      ring: 'oklch(0.5 0.15 155)',
      chart1: 'oklch(0.75 0.15 145)',
      chart2: 'oklch(0.696 0.17 162.48)',
      chart3: 'oklch(0.6 0.18 158)',
      chart4: 'oklch(0.5 0.16 162)',
      chart5: 'oklch(0.45 0.14 166)',
      sidebarPrimary: 'oklch(0.696 0.17 162.48)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.5 0.15 155)',
    },
  },
  purple: {
    light: {
      primary: 'oklch(0.627 0.265 303.9)',
      primaryForeground: 'oklch(0.985 0.016 286.375)',
      ring: 'oklch(0.627 0.265 303.9)',
      chart1: 'oklch(0.75 0.22 295)',
      chart2: 'oklch(0.627 0.265 303.9)',
      chart3: 'oklch(0.55 0.25 310)',
      chart4: 'oklch(0.45 0.22 315)',
      chart5: 'oklch(0.4 0.2 320)',
      sidebarPrimary: 'oklch(0.55 0.25 310)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.627 0.265 303.9)',
    },
    dark: {
      primary: 'oklch(0.714 0.203 305.504)',
      primaryForeground: 'oklch(0.21 0.034 305)',
      ring: 'oklch(0.5 0.2 305)',
      chart1: 'oklch(0.78 0.18 298)',
      chart2: 'oklch(0.714 0.203 305.504)',
      chart3: 'oklch(0.6 0.22 310)',
      chart4: 'oklch(0.5 0.2 315)',
      chart5: 'oklch(0.45 0.18 320)',
      sidebarPrimary: 'oklch(0.714 0.203 305.504)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.5 0.2 305)',
    },
  },
  orange: {
    light: {
      primary: 'oklch(0.705 0.213 47.604)',
      primaryForeground: 'oklch(0.21 0.034 45)',
      ring: 'oklch(0.705 0.213 47.604)',
      chart1: 'oklch(0.8 0.18 42)',
      chart2: 'oklch(0.705 0.213 47.604)',
      chart3: 'oklch(0.6 0.2 52)',
      chart4: 'oklch(0.5 0.18 55)',
      chart5: 'oklch(0.45 0.15 58)',
      sidebarPrimary: 'oklch(0.6 0.2 52)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.705 0.213 47.604)',
    },
    dark: {
      primary: 'oklch(0.75 0.183 55.934)',
      primaryForeground: 'oklch(0.21 0.034 50)',
      ring: 'oklch(0.5 0.17 50)',
      chart1: 'oklch(0.8 0.16 45)',
      chart2: 'oklch(0.75 0.183 55.934)',
      chart3: 'oklch(0.65 0.2 58)',
      chart4: 'oklch(0.55 0.18 62)',
      chart5: 'oklch(0.5 0.16 65)',
      sidebarPrimary: 'oklch(0.75 0.183 55.934)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.5 0.17 50)',
    },
  },
  pink: {
    light: {
      primary: 'oklch(0.656 0.241 354.308)',
      primaryForeground: 'oklch(0.985 0.016 286.375)',
      ring: 'oklch(0.656 0.241 354.308)',
      chart1: 'oklch(0.75 0.2 350)',
      chart2: 'oklch(0.656 0.241 354.308)',
      chart3: 'oklch(0.55 0.22 358)',
      chart4: 'oklch(0.45 0.2 2)',
      chart5: 'oklch(0.4 0.18 5)',
      sidebarPrimary: 'oklch(0.55 0.22 358)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.656 0.241 354.308)',
    },
    dark: {
      primary: 'oklch(0.718 0.202 349.761)',
      primaryForeground: 'oklch(0.21 0.034 350)',
      ring: 'oklch(0.5 0.19 352)',
      chart1: 'oklch(0.78 0.17 346)',
      chart2: 'oklch(0.718 0.202 349.761)',
      chart3: 'oklch(0.6 0.21 354)',
      chart4: 'oklch(0.5 0.19 358)',
      chart5: 'oklch(0.45 0.17 2)',
      sidebarPrimary: 'oklch(0.718 0.202 349.761)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.5 0.19 352)',
    },
  },
  cyan: {
    light: {
      primary: 'oklch(0.715 0.143 215.221)',
      primaryForeground: 'oklch(0.21 0.034 210)',
      ring: 'oklch(0.715 0.143 215.221)',
      chart1: 'oklch(0.8 0.12 210)',
      chart2: 'oklch(0.715 0.143 215.221)',
      chart3: 'oklch(0.6 0.15 220)',
      chart4: 'oklch(0.5 0.13 225)',
      chart5: 'oklch(0.45 0.11 230)',
      sidebarPrimary: 'oklch(0.6 0.15 220)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.715 0.143 215.221)',
    },
    dark: {
      primary: 'oklch(0.777 0.152 211.53)',
      primaryForeground: 'oklch(0.21 0.034 215)',
      ring: 'oklch(0.5 0.12 218)',
      chart1: 'oklch(0.82 0.1 205)',
      chart2: 'oklch(0.777 0.152 211.53)',
      chart3: 'oklch(0.65 0.14 218)',
      chart4: 'oklch(0.55 0.12 222)',
      chart5: 'oklch(0.5 0.1 226)',
      sidebarPrimary: 'oklch(0.777 0.152 211.53)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.5 0.12 218)',
    },
  },
};

export const colorThemeLabels: Record<ColorTheme, string> = {
  yellow: 'Yellow',
  blue: 'Blue',
  red: 'Red',
  green: 'Green',
  purple: 'Purple',
  orange: 'Orange',
  pink: 'Pink',
  cyan: 'Cyan',
};

export const colorThemeColors: Record<ColorTheme, string> = {
  yellow: '#f59e0b',
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  pink: '#ec4899',
  cyan: '#06b6d4',
};

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('yellow');
  const [mounted, setMounted] = useState(false);

  // Apply color theme to CSS variables
  const applyColorTheme = useCallback((theme: ColorTheme, isDark: boolean) => {
    const config = colorConfigs[theme];
    const colors = isDark ? config.dark : config.light;
    const root = document.documentElement;

    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--ring', colors.ring);
    root.style.setProperty('--chart-1', colors.chart1);
    root.style.setProperty('--chart-2', colors.chart2);
    root.style.setProperty('--chart-3', colors.chart3);
    root.style.setProperty('--chart-4', colors.chart4);
    root.style.setProperty('--chart-5', colors.chart5);
    root.style.setProperty('--sidebar-primary', colors.sidebarPrimary);
    root.style.setProperty('--sidebar-primary-foreground', colors.sidebarPrimaryForeground);
    root.style.setProperty('--sidebar-ring', colors.sidebarRing);
  }, []);

  // Initialize from localStorage and set up observer
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('color-theme') as ColorTheme | null;
    if (saved && colorConfigs[saved]) {
      setColorThemeState(saved);
    }
  }, []);

  // Apply theme when it changes or dark mode changes
  useEffect(() => {
    if (!mounted) return;

    const applyCurrentTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      applyColorTheme(colorTheme, isDark);
    };

    applyCurrentTheme();

    // Watch for dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          applyCurrentTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [colorTheme, mounted, applyColorTheme]);

  const setColorTheme = useCallback((theme: ColorTheme) => {
    setColorThemeState(theme);
    localStorage.setItem('color-theme', theme);
  }, []);

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error('useColorTheme must be used within a ColorThemeProvider');
  }
  return context;
}
