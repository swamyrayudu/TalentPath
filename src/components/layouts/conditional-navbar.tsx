'use client';

import { usePathname } from 'next/navigation';
import Navbar from './navbar';
import HomeNavbar from './home-navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Show HomeNavbar on home page, regular Navbar on other pages
  if (pathname === '/') {
    return <HomeNavbar />;
  }
  
  return <Navbar />;
}
