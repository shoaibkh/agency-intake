import crypto from 'crypto';

export function verifyWebhookSignature(payload: string, signature: string | null) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) throw new Error('WEBHOOK_SECRET is not set.');

  if (!signature) return false;

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const provided = signature.replace(/^sha256=/, '');
  if (provided.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}
