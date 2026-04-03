import { NextResponse } from 'next/server';
import { currentSessionFromRequest } from '@/lib/auth';
import { getBriefById } from '@/lib/brief-service';
import { canAccessBrief } from '@/lib/permissions';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await currentSessionFromRequest(req as any);
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Login required.' } }, { status: 401 });
  }

  const brief = await getBriefById(params.id);
  if (!brief) return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Brief not found.' } }, { status: 404 });
  if (!canAccessBrief(session.role, brief.assignedToId, session.id)) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You can only view assigned briefs.' } }, { status: 403 });
  }

  return NextResponse.json({ brief });
}
