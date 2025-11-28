import React from 'react'
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/layouts/theme-provider';
import ConditionalNavbar from '../components/layouts/conditional-navbar';
import AuthProvider from '@/components/providers/session-provider';
import { DsaProblemsCacheProvider } from '@/components/context/DsaProblemsCacheContext';
import { Toaster } from 'sonner';
import AIChatbot from '@/components/ai-chatbot';

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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <DsaProblemsCacheProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <ConditionalNavbar />
              <main>{children}</main>
              <Toaster richColors position="top-right" />
              <AIChatbot />
            </ThemeProvider>
          </DsaProblemsCacheProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
