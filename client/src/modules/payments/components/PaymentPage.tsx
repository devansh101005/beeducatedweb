// Payment Page
// Razorpay checkout integration

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Shield,
  Lock,
  CheckCircle,
  AlertCircle,
  Receipt,
  ArrowLeft,
  Building2,
  Smartphone,
} from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Spinner,
} from '@shared/components/ui';
import { fadeInUp } from '@shared/components/ui/motion';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

interface FeeDetails {
  id: string;
  fee_type: string;
  description: string;
  total_amount: number;
  amount_due: number;
  currency: string;
  due_date: string;
}

interface RazorpayConfig {
  keyId: string;
  currency: string;
  name: string;
  description: string;
  image: string;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// MAIN COMPONENT
// ============================================

export function PaymentPage() {
  const { feeId } = useParams<{ feeId: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [fee, setFee] = useState<FeeDetails | null>(null);
  const [razorpayConfig, setRazorpayConfig] = useState<RazorpayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'upi' | 'netbanking'>('online');

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch fee details and razorpay config
  useEffect(() => {
    const fetchData = async () => {
      if (!feeId) return;

      setLoading(true);
      try {
        const token = await getToken();

        // Fetch fee details
        const feeRes = await fetch(`${API_URL}/v2/fees/${feeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (feeRes.ok) {
          const feeData = await feeRes.json();
          setFee(feeData.data);
        } else {
          setError('Fee not found');
        }

        // Fetch Razorpay config
        const configRes = await fetch(`${API_URL}/v2/payments/razorpay/config`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (configRes.ok) {
          const configData = await configRes.json();
          setRazorpayConfig(configData.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [feeId, getToken]);

  // Apply discount code
  const handleApplyDiscount = async () => {
    if (!discountCode || !fee) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/v2/fees/validate-discount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: discountCode,
          amount: fee.amount_due,
          feeType: fee.fee_type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDiscountApplied(data.data.discountAmount);
      } else {
        setError('Invalid discount code');
      }
    } catch (err) {
      setError('Failed to apply discount');
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!fee || !razorpayConfig) return;

    setProcessing(true);
    setError(null);

    try {
      const token = await getToken();

      // Initiate payment
      const initiateRes = await fetch(`${API_URL}/v2/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          feeId: fee.id,
          amount: finalAmount,
          discountCode: discountApplied > 0 ? discountCode : undefined,
        }),
      });

      if (!initiateRes.ok) {
        throw new Error('Failed to initiate payment');
      }

      const { data: paymentData } = await initiateRes.json();
      const order: RazorpayOrder = paymentData.order;

      // Open Razorpay checkout
      const options = {
        key: razorpayConfig.keyId,
        amount: order.amount,
        currency: order.currency,
        name: razorpayConfig.name,
        description: `Payment for ${fee.description || fee.fee_type}`,
        image: razorpayConfig.image,
        order_id: order.id,
        prefill: {
          name: user?.fullName || '',
          email: user?.primaryEmailAddress?.emailAddress || '',
          contact: user?.primaryPhoneNumber?.phoneNumber || '',
        },
        theme: {
          color: '#f59e0b',
        },
        handler: async function (response: any) {
          // Complete payment
          try {
            const completeRes = await fetch(`${API_URL}/v2/payments/complete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                paymentId: paymentData.paymentId,
              }),
            });

            if (completeRes.ok) {
              navigate(`/dashboard/payments/success?paymentId=${paymentData.paymentId}`);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError('Failed to process payment. Please try again.');
      setProcessing(false);
    }
  };

  // Calculate final amount
  const finalAmount = fee ? fee.amount_due - discountApplied : 0;

  // Format currency
  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-slate-500">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error && !fee) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-heading font-semibold text-slate-900 mb-2">
            Payment Error
          </h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="mb-6"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Fees</span>
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Form */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="lg:col-span-2 space-y-6"
        >
          {/* Fee Details */}
          <Card className="p-6">
            <h2 className="text-lg font-heading font-semibold text-slate-900 mb-4">
              Payment Details
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Receipt className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{fee?.description || fee?.fee_type}</p>
                    <p className="text-sm text-slate-500">Fee ID: {fee?.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-slate-900">
                  {formatCurrency(fee?.amount_due || 0)}
                </p>
              </div>

              {/* Discount Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Discount Code (Optional)
                </label>
                <div className="flex gap-2">
                  <Input
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyDiscount}
                    disabled={!discountCode}
                  >
                    Apply
                  </Button>
                </div>
                {discountApplied > 0 && (
                  <p className="text-sm text-emerald-600 mt-1.5 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Discount of {formatCurrency(discountApplied)} applied!
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Payment Methods */}
          <Card className="p-6">
            <h2 className="text-lg font-heading font-semibold text-slate-900 mb-4">
              Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'online', label: 'Cards/Wallets', icon: CreditCard, desc: 'Credit, Debit, Wallets' },
                { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'GPay, PhonePe, Paytm' },
                { id: 'netbanking', label: 'Net Banking', icon: Building2, desc: 'All major banks' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={clsx(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    paymentMethod === method.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <method.icon className={clsx(
                    'w-6 h-6 mb-2',
                    paymentMethod === method.id ? 'text-amber-600' : 'text-slate-400'
                  )} />
                  <p className={clsx(
                    'font-medium',
                    paymentMethod === method.id ? 'text-amber-700' : 'text-slate-700'
                  )}>
                    {method.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{method.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Security Note */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <Shield className="w-5 h-5 text-slate-400 shrink-0" />
            <p className="text-sm text-slate-600">
              Your payment is secured with 256-bit SSL encryption. Powered by Razorpay.
            </p>
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 sticky top-24">
            <h2 className="text-lg font-heading font-semibold text-slate-900 mb-4">
              Order Summary
            </h2>

            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="text-slate-900">{formatCurrency(fee?.amount_due || 0)}</span>
              </div>
              {discountApplied > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Discount</span>
                  <span className="text-emerald-600">-{formatCurrency(discountApplied)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Processing Fee</span>
                <span className="text-slate-900">Free</span>
              </div>
            </div>

            <div className="flex justify-between py-4 border-b border-slate-100">
              <span className="font-medium text-slate-900">Total</span>
              <span className="text-xl font-semibold text-slate-900">
                {formatCurrency(finalAmount)}
              </span>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}

            <Button
              variant="primary"
              isFullWidth
              size="lg"
              onClick={handlePayment}
              isLoading={processing}
              leftIcon={processing ? undefined : <Lock className="w-4 h-4" />}
              className="mt-6"
            >
              {processing ? 'Processing...' : `Pay ${formatCurrency(finalAmount)}`}
            </Button>

            <div className="mt-4 flex items-center justify-center gap-2">
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500">Secure Payment</span>
            </div>

            {/* Trust badges */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-center gap-4 opacity-50">
                <img src="/razorpay-logo.svg" alt="Razorpay" className="h-5" onError={(e) => e.currentTarget.style.display = 'none'} />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default PaymentPage;
