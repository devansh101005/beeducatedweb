// Razorpay Service
// Handles Razorpay payment gateway integration

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getSupabase } from '../config/supabase.js';

// Lazy-loaded Razorpay instance (only created when credentials are available)
let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
}

// Types
export interface CreateOrderInput {
  amount: number; // Amount in paise (INR smallest unit)
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  paymentCapture?: boolean;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayPayment {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  captured: boolean;
  description: string;
  card_id: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  created_at: number;
}

export interface RefundInput {
  paymentId: string;
  amount?: number; // Optional for partial refund (in paise)
  speed?: 'normal' | 'optimum';
  notes?: Record<string, string>;
  receipt?: string;
}

export interface RazorpayRefund {
  id: string;
  entity: string;
  amount: number;
  receipt: string;
  currency: string;
  payment_id: string;
  notes: Record<string, string>;
  status: string;
  speed_processed: string;
  speed_requested: string;
  created_at: number;
}

class RazorpayService {
  private supabase = getSupabase();

  /**
   * Check if Razorpay is configured
   */
  isConfigured(): boolean {
    return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  /**
   * Get Razorpay key ID (for client-side)
   */
  getKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || '';
  }

  /**
   * Create Razorpay order
   */
  async createOrder(input: CreateOrderInput): Promise<RazorpayOrder> {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured');
    }

    const options = {
      amount: input.amount, // Amount in paise
      currency: input.currency || 'INR',
      receipt: input.receipt || `receipt_${Date.now()}`,
      notes: input.notes || {},
      payment_capture: input.paymentCapture !== false ? 1 : 0,
    };

    const order = await getRazorpay().orders.create(options);
    return order as RazorpayOrder;
  }

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(input: VerifyPaymentInput): boolean {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured');
    }

    const body = input.razorpay_order_id + '|' + input.razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest('hex');

