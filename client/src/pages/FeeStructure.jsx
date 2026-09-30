import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  HiOutlineAcademicCap,
  HiOutlineCash,
  HiOutlineClipboardCheck,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineChevronDown,
  HiOutlineClock,
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlineChatAlt2,
  HiOutlineClipboardList,
  HiOutlineHome,
  HiOutlineRefresh,
  HiOutlineBadgeCheck,
  HiOutlineLocationMarker,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import Footer from '../components/Footer';

/* ──────────────────────────────────────────────
   OFFLINE BATCH (Hybrid) — FEE DATA
   Source: migrations 018 + 021
   Plans: M (Monthly +10%), B (50/50 — 10% OFF, default), C (One-Time — 15% OFF)
   ────────────────────────────────────────────── */
const classFees = [
  { class: '6',  annual: 9799,  monthly: 899  },
  { class: '7',  annual: 10799, monthly: 990  },
  { class: '8',  annual: 11999, monthly: 1100 },
  { class: '9',  annual: 17000, monthly: 1559 },
  { class: '10', annual: 21000, monthly: 1925 },
  { class: '11', annual: 26000, monthly: 2384 },
  { class: '12', annual: 33000, monthly: 3025 },
];

const batchIncludes = [
  { icon: HiOutlineBookOpen,     text: 'Classroom teaching by experienced faculty' },
  { icon: HiOutlineUserGroup,    text: 'Subject-wise expert teachers' },
  { icon: HiOutlineClipboardCheck, text: 'Regular practice sessions' },
  { icon: HiOutlineChartBar,     text: 'Monthly tests and performance reports' },
  { icon: HiOutlineChatAlt2,     text: 'Doubt clearing sessions' },
  { icon: HiOutlineClipboardList, text: 'Worksheets and academic support' },
];

const offlineTerms = [
  'Only one payment option can be selected at the time of enrollment.',
  'Monthly Plan carries a +10% annual surcharge over the base annual fee.',
  '10% OFF is available on the 2-installment (50/50) plan; 15% OFF is available on one-time payment.',
  'Discounts apply on course fee only — registration fee and GST are excluded.',
  'Discounts cannot be combined.',
  'Delay beyond the due date will attract a late fine of ₹50 per day.',
  'Fees once paid are non-refundable.',
  'Registration fee is strictly non-refundable.',
  'Course fee once paid is non-transferable and non-adjustable.',
  'Students must follow institute discipline, attendance, and academic rules.',
  'Admission may be terminated due to misconduct or irregular attendance without any refund.',
  'If a class is cancelled by the institute or faculty, a replacement or extra class will be arranged.',
  'Batch timings or faculty may be changed at the discretion of the institute.',
  'Fee structure is valid for the current session; may be revised for new admissions.',
  "The management's decision shall be final and binding.",
];

/* ──────────────────────────────────────────────
   HOME TUITION — FEE DATA (3 LOCATIONS)
   Source: migrations 022 + 024
   Plans: M (Monthly, no surcharge), E (4-Inst — 5% OFF),
          C (2-Inst — 10% OFF, default), D (One-Time — 15% OFF)
   Monthly = annual / 12
   ────────────────────────────────────────────── */
const tuitionFeesByLocation = {
  lalganj: [
    { class: 'Nursery', monthly: 2000, annual: 24000 },
    { class: 'LKG',     monthly: 2050, annual: 24600 },
    { class: 'UKG',     monthly: 2100, annual: 25200 },
    { class: '1st',     monthly: 2150, annual: 25800 },
    { class: '2nd',     monthly: 2200, annual: 26400 },
    { class: '3rd',     monthly: 2250, annual: 27000 },
    { class: '4th',     monthly: 2300, annual: 27600 },
    { class: '5th',     monthly: 2500, annual: 30000 },
    { class: '6th',     monthly: 2600, annual: 31200 },
    { class: '7th',     monthly: 2700, annual: 32400 },
    { class: '8th',     monthly: 2800, annual: 33600 },
    { class: '9th',     monthly: 3200, annual: 38400 },
    { class: '10th',    monthly: 3500, annual: 42000 },
    { class: '11th',    monthly: 6000, annual: 72000 },
    { class: '12th',    monthly: 6500, annual: 78000 },
  ],
  pratapgarh: [
    { class: 'Nursery', monthly: 2500, annual: 30000 },
    { class: 'LKG',     monthly: 2550, annual: 30600 },
    { class: 'UKG',     monthly: 2600, annual: 31200 },
    { class: '1st',     monthly: 2700, annual: 32400 },
    { class: '2nd',     monthly: 2800, annual: 33600 },
    { class: '3rd',     monthly: 2900, annual: 34800 },
    { class: '4th',     monthly: 3000, annual: 36000 },
    { class: '5th',     monthly: 3100, annual: 37200 },
    { class: '6th',     monthly: 3200, annual: 38400 },
    { class: '7th',     monthly: 3300, annual: 39600 },
    { class: '8th',     monthly: 3400, annual: 40800 },
    { class: '9th',     monthly: 3800, annual: 45600 },
    { class: '10th',    monthly: 4100, annual: 49200 },
    { class: '11th',    monthly: 6600, annual: 79200 },
    { class: '12th',    monthly: 7100, annual: 85200 },
  ],
  prayagraj: [
    { class: 'Nursery', monthly: 3000, annual: 36000 },
    { class: 'LKG',     monthly: 3050, annual: 36600 },
    { class: 'UKG',     monthly: 3100, annual: 37200 },
    { class: '1st',     monthly: 3200, annual: 38400 },
    { class: '2nd',     monthly: 3300, annual: 39600 },
    { class: '3rd',     monthly: 3400, annual: 40800 },
    { class: '4th',     monthly: 3500, annual: 42000 },
    { class: '5th',     monthly: 3600, annual: 43200 },
    { class: '6th',     monthly: 3700, annual: 44400 },
    { class: '7th',     monthly: 3800, annual: 45600 },
    { class: '8th',     monthly: 3900, annual: 46800 },
    { class: '9th',     monthly: 4300, annual: 51600 },
    { class: '10th',    monthly: 4700, annual: 56400 },
    { class: '11th',    monthly: 7200, annual: 86400 },
    { class: '12th',    monthly: 7700, annual: 92400 },
  ],
};

const LOCATIONS = [
  { id: 'lalganj',    label: 'Lalganj' },
  { id: 'pratapgarh', label: 'Pratapgarh' },
  { id: 'prayagraj',  label: 'Prayagraj' },
];

const fmt = (n) => Math.round(n).toLocaleString('en-IN');

/* ──────────────────────────────────────────────
   SHARED: ACCORDION
   ────────────────────────────────────────────── */
