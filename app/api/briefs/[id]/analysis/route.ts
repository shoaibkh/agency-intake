import { NextResponse } from 'next/server';
import { currentSessionFromRequest } from '@/lib/auth';
import { overrideAnalysisSchema } from '@/lib/validators';
import { overrideAnalysis, getBriefById } from '@/lib/brief-service';
import { canAccessBrief } from '@/lib/permissions';

export async function PATCH(req: Request, { params }: {  params: Promise<{ id: string }> }) {
  const session = await currentSessionFromRequest(req as any);
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Login required.' } }, { status: 401 });
  }

  try {
    const { id } = await params;
    const brief = await getBriefById(id);
    if (!brief) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Brief not found.' } }, { status: 404 });
    }
    if (!canAccessBrief(session.role, brief.assignedToId, session.id)) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You can only override assigned briefs.' } }, { status: 403 });
    }
    const body = await req.json();
    const parsed = overrideAnalysisSchema.parse(body);
    const analysis = await overrideAnalysis({ ...parsed, briefId: id, actorId: session.id });
    return NextResponse.json({ analysis });
  } catch (error) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: error instanceof Error ? error.message : 'Failed to override analysis.' } }, { status: 400 });
  }
}
