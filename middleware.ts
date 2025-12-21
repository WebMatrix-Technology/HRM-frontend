import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const isPublicRoute = pathname === '/' || 
                       pathname.startsWith('/auth/login') || 
                       pathname.startsWith('/auth/register');

  // Since we're using localStorage for tokens (client-side only),
  // we can't check tokens server-side in middleware.
  // Let client-side components handle auth redirects.
  // This middleware only handles basic route protection if needed.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

