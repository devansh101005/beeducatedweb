// Payment Service
// Handles payment creation, tracking, and processing

import { getSupabase } from '../config/supabase.js';
import { razorpayService } from './razorpayService.js';
import { feeService, PaymentStatus } from './feeService.js';

// Types
export type PaymentMethod = 'razorpay' | 'bank_transfer' | 'cash' | 'cheque' | 'upi' | 'card' | 'wallet' | 'emi' | 'other';

export interface Payment {
  id: string;
  payment_number: string;
  student_id: string;
  student_fee_id: string | null;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  razorpay_invoice_id: string | null;
  bank_name: string | null;
  bank_reference: string | null;
  transaction_id: string | null;
  cheque_number: string | null;
  cheque_date: string | null;
  cheque_bank: string | null;
  status: PaymentStatus;
  status_reason: string | null;
  refund_amount: number | null;
  refund_status: string | null;
  refund_id: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
  initiated_at: string;
  completed_at: string | null;
  receipt_url: string | null;
  receipt_number: string | null;
  payer_name: string | null;
  payer_email: string | null;
  payer_phone: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentInput {
  student_id: string;
  student_fee_id?: string;
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  payer_name?: string;
  payer_email?: string;
  payer_phone?: string;
  notes?: string;
  ip_address?: string;
  user_agent?: string;
  created_by?: string;
}

export interface InitiateRazorpayPaymentInput {
  student_id: string;
  student_fee_id?: string;
  amount: number;
  payer_name?: string;
  payer_email?: string;
  payer_phone?: string;
  discount_code?: string;
  notes?: string;
  created_by?: string;
}

export interface CompleteRazorpayPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentListOptions {
  page?: number;
  limit?: number;
  studentId?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
}

class PaymentService {
  private supabase = getSupabase();

  /**
   * Generate payment number
   */
  private async generatePaymentNumber(): Promise<string> {
    const { data } = await this.supabase.rpc('generate_payment_number');
    return data || `PAY-${Date.now()}`;
  }

  /**
   * Create payment record
   */
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    const paymentNumber = await this.generatePaymentNumber();

    const { data, error } = await this.supabase
      .from('payments')
      .insert({
        payment_number: paymentNumber,
        student_id: input.student_id,
        student_fee_id: input.student_fee_id,
        amount: input.amount,
        currency: input.currency || 'INR',
        payment_method: input.payment_method,
        status: 'pending',
        payer_name: input.payer_name,
        payer_email: input.payer_email,
        payer_phone: input.payer_phone,
        notes: input.notes,
        ip_address: input.ip_address,
        user_agent: input.user_agent,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create payment: ${error.message}`);
    }

    return data as Payment;
  }

  /**
   * Initiate Razorpay payment
   */
  async initiateRazorpayPayment(input: InitiateRazorpayPaymentInput): Promise<{
    payment: Payment;
    razorpayOrder: {
      id: string;
      amount: number;
      currency: string;
    };
    keyId: string;
  }> {
    let finalAmount = input.amount;
    let discountCodeId: string | undefined;

    // Apply discount code if provided
    if (input.discount_code) {
      const discountResult = await feeService.validateDiscount(
        input.discount_code,
        input.student_id,
        input.amount
      );

      if (discountResult.valid) {
        finalAmount = input.amount - discountResult.discountAmount;
        const discountCode = await feeService.getDiscountCode(input.discount_code);
        discountCodeId = discountCode?.id;
      } else {
        throw new Error(discountResult.message || 'Invalid discount code');
      }
    }

    // Create payment record
    const payment = await this.createPayment({
      student_id: input.student_id,
      student_fee_id: input.student_fee_id,
      amount: finalAmount,
      payment_method: 'razorpay',
      payer_name: input.payer_name,
      payer_email: input.payer_email,
      payer_phone: input.payer_phone,
      notes: input.notes,
      created_by: input.created_by,
    });

    // Store discount code ID in metadata if used
    if (discountCodeId) {
      await this.supabase
        .from('payments')
        .update({
          metadata: { discount_code_id: discountCodeId, original_amount: input.amount },
        })
        .eq('id', payment.id);
    }

    // Create Razorpay order
    const razorpayOrder = await razorpayService.createOrder({
      amount: Math.round(finalAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: payment.payment_number,
      notes: {
        payment_id: payment.id,
        student_id: input.student_id,
        student_fee_id: input.student_fee_id || '',
      },
    });

    // Update payment with Razorpay order ID
    await this.supabase
      .from('payments')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', payment.id);

    return {
      payment: { ...payment, razorpay_order_id: razorpayOrder.id },
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      keyId: razorpayService.getKeyId(),
    };
  }

  /**
   * Complete Razorpay payment after successful payment
   */
  async completeRazorpayPayment(input: CompleteRazorpayPaymentInput): Promise<Payment> {
    // Verify signature
    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id: input.razorpay_order_id,
      razorpay_payment_id: input.razorpay_payment_id,
      razorpay_signature: input.razorpay_signature,
    });

    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    // Get payment by order ID
    const { data: payment, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', input.razorpay_order_id)
      .single();

    if (error || !payment) {
      throw new Error('Payment not found');
    }

    // Update payment status
    const { data: updatedPayment, error: updateError } = await this.supabase
      .from('payments')
      .update({
        razorpay_payment_id: input.razorpay_payment_id,
        razorpay_signature: input.razorpay_signature,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', payment.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to complete payment: ${updateError.message}`);
    }

