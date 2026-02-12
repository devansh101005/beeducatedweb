import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineCreditCard,
  HiOutlineChevronRight,
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineLightningBolt,
  HiOutlineChatAlt2,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineDesktopComputer,
} from 'react-icons/hi';
import type { ClassesResponse, AcademicClass, EnrollmentInitiateResponse } from '../types';
import Footer from '../../../components/Footer';

/* Declare Razorpay type */
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
    } catch {
      setError('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  /* ── Razorpay script loader ── */
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

  /* ── Enrollment + Payment handler ── */
  const handleEnroll = async (classItem: AcademicClass) => {
    if (!isLoaded) return;

    if (!isSignedIn) {
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
      if (!scriptLoaded) throw new Error('Failed to load payment gateway');

      // 2. Initiate enrollment
      const res = await fetch('/api/v2/course-types/enrollments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classItem.id,
          feePlanId: classItem.feePlan.id,
        }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Failed to initiate enrollment');

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
        theme: { color: '#05308d' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/v2/course-types/enrollments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyResult = await verifyRes.json();
            if (verifyResult.success) {
              setPaymentSuccess(`Successfully enrolled in ${classItem.name}!`);
              fetchClasses();
            } else {
              throw new Error(verifyResult.message || 'Payment verification failed');
            }
          } catch (err: any) {
            setPaymentError(err.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => setEnrollingClassId(null),
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', async (response: any) => {
        try {
          await fetch('/api/v2/course-types/enrollments/failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-[80px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#05308d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-body text-gray-500">Loading classes...</p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-[80px]">
        <div className="text-center">
          <HiOutlineExclamationCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="font-body text-red-500 mb-4">{error || 'Course not found'}</p>
          <Link
            to="/courses"
            className="px-6 py-3 bg-[#05308d] text-white rounded-xl font-heading font-bold text-sm no-underline hover:bg-[#1a56db] transition-colors"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section
        className="relative pt-[80px] min-h-[40vh] flex items-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#0a1e3d]/80"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-5 py-16 w-full">
          {/* Back button */}
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 font-heading text-sm font-semibold text-white/60 hover:text-white no-underline mb-6 transition-colors duration-300"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>

          <span className="block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-3">
            {data.courseType.name}
          </span>
          <h1 className="font-heading text-[28px] sm:text-[36px] md:text-[44px] font-extrabold text-white mb-3 leading-tight">
            Choose Your Class & Enroll
          </h1>
          <p className="font-body text-base text-white/60 max-w-2xl leading-relaxed">
            Select a class to begin your learning journey with expert guidance and structured preparation.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* ALERTS */}
      {/* ============================================ */}
      <div className="max-w-6xl mx-auto px-5 pt-8">
        {paymentSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <HiOutlineCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-heading font-bold text-green-800 text-sm">{paymentSuccess}</p>
              <Link
                to="/dashboard/my-enrollments"
                className="font-body text-green-600 hover:text-green-700 text-sm underline"
              >
                View your enrollments
              </Link>
            </div>
          </div>
        )}

        {paymentError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <HiOutlineExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-heading font-bold text-red-800 text-sm">{paymentError}</p>
              <button
                onClick={() => setPaymentError(null)}
                className="font-body text-red-600 hover:text-red-700 text-sm underline bg-transparent border-none cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* CLASSES GRID */}
      {/* ============================================ */}
      <section className="py-10 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          {data.classes.length === 0 ? (
            <div className="text-center py-20">
              <HiOutlineBookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-[#0a1e3d] mb-2">
                No classes available yet
              </h3>
              <p className="font-body text-gray-500 mb-6">
                Classes for this program will be available soon.
              </p>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#05308d] text-white rounded-xl font-heading font-bold text-sm no-underline hover:bg-[#1a56db] transition-colors"
              >
                <HiOutlineArrowLeft className="w-4 h-4" />
                Back to Courses
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {data.classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className="group/card relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#05308d]/20"
                >
                  {/* Top accent bar */}
                  <div className="h-1.5 bg-[#05308d] group-hover/card:bg-gradient-to-r group-hover/card:from-[#05308d] group-hover/card:to-[#fbbf24] transition-all duration-500"></div>

                  {/* Corner glow */}
                  <div className="absolute -top-10 -right-10 w-28 h-28 bg-[#05308d]/5 rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>

                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-[#0a1e3d] to-[#05308d] text-white p-6 relative overflow-hidden">
                    <div className="absolute top-3 right-3 w-16 h-16 border border-white/5 rounded-full"></div>
                    <div className="absolute top-6 right-6 w-10 h-10 border border-white/5 rounded-full"></div>

                    <div className="relative z-10 flex items-start justify-between">
                      <div>
                        <h3 className="font-heading text-2xl font-bold mb-2">{classItem.name}</h3>
                        {classItem.targetBoard && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-white/60">
                            <HiOutlineShieldCheck className="w-4 h-4" />
                            {classItem.targetBoard}
                          </span>
                        )}
                      </div>
                      {classItem.duration && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-white/60">
                          <HiOutlineClock className="w-4 h-4" />
                          {classItem.duration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Description */}
                    {classItem.description && (
                      <p className="font-body text-gray-500 text-[15px] leading-relaxed mb-5">
                        {classItem.description}
                      </p>
                    )}

                    {/* Features */}
                    {classItem.features && classItem.features.length > 0 && (
                      <div className="mb-5">
                        <h4 className="font-heading text-sm font-bold text-[#0a1e3d] mb-3 flex items-center gap-2">
                          <HiOutlineBookOpen className="w-4 h-4 text-[#05308d]" />
                          What you'll get
                        </h4>
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {classItem.features.slice(0, 6).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 font-body text-sm text-gray-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] mt-1.5 flex-shrink-0"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Fee Breakdown */}
                    {classItem.feePlan && (
                      <div className="bg-gray-50 group-hover/card:bg-[#05308d]/[0.02] rounded-xl p-4 mb-5 transition-colors duration-300">
                        <h4 className="font-heading text-sm font-bold text-[#0a1e3d] mb-3 flex items-center gap-2">
                          <HiOutlineCreditCard className="w-4 h-4 text-[#05308d]" />
                          Fee Breakdown
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-body text-gray-500">Registration Fee</span>
                            <span className="font-heading font-semibold text-[#0a1e3d]">
                              {classItem.feePlan.registrationFee > 0
                                ? `₹${classItem.feePlan.registrationFee.toLocaleString()}`
                                : 'Free'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-body text-gray-500">Tuition Fee</span>
                            <span className="font-heading font-semibold text-[#0a1e3d]">
                              ₹{classItem.feePlan.tuitionFee.toLocaleString()}
                            </span>
                          </div>
                          {classItem.feePlan.materialFee > 0 && (
                            <div className="flex justify-between">
                              <span className="font-body text-gray-500">Material Fee</span>
                              <span className="font-heading font-semibold text-[#0a1e3d]">
                                ₹{classItem.feePlan.materialFee.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {classItem.feePlan.discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span className="font-body">{classItem.feePlan.discountLabel || 'Discount'}</span>
                              <span className="font-heading font-semibold">-₹{classItem.feePlan.discountAmount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="border-t border-gray-200 pt-2 flex justify-between">
                            <span className="font-heading font-bold text-[#0a1e3d]">Total Amount</span>
                            <span className="font-heading font-extrabold text-lg text-[#05308d]">
                              ₹{classItem.feePlan.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Capacity info */}
                    {classItem.maxStudents && (
                      <div className="flex items-center gap-2 font-body text-sm text-gray-400 mb-5">
                        <HiOutlineUserGroup className="w-4 h-4" />
                        <span>
                          {classItem.currentStudents} / {classItem.maxStudents} students enrolled
                        </span>
                      </div>
                    )}

                    {/* CTA Button */}
                    {classItem.isEnrolled ? (
                      <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 py-3.5 px-4 rounded-xl font-heading font-bold text-sm">
                        <HiOutlineAcademicCap className="w-5 h-5" />
                        {classItem.enrollmentStatus === 'active' ? 'Enrolled' : 'Enrollment Pending'}
                      </div>
                    ) : classItem.enrollmentOpen ? (
                      <button
                        onClick={() => handleEnroll(classItem)}
                        disabled={enrollingClassId === classItem.id}
                        className="w-full flex items-center justify-center gap-2 bg-[#05308d] hover:bg-[#1a56db] text-white py-3.5 px-4 rounded-xl font-heading font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none hover:shadow-lg hover:shadow-[#05308d]/25"
                      >
                        {enrollingClassId === classItem.id ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            Enroll Now
                            <HiOutlineChevronRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="text-center py-3.5 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl font-heading font-bold text-sm">
                        Enrollment Closed
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================ */}
      {/* WHAT YOU GET — OFFLINE BATCH */}
      {/* ============================================ */}
      {data.classes.length > 0 && (
        <section className="py-16 sm:py-20 bg-[#0a1e3d] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#05308d]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#fbbf24]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10 max-w-6xl mx-auto px-5">
            <div className="text-center mb-14">
              <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.15em] mb-3">
                What You Get
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                Offline Batch Includes
              </h2>
              <p className="font-body text-white/50 max-w-xl mx-auto">
                Complete academic ecosystem designed for maximum results
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: HiOutlineBookOpen, text: 'Concept-based classroom lectures' },
                { icon: HiOutlineAcademicCap, text: 'Complete NCERT + Competitive level coverage' },
                { icon: HiOutlineClipboardList, text: 'Daily Practice Problems (DPP)' },
                { icon: HiOutlineChartBar, text: 'Weekly / Monthly Test Series' },
                { icon: HiOutlineLightningBolt, text: 'Detailed Performance Analysis' },
                { icon: HiOutlineChatAlt2, text: 'Dedicated Doubt Clearing Sessions' },
                { icon: HiOutlineDocumentText, text: 'Study Material & Notes' },
                { icon: HiOutlineUserGroup, text: 'Parent Progress Updates' },
                { icon: HiOutlineDesktopComputer, text: 'Hybrid Academic Support (Revision / Extra Guidance)' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="group/inc relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:border-white/20 overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#fbbf24] to-transparent opacity-0 group-hover/inc:opacity-100 transition-opacity duration-500 group-hover/inc:animate-[shimmer_2s_linear_infinite] bg-[length:200%_100%]"></div>
                    <div className="absolute -top-8 -right-8 w-20 h-20 bg-[#fbbf24]/10 rounded-full blur-2xl opacity-0 group-hover/inc:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10 flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover/inc:scale-110 group-hover/inc:bg-[#fbbf24]/20">
                        <Icon className="w-5 h-5 text-[#fbbf24]" />
                      </div>
                      <p className="font-body text-white/80 text-sm sm:text-[15px] leading-relaxed pt-2 group-hover/inc:text-white transition-colors duration-300">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

export default ClassesPage;
