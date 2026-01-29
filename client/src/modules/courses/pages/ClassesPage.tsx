import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Users,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  ChevronRight,
  GraduationCap,
  Target,
} from 'lucide-react';
import type { ClassesResponse, AcademicClass, EnrollmentInitiateResponse } from '../types';

// Declare Razorpay type
declare global {
  interface Window {
    Razorpay: any;
  }
}

export function ClassesPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  const [data, setData] = useState<ClassesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollingClassId, setEnrollingClassId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchClasses();
    }
  }, [slug]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v2/course-types/${slug}/classes`);
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError('Failed to load classes');
      }
    } catch (err) {
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  // Load Razorpay script
  const loadRazorpayScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const handleEnroll = async (classItem: AcademicClass) => {
    // Check if signed in
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Redirect to sign in with return URL
      navigate(`/sign-in?redirect_url=/courses/${slug}`);
      return;
    }

    if (!classItem.feePlan) {
      setPaymentError('No fee plan available for this class');
      return;
    }

    setEnrollingClassId(classItem.id);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      // 1. Load Razorpay
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // 2. Initiate enrollment
      const res = await fetch('/api/v2/course-types/enrollments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: classItem.id,
          feePlanId: classItem.feePlan.id,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to initiate enrollment');
      }

      const orderData: EnrollmentInitiateResponse = result.data;

      // 3. Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency,
        name: 'Be Educated',
        description: `Enrollment for ${classItem.name}`,
        order_id: orderData.orderId,
        prefill: orderData.prefill,
        notes: orderData.notes,
        theme: {
          color: '#3B82F6',
        },
        handler: async (response: any) => {
          // Payment successful - verify on backend
          try {
            const verifyRes = await fetch('/api/v2/course-types/enrollments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyResult = await verifyRes.json();

            if (verifyResult.success) {
              setPaymentSuccess(`Successfully enrolled in ${classItem.name}!`);
              // Refresh classes to update enrollment status
              fetchClasses();
            } else {
              throw new Error(verifyResult.message || 'Payment verification failed');
            }
          } catch (err: any) {
            setPaymentError(err.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setEnrollingClassId(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', async (response: any) => {
        // Report failure to backend
        try {
          await fetch('/api/v2/course-types/enrollments/failure', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: orderData.orderId,
              error_code: response.error.code,
              error_description: response.error.description,
            }),
          });
        } catch {
          // Ignore error reporting failures
        }

        setPaymentError(response.error.description || 'Payment failed');
      });

      razorpay.open();
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to process enrollment');
    } finally {
      setEnrollingClassId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading classes...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Course not found'}</p>
          <Link
            to="/courses"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Back button */}
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Link>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {data.courseType.name}
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl">
              Choose a class to enroll and begin your learning journey with expert guidance.
            </p>
          </motion.div>
        </div>

        {/* Wave decoration */}
        <div className="h-12 bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-t-[2rem]"></div>
      </div>

      {/* Alerts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-800 font-medium">{paymentSuccess}</p>
              <Link
                to="/dashboard/my-enrollments"
                className="text-green-600 hover:text-green-700 text-sm underline"
              >
                View your enrollments
              </Link>
            </div>
          </motion.div>
        )}

        {paymentError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">{paymentError}</p>
              <button
                onClick={() => setPaymentError(null)}
                className="text-red-600 hover:text-red-700 text-sm underline"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Classes Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.classes.map((classItem, index) => (
            <motion.div
              key={classItem.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{classItem.name}</h3>
                      {classItem.targetBoard && (
                        <span className="inline-flex items-center gap-1 text-sm text-slate-300">
                          <Target className="w-4 h-4" />
                          {classItem.targetBoard}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      {classItem.duration && (
                        <span className="inline-flex items-center gap-1 text-sm text-slate-300">
                          <Clock className="w-4 h-4" />
                          {classItem.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Description */}
                  {classItem.description && (
                    <p className="text-slate-600 mb-6">{classItem.description}</p>
                  )}

                  {/* Features */}
                  {classItem.features && classItem.features.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        What you'll get
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {classItem.features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fee Breakdown */}
                  {classItem.feePlan && (
                    <div className="bg-slate-50 rounded-xl p-4 mb-6">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        Fee Breakdown
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Registration Fee</span>
                          <span className="text-slate-900">
                            {classItem.feePlan.registrationFee > 0
                              ? `₹${classItem.feePlan.registrationFee.toLocaleString()}`
                              : 'Free'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Tuition Fee</span>
                          <span className="text-slate-900">
                            ₹{classItem.feePlan.tuitionFee.toLocaleString()}
                          </span>
                        </div>
                        {classItem.feePlan.materialFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">Material Fee</span>
                            <span className="text-slate-900">
                              ₹{classItem.feePlan.materialFee.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {classItem.feePlan.discountAmount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>
                              {classItem.feePlan.discountLabel || 'Discount'}
                            </span>
                            <span>
                              -₹{classItem.feePlan.discountAmount.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-slate-200 pt-2 flex justify-between font-semibold">
                          <span className="text-slate-900">Total Amount</span>
                          <span className="text-blue-600 text-lg">
                            ₹{classItem.feePlan.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Capacity info */}
                  {classItem.maxStudents && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                      <Users className="w-4 h-4" />
                      <span>
                        {classItem.currentStudents} / {classItem.maxStudents} students enrolled
                      </span>
                    </div>
                  )}

                  {/* CTA Button */}
                  {classItem.isEnrolled ? (
                    <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3 px-4 rounded-xl font-semibold">
                      <GraduationCap className="w-5 h-5" />
                      {classItem.enrollmentStatus === 'active' ? 'Enrolled' : 'Enrollment Pending'}
                    </div>
                  ) : classItem.enrollmentOpen ? (
                    <button
                      onClick={() => handleEnroll(classItem)}
                      disabled={enrollingClassId === classItem.id}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {enrollingClassId === classItem.id ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Enroll Now
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="text-center py-3 bg-slate-100 text-slate-500 rounded-xl font-medium">
                      Enrollment Closed
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {data.classes.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No classes available yet
            </h3>
            <p className="text-slate-600 mb-6">
              Classes for this program will be available soon.
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClassesPage;