    // Record discount usage if applicable
    const paymentData = payment as Payment;
    const metadata = paymentData.metadata as { discount_code_id?: string };
    if (metadata?.discount_code_id && paymentData.student_fee_id) {
      await feeService.recordDiscountUsage(
        metadata.discount_code_id,
        paymentData.student_id,
        paymentData.id,
        paymentData.student_fee_id,
        paymentData.amount
      );
    }

    // Log transaction
    await this.logTransaction(payment.id, 'payment', payment.amount, 'completed', {
      razorpay_payment_id: input.razorpay_payment_id,
    });

    return updatedPayment as Payment;
  }

  /**
   * Record manual payment (cash, cheque, bank transfer)
   */
  async recordManualPayment(input: {
    student_id: string;
    student_fee_id?: string;
    amount: number;
    payment_method: PaymentMethod;
    transaction_id?: string;
    bank_name?: string;
    bank_reference?: string;
    cheque_number?: string;
    cheque_date?: string;
    cheque_bank?: string;
    payer_name?: string;
    payer_email?: string;
    payer_phone?: string;
    notes?: string;
    created_by?: string;
  }): Promise<Payment> {
    const paymentNumber = await this.generatePaymentNumber();

    const { data, error } = await this.supabase
      .from('payments')
      .insert({
        payment_number: paymentNumber,
        student_id: input.student_id,
        student_fee_id: input.student_fee_id,
        amount: input.amount,
        currency: 'INR',
        payment_method: input.payment_method,
        status: 'completed',
        completed_at: new Date().toISOString(),
        transaction_id: input.transaction_id,
        bank_name: input.bank_name,
        bank_reference: input.bank_reference,
        cheque_number: input.cheque_number,
        cheque_date: input.cheque_date,
        cheque_bank: input.cheque_bank,
        payer_name: input.payer_name,
        payer_email: input.payer_email,
        payer_phone: input.payer_phone,
        notes: input.notes,
        created_by: input.created_by,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record payment: ${error.message}`);
    }

    // Log transaction
    await this.logTransaction(data.id, 'payment', input.amount, 'completed', {
      method: input.payment_method,
      transaction_id: input.transaction_id,
    });

    return data as Payment;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get payment: ${error.message}`);
    }

    return data as Payment;
  }

