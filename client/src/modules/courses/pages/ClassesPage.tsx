import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { load as loadCashfree } from '@cashfreepayments/cashfree-js';
import {
  HiOutlineArrowLeft,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineBookOpen,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineCreditCard,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineLightningBolt,
  HiOutlineChatAlt2,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineDesktopComputer,
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

/* ── Content type icons & labels ── */
const materialTypeLabels: Record<string, string> = {
  lecture: 'Lecture',
  notes: 'Notes',
  dpp: 'DPP',
  dpp_pdf: 'DPP (PDF)',
  dpp_video: 'DPP (Video)',
  quiz: 'Quiz',
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


/* ── Static content overrides per class (frontend only) ── */
const classContentMap: Record<string, { title: string; description: string; features: string[] }> = {
  '6': {
    title: 'CLASS 6 – HYBRID BATCH',
    description: 'Strong foundation building for Class 6 students with classroom teaching and digital support.',
    features: ['Complete NCERT Coverage', 'Classroom Teaching (Offline)', 'Live + Recorded Backup Access', 'Printed + PDF Notes', 'Weekly Assignments', 'Monthly Tests', 'Parent Performance Updates', 'Doubt Support (Offline + Online)'],
  },
  '7': {
    title: 'CLASS 7 – HYBRID BATCH',
    description: 'Concept clarity and analytical thinking development with structured classroom learning.',
    features: ['Full Syllabus Coverage', 'Offline Classroom Teaching', 'Recorded Lecture Access', 'Study Material (Printed + PDF)', 'Weekly Practice Sheets', 'Monthly Test Series', 'Performance Report', 'Doubt Support System'],
  },
  '8': {
    title: 'CLASS 8 – HYBRID BATCH',
    description: 'Strong academic preparation with regular assessment and hybrid learning support.',
    features: ['Complete NCERT + Important Questions', 'Offline Teaching + Online Backup', 'Chapter-wise Tests', 'Printed + Digital Notes', 'Doubt Clearing Sessions', 'Parent Updates', 'Annual Revision Program'],
  },
  '9': {
    title: 'CLASS 9 – HYBRID BATCH',
    description: 'Board-oriented preparation with conceptual clarity and exam-focused strategy.',
    features: ['Complete Syllabus Coverage', 'Classroom Teaching', 'Recorded Backup Access', 'Weekly Tests', 'Board Pattern Practice', 'Study Material + Notes', 'Performance Tracking', 'Doubt Sessions'],
  },
  '10': {
    title: 'CLASS 10 – HYBRID BATCH',
    description: 'Board Exam Special Preparation with structured revision plan.',
    features: ['Full Board Syllabus Coverage', 'Offline + Online Access', 'Chapter-wise Tests', 'Pre-Board Exams', 'Important Question Bank', 'Revision Classes', 'Parent Meeting Updates', 'Performance Analysis'],
  },
  '11': {
    title: 'CLASS 11 – HYBRID BATCH',
    description: 'Strong foundation for higher studies & competitive preparation.',
    features: ['Complete Syllabus Coverage', 'Concept-based Teaching', 'Recorded Lecture Access', 'Weekly & Monthly Tests', 'Competitive Oriented Questions', 'Study Material (Printed + PDF)', 'Doubt Sessions', 'Performance Report'],
  },
  '12': {
    title: 'CLASS 12 – HYBRID BATCH',
    description: 'Board + Competitive Focused Preparation with exam strategy guidance.',
    features: ['Full Board Syllabus', 'Offline + Recorded Access', 'Board Pattern Tests', 'Sample Paper Practice', 'Important Question Discussion', 'Revision Program', 'Performance Tracking', 'Career Guidance Support'],
  },
};

/* Extract class number from name like "Class 6", "Class 10" etc. */
function getClassNumber(name: string): string | null {
  const match = name.match(/\b(\d{1,2})\b/);
  return match ? match[1] : null;
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
  // Track selected plan per class: classId -> plan index
  const [selectedPlans, setSelectedPlans] = useState<Record<string, number>>({});
  // Coupon state per class
  const [couponInputs, setCouponInputs] = useState<Record<string, string>>({});
  const [couponResults, setCouponResults] = useState<Record<string, { valid: boolean; discountAmount: number; message?: string } | null>>({});
  const [validatingCoupon, setValidatingCoupon] = useState<string | null>(null);
  // Content preview state
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [contentData, setContentData] = useState<Record<string, { content: BrowseContent[]; isEnrolled: boolean; loading: boolean }>>({});

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

  /* ── Fetch content preview for a class ── */
  const toggleContentPreview = async (classId: string) => {
    if (expandedClassId === classId) {
      setExpandedClassId(null);
      return;
    }
    setExpandedClassId(classId);

    // Already loaded
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

  /* ── Get selected plan for a class (supports multi-plan selector) ── */
  const getSelectedPlan = (classItem: AcademicClass): FeePlan | null => {
    const plans = classItem.feePlans || [];
    if (plans.length === 0) return classItem.feePlan;
    const idx = selectedPlans[classItem.id] ?? 0;
    return plans[idx] || plans[0];
  };

  /* ── Validate coupon handler ── */
  const handleValidateCoupon = async (classId: string) => {
    const code = couponInputs[classId]?.trim();
    if (!code) return;

    const classItem = data?.classes.find((c) => c.id === classId);
    const selectedPlan = classItem ? getSelectedPlan(classItem) : null;

    setValidatingCoupon(classId);
    setCouponResults((prev) => ({ ...prev, [classId]: null }));

    try {
      const res = await fetch('/api/v2/course-types/enrollments/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: code, classId, feePlanId: selectedPlan?.id }),
      });
      const result = await res.json();
      if (result.success) {
        setCouponResults((prev) => ({ ...prev, [classId]: result.data }));
      } else {
        setCouponResults((prev) => ({ ...prev, [classId]: { valid: false, discountAmount: 0, message: result.message || 'Invalid coupon' } }));
      }
    } catch {
      setCouponResults((prev) => ({ ...prev, [classId]: { valid: false, discountAmount: 0, message: 'Failed to validate coupon' } }));
    } finally {
      setValidatingCoupon(null);
    }
  };

  /* ── Cashfree SDK ref ── */
  const cashfreeRef = useRef<any>(null);

  /* ── Enrollment + Payment handler ── */
  const handleEnroll = async (classItem: AcademicClass) => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      navigate(`/sign-in?redirect_url=/courses/${slug}`);
      return;
    }

    const selectedPlan = getSelectedPlan(classItem);
    if (!selectedPlan) {
      setPaymentError('No fee plan available for this class');
      return;
    }

    setEnrollingClassId(classItem.id);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      // 1. Initiate enrollment (backend creates Cashfree order)
      const res = await fetch('/api/v2/course-types/enrollments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classItem.id,
          feePlanId: selectedPlan.id,
          couponCode: couponResults[classItem.id]?.valid ? couponInputs[classItem.id]?.trim() : undefined,
        }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Failed to initiate enrollment');

      const orderData: EnrollmentInitiateResponse = result.data;

      // 2. Load Cashfree SDK
      if (!cashfreeRef.current) {
        cashfreeRef.current = await loadCashfree({ mode: orderData.environment });
      }
      if (!cashfreeRef.current) throw new Error('Failed to load payment gateway');

      // 3. Open Cashfree checkout
      const checkoutResult = await cashfreeRef.current.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: '_modal',
      });

      if (checkoutResult.error) {
        // Payment failed or was dismissed
        try {
          await fetch('/api/v2/course-types/enrollments/failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderData.orderId,
              error_code: checkoutResult.error?.code || 'UNKNOWN',
              error_description: checkoutResult.error?.message || 'Payment failed',
            }),
          });
        } catch {
          // Ignore error reporting failures
        }
        setPaymentError(checkoutResult.error?.message || 'Payment failed');
        return;
      }

      if (checkoutResult.paymentDetails) {
        // 4. Verify payment with backend
        const verifyRes = await fetch('/api/v2/course-types/enrollments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderData.orderId }),
        });
        const verifyResult = await verifyRes.json();
        if (verifyResult.success) {
          if (verifyResult.data.verifiedStep === 'registration') {
            setPaymentSuccess(`Registration fee paid for ${classItem.name}! Please click "Pay Tuition" to complete enrollment.`);
          } else {
            setPaymentSuccess(`Successfully enrolled in ${classItem.name}!`);
          }
          fetchClasses();
        } else {
          throw new Error(verifyResult.message || 'Payment verification failed');
        }
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to process enrollment');
    } finally {
      setEnrollingClassId(null);
    }
  };

  /* ── Pay Tuition handler (after registration fee is paid) ── */
  const handlePayTuition = async (classItem: AcademicClass) => {
    if (!isLoaded || !isSignedIn || !classItem.enrollmentId) return;

    setEnrollingClassId(classItem.id);
    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const res = await fetch(`/api/v2/course-types/enrollments/${classItem.enrollmentId}/pay-tuition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message || 'Failed to initiate tuition payment');

      const orderData: EnrollmentInitiateResponse = result.data;

      if (!cashfreeRef.current) {
        cashfreeRef.current = await loadCashfree({ mode: orderData.environment });
      }
      if (!cashfreeRef.current) throw new Error('Failed to load payment gateway');

      const checkoutResult = await cashfreeRef.current.checkout({
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: '_modal',
      });

      if (checkoutResult.error) {
        try {
          await fetch('/api/v2/course-types/enrollments/failure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderData.orderId,
              error_code: checkoutResult.error?.code || 'UNKNOWN',
              error_description: checkoutResult.error?.message || 'Payment failed',
            }),
          });
        } catch { /* ignore */ }
        setPaymentError(checkoutResult.error?.message || 'Payment failed');
        return;
      }

      if (checkoutResult.paymentDetails) {
        const verifyRes = await fetch('/api/v2/course-types/enrollments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderData.orderId }),
        });
        const verifyResult = await verifyRes.json();
        if (verifyResult.success) {
          setPaymentSuccess(`Successfully enrolled in ${classItem.name}!`);
          fetchClasses();
        } else {
          throw new Error(verifyResult.message || 'Payment verification failed');
        }
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to process tuition payment');
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
              {data.classes.map((classItem) => {
                const classNum = getClassNumber(classItem.name);
                const staticContent = classNum ? classContentMap[classNum] : null;
                const plans = classItem.feePlans || [];
                const selectedIdx = selectedPlans[classItem.id] ?? 0;
                const currentPlan = plans.length > 0 ? (plans[selectedIdx] || plans[0]) : classItem.feePlan;
                const planMeta = currentPlan?.metadata || {};
                const isMonthly = planMeta.plan_code === 'M';

                return (
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
                        <h3 className="font-heading text-2xl font-bold text-white mb-2">
                          {staticContent ? staticContent.title : classItem.name}
                        </h3>
                        {classItem.targetBoard && (
                          <span className="inline-flex items-center gap-1.5 text-sm text-[#fbbf24]/80">
                            <HiOutlineShieldCheck className="w-4 h-4" />
                            {classItem.targetBoard}
                          </span>
                        )}
                      </div>
                      {classItem.duration && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-white/70">
                          <HiOutlineClock className="w-4 h-4" />
                          {classItem.duration}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Description */}
                    <p className="font-body text-gray-500 text-[15px] leading-relaxed mb-5">
                      {staticContent ? staticContent.description : classItem.description}
                    </p>

                    {/* Features */}
                    {(staticContent || (classItem.features && classItem.features.length > 0)) && (
                      <div className="mb-5">
                        <h4 className="font-heading text-sm font-bold text-[#0a1e3d] mb-3 flex items-center gap-2">
                          <HiOutlineBookOpen className="w-4 h-4 text-[#05308d]" />
                          What Students Will Get
                        </h4>
                        <ul className="grid sm:grid-cols-2 gap-2">
                          {(staticContent ? staticContent.features : classItem.features!.slice(0, 8)).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 font-body text-sm text-gray-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] mt-1.5 flex-shrink-0"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Plan Picker */}
                    {plans.length > 1 && (
                      <div className="mb-4">
                        <p className="font-heading text-xs font-bold text-[#0a1e3d] mb-2 uppercase tracking-wide">
                          Choose Payment Plan
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {plans.map((plan, idx) => {
                            const pm = plan.metadata || {};
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
                                  {pm.plan_code === 'M'
                                    ? 'Monthly'
                                    : pm.installments === 2
                                    ? '2 Installments'
                                    : 'One-Time'}
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
                      <div className="bg-gray-50 group-hover/card:bg-[#05308d]/[0.02] rounded-xl p-4 mb-5 transition-colors duration-300">
                        <h4 className="font-heading text-sm font-bold text-[#0a1e3d] mb-3 flex items-center gap-2">
                          <HiOutlineCreditCard className="w-4 h-4 text-[#05308d]" />
                          Fee Breakdown
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-body text-gray-500">Registration Fee</span>
                            <span className="font-heading font-semibold text-[#0a1e3d]">
                              {currentPlan.registrationFee > 0
                                ? `₹${currentPlan.registrationFee.toLocaleString()}`
                                : 'Free'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-body text-gray-500">
                              {isMonthly ? 'Annual Fee (+10%)' : 'Tuition Fee'}
                            </span>
                            <span className="font-heading font-semibold text-[#0a1e3d]">
                              ₹{currentPlan.tuitionFee.toLocaleString()}
                            </span>
                          </div>
                          {currentPlan.materialFee > 0 && (
                            <div className="flex justify-between">
                              <span className="font-body text-gray-500">Material Fee</span>
                              <span className="font-heading font-semibold text-[#0a1e3d]">
                                ₹{currentPlan.materialFee.toLocaleString()}
                              </span>
                            </div>
                          )}
                          {currentPlan.discountAmount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span className="font-body">{currentPlan.discountLabel || 'Discount'}</span>
                              <span className="font-heading font-semibold">-₹{currentPlan.discountAmount.toLocaleString()}</span>
                            </div>
                          )}
                          {couponResults[classItem.id]?.valid && (
                            <div className="flex justify-between text-green-600">
                              <span className="font-body">Coupon Discount</span>
                              <span className="font-heading font-semibold">-₹{couponResults[classItem.id]!.discountAmount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="border-t border-gray-200 pt-2 flex justify-between">
                            <span className="font-heading font-bold text-[#0a1e3d]">
                              {isMonthly ? 'Total (Annual)' : 'Total Amount'}
                            </span>
                            <span className="font-heading font-extrabold text-lg text-[#05308d]">
                              ₹{(currentPlan.totalAmount - (couponResults[classItem.id]?.valid ? couponResults[classItem.id]!.discountAmount : 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Monthly breakdown */}
                        {isMonthly && planMeta.monthly_fee && (
                          <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                            <p className="font-heading text-[10px] font-bold text-[#05308d] uppercase tracking-wide mb-2">
                              Monthly Payment
                            </p>
                            <div className="flex justify-between text-sm">
                              <span className="font-body text-gray-500">
                                ₹{Number(planMeta.monthly_fee).toLocaleString()} x 12 months
                              </span>
                              <span className="font-heading font-bold text-[#05308d]">
                                ₹{Number(planMeta.monthly_fee).toLocaleString()}/mo
                              </span>
                            </div>
                            <p className="font-body text-[10px] text-gray-400 mt-1">
                              First month paid at enrollment, remaining 11 billed monthly.
                            </p>
                          </div>
                        )}

                        {/* 2-installment breakdown */}
                        {planMeta.installments === 2 && planMeta.installment_1 && (
                          <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                            <p className="font-heading text-[10px] font-bold text-[#05308d] uppercase tracking-wide mb-2">
                              Payment Schedule
                            </p>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="font-body text-gray-500">1st Installment (at admission)</span>
                                <span className="font-heading font-bold text-[#0a1e3d]">
                                  ₹{Number(planMeta.installment_1).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-body text-gray-500">2nd Installment (after 6 months)</span>
                                <span className="font-heading font-bold text-[#0a1e3d]">
                                  ₹{Number(planMeta.installment_2).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Coupon Code Input */}
                        {!classItem.isEnrolled && classItem.enrollmentOpen && (
                          <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                            <p className="font-heading text-[10px] font-bold text-[#05308d] uppercase tracking-wide mb-2">
                              Have a Coupon?
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Enter coupon code"
                                value={couponInputs[classItem.id] || ''}
                                onChange={(e) => {
                                  setCouponInputs((prev) => ({ ...prev, [classItem.id]: e.target.value.toUpperCase() }));
                                  setCouponResults((prev) => ({ ...prev, [classItem.id]: null }));
                                }}
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-body text-sm text-[#0a1e3d] placeholder-gray-400 focus:outline-none focus:border-[#05308d] focus:ring-1 focus:ring-[#05308d]/20 transition-colors"
                              />
                              <button
                                onClick={() => handleValidateCoupon(classItem.id)}
                                disabled={!couponInputs[classItem.id]?.trim() || validatingCoupon === classItem.id}
                                className="px-4 py-2 bg-[#05308d] text-white rounded-lg font-heading text-xs font-bold transition-colors hover:bg-[#1a56db] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none"
                              >
                                {validatingCoupon === classItem.id ? '...' : 'Apply'}
                              </button>
                            </div>
                            {couponResults[classItem.id] && (
                              <p className={`font-body text-xs mt-1.5 ${couponResults[classItem.id]!.valid ? 'text-green-600' : 'text-red-500'}`}>
                                {couponResults[classItem.id]!.valid
                                  ? `Coupon applied! ₹${couponResults[classItem.id]!.discountAmount.toLocaleString()} off`
                                  : couponResults[classItem.id]!.message || 'Invalid coupon'}
                              </p>
                            )}
                          </div>
                        )}
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

                    {/* Content Preview Toggle */}
                    <button
                      onClick={() => toggleContentPreview(classItem.id)}
                      className="w-full flex items-center justify-between px-4 py-3 mb-4 rounded-xl border border-dashed border-gray-300 hover:border-[#05308d]/40 hover:bg-[#05308d]/[0.02] transition-all duration-200 cursor-pointer bg-transparent group/preview"
                    >
                      <span className="flex items-center gap-2 font-heading text-sm font-semibold text-gray-600 group-hover/preview:text-[#05308d] transition-colors">
                        <HiOutlineEye className="w-4 h-4" />
                        Preview Study Material
                      </span>
                      <HiOutlineChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                          expandedClassId === classItem.id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Content Preview Panel */}
                    {expandedClassId === classItem.id && (
                      <div className="mb-5 rounded-xl border border-gray-100 overflow-hidden">
                        {contentData[classItem.id]?.loading ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="w-6 h-6 border-2 border-[#05308d] border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-3 font-body text-sm text-gray-400">Loading content...</span>
                          </div>
                        ) : !contentData[classItem.id]?.content?.length ? (
                          <div className="text-center py-8 px-4">
                            <HiOutlineBookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="font-body text-sm text-gray-400">No study material uploaded yet</p>
                          </div>
                        ) : (() => {
                          const items = contentData[classItem.id].content;
                          const isEnrolled = contentData[classItem.id].isEnrolled;
                          // Group by subject
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
                              {/* Stats bar */}
                              <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                <span className="inline-flex items-center gap-1 font-heading text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                                  <HiOutlineLockOpen className="w-3 h-3" />
                                  {freeCount} Free
                                </span>
                                {paidCount > 0 && (
                                  <span className="inline-flex items-center gap-1 font-heading text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                    <HiOutlineLockClosed className="w-3 h-3" />
                                    {paidCount} Premium
                                  </span>
                                )}
                              </div>

                              {/* Content list grouped by subject */}
                              <div className="max-h-[360px] overflow-y-auto">
                                {Object.entries(grouped).map(([subject, subjectItems]) => (
                                  <div key={subject}>
                                    <div className="px-4 py-2 bg-[#05308d]/[0.03] border-b border-gray-100">
                                      <h5 className="font-heading text-xs font-bold text-[#05308d] uppercase tracking-wide">{subject}</h5>
                                    </div>
                                    {subjectItems.map((item) => {
                                      const isLocked = !item.is_free && !isEnrolled;
                                      const isVideo = item.content_type === 'video';
                                      const isPdf = item.content_type === 'pdf' || item.content_type === 'document';

                                      return (
                                        <div
                                          key={item.id}
                                          className={`relative flex items-center gap-3 px-4 py-3 border-b border-gray-50 transition-colors duration-150 ${
                                            isLocked ? 'bg-gray-50/50' : 'hover:bg-blue-50/30'
                                          }`}
                                        >
                                          {/* Icon */}
                                          <div
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                              isLocked
                                                ? 'bg-gray-100 text-gray-400'
                                                : isVideo
                                                  ? 'bg-red-50 text-red-500'
                                                  : 'bg-blue-50 text-blue-500'
                                            }`}
                                          >
                                            {isLocked ? (
                                              <HiOutlineLockClosed className="w-4 h-4" />
                                            ) : isVideo ? (
                                              <HiOutlinePlay className="w-4 h-4" />
                                            ) : (
                                              <HiOutlineDocumentText className="w-4 h-4" />
                                            )}
                                          </div>

                                          {/* Info */}
                                          <div className="flex-1 min-w-0">
                                            <p className={`font-heading text-sm font-semibold truncate ${isLocked ? 'text-gray-400' : 'text-[#0a1e3d]'}`}>
                                              {item.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              {item.material_type && (
                                                <span className="font-body text-[10px] text-gray-400">
                                                  {materialTypeLabels[item.material_type] || item.material_type}
                                                </span>
                                              )}
                                              {item.file_size && (
                                                <span className="font-body text-[10px] text-gray-300">{formatFileSize(item.file_size)}</span>
                                              )}
                                              {item.duration_seconds && (
                                                <span className="font-body text-[10px] text-gray-300">{formatDuration(item.duration_seconds)}</span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Badge & Action */}
                                          {item.is_free ? (
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              <span className="font-heading text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">FREE</span>
                                              {item.file_url && (
                                                isVideo ? (
                                                  <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors no-underline">
                                                    <HiOutlinePlay className="w-3.5 h-3.5" />
                                                  </a>
                                                ) : isPdf && item.is_downloadable ? (
                                                  <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors no-underline">
                                                    <HiOutlineDownload className="w-3.5 h-3.5" />
                                                  </a>
                                                ) : (
                                                  <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors no-underline">
                                                    <HiOutlineEye className="w-3.5 h-3.5" />
                                                  </a>
                                                )
                                              )}
                                            </div>
                                          ) : (
                                            <span className="font-heading text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                              PREMIUM
                                            </span>
                                          )}

                                          {/* Lock overlay gradient for paid */}
                                          {isLocked && (
                                            <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none"></div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>

                              {/* Enroll prompt for locked content */}
                              {paidCount > 0 && !isEnrolled && (
                                <div className="px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100 flex items-center justify-between">
                                  <p className="font-body text-xs text-amber-800">
                                    <span className="font-semibold">Enroll now</span> to unlock all {paidCount} premium materials
                                  </p>
                                  <HiOutlineLockOpen className="w-4 h-4 text-amber-500" />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* CTA Button */}
                    {classItem.enrollmentStatus === 'active' ? (
                      <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-700 py-3.5 px-4 rounded-xl font-heading font-bold text-sm">
                        <HiOutlineAcademicCap className="w-5 h-5" />
                        Enrolled
                      </div>
                    ) : classItem.isEnrolled && classItem.registrationPaid && classItem.enrollmentStatus === 'pending' ? (
                      <button
                        onClick={() => handlePayTuition(classItem)}
                        disabled={enrollingClassId === classItem.id}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3.5 px-4 rounded-xl font-heading font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none hover:shadow-lg hover:shadow-amber-500/25"
                      >
                        {enrollingClassId === classItem.id ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <HiOutlineCreditCard className="w-5 h-5" />
                            Pay {isMonthly ? 'Month 1' : 'Tuition'} — ₹{(isMonthly
                              ? Number(planMeta.monthly_fee || 0)
                              : (currentPlan?.totalAmount || 0) - (currentPlan?.registrationFee || 0)
                            ).toLocaleString('en-IN')}
                          </>
                        )}
                      </button>
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
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============================================ */}
      {/* WHAT YOU GET — OFFLINE BATCH */}
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