    return expectedSignature === input.razorpay_signature;
  }

  /**
   * Fetch payment details
   */
  async getPayment(paymentId: string): Promise<RazorpayPayment> {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured');
    }

    const payment = await getRazorpay().payments.fetch(paymentId);
    return payment as RazorpayPayment;
  }

  /**
   * Fetch order details
   */
  async getOrder(orderId: string): Promise<RazorpayOrder> {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured');
    }

    const order = await getRazorpay().orders.fetch(orderId);
    return order as RazorpayOrder;
  }

  /**
   * Capture payment (for manual capture mode)
   */
  async capturePayment(paymentId: string, amount: number, currency: string = 'INR'): Promise<RazorpayPayment> {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured');
    }

    const payment = await getRazorpay().payments.capture(paymentId, amount, currency);
    return payment as RazorpayPayment;
  }

  /**
   * Create refund
   */
  async createRefund(input: RefundInput): Promise<RazorpayRefund> {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured');
    }

    const options: Record<string, unknown> = {
      speed: input.speed || 'normal',
      notes: input.notes || {},
      receipt: input.receipt,
    };

    if (input.amount) {
      options.amount = input.amount;
    }

    const refund = await getRazorpay().payments.refund(input.paymentId, options);
    return refund as RazorpayRefund;
  }

  /**
   * Fetch refund details
   */
  async getRefund(_paymentId: string, refundId: string): Promise<RazorpayRefund> {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured');
    }

    const refund = await getRazorpay().refunds.fetch(refundId);
    return refund as RazorpayRefund;
  }

  /**
   * Get all refunds for a payment
   */
  async getPaymentRefunds(paymentId: string): Promise<RazorpayRefund[]> {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured');
    }

    const refunds = await getRazorpay().payments.fetchMultipleRefund(paymentId, {});
    return (refunds.items || []) as RazorpayRefund[];
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    if (!webhookSecret) {
      console.warn('Razorpay webhook secret not configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: string, payload: Record<string, unknown>): Promise<void> {
    console.log(`Processing Razorpay webhook event: ${event}`);

    switch (event) {
      case 'payment.authorized':
        await this.handlePaymentAuthorized(payload);
        break;

      case 'payment.captured':
        await this.handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(payload);
        break;

      case 'refund.created':
        await this.handleRefundCreated(payload);
        break;

      case 'refund.processed':
        await this.handleRefundProcessed(payload);
        break;

      case 'refund.failed':
        await this.handleRefundFailed(payload);
        break;

      case 'order.paid':
        await this.handleOrderPaid(payload);
        break;

      default:
        console.log(`Unhandled Razorpay event: ${event}`);
    }
  }

  /**
   * Handle payment.authorized webhook
   */
  private async handlePaymentAuthorized(payload: Record<string, unknown>): Promise<void> {
    const payment = (payload.payment as { entity: RazorpayPayment })?.entity;
    if (!payment) return;

    await this.updatePaymentStatus(payment.order_id, {
      status: 'processing',
      razorpay_payment_id: payment.id,
    });

    await this.logTransaction(payment.order_id, 'payment', payment.amount, 'authorized', payload);
  }

  /**
   * Handle payment.captured webhook
   */
  private async handlePaymentCaptured(payload: Record<string, unknown>): Promise<void> {
    const payment = (payload.payment as { entity: RazorpayPayment })?.entity;
    if (!payment) return;

    await this.updatePaymentStatus(payment.order_id, {
      status: 'completed',
      razorpay_payment_id: payment.id,
      completed_at: new Date().toISOString(),
    });

    await this.logTransaction(payment.order_id, 'payment', payment.amount, 'captured', payload);
  }

  /**
   * Handle payment.failed webhook
   */
  private async handlePaymentFailed(payload: Record<string, unknown>): Promise<void> {
    const payment = (payload.payment as { entity: RazorpayPayment })?.entity;
    if (!payment) return;

    await this.updatePaymentStatus(payment.order_id, {
      status: 'failed',
      razorpay_payment_id: payment.id,
      status_reason: payment.error_description || 'Payment failed',
    });

    await this.logTransaction(payment.order_id, 'payment', payment.amount, 'failed', payload);
  }

  /**
   * Handle refund.created webhook
   */
  private async handleRefundCreated(payload: Record<string, unknown>): Promise<void> {
    const refund = (payload.refund as { entity: RazorpayRefund })?.entity;
    if (!refund) return;

    await this.updatePaymentRefundStatus(refund.payment_id, {
      refund_status: 'processing',
      refund_id: refund.id,
      refund_amount: refund.amount / 100, // Convert from paise
    });

    await this.logTransaction(refund.payment_id, 'refund', refund.amount, 'created', payload);
  }

  /**
   * Handle refund.processed webhook
   */
  private async handleRefundProcessed(payload: Record<string, unknown>): Promise<void> {
    const refund = (payload.refund as { entity: RazorpayRefund })?.entity;
    if (!refund) return;

    await this.updatePaymentRefundStatus(refund.payment_id, {
      refund_status: 'completed',
      refund_id: refund.id,
      refunded_at: new Date().toISOString(),
      status: 'refunded',
    });

    await this.logTransaction(refund.payment_id, 'refund', refund.amount, 'processed', payload);
  }

  /**
   * Handle refund.failed webhook
   */
  private async handleRefundFailed(payload: Record<string, unknown>): Promise<void> {
    const refund = (payload.refund as { entity: RazorpayRefund })?.entity;
    if (!refund) return;

    await this.updatePaymentRefundStatus(refund.payment_id, {
      refund_status: 'failed',
    });

    await this.logTransaction(refund.payment_id, 'refund', refund.amount, 'failed', payload);
  }

  /**
   * Handle order.paid webhook
   */
  private async handleOrderPaid(payload: Record<string, unknown>): Promise<void> {
    const order = (payload.order as { entity: RazorpayOrder })?.entity;
    if (!order) return;

    await this.updatePaymentStatus(order.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  }

  /**
   * Update payment status by Razorpay order ID
   */
  private async updatePaymentStatus(
    razorpayOrderId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('payments')
      .update(updates)
      .eq('razorpay_order_id', razorpayOrderId);

    if (error) {
      console.error('Failed to update payment status:', error);
    }
  }

  /**
   * Update payment refund status by Razorpay payment ID
   */
  private async updatePaymentRefundStatus(
    razorpayPaymentId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('payments')
      .update(updates)
      .eq('razorpay_payment_id', razorpayPaymentId);

    if (error) {
      console.error('Failed to update payment refund status:', error);
    }
  }

  /**
   * Log transaction
   */
  private async logTransaction(
    identifier: string,
    type: string,
    amount: number,
    status: string,
    response: Record<string, unknown>
  ): Promise<void> {
    // Find payment by order ID or payment ID
    const { data: payment } = await this.supabase
      .from('payments')
      .select('id')
      .or(`razorpay_order_id.eq.${identifier},razorpay_payment_id.eq.${identifier}`)
      .single();

    if (!payment) return;

    await this.supabase.from('payment_transactions').insert({
      payment_id: payment.id,
      transaction_type: type,
      amount: amount / 100, // Convert from paise
      currency: 'INR',
      status,
      gateway_response: response,
      gateway_transaction_id: identifier,
    });
  }

  /**
   * Create payment link (for sharing)
   */
  async createPaymentLink(options: {
    amount: number;
    currency?: string;
    description: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    callbackUrl?: string;
    callbackMethod?: 'get' | 'post';
    expireBy?: number;
    notes?: Record<string, string>;
  }): Promise<{ short_url: string; id: string }> {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured');
    }

    const paymentLink = await getRazorpay().paymentLink.create({
      amount: options.amount,
      currency: options.currency || 'INR',
      accept_partial: false,
      description: options.description,
      customer: {
        name: options.customerName,
        email: options.customerEmail,
        contact: options.customerPhone,
      },
      notify: {
        sms: !!options.customerPhone,
        email: !!options.customerEmail,
      },
      reminder_enable: true,
      notes: options.notes || {},
      callback_url: options.callbackUrl,
      callback_method: options.callbackMethod || 'get',
      expire_by: options.expireBy,
    });

    return {
      short_url: paymentLink.short_url,
      id: paymentLink.id,
    };
  }
}

// Export singleton instance
export const razorpayService = new RazorpayService();