  /**
   * Get payment by payment number
   */
  async getPaymentByNumber(paymentNumber: string): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('payment_number', paymentNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get payment: ${error.message}`);
    }

    return data as Payment;
  }

  /**
   * Get payment by Razorpay order ID
   */
  async getPaymentByRazorpayOrderId(orderId: string): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get payment: ${error.message}`);
    }

    return data as Payment;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    id: string,
    status: PaymentStatus,
    statusReason?: string
  ): Promise<Payment> {
    const updates: Record<string, unknown> = { status };

    if (statusReason) {
      updates.status_reason = statusReason;
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update payment: ${error.message}`);
    }

    return data as Payment;
  }

  /**
   * List payments
   */
  async listPayments(options: PaymentListOptions = {}): Promise<{ payments: Payment[]; total: number }> {
    const { page = 1, limit = 20, studentId, status, paymentMethod, dateFrom, dateTo } = options;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('payments')
      .select('*', { count: 'exact' });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list payments: ${error.message}`);
    }

    return {
      payments: data as Payment[],
      total: count || 0,
    };
  }

  /**
   * Get payment history with details
   */
  async getPaymentHistory(studentId: string): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payment_history')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get payment history: ${error.message}`);
    }

    return data as Payment[];
  }

  /**
   * Initiate refund
   */
  async initiateRefund(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId);

    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Can only refund completed payments');
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new Error('Refund amount exceeds payment amount');
    }

    // For Razorpay payments, initiate refund through gateway
    if (payment.payment_method === 'razorpay' && payment.razorpay_payment_id) {
      const refund = await razorpayService.createRefund({
        paymentId: payment.razorpay_payment_id,
        amount: refundAmount ? Math.round(refundAmount * 100) : undefined,
        notes: { reason: reason || 'Refund requested' },
      });

      const { data, error } = await this.supabase
        .from('payments')
        .update({
          refund_amount: refundAmount,
          refund_status: 'processing',
          refund_id: refund.id,
          refund_reason: reason,
          status: refundAmount >= payment.amount ? 'refunded' : 'partially_refunded',
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        // Razorpay refund was issued but DB update failed — log prominently for manual reconciliation
        console.error(`[REFUND_DB_FAIL] razorpay_refund_id=${refund.id} payment_id=${paymentId} amount=${refundAmount} — DB update failed: ${error.message}`);
        throw new Error(`Failed to update refund status: ${error.message}`);
      }

      // Log transaction
      await this.logTransaction(paymentId, 'refund', refundAmount, 'processing', {
        refund_id: refund.id,
        reason,
      });

      return data as Payment;
    }

    // For manual payments, just update the status
    const { data, error } = await this.supabase
      .from('payments')
      .update({
        refund_amount: refundAmount,
        refund_status: 'completed',
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
        status: refundAmount >= payment.amount ? 'refunded' : 'partially_refunded',
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to process refund: ${error.message}`);
    }

    // Log transaction
    await this.logTransaction(paymentId, 'refund', refundAmount, 'completed', { reason });

    return data as Payment;
  }

  /**
   * Get payment summary for a student
   */
  async getPaymentSummary(studentId: string): Promise<{
    totalPaid: number;
    totalPending: number;
    totalRefunded: number;
    paymentCount: number;
    lastPaymentDate: string | null;
  }> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('amount, status, refund_amount, completed_at')
      .eq('student_id', studentId);

    if (error) {
      throw new Error(`Failed to get payment summary: ${error.message}`);
    }

    const completed = data.filter((p) => p.status === 'completed');
    const pending = data.filter((p) => p.status === 'pending' || p.status === 'processing');
    const refunded = data.filter((p) => p.status === 'refunded' || p.status === 'partially_refunded');

    const lastPayment = completed
      .filter((p) => p.completed_at)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0];

    return {
      totalPaid: completed.reduce((sum, p) => sum + Number(p.amount), 0),
      totalPending: pending.reduce((sum, p) => sum + Number(p.amount), 0),
      totalRefunded: refunded.reduce((sum, p) => sum + Number(p.refund_amount || 0), 0),
      paymentCount: completed.length,
      lastPaymentDate: lastPayment?.completed_at || null,
    };
  }

  /**
   * Get payment analytics for admin
   */
  async getPaymentAnalytics(options: {
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<{
    totalCollected: number;
    totalRefunded: number;
    paymentCount: number;
    avgPaymentAmount: number;
    paymentsByMethod: Record<string, number>;
    paymentsByStatus: Record<string, number>;
    dailyCollection: { date: string; amount: number }[];
  }> {
    let query = this.supabase.from('payments').select('*');

    if (options.dateFrom) {
      query = query.gte('created_at', options.dateFrom);
    }

    if (options.dateTo) {
      query = query.lte('created_at', options.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }

    const payments = data as Payment[];
    const completed = payments.filter((p) => p.status === 'completed');

    // Group by method
    const paymentsByMethod: Record<string, number> = {};
    const paymentsByStatus: Record<string, number> = {};

    for (const payment of payments) {
      paymentsByMethod[payment.payment_method] = (paymentsByMethod[payment.payment_method] || 0) + 1;
      paymentsByStatus[payment.status] = (paymentsByStatus[payment.status] || 0) + 1;
    }

    // Daily collection
    const dailyMap: Record<string, number> = {};
    for (const payment of completed) {
      const date = payment.completed_at?.split('T')[0] || payment.created_at.split('T')[0];
      dailyMap[date] = (dailyMap[date] || 0) + Number(payment.amount);
    }

    const dailyCollection = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalCollected: completed.reduce((sum, p) => sum + Number(p.amount), 0),
      totalRefunded: payments
        .filter((p) => p.refund_amount)
        .reduce((sum, p) => sum + Number(p.refund_amount || 0), 0),
      paymentCount: completed.length,
      avgPaymentAmount: completed.length > 0
        ? completed.reduce((sum, p) => sum + Number(p.amount), 0) / completed.length
        : 0,
      paymentsByMethod,
      paymentsByStatus,
      dailyCollection,
    };
  }

  /**
   * Log transaction
   */
  private async logTransaction(
    paymentId: string,
    type: string,
    amount: number,
    status: string,
    response: Record<string, unknown>
  ): Promise<void> {
    await this.supabase.from('payment_transactions').insert({
      payment_id: paymentId,
      transaction_type: type,
      amount,
      currency: 'INR',
      status,
      gateway_response: response,
    });
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
