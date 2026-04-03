import { NextResponse } from 'next/server';
import { loginUser, signSession, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validators';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);

    const user = await loginUser(parsed.email, parsed.password);
    if (!user) {
      return NextResponse.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' } }, { status: 401 });
    }

    const token = await signSession(user);
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    return setSessionCookie(res, token);
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: error instanceof Error ? error.message : 'Invalid request.' } },
      { status: 400 }
    );
  }
}
