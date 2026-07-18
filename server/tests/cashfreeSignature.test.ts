// Unit tests for Cashfree webhook signature verification.
// HMAC-SHA256(secret, timestamp + rawBody), base64 — computed here
// independently and compared against the service's verdict.
import crypto from 'crypto';
import { describe, it, expect } from 'vitest';
import { cashfreeService } from '../src/services/cashfreeService';

const SECRET = 'test-webhook-secret'; // matches vitest.config.ts env

function sign(timestamp: string, rawBody: string, secret: string = SECRET): string {
  return crypto.createHmac('sha256', secret).update(timestamp + rawBody).digest('base64');
}

describe('cashfreeService.verifyWebhookSignature', () => {
  const timestamp = '1710000000';
  const rawBody = JSON.stringify({
    type: 'PAYMENT_SUCCESS_WEBHOOK',
    data: { order: { order_id: 'order_123', order_amount: 499 } },
  });

  it('accepts a signature computed with the shared secret over timestamp + raw body', () => {
    const signature = sign(timestamp, rawBody);
    expect(cashfreeService.verifyWebhookSignature(rawBody, timestamp, signature)).toBe(true);
  });

  it('rejects a signature made with a different secret', () => {
    const forged = sign(timestamp, rawBody, 'attacker-secret');
    expect(cashfreeService.verifyWebhookSignature(rawBody, timestamp, forged)).toBe(false);
  });

  it('rejects when the body was tampered with after signing', () => {
    const signature = sign(timestamp, rawBody);
    const tampered = rawBody.replace('499', '1');
    expect(cashfreeService.verifyWebhookSignature(tampered, timestamp, signature)).toBe(false);
  });

  it('rejects when the timestamp differs from the signed one (replay defense)', () => {
    const signature = sign(timestamp, rawBody);
    expect(cashfreeService.verifyWebhookSignature(rawBody, '1710009999', signature)).toBe(false);
  });

  it('rejects an empty signature', () => {
    expect(cashfreeService.verifyWebhookSignature(rawBody, timestamp, '')).toBe(false);
  });
});
