'use client';

import React from 'react';
import {
  useColorTheme,
  colorThemeLabels,
  colorThemeColors,
  type ColorTheme,
} from '@/components/context/ColorThemeContext';
import { Check } from 'lucide-react';

const colorThemes: ColorTheme[] = ['yellow', 'blue', 'red', 'green', 'purple', 'orange', 'pink', 'cyan'];

export function MobileColorPicker() {
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground px-1">Theme Color</p>
      <div className="grid grid-cols-4 gap-2">
        {colorThemes.map((theme) => (
          <button
            key={theme}
            onClick={() => setColorTheme(theme)}
            className={`relative flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all duration-200 ${
              colorTheme === theme
                ? 'bg-primary/10 ring-2 ring-primary'
                : 'hover:bg-accent'
            }`}
            title={colorThemeLabels[theme]}
          >
            <div
              className="h-6 w-6 rounded-full border-2 border-border shadow-sm"
              style={{ backgroundColor: colorThemeColors[theme] }}
            />
            {colorTheme === theme && (
              <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
            )}
            <span className="text-[10px] text-muted-foreground">{colorThemeLabels[theme]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
