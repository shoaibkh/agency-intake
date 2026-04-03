import { NextResponse } from 'next/server';
import { createBriefAndQueueAnalysis } from '@/lib/brief-service';
import { intakeSchema } from '@/lib/validators';
import { verifyWebhookSignature } from '@/lib/hmac';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const raw = await req.text();
  const signature = req.headers.get('x-intake-signature');

  try {
    if (!verifyWebhookSignature(raw, signature)) {
      return NextResponse.json({ error: { code: 'INVALID_SIGNATURE', message: 'Signature verification failed.' } }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = await rateLimit(`webhook:${ip}`, 20, '1 m');
    if (!limit.success) {
      return NextResponse.json({ error: { code: 'RATE_LIMITED', message: 'Webhook rate limit reached.' } }, { status: 429 });
    }

    const parsed = intakeSchema.parse({ ...JSON.parse(raw), source: 'WEBHOOK' });
    const brief = await createBriefAndQueueAnalysis(parsed);
    return NextResponse.json({ ok: true, briefId: brief.id }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: error instanceof Error ? error.message : 'Invalid request.' } },
      { status: 400 }
    );
  }
}
