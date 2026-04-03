import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { currentSessionFromRequest } from '@/lib/auth';
import { createUserSchema } from '@/lib/validators';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const session = await currentSessionFromRequest(req as any);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Admin access required.' } }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createUserSchema.parse(body);
    const passwordHash = await bcrypt.hash(parsed.password, 12);

    const user = await prisma.user.create({
      data: {
        name: parsed.name,
        email: parsed.email,
        passwordHash,
        role: parsed.role
      }
    });

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: error instanceof Error ? error.message : 'Invalid request.' } },
      { status: 400 }
    );
  }
}
