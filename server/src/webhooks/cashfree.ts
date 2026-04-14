// Cashfree Webhook Handler
// Handles payment events from Cashfree

import { Router, Request, Response } from 'express';
import { cashfreeService } from '../services/cashfreeService.js';
import { enrollmentService } from '../services/enrollmentService.js';

const router = Router();

/**
 * POST /webhooks/cashfree
 * Handle Cashfree webhook events
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    // Get signature and timestamp from headers (Cashfree sends x-webhook-*)
    const signature = (req.headers['x-webhook-signature'] || req.headers['x-cashfree-signature']) as string;
    const timestamp = (req.headers['x-webhook-timestamp'] || req.headers['x-cashfree-timestamp']) as string;

    if (!signature || !timestamp) {
      console.warn('Cashfree webhook: Missing signature or timestamp');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify signature
    const isValid = cashfreeService.verifyWebhookSignature(rawBody, timestamp, signature);

    if (!isValid) {
      console.warn('Cashfree webhook: Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Get event data
    const { type } = req.body;

    if (!type) {
      console.warn('Cashfree webhook: Missing event type');
      return res.status(400).json({ error: 'Missing event type' });
    }

    console.log(`Cashfree webhook received: ${type}`);

    // For successful enrollment payments, use the authoritative state-transition path
    // (enrollmentService.verifyPayment) so registration_paid / enrollment activation
    // is always applied — even if the browser never reaches the return_url.
    // Falls back to the generic handler (payments table) if the order is not an enrollment.
    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = req.body?.data?.order?.order_id;
      if (orderId) {
        try {
          await enrollmentService.verifyPayment({ order_id: orderId });
          console.log(`Cashfree webhook: enrollment payment processed for ${orderId}`);
        } catch (err: any) {
          const msg = err?.message || '';
          if (msg.includes('Payment record not found')) {
            // Not an enrollment payment — it's a general fee / monthly payment row
            await cashfreeService.processWebhookEvent(type, req.body);
          } else {
            throw err;
          }
        }
      }
    } else {
      await cashfreeService.processWebhookEvent(type, req.body);
    }

    // Acknowledge receipt
    res.status(200).json({ received: true, event: type });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    // Return 200 to prevent Cashfree from retrying
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

export default router;
