import { NextResponse } from 'next/server';
import { listBriefs } from '@/lib/brief-service';
import { currentSessionFromRequest } from '@/lib/auth';
import { BriefStage } from '@prisma/client';

export async function GET(req: Request) {
  const session = await currentSessionFromRequest(req as any);
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Login required.' } }, { status: 401 });
  }

  const url = new URL(req.url);
  const rawStage = url.searchParams.get('stage');
  const stage = rawStage && ['NEW','UNDER_REVIEW','PROPOSAL_SENT','WON','ARCHIVED'].includes(rawStage) ? rawStage as BriefStage : null;
  const cursor = url.searchParams.get('cursor') || undefined;
  const { items, nextCursor } = await listBriefs({
    stage: stage || undefined,
    cursor,
    assignedToId: session.role === 'ADMIN' ? undefined : session.id
  });
  return NextResponse.json({ items, nextCursor });
}
