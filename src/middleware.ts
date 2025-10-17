import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Protect admin routes: only allow users with role === 'admin'
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run this middleware for /admin routes (config.matcher below
  // already limits which requests invoke the middleware, but keep a
  // defensive check here so the function is safe if reused.)
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // Try to get the NextAuth JWT from the request.
  // Prefer using NEXTAUTH_SECRET (production). If it's not set (common in
  // local development), fall back to calling getToken without the secret so
  // the middleware can still read the token if present.
  let token = null as any;
  try {
    token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  } catch (e) {
    // If getToken throws (missing/incorrect secret), try again without secret
    // to allow local development. This is NOT recommended for production.
    token = await getToken({ req: request });
  }

  // If there's no token available here, don't redirect at edge level.
  // Some environments (local dev or cookie/secret mismatches) can make
  // getToken return null even when the server-side `auth()` would succeed.
  // Let the server-side page (which calls `auth()`) handle sign-in redirects.
  if (!token) {
    return NextResponse.next();
  }

  // If token exists but role is not admin, block access at the edge
  const role = (token as any).role ?? 'user';
  if (String(role).toLowerCase() !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Admin — allow
  return NextResponse.next();
}

// Apply middleware only to /admin and its subpaths
export const config = {
  matcher: ['/admin/:path*'],
};
