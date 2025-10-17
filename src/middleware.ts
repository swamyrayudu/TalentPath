import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware no longer protects admin routes. Keep as a no-op passthrough
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

// No matcher — middleware will be a no-op. If you later want to re-enable
// protection for specific routes, add matchers here.
export const config = {
  matcher: [],
};
