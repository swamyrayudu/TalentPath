import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../components/layouts/theme-provider';
import ConditionalNavbar from '../components/layouts/conditional-navbar';
import AuthProvider from '@/components/providers/session-provider';
import { DsaProblemsCacheProvider } from '@/components/context/DsaProblemsCacheContext';
import { Toaster } from 'sonner';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <DsaProblemsCacheProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ConditionalNavbar />
              <main>{children}</main>
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </DsaProblemsCacheProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
