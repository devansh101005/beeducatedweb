// Payment Success Page
// Confirmation after successful payment

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Download,
  Mail,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Card, Button, Spinner } from '@shared/components/ui';
import confetti from 'canvas-confetti';

// ============================================
// TYPES
// ============================================

interface PaymentDetails {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  razorpay_payment_id: string;
  created_at: string;
  fee?: {
    id: string;
    fee_type: string;
    description: string;
  };
  student?: {
    first_name: string;
    last_name: string;
    student_id: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ============================================
// MAIN COMPONENT
// ============================================

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const { getToken } = useAuth();

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Trigger confetti on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#0ea5e9'],
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Fetch payment details
  useEffect(() => {
    const fetchPayment = async () => {
      if (!paymentId) {
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/v2/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setPayment(data.data);
        }
      } catch (error) {
        console.error('Error fetching payment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId, getToken]);

  // Format currency
  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-heading font-semibold text-slate-900 mb-2"
          >
            Payment Successful!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 mb-8"
          >
            Your payment has been processed successfully.
          </motion.p>

          {/* Amount */}
          {payment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <p className="text-4xl font-heading font-bold text-slate-900">
                {formatCurrency(payment.amount, payment.currency)}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {payment.fee?.description || payment.fee?.fee_type}
              </p>
            </motion.div>
          )}

          {/* Payment Details */}
          {payment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-slate-50 rounded-xl p-4 mb-8"
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-left">
                  <p className="text-slate-500">Transaction ID</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 font-mono text-xs">
                      {payment.razorpay_payment_id}
                    </p>
                    <button
                      onClick={() => handleCopy(payment.razorpay_payment_id)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Date</p>
                  <p className="font-medium text-slate-900">
                    {format(parseISO(payment.created_at), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-slate-500">Payment Method</p>
                  <p className="font-medium text-slate-900 capitalize">
                    {payment.payment_method || 'Online'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500">Status</p>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <div className="flex gap-3">
              <Button variant="outline" isFullWidth leftIcon={<Download className="w-4 h-4" />}>
                Download Receipt
              </Button>
              <Button variant="outline" isFullWidth leftIcon={<Mail className="w-4 h-4" />}>
                Email Receipt
              </Button>
            </div>

            <Link to="/dashboard/fees" className="block">
              <Button variant="primary" isFullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
                Back to Fees
              </Button>
            </Link>
          </motion.div>

          {/* Help Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xs text-slate-400 mt-6"
          >
            A confirmation email has been sent to your registered email address.
            <br />
            For any queries, contact support@beeducated.com
          </motion.p>
        </Card>
      </motion.div>
    </div>
  );
}

export default PaymentSuccessPage;
