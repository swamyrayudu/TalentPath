'use client';

import React from 'react';
import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useColorTheme,
  colorThemeLabels,
  colorThemeColors,
  type ColorTheme,
} from '@/components/context/ColorThemeContext';
import { Check } from 'lucide-react';

const colorThemes: ColorTheme[] = ['yellow', 'blue', 'red', 'green', 'purple', 'orange', 'pink', 'cyan'];

export function ColorPicker() {
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change color theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Choose Color Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {colorThemes.map((theme) => (
          <DropdownMenuItem
            key={theme}
            onClick={() => setColorTheme(theme)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div
              className="h-5 w-5 rounded-full border-2 border-border"
              style={{ backgroundColor: colorThemeColors[theme] }}
            />
            <span>{colorThemeLabels[theme]}</span>
            {colorTheme === theme && (
              <Check className="h-4 w-4 ml-auto text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
