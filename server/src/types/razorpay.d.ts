// Type declarations for razorpay module

declare module 'razorpay' {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  interface OrderCreateOptions {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, string>;
    payment_capture?: number;
  }

  interface Order {
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

  interface Payment {
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

  interface Refund {
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

  interface RefundOptions {
    amount?: number;
    speed?: 'normal' | 'optimum';
    notes?: Record<string, string>;
    receipt?: string;
  }

  interface PaymentLinkOptions {
    amount: number;
    currency: string;
    accept_partial?: boolean;
    description: string;
    customer?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    notify?: {
      sms?: boolean;
      email?: boolean;
    };
    reminder_enable?: boolean;
    notes?: Record<string, string>;
    callback_url?: string;
    callback_method?: string;
    expire_by?: number;
  }

  interface PaymentLink {
    id: string;
    short_url: string;
  }

  interface Orders {
    create(options: OrderCreateOptions): Promise<Order>;
    fetch(orderId: string): Promise<Order>;
  }

  interface Payments {
    fetch(paymentId: string): Promise<Payment>;
    capture(paymentId: string, amount: number, currency: string): Promise<Payment>;
    refund(paymentId: string, options?: RefundOptions): Promise<Refund>;
    fetchMultipleRefund(paymentId: string, options: Record<string, unknown>): Promise<{ items: Refund[] }>;
  }

  interface Refunds {
    fetch(refundId: string): Promise<Refund>;
  }

  interface PaymentLinks {
    create(options: PaymentLinkOptions): Promise<PaymentLink>;
  }

  class Razorpay {
    constructor(options: RazorpayOptions);
    orders: Orders;
    payments: Payments;
    refunds: Refunds;
    paymentLink: PaymentLinks;
  }

  export = Razorpay;
}
