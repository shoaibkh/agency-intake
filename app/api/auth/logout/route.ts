import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  return clearSessionCookie(
    NextResponse.redirect(new URL('/', request.url))
  );
}