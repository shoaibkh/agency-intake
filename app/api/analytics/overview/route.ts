import { NextResponse } from 'next/server';
import { currentSessionFromRequest } from '@/lib/auth';
import { getDashboardOverview } from '@/lib/brief-service';

export async function GET(req: Request) {
  const session = await currentSessionFromRequest(req as any);
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Login required.' } }, { status: 401 });
  }

  const data = await getDashboardOverview();
  return NextResponse.json({ data });
}
