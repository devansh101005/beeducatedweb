// Cashfree Service
// Handles Cashfree payment gateway integration
// Replaces razorpayService.ts

import crypto from 'crypto';
import { getSupabase } from '../config/supabase.js';
import { env } from '../config/env.js';

// Types
export interface CreateOrderInput {
  orderId: string; // Your unique order/receipt ID
  amount: number; // Amount in INR (not paise)
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes?: Record<string, string>;
}

export interface CashfreeOrderResult {
  cf_order_id: string;
  order_id: string;
  payment_session_id: string;
  order_status: string;
  order_amount: number;
  order_currency: string;
}

export interface CashfreePayment {
  cf_payment_id: string;
  order_id: string;
  payment_status: string;
  payment_amount: number;
  payment_currency: string;
  payment_method: {
    type: string;
    upi?: { upi_id: string };
    card?: { card_number: string; card_network: string; card_type: string };
    netbanking?: { netbanking_bank_code: string; netbanking_bank_name: string };
  };
  bank_reference: string;
  payment_time: string;
}

export interface RefundInput {
  paymentId: string; // cf_payment_id
  refundAmount: number; // in INR
  refundId: string; // your unique refund ID
  refundNote?: string;
  refundSpeed?: 'STANDARD' | 'INSTANT';
}

export interface CashfreeRefund {
  cf_refund_id: string;
  refund_id: string;
  order_id: string;
  refund_amount: number;
  refund_status: string;
  refund_speed: string;
}

class CashfreeService {
  private supabase = getSupabase();

