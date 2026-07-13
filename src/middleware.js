import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Exclude Next.js internals, static files, and authentication API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login'
  ) {
    // If logged in and attempting to visit /login, redirect to dashboard
    if (pathname === '/login' && token === 'admin_session') {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = '/';
      return NextResponse.redirect(dashboardUrl);
    }
    return NextResponse.next();
  }

  // 2. Protect all other pages and API endpoints
  if (!token || token !== 'admin_session') {
    // If it's an API request, return JSON unauthorized response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized access. Please login first.' },
        { status: 401 }
      );
    }
    
    // Otherwise, redirect to login page
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
