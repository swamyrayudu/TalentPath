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
      primary: 'oklch(0.546 0.245 262)',
      primaryForeground: 'oklch(0.98 0.02 262)',
      ring: 'oklch(0.546 0.245 262)',
      chart1: 'oklch(0.62 0.22 255)',
      chart2: 'oklch(0.546 0.245 262)',
      chart3: 'oklch(0.47 0.22 268)',
      chart4: 'oklch(0.4 0.2 274)',
      chart5: 'oklch(0.34 0.18 280)',
      sidebarPrimary: 'oklch(0.47 0.22 268)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.546 0.245 262)',
    },
    dark: {
      primary: 'oklch(0.546 0.245 262)',
      primaryForeground: 'oklch(0.98 0.02 262)',
      ring: 'oklch(0.47 0.22 262)',
      chart1: 'oklch(0.62 0.2 255)',
      chart2: 'oklch(0.546 0.245 262)',
      chart3: 'oklch(0.47 0.22 268)',
      chart4: 'oklch(0.4 0.2 274)',
      chart5: 'oklch(0.34 0.18 280)',
      sidebarPrimary: 'oklch(0.546 0.245 262)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.47 0.22 262)',
    },
  },
  red: {
    light: {
      primary: 'oklch(0.577 0.245 27.325)',
      primaryForeground: 'oklch(0.98 0.02 27)',
      ring: 'oklch(0.577 0.245 27.325)',
      chart1: 'oklch(0.65 0.22 22)',
      chart2: 'oklch(0.577 0.245 27.325)',
      chart3: 'oklch(0.5 0.22 32)',
      chart4: 'oklch(0.42 0.2 37)',
      chart5: 'oklch(0.35 0.18 42)',
      sidebarPrimary: 'oklch(0.5 0.22 32)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.577 0.245 27.325)',
    },
    dark: {
      primary: 'oklch(0.577 0.245 27.325)',
      primaryForeground: 'oklch(0.98 0.02 27)',
      ring: 'oklch(0.5 0.22 27)',
      chart1: 'oklch(0.65 0.2 22)',
      chart2: 'oklch(0.577 0.245 27.325)',
      chart3: 'oklch(0.5 0.22 32)',
      chart4: 'oklch(0.42 0.2 37)',
      chart5: 'oklch(0.35 0.18 42)',
      sidebarPrimary: 'oklch(0.577 0.245 27.325)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.5 0.22 27)',
    },
  },
  green: {
    light: {
      primary: 'oklch(0.648 0.2 145)',
      primaryForeground: 'oklch(0.98 0.02 145)',
      ring: 'oklch(0.648 0.2 145)',
      chart1: 'oklch(0.72 0.19 140)',
      chart2: 'oklch(0.648 0.2 145)',
      chart3: 'oklch(0.55 0.18 150)',
      chart4: 'oklch(0.45 0.16 155)',
      chart5: 'oklch(0.38 0.14 160)',
      sidebarPrimary: 'oklch(0.55 0.18 150)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.648 0.2 145)',
    },
    dark: {
      primary: 'oklch(0.648 0.2 145)',
      primaryForeground: 'oklch(0.15 0.03 145)',
      ring: 'oklch(0.55 0.18 145)',
      chart1: 'oklch(0.72 0.17 140)',
      chart2: 'oklch(0.648 0.2 145)',
      chart3: 'oklch(0.55 0.18 150)',
      chart4: 'oklch(0.45 0.16 155)',
      chart5: 'oklch(0.38 0.14 160)',
      sidebarPrimary: 'oklch(0.648 0.2 145)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.55 0.18 145)',
    },
  },
  purple: {
    light: {
      primary: 'oklch(0.558 0.288 302)',
      primaryForeground: 'oklch(0.98 0.02 302)',
      ring: 'oklch(0.558 0.288 302)',
      chart1: 'oklch(0.65 0.25 295)',
      chart2: 'oklch(0.558 0.288 302)',
      chart3: 'oklch(0.48 0.25 308)',
      chart4: 'oklch(0.4 0.22 314)',
      chart5: 'oklch(0.35 0.2 320)',
      sidebarPrimary: 'oklch(0.48 0.25 308)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.558 0.288 302)',
    },
    dark: {
      primary: 'oklch(0.558 0.288 302)',
      primaryForeground: 'oklch(0.98 0.02 302)',
      ring: 'oklch(0.48 0.25 302)',
      chart1: 'oklch(0.65 0.22 295)',
      chart2: 'oklch(0.558 0.288 302)',
      chart3: 'oklch(0.48 0.25 308)',
      chart4: 'oklch(0.4 0.22 314)',
      chart5: 'oklch(0.35 0.2 320)',
      sidebarPrimary: 'oklch(0.558 0.288 302)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.48 0.25 302)',
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
      primary: 'oklch(0.592 0.249 0)',
      primaryForeground: 'oklch(0.98 0.02 0)',
      ring: 'oklch(0.592 0.249 0)',
      chart1: 'oklch(0.68 0.22 355)',
      chart2: 'oklch(0.592 0.249 0)',
      chart3: 'oklch(0.5 0.23 5)',
      chart4: 'oklch(0.42 0.21 10)',
      chart5: 'oklch(0.35 0.19 15)',
      sidebarPrimary: 'oklch(0.5 0.23 5)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.592 0.249 0)',
    },
    dark: {
      primary: 'oklch(0.592 0.249 0)',
      primaryForeground: 'oklch(0.98 0.02 0)',
      ring: 'oklch(0.5 0.23 0)',
      chart1: 'oklch(0.68 0.2 355)',
      chart2: 'oklch(0.592 0.249 0)',
      chart3: 'oklch(0.5 0.23 5)',
      chart4: 'oklch(0.42 0.21 10)',
      chart5: 'oklch(0.35 0.19 15)',
      sidebarPrimary: 'oklch(0.592 0.249 0)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.5 0.23 0)',
    },
  },
  cyan: {
    light: {
      primary: 'oklch(0.628 0.185 205)',
      primaryForeground: 'oklch(0.15 0.03 205)',
      ring: 'oklch(0.628 0.185 205)',
      chart1: 'oklch(0.7 0.17 200)',
      chart2: 'oklch(0.628 0.185 205)',
      chart3: 'oklch(0.54 0.17 210)',
      chart4: 'oklch(0.46 0.15 215)',
      chart5: 'oklch(0.4 0.13 220)',
      sidebarPrimary: 'oklch(0.54 0.17 210)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.628 0.185 205)',
    },
    dark: {
      primary: 'oklch(0.628 0.185 205)',
      primaryForeground: 'oklch(0.15 0.03 205)',
      ring: 'oklch(0.54 0.17 205)',
      chart1: 'oklch(0.7 0.15 200)',
      chart2: 'oklch(0.628 0.185 205)',
      chart3: 'oklch(0.54 0.17 210)',
      chart4: 'oklch(0.46 0.15 215)',
      chart5: 'oklch(0.4 0.13 220)',
      sidebarPrimary: 'oklch(0.628 0.185 205)',
      sidebarPrimaryForeground: 'oklch(0.985 0.016 286.375)',
      sidebarRing: 'oklch(0.54 0.17 205)',
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

// Helper function to get initial color theme from localStorage (runs on client only)
const getInitialColorTheme = (): ColorTheme => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('color-theme') as ColorTheme | null;
    if (saved && colorConfigs[saved]) {
      return saved;
    }
  }
  return 'yellow';
};

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(getInitialColorTheme);
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

  // Initialize mounted state
  useEffect(() => {
    setMounted(true);
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
