import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineCreditCard,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineAcademicCap,
  HiOutlineHome,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineBadgeCheck,
  HiOutlineBookOpen,
  HiOutlineDocumentText,
  HiOutlinePlay,
  HiOutlineDownload,
  HiOutlineEye,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
} from 'react-icons/hi';
import type { ClassesResponse, AcademicClass, FeePlan, EnrollmentInitiateResponse } from '../types';
import Footer from '../../../components/Footer';

/* ── Content types for preview section ── */
interface BrowseContent {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  material_type: string | null;
  file_size: number | null;
  duration_seconds: number | null;
  is_free: boolean;
  is_downloadable: boolean;
  subject_name: string | null;
  file_url?: string;
}

const materialTypeLabels: Record<string, string> = {
  lecture: 'Lecture', notes: 'Notes', dpp: 'DPP', dpp_pdf: 'DPP (PDF)', dpp_video: 'DPP (Video)', quiz: 'Quiz',
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function HomeTuitionClassesPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  const [data, setData] = useState<ClassesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollingClassId, setEnrollingClassId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  // Track selected plan per class: classId -> plan index
  const [selectedPlans, setSelectedPlans] = useState<Record<string, number>>({});
  // Content preview state
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [contentData, setContentData] = useState<Record<string, { content: BrowseContent[]; isEnrolled: boolean; loading: boolean }>>({});

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v2/course-types/home_tuition/classes');
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

  const getSelectedPlan = (classItem: AcademicClass): FeePlan | null => {
    const plans = classItem.feePlans || [];
    if (plans.length === 0) return classItem.feePlan;
    const idx = selectedPlans[classItem.id] ?? 0;
    return plans[idx] || plans[0];
  };

  /* ── Fetch content preview for a class ── */
  const toggleContentPreview = async (classId: string) => {
    if (expandedClassId === classId) {
      setExpandedClassId(null);
      return;
    }
    setExpandedClassId(classId);
    if (contentData[classId] && !contentData[classId].loading) return;

    setContentData((prev) => ({ ...prev, [classId]: { content: [], isEnrolled: false, loading: true } }));
    try {
      const res = await fetch(`/api/v2/content/browse?classId=${classId}`);
      const result = await res.json();
      if (result.success) {
        setContentData((prev) => ({
          ...prev,
          [classId]: { content: result.data.content, isEnrolled: result.data.isEnrolled, loading: false },
        }));
      } else {
        setContentData((prev) => ({ ...prev, [classId]: { content: [], isEnrolled: false, loading: false } }));
      }
    } catch {
      setContentData((prev) => ({ ...prev, [classId]: { content: [], isEnrolled: false, loading: false } }));
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
      navigate('/sign-in?redirect_url=/courses/home-tuition');
      return;
    }

    const selectedPlan = getSelectedPlan(classItem);
    if (!selectedPlan) {
      setPaymentError('No fee plan selected');
      return;
    }

    setEnrollingClassId(classItem.id);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load payment gateway');

      const res = await fetch('/api/v2/course-types/enrollments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classItem.id,
          feePlanId: selectedPlan.id,
        }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Failed to initiate enrollment');

      const orderData: EnrollmentInitiateResponse = result.data;
      const meta = selectedPlan.metadata || {};
      const isInstallment = meta.plan_code === 'C';

      const options = {
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency,
        name: 'Be Educated',
        description: isInstallment
          ? `Home Tuition ${classItem.name} - Installment 1 of 2`
          : `Home Tuition ${classItem.name} - One-Time Payment`,
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
              const msg = isInstallment
                ? `Enrolled in ${classItem.name}! 1st installment paid. 2nd installment due after 6 months.`
                : `Successfully enrolled in ${classItem.name}!`;
              setPaymentSuccess(msg);
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
          <p className="font-body text-gray-500">Loading home tuition classes...</p>
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
          <p className="font-body text-red-500 mb-4">{error || 'Home tuition data not found'}</p>
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
          backgroundImage: `url('https://images.unsplash.com/photo-1588072432836-e10032774350?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#0a1e3d]/80"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-5 py-16 w-full">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 font-heading text-sm font-semibold text-white/60 hover:text-white no-underline mb-6 transition-colors duration-300"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>

          <span className="block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-3">
            Home Tuition
          </span>
          <h1 className="font-heading text-[28px] sm:text-[36px] md:text-[44px] font-extrabold text-white mb-3 leading-tight">
            Choose Your Class & Enroll
          </h1>
          <p className="font-body text-base text-white/60 max-w-2xl leading-relaxed">
            Personalized one-on-one tutoring at your home with qualified teachers. Select a class and payment plan to get started.
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
      {/* REGISTRATION NOTE */}
      {/* ============================================ */}
      <div className="max-w-6xl mx-auto px-5 pt-4">
        <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl px-5 py-3 flex items-center gap-3">
          <HiOutlineShieldCheck className="w-5 h-5 text-[#b45309] flex-shrink-0" />
          <p className="font-body text-sm text-[#92400e]">
            <span className="font-semibold">Registration Fee:</span> A one-time non-refundable registration fee of <span className="font-bold">₹499</span> is included in all plans.
          </p>
        </div>
      </div>

      {/* ============================================ */}
      {/* CLASSES GRID */}
      {/* ============================================ */}
      <section className="py-10 sm:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          {data.classes.length === 0 ? (
            <div className="text-center py-20">
              <HiOutlineHome className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-[#0a1e3d] mb-2">
                No classes available yet
              </h3>
              <p className="font-body text-gray-500 mb-6">
                Home tuition classes will be available soon.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.classes.map((classItem) => {
                const plans = classItem.feePlans || [];
                const selectedIdx = selectedPlans[classItem.id] ?? 0;
                const currentPlan = plans[selectedIdx] || classItem.feePlan;
                const meta = currentPlan?.metadata || {};
                const isInstallment = meta.plan_code === 'C';

                return (
                  <div
                    key={classItem.id}
                    className="group/card relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#05308d]/20"
                  >
                    {/* Top accent bar */}
                    <div className="h-1.5 bg-[#05308d] group-hover/card:bg-gradient-to-r group-hover/card:from-[#05308d] group-hover/card:to-[#fbbf24] transition-all duration-500"></div>

                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-[#0a1e3d] to-[#05308d] text-white px-5 py-4 relative overflow-hidden">
                      <div className="absolute top-2 right-2 w-12 h-12 border border-white/5 rounded-full"></div>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-heading text-lg font-bold text-white">
                            {classItem.name}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-xs text-[#fbbf24]/80">
                            <HiOutlineHome className="w-3.5 h-3.5" />
                            Home Tuition
                          </span>
                        </div>
                        {classItem.duration && (
                          <span className="inline-flex items-center gap-1 text-xs text-white/60">
                            <HiOutlineClock className="w-3.5 h-3.5" />
                            {classItem.duration}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      {/* Plan Picker */}
                      {plans.length > 1 && (
                        <div className="mb-4">
                          <p className="font-heading text-xs font-bold text-[#0a1e3d] mb-2 uppercase tracking-wide">
                            Choose Plan
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {plans.map((plan, idx) => {
                              const planMeta = plan.metadata || {};
                              const isSelected = selectedIdx === idx;
                              return (
                                <button
                                  key={plan.id}
                                  onClick={() =>
                                    setSelectedPlans((prev) => ({ ...prev, [classItem.id]: idx }))
                                  }
                                  className={`relative text-left px-3 py-2.5 rounded-xl border-2 transition-all duration-200 cursor-pointer bg-transparent ${
                                    isSelected
                                      ? 'border-[#05308d] bg-[#05308d]/5'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  {plan.highlightLabel && (
                                    <span className="absolute -top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                      {plan.highlightLabel}
                                    </span>
                                  )}
                                  <p
                                    className={`font-heading text-xs font-bold ${
                                      isSelected ? 'text-[#05308d]' : 'text-gray-600'
                                    }`}
                                  >
                                    {planMeta.plan_code === 'C' ? '2 Installments' : 'One-Time'}
                                  </p>
                                  <p className="font-body text-[10px] text-gray-400 mt-0.5">
                                    {plan.discountLabel}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Fee Breakdown */}
                      {currentPlan && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-4">
                          <h4 className="font-heading text-xs font-bold text-[#0a1e3d] mb-3 flex items-center gap-1.5">
                            <HiOutlineCreditCard className="w-4 h-4 text-[#05308d]" />
                            Fee Breakdown
                          </h4>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <span className="font-body text-gray-500">Annual Fee</span>
                              <span className="font-heading font-semibold text-[#0a1e3d]">
                                ₹{currentPlan.tuitionFee.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span className="font-body">{currentPlan.discountLabel}</span>
                              <span className="font-heading font-semibold">
                                -₹{currentPlan.discountAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-body text-gray-500">Registration</span>
                              <span className="font-heading font-semibold text-[#0a1e3d]">
                                ₹{currentPlan.registrationFee.toLocaleString()}
                              </span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 flex justify-between">
                              <span className="font-heading font-bold text-[#0a1e3d]">
                                Total
                              </span>
                              <span className="font-heading font-extrabold text-lg text-[#05308d]">
                                ₹{currentPlan.totalAmount.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Installment breakdown for Plan C */}
                          {isInstallment && meta.installment_1 && (
                            <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                              <p className="font-heading text-[10px] font-bold text-[#05308d] uppercase tracking-wide mb-2">
                                Payment Schedule
                              </p>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="font-body text-gray-500">
                                    1st Installment (at admission)
                                  </span>
                                  <span className="font-heading font-bold text-[#0a1e3d]">
                                    ₹{Number(meta.installment_1).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="font-body text-gray-500">
                                    2nd Installment (after 6 months)
                                  </span>
                                  <span className="font-heading font-bold text-[#0a1e3d]">
                                    ₹{Number(meta.installment_2).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content Preview Toggle */}
                      <button
                        onClick={() => toggleContentPreview(classItem.id)}
                        className="w-full flex items-center justify-between px-4 py-2.5 mb-4 rounded-xl border border-dashed border-gray-300 hover:border-[#05308d]/40 hover:bg-[#05308d]/[0.02] transition-all duration-200 cursor-pointer bg-transparent group/preview"
                      >
                        <span className="flex items-center gap-2 font-heading text-xs font-semibold text-gray-600 group-hover/preview:text-[#05308d] transition-colors">
                          <HiOutlineEye className="w-3.5 h-3.5" />
                          Preview Study Material
                        </span>
                        <HiOutlineChevronDown
                          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${
                            expandedClassId === classItem.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Content Preview Panel */}
                      {expandedClassId === classItem.id && (
                        <div className="mb-4 rounded-xl border border-gray-100 overflow-hidden">
                          {contentData[classItem.id]?.loading ? (
                            <div className="flex items-center justify-center py-6">
                              <div className="w-5 h-5 border-2 border-[#05308d] border-t-transparent rounded-full animate-spin"></div>
                              <span className="ml-2 font-body text-xs text-gray-400">Loading content...</span>
                            </div>
                          ) : !contentData[classItem.id]?.content?.length ? (
                            <div className="text-center py-6 px-4">
                              <HiOutlineBookOpen className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                              <p className="font-body text-xs text-gray-400">No study material uploaded yet</p>
                            </div>
                          ) : (() => {
                            const items = contentData[classItem.id].content;
                            const enrolled = contentData[classItem.id].isEnrolled;
                            const grouped: Record<string, BrowseContent[]> = {};
                            items.forEach((item) => {
                              const key = item.subject_name || 'General';
                              if (!grouped[key]) grouped[key] = [];
                              grouped[key].push(item);
                            });
                            const freeCount = items.filter((i) => i.is_free).length;
                            const paidCount = items.length - freeCount;

                            return (
                              <div>
                                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
                                  <span className="inline-flex items-center gap-1 font-heading text-[10px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
                                    <HiOutlineLockOpen className="w-2.5 h-2.5" />
                                    {freeCount} Free
                                  </span>
                                  {paidCount > 0 && (
                                    <span className="inline-flex items-center gap-1 font-heading text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                                      <HiOutlineLockClosed className="w-2.5 h-2.5" />
                                      {paidCount} Premium
                                    </span>
                                  )}
                                </div>

                                <div className="max-h-[280px] overflow-y-auto">
                                  {Object.entries(grouped).map(([subject, subjectItems]) => (
                                    <div key={subject}>
                                      <div className="px-3 py-1.5 bg-[#05308d]/[0.03] border-b border-gray-100">
                                        <h5 className="font-heading text-[10px] font-bold text-[#05308d] uppercase tracking-wide">{subject}</h5>
                                      </div>
                                      {subjectItems.map((item) => {
                                        const isLocked = !item.is_free && !enrolled;
                                        const isVideo = item.content_type === 'video';
                                        const isPdf = item.content_type === 'pdf' || item.content_type === 'document';

                                        return (
                                          <div
                                            key={item.id}
                                            className={`relative flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-50 transition-colors ${
                                              isLocked ? 'bg-gray-50/50' : 'hover:bg-blue-50/30'
                                            }`}
                                          >
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                              isLocked ? 'bg-gray-100 text-gray-400' : isVideo ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                                            }`}>
                                              {isLocked ? <HiOutlineLockClosed className="w-3.5 h-3.5" /> : isVideo ? <HiOutlinePlay className="w-3.5 h-3.5" /> : <HiOutlineDocumentText className="w-3.5 h-3.5" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                              <p className={`font-heading text-xs font-semibold truncate ${isLocked ? 'text-gray-400' : 'text-[#0a1e3d]'}`}>
                                                {item.title}
                                              </p>
                                              <div className="flex items-center gap-1.5 mt-0.5">
                                                {item.material_type && <span className="font-body text-[9px] text-gray-400">{materialTypeLabels[item.material_type] || item.material_type}</span>}
                                                {item.file_size && <span className="font-body text-[9px] text-gray-300">{formatFileSize(item.file_size)}</span>}
                                                {item.duration_seconds && <span className="font-body text-[9px] text-gray-300">{formatDuration(item.duration_seconds)}</span>}
                                              </div>
                                            </div>

                                            {item.is_free ? (
                                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <span className="font-heading text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">FREE</span>
                                                {item.file_url && (
                                                  isVideo ? (
                                                    <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors no-underline">
                                                      <HiOutlinePlay className="w-3 h-3" />
                                                    </a>
                                                  ) : isPdf && item.is_downloadable ? (
                                                    <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors no-underline">
                                                      <HiOutlineDownload className="w-3 h-3" />
                                                    </a>
                                                  ) : (
                                                    <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors no-underline">
                                                      <HiOutlineEye className="w-3 h-3" />
                                                    </a>
                                                  )
                                                )}
                                              </div>
                                            ) : (
                                              <span className="font-heading text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full flex-shrink-0">PREMIUM</span>
                                            )}

                                            {isLocked && <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ))}
                                </div>

                                {paidCount > 0 && !enrolled && (
                                  <div className="px-3 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100 flex items-center justify-between">
                                    <p className="font-body text-[10px] text-amber-800">
                                      <span className="font-semibold">Enroll now</span> to unlock all {paidCount} premium materials
                                    </p>
                                    <HiOutlineLockOpen className="w-3.5 h-3.5 text-amber-500" />
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* CTA Button */}
                      {classItem.isEnrolled ? (
                        <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 py-3 px-4 rounded-xl font-heading font-bold text-sm">
                          <HiOutlineAcademicCap className="w-5 h-5" />
                          {classItem.enrollmentStatus === 'active'
                            ? 'Enrolled'
                            : 'Enrollment Pending'}
                        </div>
                      ) : classItem.enrollmentOpen ? (
                        <button
                          onClick={() => handleEnroll(classItem)}
                          disabled={enrollingClassId === classItem.id}
                          className="w-full flex items-center justify-center gap-2 bg-[#05308d] hover:bg-[#1a56db] text-white py-3 px-4 rounded-xl font-heading font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none hover:shadow-lg hover:shadow-[#05308d]/25"
                        >
                          {enrollingClassId === classItem.id ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              {isInstallment ? 'Pay 1st Installment' : 'Enroll Now'}
                              <HiOutlineChevronRight className="w-5 h-5" />
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="text-center py-3 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl font-heading font-bold text-sm">
                          Enrollment Closed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============================================ */}
      {/* WHAT YOU GET */}
      {/* ============================================ */}
      {data.classes.length > 0 && (
        <section
          className="py-16 sm:py-20 relative overflow-hidden"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&q=80')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[#0a1e3d]/90"></div>

          <div className="relative z-10 max-w-6xl mx-auto px-5">
            <div className="text-center mb-12">
              <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.15em] mb-3">
                Why Home Tuition?
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">
                What's Included
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: HiOutlineHome, text: 'One-on-one tutoring at your home' },
                { icon: HiOutlineAcademicCap, text: 'Qualified & experienced teachers' },
                { icon: HiOutlineClock, text: 'Flexible scheduling' },
                { icon: HiOutlineBadgeCheck, text: 'Customized learning pace' },
                { icon: HiOutlineShieldCheck, text: 'Regular progress tracking' },
                { icon: HiOutlineCheckCircle, text: 'Monthly performance reports' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:-translate-y-1"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-[#fbbf24]" />
                      </div>
                      <p className="font-body text-white/80 text-sm sm:text-[15px] leading-relaxed pt-2">
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

      {/* ============================================ */}
      {/* CTA */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0a1e3d] mb-4">
            Need Help Choosing a Plan?
          </h2>
          <p className="font-body text-gray-500 mb-8 max-w-xl mx-auto">
            Our counselors are here to help you pick the right plan. Contact us for personalized guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-[#05308d] text-white px-8 py-4 rounded-xl font-heading font-bold text-sm no-underline hover:bg-[#1a56db] transition-colors"
            >
              Talk to a Counselor
              <HiOutlineChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/fee-structure?tab=home-tuition"
              className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-gray-200 text-[#0a1e3d] px-8 py-4 rounded-xl font-heading font-bold text-sm no-underline hover:border-[#05308d]/30 hover:bg-[#05308d]/5 transition-colors"
            >
              View Full Fee Structure
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default HomeTuitionClassesPage;
