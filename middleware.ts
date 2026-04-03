import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const protectedPath = pathname.startsWith('/dashboard');
  if (!protectedPath) return NextResponse.next();

  const hasSession = Boolean(req.cookies.get('agp_session')?.value);
  if (!hasSession) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};
