import { NextResponse } from 'next/server';
import { currentSessionFromRequest } from '@/lib/auth';
import { assignBrief, getBriefById } from '@/lib/brief-service';
import { prisma } from '@/lib/db';
import id from 'zod/v4/locales/id.js';

export async function PATCH(req: Request, { params }: {  params: Promise<{ id: string }> }) {
  const session = await currentSessionFromRequest(req as any);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin access required.' } }, { status: 403 });
  }

  try {
    const { id } = await params;
    const briefExists = await getBriefById(id);
    if (!briefExists) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Brief not found.' } }, { status: 404 });
    }
    const body = await req.json();
    const assignedUser = await prisma.user.findUnique({ where: { id: body.assignedToId } });
    if (!assignedUser) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Assigned user not found.' } }, { status: 404 });
    }
    if (assignedUser.role !== 'REVIEWER' && assignedUser.role !== 'ADMIN') {
      return NextResponse.json({ error: { code: 'BAD_REQUEST', message: 'User is not assignable.' } }, { status: 400 });
    }
    const brief = await assignBrief({
      briefId: id,
      assignedById: session.id,
      assignedToId: body.assignedToId,
      reason: body.reason
    });
    return NextResponse.json({ brief });
  } catch (error) {
    return NextResponse.json({ error: { code: 'BAD_REQUEST', message: error instanceof Error ? error.message : 'Failed to assign brief.' } }, { status: 400 });
  }
}
