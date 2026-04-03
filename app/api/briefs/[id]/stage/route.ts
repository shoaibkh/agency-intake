import { NextResponse } from 'next/server';
import { currentSessionFromRequest } from '@/lib/auth';
import { stageSchema } from '@/lib/validators';
import { updateBriefStage, getBriefById } from '@/lib/brief-service';
import { canAccessBrief } from '@/lib/permissions';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await currentSessionFromRequest(req as any);
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Login required.' } }, { status: 401 });
  }

  try {
    const { id } = await params;
    const briefRecord = await getBriefById(id);
    if (!briefRecord) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Brief not found.' } }, { status: 404 });
    }
    if (!canAccessBrief(session.role, briefRecord.assignedToId, session.id)) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You can only update assigned briefs.' } }, { status: 403 });
    }
    const body = await req.json();
    const parsed = stageSchema.parse(body);
    const brief = await updateBriefStage({ briefId: id, stage: parsed.stage, actorId: session.id });
    return NextResponse.json({ brief });
  } catch (error) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: error instanceof Error ? error.message : 'Failed to update stage.' } }, { status: 400 });
  }
}
