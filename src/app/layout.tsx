import React from 'react'
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/layouts/theme-provider';
import ConditionalNavbar from '../components/layouts/conditional-navbar';
import AuthProvider from '@/components/providers/session-provider';
import { DsaProblemsCacheProvider } from '@/components/context/DsaProblemsCacheContext';
import { ColorThemeProvider } from '@/components/context/ColorThemeContext';
import { Toaster } from 'sonner';
import AIChatbot from '@/components/ai-chatbot';
import { ActivityTracker } from '@/components/providers/activity-tracker';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TalentPath - Your Career Journey',
  description: 'Authentication and career management platform',
  icons: {
    icon: '/talentpath-logo.svg',
    shortcut: '/talentpath-logo.svg',
    apple: '/talentpath-logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inline script to apply color theme before React hydrates (prevents flash)
  const colorThemeScript = `
    (function() {
      try {
        var colorTheme = localStorage.getItem('color-theme') || 'yellow';
        var configs = {
          yellow: { light: { primary: 'oklch(0.852 0.199 91.936)', primaryForeground: 'oklch(0.421 0.095 57.708)', ring: 'oklch(0.852 0.199 91.936)' }, dark: { primary: 'oklch(0.795 0.184 86.047)', primaryForeground: 'oklch(0.421 0.095 57.708)', ring: 'oklch(0.421 0.095 57.708)' } },
          blue: { light: { primary: 'oklch(0.546 0.245 262)', primaryForeground: 'oklch(0.98 0.02 262)', ring: 'oklch(0.546 0.245 262)' }, dark: { primary: 'oklch(0.546 0.245 262)', primaryForeground: 'oklch(0.98 0.02 262)', ring: 'oklch(0.47 0.22 262)' } },
          red: { light: { primary: 'oklch(0.577 0.245 27.325)', primaryForeground: 'oklch(0.98 0.02 27)', ring: 'oklch(0.577 0.245 27.325)' }, dark: { primary: 'oklch(0.577 0.245 27.325)', primaryForeground: 'oklch(0.98 0.02 27)', ring: 'oklch(0.5 0.22 27)' } },
          green: { light: { primary: 'oklch(0.648 0.2 145)', primaryForeground: 'oklch(0.98 0.02 145)', ring: 'oklch(0.648 0.2 145)' }, dark: { primary: 'oklch(0.648 0.2 145)', primaryForeground: 'oklch(0.15 0.03 145)', ring: 'oklch(0.55 0.18 145)' } },
          purple: { light: { primary: 'oklch(0.558 0.288 302)', primaryForeground: 'oklch(0.98 0.02 302)', ring: 'oklch(0.558 0.288 302)' }, dark: { primary: 'oklch(0.558 0.288 302)', primaryForeground: 'oklch(0.98 0.02 302)', ring: 'oklch(0.48 0.25 302)' } },
          orange: { light: { primary: 'oklch(0.705 0.213 47.604)', primaryForeground: 'oklch(0.21 0.034 45)', ring: 'oklch(0.705 0.213 47.604)' }, dark: { primary: 'oklch(0.75 0.183 55.934)', primaryForeground: 'oklch(0.21 0.034 50)', ring: 'oklch(0.5 0.17 50)' } },
          pink: { light: { primary: 'oklch(0.592 0.249 0)', primaryForeground: 'oklch(0.98 0.02 0)', ring: 'oklch(0.592 0.249 0)' }, dark: { primary: 'oklch(0.592 0.249 0)', primaryForeground: 'oklch(0.98 0.02 0)', ring: 'oklch(0.5 0.23 0)' } },
          cyan: { light: { primary: 'oklch(0.628 0.185 205)', primaryForeground: 'oklch(0.15 0.03 205)', ring: 'oklch(0.628 0.185 205)' }, dark: { primary: 'oklch(0.628 0.185 205)', primaryForeground: 'oklch(0.15 0.03 205)', ring: 'oklch(0.54 0.17 205)' } }
        };
        var config = configs[colorTheme];
        if (config) {
          // Check for dark mode from next-themes localStorage or class
          var theme = localStorage.getItem('theme');
          var isDark = theme === 'dark' || document.documentElement.classList.contains('dark');
          var colors = isDark ? config.dark : config.light;
          document.documentElement.style.setProperty('--primary', colors.primary);
          document.documentElement.style.setProperty('--primary-foreground', colors.primaryForeground);
          document.documentElement.style.setProperty('--ring', colors.ring);
        }
      } catch (e) {}
    })();
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="lxkb-K7mRGEDZvcd8QIBFZVzYJODUAv3LVFtvne2BWI" />
        <script dangerouslySetInnerHTML={{ __html: colorThemeScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <DsaProblemsCacheProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
              disableTransitionOnChange
            >
              <ColorThemeProvider>
                <ConditionalNavbar />
                <main>{children}</main>
                <Toaster richColors position="top-right" />
                <AIChatbot />
                <ActivityTracker />
              </ColorThemeProvider>
            </ThemeProvider>
          </DsaProblemsCacheProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