function PolicyAccordion({ title, icon: Icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`group/acc border rounded-2xl transition-all duration-300 overflow-hidden ${
      isOpen ? 'border-[#05308d]/20 shadow-lg shadow-[#05308d]/5 bg-white dark:bg-slate-800 dark:border-slate-600' : 'border-gray-200 bg-white dark:bg-slate-800 dark:border-slate-700 hover:shadow-md hover:border-[#05308d]/10'
    }`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-6 text-left cursor-pointer bg-transparent border-none"
      >
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-[#05308d] text-white' : 'bg-[#05308d]/5 text-[#05308d] dark:bg-[#05308d]/20 dark:text-blue-300 group-hover/acc:bg-[#05308d]/10'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`flex-1 font-heading font-bold text-lg transition-colors duration-300 ${
          isOpen ? 'text-[#05308d] dark:text-blue-300' : 'text-[#0a1e3d] dark:text-slate-50'
        }`}>{title}</span>
        <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-[#05308d] text-white rotate-180' : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-slate-400 group-hover/acc:bg-[#05308d]/10 group-hover/acc:text-[#05308d]'
        }`}>
          <HiOutlineChevronDown className="w-4 h-4" />
        </span>
      </button>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 pt-0">
          <div className="w-12 h-[2px] bg-[#fbbf24] rounded-full mb-5"></div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   OPTION CARD + ROW
   ────────────────────────────────────────────── */
function OptionCard({ letter, label, badge, accentColor, children }) {
  const styles = {
    gray:  { border: 'border-gray-200 dark:border-slate-700 hover:border-[#05308d]/30', bg: 'bg-white dark:bg-slate-800', bar: 'bg-gray-200 dark:bg-slate-600',                                        badge: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'            },
    blue:  { border: 'border-gray-200 dark:border-slate-700 hover:border-[#05308d]/30', bg: 'bg-white dark:bg-slate-800', bar: 'bg-blue-200',                                         badge: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'             },
    green: { border: 'border-green-200 dark:border-green-800 hover:border-green-300',   bg: 'bg-white dark:bg-slate-800', bar: 'bg-gradient-to-r from-green-400 to-green-500',         badge: 'bg-green-100 dark:bg-green-900/30 text-green-700'          },
    gold:  { border: 'border-[#fbbf24]/30 hover:border-[#fbbf24]/50', bg: 'bg-gradient-to-br from-[#fbbf24]/5 to-white dark:from-[#fbbf24]/10 dark:to-slate-800', bar: 'bg-gradient-to-r from-[#fbbf24] to-yellow-500', badge: 'bg-[#fbbf24]/20 text-yellow-700' },
  };
  const s = styles[accentColor] || styles.gray;
  return (
    <div className={`relative rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${s.border} ${s.bg}`}>
      <div className={`h-1.5 ${s.bar}`}></div>
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-heading text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Option {letter}</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${s.badge}`}>{badge}</span>
            {accentColor === 'gold' && (
              <span className="bg-[#fbbf24] text-[#0a1e3d] text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md">Best Value</span>
            )}
          </div>
        </div>
        <h3 className="font-heading text-base sm:text-lg font-bold text-[#0a1e3d] dark:text-slate-50 mb-4">{label}</h3>
        {children}
      </div>
    </div>
  );
}

function CalcRow({ label, sub, value, highlight }) {
  return (
    <div className={`flex justify-between items-center py-2 px-3 rounded-lg ${highlight ? 'bg-[#05308d]/5 border border-[#05308d]/10' : 'bg-gray-50 dark:bg-slate-800'}`}>
      <div>
        <span className={`font-body text-xs block ${highlight ? 'font-semibold text-[#05308d]' : 'text-gray-500 dark:text-slate-400'}`}>{label}</span>
        {sub && <span className="font-body text-[10px] text-gray-400 dark:text-slate-500">{sub}</span>}
      </div>
      <span className={`font-heading text-sm font-bold ${highlight ? 'text-[#05308d]' : 'text-[#0a1e3d] dark:text-slate-50'}`}>{value}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────
   MAIN PAGE
   ────────────────────────────────────────────── */
const FeeStructure = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedOfflineClass, setSelectedOfflineClass] = useState(null);

  const activeTab = searchParams.get('tab') === 'home-tuition' ? 'home-tuition' : 'offline';
  const locParam = (searchParams.get('location') || '').toLowerCase();
  const selectedLocation = ['lalganj', 'pratapgarh', 'prayagraj'].includes(locParam) ? locParam : 'lalganj';
  const tuitionFees = tuitionFeesByLocation[selectedLocation];

  const switchTab = (tab) => {
    if (tab === 'home-tuition') {
      setSearchParams({ tab: 'home-tuition', location: selectedLocation });
    } else {
      setSearchParams({});
    }
    setSelectedClass(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchLocation = (loc) => {
    setSearchParams({ tab: 'home-tuition', location: loc });
    setSelectedClass(null);
  };

  /* Navigate to courses page for enrollment */
  const goToHomeTuitionEnroll = () => {
    navigate(`/courses/home-tuition?location=${selectedLocation}`);
  };
  const goToOfflineEnroll = () => {
    navigate('/courses/coaching_offline');
  };

  /* Home Tuition calculator — 4 plans (M, E, C, D) */
  const selectedTuition = tuitionFees.find((f) => f.class === selectedClass);
  const calc = selectedTuition
    ? (() => {
        const { monthly, annual } = selectedTuition;
        // Plan E (4-Installment, 5% OFF)
        const annualE = Math.round(annual * 0.95);
        const eq = Math.round(annualE / 4);
        // Plan C (2-Installment, 10% OFF)
        const annualC = Math.round(annual * 0.9);
        const c1 = Math.round(annualC / 2);
        const c2 = annualC - c1;
        // Plan D (One-Time, 15% OFF)
        const annualD = Math.round(annual * 0.85);
        return { monthly, annual, annualE, eq, annualC, c1, c2, annualD };
      })()
    : null;

  /* Offline Batch calculator — 3 plans (M, B, C) */
  const selectedOffline = classFees.find((f) => f.class === selectedOfflineClass);
  const offlineCalc = selectedOffline
    ? (() => {
        const { annual, monthly } = selectedOffline;
        // Plan M (Monthly, +10% surcharge)
        const annualWithSurcharge = Math.round(annual * 1.10);
        // Plan B: 10% OFF, 2 installments (50/50)
        const annualB = Math.round(annual * 0.9);
        const b1 = Math.round(annualB / 2);
        const b2 = annualB - b1;
        // Plan C: 15% OFF, one-time
        const annualC = Math.round(annual * 0.85);
        return { annual, monthlySurcharge: monthly, annualWithSurcharge, annualB, b1, b2, annualC };
      })()
    : null;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">

      {/* ============================================ */}
      {/* HERO */}
      {/* ============================================ */}
      <section
        className="relative pt-[80px] min-h-[50vh] flex items-center justify-center text-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#0a1e3d]/75"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-5 py-20">
          <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-4">
            Fee Structure
          </span>
          <h1 className="font-heading text-[32px] sm:text-[42px] md:text-[50px] font-extrabold text-white mb-4 leading-tight">
            {activeTab === 'home-tuition' ? 'Home Tuition — Fee & Payment Plans' : 'Hybrid Batch — Class 6 to 12'}
          </h1>
          <p className="font-body text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            {activeTab === 'home-tuition'
              ? 'Flexible payment options — monthly, quarterly, half-yearly, or one-time — with exclusive discounts.'
              : 'Transparent and affordable pricing. Choose monthly, half-yearly, or one-time payment.'}
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* TAB SWITCHER */}
      {/* ============================================ */}
      <section className="relative -mt-7 z-10 px-5">
        <div className="max-w-sm mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-1.5 flex gap-1.5">
            <button
              onClick={() => switchTab('offline')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-heading font-bold text-sm transition-all duration-250 cursor-pointer border-none ${
                activeTab === 'offline'
                  ? 'bg-[#05308d] text-white shadow-md shadow-[#05308d]/20'
                  : 'bg-transparent text-gray-500 dark:text-slate-400 hover:text-[#05308d] hover:bg-[#05308d]/5'
              }`}
            >
              <HiOutlineAcademicCap className="w-4 h-4" />
              Offline Batch
            </button>
            <button
              onClick={() => switchTab('home-tuition')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-heading font-bold text-sm transition-all duration-250 cursor-pointer border-none ${
                activeTab === 'home-tuition'
                  ? 'bg-[#05308d] text-white shadow-md shadow-[#05308d]/20'
                  : 'bg-transparent text-gray-500 dark:text-slate-400 hover:text-[#05308d] hover:bg-[#05308d]/5'
              }`}
            >
              <HiOutlineHome className="w-4 h-4" />
              Home Tuition
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ */}
      {/* HYBRID (OFFLINE) BATCH TAB                   */}
      {/* ════════════════════════════════════════════ */}
      {activeTab === 'offline' && (
        <>
          {/* Registration Fee Banner */}
          <section className="mt-10 px-5">
            <div className="max-w-4xl mx-auto">
              <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#05308d] via-[#fbbf24] to-[#05308d] bg-[length:200%_100%] group-hover:animate-[shimmer_2s_linear_infinite]"></div>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <HiOutlineCash className="w-8 h-8 text-[#fbbf24]" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#0a1e3d] dark:text-slate-50 mb-1">₹499 Registration Fee</h3>
                    <p className="font-body text-sm text-gray-500 dark:text-slate-400">One-Time, Mandatory & Non-Refundable — paid first as a separate step before tuition.</p>
                  </div>
                  <button
                    onClick={goToOfflineEnroll}
                    className="flex-shrink-0 inline-flex items-center gap-2 bg-[#05308d] text-white px-6 py-3 rounded-xl font-heading font-bold text-sm cursor-pointer border-none transition-all duration-300 hover:bg-[#1a56db] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#05308d]/25"
                  >
                    Enroll Now <HiOutlineArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Fee Calculator */}
          <section className="py-16 sm:py-20 bg-white dark:bg-slate-900">
            <div className="max-w-6xl mx-auto px-5">
              <div className="text-center mb-10">
                <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">Fee Calculator</span>
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] dark:text-slate-50 mb-3">Select Class & See All Options</h2>
                <p className="font-body text-gray-500 dark:text-slate-400 max-w-lg mx-auto">Click your class below — all 3 payment plans update instantly</p>
              </div>

              {/* Class Selector */}
              <div className="flex flex-wrap gap-2 justify-center mb-12">
                {classFees.map((f) => (
                  <button
                    key={f.class}
                    onClick={() => setSelectedOfflineClass(f.class)}
                    className={`px-4 py-2 rounded-xl font-heading font-bold text-sm transition-all duration-200 cursor-pointer border ${
                      selectedOfflineClass === f.class
                        ? 'bg-[#05308d] text-white border-[#05308d] shadow-md shadow-[#05308d]/25 scale-105'
                        : 'bg-white dark:bg-slate-800 text-[#0a1e3d] dark:text-slate-50 border-gray-200 dark:border-slate-700 hover:border-[#05308d]/30 hover:text-[#05308d] hover:bg-[#05308d]/5'
                    }`}
                  >Class {f.class}</button>
                ))}
              </div>

              {/* Empty state */}
              {!offlineCalc && (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">
                  <HiOutlineAcademicCap className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                  <p className="font-body text-gray-400 dark:text-slate-500">Select a class above to see all payment options</p>
                </div>
              )}

              {/* Option Cards */}
              {offlineCalc && (
                <>
                  <div className="text-center mb-6">
                    <span className="inline-flex items-center gap-2 bg-[#05308d]/5 text-[#05308d] px-4 py-2 rounded-xl font-heading text-sm font-bold">
                      <HiOutlineAcademicCap className="w-4 h-4" />
                      Class {selectedOfflineClass} — Annual Fee ₹{fmt(offlineCalc.annual)}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">

                    {/* OPTION M: Monthly Plan (+10% surcharge) */}
                    <OptionCard letter="M" label="Monthly Plan" badge="+10% surcharge" accentColor="gray">
                      <div className="mb-3">
                        <span className="font-heading text-2xl font-extrabold text-[#05308d]">₹{fmt(offlineCalc.monthlySurcharge)}</span>
                        <span className="font-body text-xs text-gray-400 dark:text-slate-500 ml-1">/ month</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <CalcRow label="At Admission" sub="Month 1 fee" value={`₹${fmt(offlineCalc.monthlySurcharge)}`} highlight />
                        <CalcRow label="Months 2 – 12" sub="Auto-billed monthly" value={`₹${fmt(offlineCalc.monthlySurcharge)} × 11`} />
                        <CalcRow label="Annual (with surcharge)" value={`₹${fmt(offlineCalc.annualWithSurcharge)}`} />
                      </div>
                      <p className="font-body text-[10px] text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 rounded-lg p-2.5">
                        ₹499 registration fee paid separately at admission. No discount on monthly plan.
                      </p>
                    </OptionCard>

                    {/* OPTION B: 10% OFF, 2 installments (50/50) */}
                    <OptionCard letter="B" label="2-Installment Plan (50/50)" badge="10% OFF" accentColor="green">
                      <div className="mb-3">
                        <span className="font-body text-xs text-gray-400 dark:text-slate-500 line-through">₹{fmt(offlineCalc.annual)}</span>
                        <span className="font-heading text-2xl font-extrabold text-[#05308d] ml-2">₹{fmt(offlineCalc.annualB)}</span>
                        <p className="font-body text-[10px] text-green-600 mt-0.5">Save ₹{fmt(offlineCalc.annual - offlineCalc.annualB)} on course fee</p>
                      </div>
                      <div className="space-y-2 mb-4">
                        <CalcRow label="1st — At Admission" sub="First half" value={`₹${fmt(offlineCalc.b1)}`} highlight />
                        <CalcRow label="2nd — Within 75 days" sub="Second half" value={`₹${fmt(offlineCalc.b2)}`} />
                      </div>
                      <p className="font-body text-[10px] text-gray-400 dark:text-slate-500 bg-green-50 dark:bg-green-900/20 rounded-lg p-2.5">
                        Default plan. Discount on course fee only. Reg fee & GST excluded.
                      </p>
                    </OptionCard>

                    {/* OPTION C: 15% OFF, One-Time */}
                    <OptionCard letter="C" label="One-Time Full Payment" badge="15% OFF" accentColor="gold">
                      <p className="font-body text-xs text-gray-400 dark:text-slate-500 line-through mb-0.5">₹{fmt(offlineCalc.annual)}</p>
                      <p className="font-heading text-3xl font-extrabold text-[#05308d] mb-0.5">₹{fmt(offlineCalc.annualC)}</p>
                      <p className="font-body text-[10px] text-yellow-700 mb-4">Save ₹{fmt(offlineCalc.annual - offlineCalc.annualC)} — maximum savings</p>
                      <div className="py-3 px-3 rounded-lg bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-center mb-3">
                        <span className="font-body text-xs text-gray-600 dark:text-slate-300 font-semibold">Full payment at admission</span>
                        <p className="font-body text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">No further installments</p>
                      </div>
                      <p className="font-body text-[10px] text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 rounded-lg p-2.5">
                        Discount on course fee only. Reg fee & GST excluded.
                      </p>
                    </OptionCard>

                  </div>

                  {/* Enroll CTA below cards */}
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={goToOfflineEnroll}
                      className="inline-flex items-center gap-2 bg-[#05308d] text-white px-7 py-3.5 rounded-xl font-heading font-bold text-sm sm:text-base cursor-pointer border-none transition-all duration-300 hover:bg-[#1a56db] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#05308d]/25"
                    >
                      Enroll in Class {selectedOfflineClass} <HiOutlineArrowRight className="w-4 h-4" />
                    </button>
                    <p className="font-body text-xs text-gray-400 dark:text-slate-500">Continue to courses page to choose plan & pay</p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Full Fee Reference Table */}
          <section className="py-16 sm:py-20 bg-gray-50 dark:bg-slate-800">
            <div className="max-w-5xl mx-auto px-5">
              <div className="text-center mb-10">
                <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">Reference Table</span>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0a1e3d] dark:text-slate-50 mb-2">All Classes Fee Overview</h2>
                <p className="font-body text-gray-500 dark:text-slate-400 text-sm">Click any row to load it into the calculator above, or enroll directly</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="bg-[#0a1e3d]">
                        <th className="px-5 py-4 text-left font-heading text-xs font-bold text-white uppercase tracking-wider">Class</th>
                        <th className="px-5 py-4 text-right font-heading text-xs font-bold text-white uppercase tracking-wider">Monthly<br/><span className="font-normal normal-case">(+10%)</span></th>
                        <th className="px-5 py-4 text-right font-heading text-xs font-bold text-white uppercase tracking-wider">Annual</th>
                        <th className="px-5 py-4 text-right font-heading text-xs font-bold text-[#fbbf24] uppercase tracking-wider">10% OFF<br/><span className="font-normal normal-case">(2 Inst.)</span></th>
                        <th className="px-5 py-4 text-right font-heading text-xs font-bold text-[#fbbf24] uppercase tracking-wider">15% OFF<br/><span className="font-normal normal-case">(One-time)</span></th>
                        <th className="px-5 py-4 text-center font-heading text-xs font-bold text-white uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classFees.map((f, i) => {
                        const isSel = selectedOfflineClass === f.class;
                        return (
                          <tr
                            key={f.class}
                            className={`border-b border-gray-100 dark:border-slate-700 transition-colors duration-150 ${isSel ? 'bg-[#05308d]/5' : i % 2 === 0 ? 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100/50 dark:hover:bg-slate-700/50'}`}
                          >
                            <td
                              onClick={() => {
                                setSelectedOfflineClass(f.class);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-5 py-3.5 cursor-pointer"
                            >
                              <span className={`font-heading font-bold text-sm ${isSel ? 'text-[#05308d]' : 'text-[#0a1e3d] dark:text-slate-50'}`}>Class {f.class}</span>
                              {isSel && <span className="ml-2 text-[10px] bg-[#05308d] text-white px-1.5 py-0.5 rounded font-bold">↑ Selected</span>}
                            </td>
                            <td className="px-5 py-3.5 text-right font-body text-sm text-gray-600 dark:text-slate-300">₹{fmt(f.monthly)}</td>
                            <td className="px-5 py-3.5 text-right font-body text-sm text-gray-600 dark:text-slate-300">₹{fmt(f.annual)}</td>
                            <td className="px-5 py-3.5 text-right font-heading text-sm font-semibold text-green-700">₹{fmt(f.annual * 0.9)}</td>
                            <td className="px-5 py-3.5 text-right font-heading text-sm font-semibold text-[#05308d]">₹{fmt(f.annual * 0.85)}</td>
                            <td className="px-5 py-3.5 text-center">
                              <button
                                onClick={() => navigate('/courses/coaching_offline')}
                                className="inline-flex items-center gap-1 bg-[#fbbf24] text-[#0a1e3d] px-3 py-1.5 rounded-lg font-heading font-bold text-[11px] cursor-pointer border-none transition-all duration-200 hover:bg-[#f5c842] hover:shadow-md hover:-translate-y-0.5"
                              >
                                Enroll <HiOutlineArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
                  <p className="font-body text-xs text-gray-400 dark:text-slate-500">₹499 registration fee is additional · Discounts apply on course fee only · Monthly plan adds +10% surcharge</p>
                </div>
              </div>
            </div>
          </section>

          {/* What's Included */}
          <section className="py-16 sm:py-20 bg-[#0a1e3d] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#05308d]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#fbbf24]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10 max-w-6xl mx-auto px-5">
              <div className="text-center mb-14">
                <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.15em] mb-3">What You Get</span>
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3">Hybrid Batch Includes</h2>
                <p className="font-body text-white/50 max-w-xl mx-auto">Every student gets access to complete academic support and resources</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {batchIncludes.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="group/inc relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:border-white/20 overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#fbbf24] to-transparent opacity-0 group-hover/inc:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute -top-8 -right-8 w-20 h-20 bg-[#fbbf24]/10 rounded-full blur-2xl opacity-0 group-hover/inc:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative z-10 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover/inc:scale-110 group-hover/inc:bg-[#fbbf24]/20">
                          <Icon className="w-6 h-6 text-[#fbbf24]" />
                        </div>
                        <p className="font-body text-white/80 text-sm sm:text-[15px] leading-relaxed pt-2.5 group-hover/inc:text-white transition-colors duration-300">{item.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Plan Summary — dark section */}
          <section className="py-16 sm:py-20 bg-[#0a1e3d] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#05308d]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#fbbf24]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10 max-w-6xl mx-auto px-5">
              <div className="text-center mb-12">
                <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.15em] mb-3">Payment Plans</span>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">Which Plan Is Right For You?</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {[
                  { letter: 'M', title: 'Monthly Plan', sub: '+10% surcharge', tag: 'Most Flexible', tagColor: 'bg-white/10 text-white/70', points: ['Pay each month for 12 months', '+10% on top of base annual fee', 'Month 1 due at enrollment', 'Months 2-12 auto-billed monthly'], icon: HiOutlineRefresh },
                  { letter: 'B', title: '2 Installments (50/50)', sub: '10% OFF', tag: 'Default · Save 10%', tagColor: 'bg-green-500/20 text-green-300', points: ['50% at admission', '50% within 75 days', '10% off on course fee', 'Reg & GST excluded'], icon: HiOutlineBadgeCheck },
                  { letter: 'C', title: 'One-Time Payment', sub: '15% OFF', tag: 'Best Value', tagColor: 'bg-[#fbbf24]/20 text-[#fbbf24]', points: ['Full payment at admission', '15% off on course fee', 'Maximum savings', 'No further dues'], icon: HiOutlineCash },
                ].map((plan) => {
                  const Icon = plan.icon;
                  return (
                    <div key={plan.letter} className="group/plan bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:border-white/20">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center transition-all duration-300 group-hover/plan:scale-110">
                          <Icon className="w-6 h-6 text-[#fbbf24]" />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${plan.tagColor}`}>{plan.tag}</span>
                      </div>
                      <h3 className="font-heading text-base font-bold text-white mb-0.5">Option {plan.letter} — {plan.title}</h3>
                      <p className="font-body text-xs text-white/50 mb-4">{plan.sub}</p>
                      <ul className="space-y-1.5">
                        {plan.points.map((pt, i) => (
                          <li key={i} className="font-body text-xs text-white/60 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]/60 mt-1 flex-shrink-0"></span>{pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Policies */}
          <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-800 dark:to-slate-900">
            <div className="max-w-4xl mx-auto px-5">
              <div className="text-center mb-14">
                <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">Policies</span>
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] dark:text-slate-50 mb-3">Important Information</h2>
                <p className="font-body text-gray-500 dark:text-slate-400 max-w-xl mx-auto">Please read our payment, refund, and admission policies carefully</p>
              </div>
              <div className="space-y-4">
                <PolicyAccordion title="Payment Options" icon={HiOutlineCash} defaultOpen={true}>
                  <div className="space-y-4">
                    <p className="font-body text-sm text-gray-600 dark:text-slate-300 leading-relaxed">Choose from <span className="font-semibold text-[#0a1e3d] dark:text-slate-50">3 payment options</span>:</p>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {[
                        { label: 'Option M', title: 'Monthly Plan', sub: '+10% surcharge · Pay across 12 months', color: 'gray' },
                        { label: 'Option B', title: '2 Installments (50/50)', sub: '10% OFF · Default · 2nd within 75 days', color: 'green' },
                        { label: 'Option C', title: 'One-Time Payment', sub: '15% OFF · Full payment at admission', color: 'gold' },
                      ].map((opt) => (
                        <div key={opt.label} className={`bg-[#05308d]/[0.03] border rounded-xl p-5 transition-all duration-300 hover:shadow-md ${
                          opt.color === 'green' ? 'border-green-200' : opt.color === 'gold' ? 'border-[#fbbf24]/30' : 'border-[#05308d]/10'
                        }`}>
                          <span className="font-heading text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{opt.label}</span>
                          <p className="font-heading font-bold text-[#0a1e3d] dark:text-slate-50 text-base mt-1 mb-1">{opt.title}</p>
                          <p className="font-body text-xs text-gray-500 dark:text-slate-400">{opt.sub}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-start gap-3 bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-xl p-4">
                      <HiOutlineExclamationCircle className="w-5 h-5 text-[#fbbf24] flex-shrink-0 mt-0.5" />
                      <p className="font-body text-sm text-gray-700 dark:text-slate-300">₹499 registration fee is mandatory, non-refundable, and paid as a separate first step before tuition. Only one payment option can be selected.</p>
                    </div>
                  </div>
                </PolicyAccordion>

                <PolicyAccordion title="Late Payment Fine" icon={HiOutlineClock}>
                  <ul className="space-y-3">
                    {[
                      'If the second installment is not paid within 75 days, a late payment fine of ₹50 per day will be charged.',
                      'Late fee will be calculated from the 76th day onwards.',
                      'Late fee must be paid along with the pending installment.',
                      'Non-payment beyond 90 days may result in cancellation of admission without any refund.',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 font-body text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                        <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </PolicyAccordion>

                <PolicyAccordion title="Refund Policy (15-Day Rule)" icon={HiOutlineShieldCheck}>
                  <div className="space-y-5">
                    <div className="border border-green-200 bg-green-50/50 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <HiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                        <h4 className="font-heading font-bold text-[#0a1e3d] dark:text-slate-50 text-sm">Before Commencement of Classes</h4>
                      </div>
                      <ul className="space-y-2 ml-7">
                        {['80% refund of course fee', 'Registration fee (₹499) is strictly non-refundable'].map((t, i) => (
                          <li key={i} className="font-body text-sm text-gray-600 dark:text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border border-yellow-200 bg-yellow-50/50 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <HiOutlineExclamationCircle className="w-5 h-5 text-yellow-600" />
                        <h4 className="font-heading font-bold text-[#0a1e3d] dark:text-slate-50 text-sm">Within 15 Days from Class Commencement</h4>
                      </div>
                      <ul className="space-y-2 ml-7">
                        {['50% refund of course fee', 'Registration fee (₹499), study material charges, and attended classes will be deducted'].map((t, i) => (
                          <li key={i} className="font-body text-sm text-gray-600 dark:text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0"></span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border border-red-200 bg-red-50/50 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <HiOutlineExclamationCircle className="w-5 h-5 text-red-500" />
                        <h4 className="font-heading font-bold text-[#0a1e3d] dark:text-slate-50 text-sm">After 15 Days</h4>
                      </div>
                      <ul className="space-y-2 ml-7">
                        {['No refund of course fee under any circumstances', 'Registration fee remains non-refundable'].map((t, i) => (
                          <li key={i} className="font-body text-sm text-gray-600 dark:text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>{t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </PolicyAccordion>

                <PolicyAccordion title="Terms & Conditions" icon={HiOutlineDocumentText}>
                  <ol className="space-y-3">
                    {offlineTerms.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 font-body text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[#05308d]/5 flex items-center justify-center text-[10px] font-heading font-bold text-[#05308d] mt-0.5">{i + 1}</span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </PolicyAccordion>
              </div>
            </div>
          </section>

          {/* Admission Declaration */}
          <section className="py-16 sm:py-20 bg-white dark:bg-slate-900">
            <div className="max-w-4xl mx-auto px-5">
              <div className="relative bg-gradient-to-br from-[#0a1e3d] to-[#05308d] rounded-2xl p-8 sm:p-12 overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#fbbf24]/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center">
                      <HiOutlineClipboardCheck className="w-6 h-6 text-[#fbbf24]" />
                    </div>
                    <h3 className="font-heading text-xl sm:text-2xl font-bold text-white">Admission Declaration</h3>
                  </div>
                  <blockquote className="font-body text-white/70 text-sm sm:text-base leading-relaxed italic border-l-4 border-[#fbbf24]/40 pl-5">
                    "I have read and understood the fee structure, registration fee, installment plan, late payment fine, refund policy, and terms & conditions of Be Educated. I agree to abide by all the rules and regulations of the institute."
                  </blockquote>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="relative py-16 sm:py-20 overflow-hidden">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1600&q=80"
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-[#05308d]/85 backdrop-blur-[2px]" />
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            </div>

            <div className="relative max-w-3xl mx-auto px-5 text-center">
              <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.15em] mb-3">Ready to Begin?</span>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">Take the First Step Today</h2>
              <p className="font-body text-white/70 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Secure your seat with just ₹499 registration fee. Limited seats available for each batch.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={goToOfflineEnroll}
                  className="group inline-flex items-center justify-center gap-2 bg-[#fbbf24] text-[#0a1e3d] px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base cursor-pointer border-none transition-all duration-300 hover:bg-[#f5c842] hover:shadow-lg hover:shadow-[#fbbf24]/30 hover:-translate-y-0.5"
                >
                  <span>Enroll Now</span>
                  <HiOutlineArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
                <a href="tel:+918382970800" className="inline-flex items-center justify-center gap-2 bg-white/10 border-2 border-white/25 text-white px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:shadow-md hover:-translate-y-0.5 backdrop-blur-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Call Us
                </a>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* HOME TUITION TAB                            */}
      {/* ════════════════════════════════════════════ */}
      {activeTab === 'home-tuition' && (
        <>
          {/* Registration Fee Banner */}
          <section className="mt-10 px-5">
            <div className="max-w-4xl mx-auto">
              <div className="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#05308d] via-[#fbbf24] to-[#05308d]"></div>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <HiOutlineCash className="w-8 h-8 text-[#fbbf24]" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#0a1e3d] dark:text-slate-50 mb-1">₹499 Registration Fee</h3>
                    <p className="font-body text-sm text-gray-500 dark:text-slate-400">One-Time · Mandatory · Non-Refundable — paid first as a separate step before tuition.</p>
                  </div>
                  <button
                    onClick={goToHomeTuitionEnroll}
                    className="flex-shrink-0 inline-flex items-center gap-2 bg-[#05308d] text-white px-6 py-3 rounded-xl font-heading font-bold text-sm cursor-pointer border-none transition-all duration-300 hover:bg-[#1a56db] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#05308d]/25"
                  >
                    Enroll Now <HiOutlineArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Location Switcher */}
          <section className="mt-10 px-5">
            <div className="max-w-2xl mx-auto">
              <p className="text-center font-heading text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-3">
                Select Your Location
              </p>
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-1.5 flex gap-1.5">
                {LOCATIONS.map((loc) => {
                  const isActive = selectedLocation === loc.id;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => switchLocation(loc.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-heading font-bold text-sm transition-all duration-250 cursor-pointer border-none ${
                        isActive
                          ? 'bg-[#05308d] text-white shadow-md shadow-[#05308d]/20'
                          : 'bg-transparent text-gray-500 dark:text-slate-400 hover:text-[#05308d] hover:bg-[#05308d]/5'
                      }`}
                    >
                      <HiOutlineLocationMarker className="w-4 h-4" />
                      {loc.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Fee Calculator */}
          <section className="py-16 sm:py-20 bg-white dark:bg-slate-900">
            <div className="max-w-6xl mx-auto px-5">
              <div className="text-center mb-10">
                <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">Fee Calculator</span>
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] dark:text-slate-50 mb-3">
                  Select Class — {LOCATIONS.find((l) => l.id === selectedLocation)?.label}
                </h2>
                <p className="font-body text-gray-500 dark:text-slate-400 max-w-lg mx-auto">Click your class below — all 4 payment plans update instantly</p>
              </div>

              {/* Class Selector */}
              <div className="flex flex-wrap gap-2 justify-center mb-12">
                {tuitionFees.map((f) => (
                  <button
                    key={f.class}
                    onClick={() => setSelectedClass(f.class)}
                    className={`px-4 py-2 rounded-xl font-heading font-bold text-sm transition-all duration-200 cursor-pointer border ${
                      selectedClass === f.class
                        ? 'bg-[#05308d] text-white border-[#05308d] shadow-md shadow-[#05308d]/25 scale-105'
                        : 'bg-white dark:bg-slate-800 text-[#0a1e3d] dark:text-slate-50 border-gray-200 dark:border-slate-700 hover:border-[#05308d]/30 hover:text-[#05308d] hover:bg-[#05308d]/5'
                    }`}
                  >{f.class}</button>
                ))}
              </div>

              {/* Empty state */}
              {!calc && (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">
                  <HiOutlineHome className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
                  <p className="font-body text-gray-400 dark:text-slate-500">Select a class above to see all payment options</p>
                </div>
              )}

              {/* Option Cards */}
              {calc && (
                <>
                  <div className="text-center mb-6">
                    <span className="inline-flex items-center gap-2 bg-[#05308d]/5 text-[#05308d] px-4 py-2 rounded-xl font-heading text-sm font-bold">
                      <HiOutlineAcademicCap className="w-4 h-4" />
                      Class {selectedClass} ({LOCATIONS.find((l) => l.id === selectedLocation)?.label}) — Monthly ₹{fmt(calc.monthly)} · Annual ₹{fmt(calc.annual)}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">

                    {/* OPTION M: Monthly Plan (no surcharge) */}
                    <OptionCard letter="M" label="Monthly Plan" badge="No Surcharge" accentColor="gray">
                      <div className="mb-3">
                        <span className="font-heading text-2xl font-extrabold text-[#05308d]">₹{fmt(calc.monthly)}</span>
                        <span className="font-body text-xs text-gray-400 dark:text-slate-500 ml-1">/ month</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <CalcRow label="At Admission" sub="Month 1 fee" value={`₹${fmt(calc.monthly)}`} highlight />
                        <CalcRow label="Months 2 – 12" sub="Auto-billed monthly" value={`₹${fmt(calc.monthly)} × 11`} />
                        <CalcRow label="Annual Total" value={`₹${fmt(calc.annual)}`} />
                      </div>
                      <p className="font-body text-[10px] text-gray-400 dark:text-slate-500 leading-relaxed bg-gray-50 dark:bg-slate-800 rounded-lg p-2.5">No surcharge. Most flexible plan — pay as you go.</p>
                    </OptionCard>

                    {/* OPTION E: 4-Installment Plan (5% OFF) */}
                    <OptionCard letter="E" label="4-Installment Plan" badge="5% OFF" accentColor="blue">
                      <div className="mb-3">
                        <span className="font-body text-xs text-gray-400 dark:text-slate-500 line-through">₹{fmt(calc.annual)}</span>
                        <span className="font-heading text-2xl font-extrabold text-[#05308d] ml-2">₹{fmt(calc.annualE)}</span>
                        <p className="font-body text-[10px] text-blue-600 mt-0.5">Save ₹{fmt(calc.annual - calc.annualE)}</p>
                      </div>
                      <div className="space-y-2 mb-4">
                        <CalcRow label="1st — At Admission" sub="Quarter 1" value={`₹${fmt(calc.eq)}`} highlight />
                        <CalcRow label="2nd — Day 90"  sub="Quarter 2" value={`₹${fmt(calc.eq)}`} />
                        <CalcRow label="3rd — Day 180" sub="Quarter 3" value={`₹${fmt(calc.eq)}`} />
                        <CalcRow label="4th — Day 270" sub="Quarter 4" value={`₹${fmt(calc.eq)}`} />
                      </div>
                      <p className="font-body text-[10px] text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 rounded-lg p-2.5">Discount on tuition only. Reg fee & GST excluded.</p>
                    </OptionCard>

                    {/* OPTION C: 2-Installment Plan (10% OFF) — DEFAULT */}
                    <OptionCard letter="C" label="2-Installment Plan" badge="10% OFF" accentColor="green">
                      <div className="mb-3">
                        <span className="font-body text-xs text-gray-400 dark:text-slate-500 line-through">₹{fmt(calc.annual)}</span>
                        <span className="font-heading text-2xl font-extrabold text-[#05308d] ml-2">₹{fmt(calc.annualC)}</span>
                        <p className="font-body text-[10px] text-green-600 mt-0.5">Save ₹{fmt(calc.annual - calc.annualC)}</p>
                      </div>
                      <div className="space-y-2 mb-4">
                        <CalcRow label="1st — At Admission" sub="First 6 months" value={`₹${fmt(calc.c1)}`} highlight />
                        <CalcRow label="2nd — Day 180" sub="Last 6 months" value={`₹${fmt(calc.c2)}`} />
                      </div>
                      <p className="font-body text-[10px] text-gray-400 dark:text-slate-500 bg-green-50 dark:bg-green-900/20 rounded-lg p-2.5">Default plan. Discount on tuition only. Reg fee & GST excluded.</p>
                    </OptionCard>

                    {/* OPTION D: One-Time Payment (15% OFF) */}
                    <OptionCard letter="D" label="One-Time Full Payment" badge="15% OFF" accentColor="gold">
                      <p className="font-body text-xs text-gray-400 dark:text-slate-500 line-through mb-0.5">₹{fmt(calc.annual)}</p>
                      <p className="font-heading text-3xl font-extrabold text-[#05308d] mb-0.5">₹{fmt(calc.annualD)}</p>
                      <p className="font-body text-[10px] text-yellow-700 mb-4">Save ₹{fmt(calc.annual - calc.annualD)} — maximum savings</p>
                      <div className="py-3 px-3 rounded-lg bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-center mb-3">
                        <span className="font-body text-xs text-gray-600 dark:text-slate-300 font-semibold">Full payment at admission</span>
                        <p className="font-body text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">No further installments</p>
                      </div>
                      <p className="font-body text-[10px] text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 rounded-lg p-2.5">Discount on tuition only. Reg fee & GST excluded.</p>
                    </OptionCard>

                  </div>

                  {/* Enroll CTA below cards */}
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={goToHomeTuitionEnroll}
                      className="inline-flex items-center gap-2 bg-[#05308d] text-white px-7 py-3.5 rounded-xl font-heading font-bold text-sm sm:text-base cursor-pointer border-none transition-all duration-300 hover:bg-[#1a56db] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#05308d]/25"
                    >
                      Enroll in {selectedClass} ({LOCATIONS.find((l) => l.id === selectedLocation)?.label}) <HiOutlineArrowRight className="w-4 h-4" />
                    </button>
                    <p className="font-body text-xs text-gray-400 dark:text-slate-500">Continue to courses page to choose plan & pay</p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Full Fee Table */}
          <section className="py-16 sm:py-20 bg-gray-50 dark:bg-slate-800">
            <div className="max-w-5xl mx-auto px-5">
              <div className="text-center mb-10">
                <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">Reference Table</span>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0a1e3d] dark:text-slate-50 mb-2">
                  All Classes — {LOCATIONS.find((l) => l.id === selectedLocation)?.label}
                </h2>
                <p className="font-body text-gray-500 dark:text-slate-400 text-sm">Click any row to load it into the calculator above, or enroll directly</p>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px]">
                    <thead>
                      <tr className="bg-[#0a1e3d]">
                        <th className="px-5 py-4 text-left font-heading text-xs font-bold text-white uppercase tracking-wider">Class</th>
                        <th className="px-5 py-4 text-right font-heading text-xs font-bold text-white uppercase tracking-wider">Monthly</th>
                        <th className="px-5 py-4 text-right font-heading text-xs font-bold text-white uppercase tracking-wider">Annual</th>
                        <th className="px-5 py-4 text-right font-heading text-xs font-bold text-[#fbbf24] uppercase tracking-wider">10% OFF<br/><span className="font-normal normal-case">(2 Inst.)</span></th>
                        <th className="px-5 py-4 text-right font-heading text-xs font-bold text-[#fbbf24] uppercase tracking-wider">15% OFF<br/><span className="font-normal normal-case">(One-time)</span></th>
                        <th className="px-5 py-4 text-center font-heading text-xs font-bold text-white uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tuitionFees.map((f, i) => {
                        const isSel = selectedClass === f.class;
                        return (
                          <tr
                            key={f.class}
                            className={`border-b border-gray-100 dark:border-slate-700 transition-colors duration-150 ${isSel ? 'bg-[#05308d]/5' : i % 2 === 0 ? 'bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100/50 dark:hover:bg-slate-700/50'}`}
                          >
                            <td
                              onClick={() => {
                                setSelectedClass(f.class);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-5 py-3.5 cursor-pointer"
                            >
                              <span className={`font-heading font-bold text-sm ${isSel ? 'text-[#05308d]' : 'text-[#0a1e3d] dark:text-slate-50'}`}>{f.class}</span>
                              {isSel && <span className="ml-2 text-[10px] bg-[#05308d] text-white px-1.5 py-0.5 rounded font-bold">↑ Selected</span>}
                            </td>
                            <td className="px-5 py-3.5 text-right font-body text-sm text-gray-600 dark:text-slate-300">₹{fmt(f.monthly)}</td>
                            <td className="px-5 py-3.5 text-right font-body text-sm text-gray-600 dark:text-slate-300">₹{fmt(f.annual)}</td>
                            <td className="px-5 py-3.5 text-right font-heading text-sm font-semibold text-green-700">₹{fmt(f.annual * 0.9)}</td>
                            <td className="px-5 py-3.5 text-right font-heading text-sm font-semibold text-[#05308d]">₹{fmt(f.annual * 0.85)}</td>
                            <td className="px-5 py-3.5 text-center">
                              <button
                                onClick={goToHomeTuitionEnroll}
                                className="inline-flex items-center gap-1 bg-[#fbbf24] text-[#0a1e3d] px-3 py-1.5 rounded-lg font-heading font-bold text-[11px] cursor-pointer border-none transition-all duration-200 hover:bg-[#f5c842] hover:shadow-md hover:-translate-y-0.5"
                              >
                                Enroll <HiOutlineArrowRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
                  <p className="font-body text-xs text-gray-400 dark:text-slate-500">₹499 registration fee is additional · Discounts apply on tuition fee only · Monthly = Annual ÷ 12 (no surcharge)</p>
                </div>
              </div>
            </div>
          </section>

          {/* Plan Summary — dark section */}
          <section className="py-16 sm:py-20 bg-[#0a1e3d] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#05308d]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#fbbf24]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="relative z-10 max-w-6xl mx-auto px-5">
              <div className="text-center mb-12">
                <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.15em] mb-3">Payment Plans</span>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">Which Plan Is Right For You?</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { letter: 'M', title: 'Monthly', sub: 'No Surcharge', tag: 'Most Flexible', tagColor: 'bg-white/10 text-white/70', points: ['Pay each month for 12 months', 'No surcharge — pure annual / 12', 'Month 1 due at enrollment', 'Months 2-12 auto-billed monthly'], icon: HiOutlineRefresh },
                  { letter: 'E', title: '4 Installments', sub: '5% OFF', tag: 'Save 5%', tagColor: 'bg-blue-500/20 text-blue-300', points: ['25% at admission', '25% at day 90', '25% at day 180', '25% at day 270'], icon: HiOutlineClipboardCheck },
                  { letter: 'C', title: '2 Installments', sub: '10% OFF', tag: 'Default · Save 10%', tagColor: 'bg-green-500/20 text-green-300', points: ['50% at admission', '50% at day 180', '10% off on annual', 'Reg & GST excluded'], icon: HiOutlineBadgeCheck },
                  { letter: 'D', title: 'One-Time', sub: '15% OFF', tag: 'Best Value', tagColor: 'bg-[#fbbf24]/20 text-[#fbbf24]', points: ['Full payment at admission', '15% off on annual', 'Maximum savings', 'No further dues'], icon: HiOutlineCash },
                ].map((plan) => {
                  const Icon = plan.icon;
                  return (
                    <div key={plan.letter} className="group/plan bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:border-white/20">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center transition-all duration-300 group-hover/plan:scale-110">
                          <Icon className="w-6 h-6 text-[#fbbf24]" />
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${plan.tagColor}`}>{plan.tag}</span>
                      </div>
                      <h3 className="font-heading text-base font-bold text-white mb-0.5">Option {plan.letter} — {plan.title}</h3>
                      <p className="font-body text-xs text-white/50 mb-4">{plan.sub}</p>
                      <ul className="space-y-1.5">
                        {plan.points.map((pt, i) => (
                          <li key={i} className="font-body text-xs text-white/60 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]/60 mt-1 flex-shrink-0"></span>{pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Policies */}
          <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-800 dark:to-slate-900">
            <div className="max-w-4xl mx-auto px-5">
              <div className="text-center mb-14">
                <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">Policies</span>
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] dark:text-slate-50 mb-3">Important Policies</h2>
                <p className="font-body text-gray-500 dark:text-slate-400 max-w-xl mx-auto">Please read all policies carefully before enrolling</p>
              </div>
              <div className="space-y-4">
                <PolicyAccordion title="Late Fee Policy" icon={HiOutlineClock} defaultOpen={true}>
                  <div className="space-y-3">
                    {[
                      '₹50 per day late fee is charged after the due date.',
                      'Delay beyond 7 days may lead to temporary suspension of home tuition classes.',
                      'Classes resume only after full payment clearance including late fees.',
                      'Monthly plan: payment is due by the 5th of each month.',
                      'Installment due dates are auto-calculated from the date of admission.',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 font-body text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                        <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>{item}
                      </div>
                    ))}
                  </div>
                </PolicyAccordion>

                <PolicyAccordion title="Refund & Cancellation" icon={HiOutlineExclamationCircle}>
                  <div className="space-y-3">
                    {[
                      '₹499 registration fee is strictly non-refundable.',
                      'Tuition fee once paid is non-refundable.',
                      'No adjustment or refund on mid-session discontinuation.',
                      'Institute reserves the right to change teacher or schedule.',
                      'Fee is non-transferable and cannot be adjusted for another student.',
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 font-body text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                        <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>{item}
                      </div>
                    ))}
                  </div>
                </PolicyAccordion>

                <PolicyAccordion title="Discount Rules" icon={HiOutlineBadgeCheck}>
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    {[
                      { plan: 'Option M — Monthly',        discount: 'No surcharge', color: 'gray'  },
                      { plan: 'Option E — 4 Installments', discount: '5% OFF',       color: 'blue'  },
                      { plan: 'Option C — 2 Installments', discount: '10% OFF',      color: 'green' },
                      { plan: 'Option D — One-Time',       discount: '15% OFF',      color: 'gold'  },
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center justify-between p-4 rounded-xl border ${item.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : item.color === 'gold' ? 'bg-[#fbbf24]/5 border-[#fbbf24]/20' : item.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                        <span className="font-body text-sm text-gray-700 dark:text-slate-300">{item.plan}</span>
                        <span className={`font-heading text-sm font-bold ${item.color === 'green' ? 'text-green-700' : item.color === 'gold' ? 'text-yellow-700' : item.color === 'blue' ? 'text-blue-700' : 'text-gray-400'}`}>{item.discount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-3 bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-xl p-4">
                    <HiOutlineExclamationCircle className="w-5 h-5 text-[#fbbf24] flex-shrink-0 mt-0.5" />
                    <p className="font-body text-sm text-gray-700 dark:text-slate-300">Only one plan can be selected. Discounts cannot be combined. Discount applies on tuition fee only — registration fee and GST excluded.</p>
                  </div>
                </PolicyAccordion>

                <PolicyAccordion title="General Terms & Conditions" icon={HiOutlineDocumentText}>
                  <ol className="space-y-3">
                    {[
                      'Only one payment option can be selected at the time of enrollment.',
                      'Installment due dates are auto-calculated from the admission date.',
                      'Fee structure is valid for the current session; may be revised for new admissions.',
                      'Fees vary by location — Lalganj, Pratapgarh, and Prayagraj have separate rates.',
                      'GST will be applied as per government regulations.',
                      'All disputes are subject to local jurisdiction only.',
                      'The management\'s decision shall be final and binding in all matters.',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3 font-body text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                        <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[#05308d]/5 flex items-center justify-center text-[10px] font-heading font-bold text-[#05308d] mt-0.5">{i + 1}</span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </PolicyAccordion>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 sm:py-20 bg-gray-50 dark:bg-slate-800">
            <div className="max-w-3xl mx-auto px-5 text-center">
              <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">Get Started</span>
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] dark:text-slate-50 mb-4">Book Your Home Tuition Today</h2>
              <p className="font-body text-gray-500 dark:text-slate-400 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">Personalised one-on-one learning by experienced faculty — at your doorstep. Limited slots available.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={goToHomeTuitionEnroll}
                  className="group inline-flex items-center justify-center gap-2 bg-[#05308d] text-white px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base cursor-pointer border-none transition-all duration-300 hover:bg-[#1a56db] hover:shadow-lg hover:shadow-[#05308d]/25 hover:-translate-y-0.5"
                >
                  <span>Enroll Now ({LOCATIONS.find((l) => l.id === selectedLocation)?.label})</span>
                  <HiOutlineArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
                <a href="tel:+918382970800" className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-2 border-[#05308d]/15 dark:border-slate-600 text-[#05308d] px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline transition-all duration-300 hover:border-[#05308d]/30 hover:shadow-md hover:-translate-y-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Call Us
                </a>
              </div>
            </div>
          </section>
        </>
      )}

      <Footer />
    </div>
  );
};

export default FeeStructure;
