import { NextResponse } from 'next/server';
import { currentSessionFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await currentSessionFromRequest(req as any);
  return NextResponse.json({ user: session });
}
