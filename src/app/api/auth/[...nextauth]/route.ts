import { handlers } from '@/lib/auth';
import { NextRequest } from 'next/server';

// Wrap handlers to add caching headers for session endpoint
const wrappedGET = async (req: NextRequest) => {
  const response = await handlers.GET(req);
  
  // Only add cache headers for session endpoint to reduce API calls
  if (req.url.includes('/session')) {
    // Cache session response for 5 minutes on client side
    response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
  }
  
  return response;
};

export const GET = wrappedGET;
export const POST = handlers.POST;

export const runtime = 'nodejs';