  private getBaseUrl(): string {
    return env.NODE_ENV === 'production'
      ? 'https://api.cashfree.com/pg'
      : 'https://sandbox.cashfree.com/pg';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-client-id': env.CASHFREE_APP_ID,
      'x-client-secret': env.CASHFREE_SECRET_KEY,
      'x-api-version': env.CASHFREE_API_VERSION || '2023-08-01',
    };
  }

  /**
   * Check if Cashfree is configured
   */
  isConfigured(): boolean {
    return !!(env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY);
  }

  /**
   * Get Cashfree app ID (for client-side)
   */
  getAppId(): string {
    return env.CASHFREE_APP_ID;
  }

  /**
   * Get environment mode for frontend SDK
   */
  getEnvironment(): 'sandbox' | 'production' {
    return env.NODE_ENV === 'production' ? 'production' : 'sandbox';
  }

  /**
   * Create Cashfree order and get payment session ID
   */
  async createOrder(input: CreateOrderInput): Promise<CashfreeOrderResult> {
    if (!this.isConfigured()) {
      throw new Error('Cashfree is not configured');
    }

    const payload = {
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: input.currency || 'INR',
      customer_details: {
        customer_id: input.notes?.studentId || `cust_${Date.now()}`,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
      },
      order_meta: {
        return_url: `${env.FRONTEND_URL}/dashboard/payment-success?order_id={order_id}`,
        notify_url: `${env.NODE_ENV === 'production' ? 'https://beeducatedweb-backend.onrender.com' : `http://localhost:${env.PORT}`}/api/v2/webhooks/cashfree`,
      },
      order_note: input.notes ? JSON.stringify(input.notes) : undefined,
    };

    const response = await fetch(`${this.getBaseUrl()}/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Cashfree create order failed:', response.status, errorBody);
      throw new Error(`Failed to create Cashfree order: ${response.status}`);
    }

    const data = await response.json();
    return data as CashfreeOrderResult;
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<CashfreeOrderResult> {
    if (!this.isConfigured()) {
      throw new Error('Cashfree is not configured');
    }

    const response = await fetch(`${this.getBaseUrl()}/orders/${orderId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Cashfree order: ${response.status}`);
    }

    return (await response.json()) as CashfreeOrderResult;
  }

  /**
   * Get payments for an order
   */
  async getOrderPayments(orderId: string): Promise<CashfreePayment[]> {
    if (!this.isConfigured()) {
      throw new Error('Cashfree is not configured');
    }

    const response = await fetch(`${this.getBaseUrl()}/orders/${orderId}/payments`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payments: ${response.status}`);
    }

    return (await response.json()) as CashfreePayment[];
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
    const webhookSecret = env.CASHFREE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('Cashfree webhook secret not configured');
      return false;
    }

    const signatureData = timestamp + rawBody;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signatureData)
      .digest('base64');

    return expectedSignature === signature;
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(eventType: string, payload: Record<string, any>): Promise<void> {
    console.log(`Processing Cashfree webhook event: ${eventType}`);

    switch (eventType) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        await this.handlePaymentSuccess(payload);
        break;

      case 'PAYMENT_FAILED_WEBHOOK':
        await this.handlePaymentFailed(payload);
        break;

      case 'REFUND_STATUS_WEBHOOK':
        await this.handleRefundStatus(payload);
        break;

      default:
        console.log(`Unhandled Cashfree event: ${eventType}`);
    }
  }

  /**
   * Handle successful payment webhook
   */
  private async handlePaymentSuccess(payload: Record<string, any>): Promise<void> {
    const orderData = payload.data?.order;
    const paymentData = payload.data?.payment;
    if (!orderData || !paymentData) return;

    const orderId = orderData.order_id;
    const cfPaymentId = paymentData.cf_payment_id?.toString();

    // Note: enrollment_payments updates are handled by enrollmentService.verifyPayment
    // (called from the webhook route for PAYMENT_SUCCESS_WEBHOOK). This method is only
    // invoked as a fallback for general fee payments that live in the `payments` table.

    await this.supabase
      .from('payments')
      .update({
        status: 'completed',
        cashfree_payment_id: cfPaymentId,
        completed_at: new Date().toISOString(),
      })
      .eq('cashfree_order_id', orderId);

    await this.logTransaction(orderId, 'payment', orderData.order_amount, 'completed', payload);
  }

  /**
   * Handle failed payment webhook
   */
  private async handlePaymentFailed(payload: Record<string, any>): Promise<void> {
    const orderData = payload.data?.order;
    const paymentData = payload.data?.payment;
    if (!orderData) return;

    const orderId = orderData.order_id;
    const errorMessage = paymentData?.payment_message || 'Payment failed';

    await this.supabase
      .from('enrollment_payments')
      .update({
        status: 'failed',
        error_description: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('cashfree_order_id', orderId);

    await this.supabase
      .from('payments')
      .update({
        status: 'failed',
        status_reason: errorMessage,
      })
      .eq('cashfree_order_id', orderId);

    await this.logTransaction(orderId, 'payment', orderData.order_amount, 'failed', payload);
  }

  /**
   * Handle refund status webhook
   */
  private async handleRefundStatus(payload: Record<string, any>): Promise<void> {
    const refundData = payload.data?.refund;
    if (!refundData) return;

    const cfPaymentId = refundData.cf_payment_id?.toString();
    const refundStatus = refundData.refund_status;

    if (refundStatus === 'SUCCESS') {
      await this.supabase
        .from('payments')
        .update({
          refund_status: 'completed',
          refunded_at: new Date().toISOString(),
          status: 'refunded',
        })
        .eq('cashfree_payment_id', cfPaymentId);
    } else if (refundStatus === 'FAILED') {
      await this.supabase
        .from('payments')
        .update({ refund_status: 'failed' })
        .eq('cashfree_payment_id', cfPaymentId);
    }
  }

  /**
   * Create refund
   */
  async createRefund(input: RefundInput): Promise<CashfreeRefund> {
    if (!this.isConfigured()) {
      throw new Error('Cashfree is not configured');
    }

    // First, find the order_id from the payment
    const { data: payment } = await this.supabase
      .from('payments')
      .select('cashfree_order_id')
      .eq('cashfree_payment_id', input.paymentId)
      .single();

    if (!payment?.cashfree_order_id) {
      throw new Error('Payment not found or missing Cashfree order ID');
    }

    const payload = {
      refund_amount: input.refundAmount,
      refund_id: input.refundId,
      refund_note: input.refundNote || 'Refund requested',
      refund_speed: input.refundSpeed || 'STANDARD',
    };

    const response = await fetch(
      `${this.getBaseUrl()}/orders/${payment.cashfree_order_id}/refunds`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Cashfree refund failed:', response.status, errorBody);
      throw new Error(`Failed to create refund: ${response.status}`);
    }

    return (await response.json()) as CashfreeRefund;
  }

  /**
   * Log transaction for audit trail
   */
  private async logTransaction(
    orderId: string,
    type: string,
    amount: number,
    status: string,
    response: Record<string, unknown>
  ): Promise<void> {
    // Find payment by Cashfree order ID
    const { data: payment } = await this.supabase
      .from('payments')
      .select('id')
      .eq('cashfree_order_id', orderId)
      .single();

    if (!payment) return;

    await this.supabase.from('payment_transactions').insert({
      payment_id: payment.id,
      transaction_type: type,
      amount,
      currency: 'INR',
      status,
      gateway_response: response,
      gateway_transaction_id: orderId,
    });
  }
}

// Export singleton instance
export const cashfreeService = new CashfreeService();
