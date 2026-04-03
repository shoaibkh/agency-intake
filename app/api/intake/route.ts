import { NextResponse } from 'next/server';
import { intakeSchema } from '@/lib/validators';
import { createBriefAndQueueAnalysis } from '@/lib/brief-service';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = await rateLimit(`intake:${ip}`, 5, '1 m');
    if (!limit.success) {
      return NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const body = await req.json();
    const parsed = intakeSchema.parse({ ...body, source: 'FORM' });
    const brief = await createBriefAndQueueAnalysis(parsed);

    return NextResponse.json({ ok: true, briefId: brief.id }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: error instanceof Error ? error.message : 'Invalid request.' } },
      { status: 400 }
    );
  }
}
