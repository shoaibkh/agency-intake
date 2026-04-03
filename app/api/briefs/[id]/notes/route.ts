import { NextResponse } from 'next/server';
import { currentSessionFromRequest } from '@/lib/auth';
import { addBriefNote, getBriefById } from '@/lib/brief-service';
import { canAccessBrief } from '@/lib/permissions';

export async function POST(req: Request, { params }: {  params: Promise<{ id: string }>  }) {
  const { id } = await params;
  const session = await currentSessionFromRequest(req as any);
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Login required.' } }, { status: 401 });
  }

  try {
    const brief = await getBriefById(id);
    if (!brief) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Brief not found.' } }, { status: 404 });
    }
    if (!canAccessBrief(session.role, brief.assignedToId, session.id)) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You can only comment on assigned briefs.' } }, { status: 403 });
    }
    const body = await req.json();
    const note = await addBriefNote({
      briefId: id,
      authorId: session.id,
      body: body.body,
      parentId: body.parentId ?? null
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: error instanceof Error ? error.message : 'Failed to add note.' } }, { status: 400 });
  }
}
