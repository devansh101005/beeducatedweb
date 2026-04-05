// Cashfree Webhook Handler
// Handles payment events from Cashfree

import { Router, Request, Response } from 'express';
import { cashfreeService } from '../services/cashfreeService.js';

const router = Router();

/**
 * POST /webhooks/cashfree
 * Handle Cashfree webhook events
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const rawBody = JSON.stringify(req.body);

    // Get signature and timestamp from headers
    const signature = req.headers['x-cashfree-signature'] as string;
    const timestamp = req.headers['x-cashfree-timestamp'] as string;

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

    // Process the event
    await cashfreeService.processWebhookEvent(type, req.body);

    // Acknowledge receipt
    res.status(200).json({ received: true, event: type });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    // Return 200 to prevent Cashfree from retrying
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

export default router;
