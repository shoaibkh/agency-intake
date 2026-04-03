import { NextResponse } from 'next/server';
import { currentSessionFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await currentSessionFromRequest(req as any);
  if (!session) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Login required.' } }, { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`event: ready\ndata: ${JSON.stringify({ ok: true, ts: Date.now() })}\n\n`));

      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`));
      }, 15000);

      const cleanup = () => clearInterval(interval);
      req.signal.addEventListener('abort', cleanup);
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
