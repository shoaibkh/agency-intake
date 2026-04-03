import { NextResponse } from 'next/server';
import { processPendingAiJobs } from '@/lib/brief-service';

export async function POST(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Invalid cron secret.' } }, { status: 403 });
  }

  const processed = await processPendingAiJobs(10);
  return NextResponse.json({ ok: true, processed });
}
