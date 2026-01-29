// Razorpay Webhook Handler
// Handles payment events from Razorpay

import { Router, Request, Response } from 'express';
import { razorpayService } from '../services/razorpayService.js';

const router = Router();

/**
 * POST /webhooks/razorpay
 * Handle Razorpay webhook events
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Get the raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    // Get signature from headers
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      console.warn('Razorpay webhook: Missing signature');
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Verify signature
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.warn('Razorpay webhook: Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Get event data
    const { event, payload } = req.body;

    if (!event || !payload) {
      console.warn('Razorpay webhook: Missing event or payload');
      return res.status(400).json({ error: 'Missing event or payload' });
    }

    console.log(`Razorpay webhook received: ${event}`);

    // Process the event
    await razorpayService.processWebhookEvent(event, payload);

    // Acknowledge receipt
    res.status(200).json({ received: true, event });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    // Return 200 to prevent Razorpay from retrying
    res.status(200).json({ received: true, error: 'Processing error' });
  }
});

export default router;
