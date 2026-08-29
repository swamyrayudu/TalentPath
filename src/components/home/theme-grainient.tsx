'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import Grainient from '@/components/ui/grainient';
import { useColorTheme, colorThemeColors } from '@/components/context/ColorThemeContext';

type Hsl = { h: number; s: number; l: number };

function hexToHsl(hex: string): Hsl {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { h: 0, s: 0, l: 0.5 };
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  if (d === 0) return { h: 0, s: 0, l };

  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h: h * 360, s, l };
}

function hslToHex({ h, s, l }: Hsl): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.min(Math.max(s, 0), 1);
  const lum = Math.min(Math.max(l, 0), 1);

  const c = (1 - Math.abs(2 * lum - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lum - c / 2;

  const [r, g, b] =
    hue < 60 ? [c, x, 0]
    : hue < 120 ? [x, c, 0]
    : hue < 180 ? [0, c, x]
    : hue < 240 ? [0, x, c]
    : hue < 300 ? [x, 0, c]
    : [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Builds the gradient's three tones from a single accent hex. Derived rather
 * than hand-listed so every colour theme — including any added later — is
 * covered. The hue only walks ±16°, so each palette still reads as its own
 * colour; the sense of depth comes from the lightness spread instead. (A
 * wider hue swing turns the yellow theme lime and pink's deep tone brown.)
 */
function derivePalette(baseHex: string, isDark: boolean) {
  const { h, s } = hexToHsl(baseHex);
  const sat = Math.max(s, 0.45);

  return isDark
    ? {
        color1: hslToHex({ h: h - 16, s: sat * 0.8, l: 0.62 }),
        color2: hslToHex({ h, s: sat, l: 0.38 }),
        color3: hslToHex({ h: h + 16, s: sat * 0.85, l: 0.18 }),
      }
    : {
        color1: hslToHex({ h: h - 16, s: sat * 0.85, l: 0.85 }),
        color2: hslToHex({ h, s: sat, l: 0.62 }),
        color3: hslToHex({ h: h + 16, s: sat * 0.9, l: 0.4 }),
      };
}

export function ThemeGrainient({ className = '' }: { className?: string }) {
  const { colorTheme } = useColorTheme();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const palette = useMemo(
    () => derivePalette(colorThemeColors[colorTheme], isDark),
    [colorTheme, isDark]
  );

  // Colour theme and dark mode both come from localStorage, so the server
  // cannot know them — mount first, then paint.
  if (!mounted) return null;

  return (
    <Grainient
      className={className}
      color1={palette.color1}
      color2={palette.color2}
      color3={palette.color3}
      timeSpeed={reduceMotion ? 0 : 0.18}
      warpStrength={1.0}
      warpFrequency={4.0}
      warpSpeed={1.4}
      warpAmplitude={60.0}
      blendSoftness={0.12}
      rotationAmount={360.0}
      noiseScale={1.6}
      grainAmount={0.09}
      grainScale={2.0}
      contrast={isDark ? 1.15 : 1.25}
      saturation={isDark ? 0.9 : 1.0}
      zoom={0.85}
    />
  );
}

export default ThemeGrainient;
