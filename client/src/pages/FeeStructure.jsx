import { useState } from 'react';
import { Link } from 'react-router-dom';
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
} from 'react-icons/hi';
import Footer from '../components/Footer';

/* ──────────────────────────────────────────────
   FEE DATA
   ────────────────────────────────────────────── */
const classFees = [
  { class: '6', fee: '7,999', raw: 7999 },
  { class: '7', fee: '8,999', raw: 8999 },
  { class: '8', fee: '9,999', raw: 9999 },
  { class: '9', fee: '14,999', raw: 14999 },
  { class: '10', fee: '16,999', raw: 16999 },
  { class: '11', fee: '17,999', raw: 17999 },
  { class: '12', fee: '18,999', raw: 18999 },
];

const batchIncludes = [
  { icon: HiOutlineBookOpen, text: 'Classroom teaching by experienced faculty' },
  { icon: HiOutlineUserGroup, text: 'Subject-wise expert teachers' },
  { icon: HiOutlineClipboardCheck, text: 'Regular practice sessions' },
  { icon: HiOutlineChartBar, text: 'Monthly tests and performance reports' },
  { icon: HiOutlineChatAlt2, text: 'Doubt clearing sessions' },
  { icon: HiOutlineClipboardList, text: 'Worksheets and academic support' },
];

const termsConditions = [
  'Admission is confirmed only after payment of ₹499 registration fee + 70% course fee.',
  'The remaining 30% course fee must be paid within 45 days from the admission date.',
  'Delay beyond 45 days will attract a late fine of ₹50 per day.',
  'Non-payment beyond 60 days may lead to cancellation of admission without any refund.',
  'Registration fee is strictly non-refundable.',
  'Course fee once paid is non-transferable and non-adjustable.',
  'Students must follow institute discipline, attendance, and academic rules.',
  'Admission may be terminated due to misconduct or irregular attendance without any refund.',
  'No compensation will be provided if a student misses any class.',
  'If a class is cancelled by the institute or faculty, a replacement or extra class will be arranged.',
  'Batch timings or faculty may be changed at the discretion of the institute.',
  'Official communication will be through notice board or WhatsApp only.',
  "The management's decision shall be final and binding.",
];

/* ──────────────────────────────────────────────
   ACCORDION (for T&C, Refund expandable sections)
   ────────────────────────────────────────────── */
function PolicyAccordion({ title, icon: Icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div
      className={`group/acc border rounded-2xl transition-all duration-300 overflow-hidden ${
        isOpen
          ? 'border-[#05308d]/20 shadow-lg shadow-[#05308d]/5 bg-white'
          : 'border-gray-200 bg-white hover:shadow-md hover:border-[#05308d]/10'
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-4 p-6 text-left cursor-pointer bg-transparent border-none"
      >
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? 'bg-[#05308d] text-white'
              : 'bg-[#05308d]/5 text-[#05308d] group-hover/acc:bg-[#05308d]/10'
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span
          className={`flex-1 font-heading font-bold text-lg transition-colors duration-300 ${
            isOpen ? 'text-[#05308d]' : 'text-[#0a1e3d]'
          }`}
        >
          {title}
        </span>
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? 'bg-[#05308d] text-white rotate-180'
              : 'bg-gray-100 text-gray-400 group-hover/acc:bg-[#05308d]/10 group-hover/acc:text-[#05308d]'
          }`}
        >
          <HiOutlineChevronDown className="w-4 h-4" />
        </span>
      </button>
      <div
        className={`transition-all duration-400 ease-in-out ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6 pt-0">
          <div className="w-12 h-[2px] bg-[#fbbf24] rounded-full mb-5"></div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   FEE STRUCTURE PAGE
   ────────────────────────────────────────────── */
const FeeStructure = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================ */}
      {/* HERO SECTION */}
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
            Offline Batch — Class 6 to 12
          </h1>
          <p className="font-body text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Transparent and affordable pricing. Invest in your child's future with quality education.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* REGISTRATION FEE BANNER */}
      {/* ============================================ */}
      <section className="relative -mt-10 z-10 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="group relative bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:shadow-2xl">
            {/* Shimmer line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#05308d] via-[#fbbf24] to-[#05308d] bg-[length:200%_100%] group-hover:animate-[shimmer_2s_linear_infinite]"></div>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                <HiOutlineCash className="w-8 h-8 text-[#fbbf24]" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#0a1e3d] mb-1">
                  ₹499 Registration Fee
                </h3>
                <p className="font-body text-sm text-gray-500">
                  One-Time, Mandatory & Non-Refundable — payable at the time of admission, separate from course fee.
                </p>
              </div>
              <Link
                to="/contact"
                className="flex-shrink-0 bg-[#05308d] text-white px-6 py-3 rounded-xl font-heading font-bold text-sm no-underline transition-all duration-300 hover:bg-[#1a56db] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#05308d]/25"
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CLASS-WISE FEE CARDS */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
              Course Fee
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] mb-3">
              Class-Wise Fee Structure
            </h2>
            <p className="font-body text-gray-500 max-w-xl mx-auto">
              Course fee does not include ₹499 registration fee
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {classFees.map((item, index) => {
              const isPopular = item.class === '11' || item.class === '12';
              const isHovered = hoveredCard === index;
              return (
                <div
                  key={item.class}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className={`group/card relative rounded-2xl border overflow-hidden transition-all duration-300 cursor-default ${
                    isPopular
                      ? 'border-[#05308d]/20 bg-white'
                      : 'border-gray-200 bg-white'
                  } hover:shadow-xl hover:-translate-y-1.5 hover:border-[#05308d]/30`}
                >
                  {/* Top accent bar */}
                  <div
                    className={`h-1.5 transition-all duration-500 ${
                      isHovered
                        ? 'bg-gradient-to-r from-[#05308d] to-[#fbbf24]'
                        : isPopular
                        ? 'bg-[#05308d]'
                        : 'bg-gray-200'
                    }`}
                  ></div>

                  {/* Popular tag */}
                  {isPopular && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-[#fbbf24] text-[#0a1e3d] text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                        Popular
                      </span>
                    </div>
                  )}

                  {/* Corner glow */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#05308d]/5 rounded-full blur-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>

                  <div className="p-6 sm:p-7">
                    {/* Class label */}
                    <div className="flex items-center gap-3 mb-5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isHovered
                            ? 'bg-[#05308d] text-white scale-110'
                            : 'bg-[#05308d]/5 text-[#05308d]'
                        }`}
                      >
                        <HiOutlineAcademicCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-heading text-lg font-bold text-[#0a1e3d] group-hover/card:text-[#05308d] transition-colors duration-300">
                          Class {item.class}
                        </h3>
                        <p className="font-body text-xs text-gray-400">
                          Offline Batch
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                      <div className="flex items-baseline gap-1">
                        <span className="font-heading text-3xl sm:text-[34px] font-extrabold text-[#0a1e3d] group-hover/card:text-[#05308d] transition-colors duration-300">
                          ₹{item.fee}
                        </span>
                      </div>
                      <p className="font-body text-xs text-gray-400 mt-1">per year / full course</p>
                    </div>

                    {/* Installment breakdown */}
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50 group-hover/card:bg-[#05308d]/[0.03] transition-colors duration-300">
                        <span className="font-body text-xs text-gray-500">1st Installment (70%)</span>
                        <span className="font-heading text-sm font-bold text-[#0a1e3d]">
                          ₹{Math.round(item.raw * 0.7).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50 group-hover/card:bg-[#05308d]/[0.03] transition-colors duration-300">
                        <span className="font-body text-xs text-gray-500">2nd Installment (30%)</span>
                        <span className="font-heading text-sm font-bold text-[#0a1e3d]">
                          ₹{Math.round(item.raw * 0.3).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Enroll CTA */}
                    <Link
                      to="/contact"
                      className={`block w-full py-3 text-center rounded-xl font-heading font-bold text-sm no-underline transition-all duration-300 ${
                        isPopular
                          ? 'bg-[#05308d] text-white hover:bg-[#1a56db] hover:shadow-lg hover:shadow-[#05308d]/25'
                          : 'bg-[#05308d]/5 text-[#05308d] hover:bg-[#05308d] hover:text-white'
                      }`}
                    >
                      Enroll Now
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* WHAT'S INCLUDED */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-[#0a1e3d] relative overflow-hidden">
        {/* Decorative */}
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
              Every student gets access to complete academic support and resources
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {batchIncludes.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="group/inc relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:border-white/20 overflow-hidden"
                >
                  {/* Gold shimmer line */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#fbbf24] to-transparent opacity-0 group-hover/inc:opacity-100 transition-opacity duration-500 group-hover/inc:animate-[shimmer_2s_linear_infinite] bg-[length:200%_100%]"></div>
                  {/* Glow orb */}
                  <div className="absolute -top-8 -right-8 w-20 h-20 bg-[#fbbf24]/10 rounded-full blur-2xl opacity-0 group-hover/inc:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative z-10 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover/inc:scale-110 group-hover/inc:bg-[#fbbf24]/20">
                      <Icon className="w-6 h-6 text-[#fbbf24]" />
                    </div>
                    <p className="font-body text-white/80 text-sm sm:text-[15px] leading-relaxed pt-2.5 group-hover/inc:text-white transition-colors duration-300">
                      {item.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* POLICIES SECTION */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
              Policies
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] mb-3">
              Important Information
            </h2>
            <p className="font-body text-gray-500 max-w-xl mx-auto">
              Please read our payment, refund, and admission policies carefully
            </p>
          </div>

          <div className="space-y-4">
            {/* INSTALLMENT POLICY */}
            <PolicyAccordion title="Fee Payment Policy (Installment System)" icon={HiOutlineCash} defaultOpen={true}>
              <div className="space-y-4">
                <p className="font-body text-sm text-gray-600 leading-relaxed">
                  Course fee can be paid in <span className="font-semibold text-[#0a1e3d]">two installments</span>:
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="group/inst bg-[#05308d]/[0.03] border border-[#05308d]/10 rounded-xl p-5 transition-all duration-300 hover:border-[#05308d]/20 hover:shadow-md">
                    <div className="w-10 h-10 rounded-lg bg-[#05308d]/10 flex items-center justify-center mb-3 transition-all duration-300 group-hover/inst:bg-[#05308d] group-hover/inst:text-white">
                      <span className="font-heading font-bold text-sm text-[#05308d] group-hover/inst:text-white">1st</span>
                    </div>
                    <p className="font-heading font-bold text-[#0a1e3d] text-lg mb-1">70% of Course Fee</p>
                    <p className="font-body text-xs text-gray-500">At the time of admission</p>
                  </div>
                  <div className="group/inst bg-[#05308d]/[0.03] border border-[#05308d]/10 rounded-xl p-5 transition-all duration-300 hover:border-[#05308d]/20 hover:shadow-md">
                    <div className="w-10 h-10 rounded-lg bg-[#05308d]/10 flex items-center justify-center mb-3 transition-all duration-300 group-hover/inst:bg-[#05308d] group-hover/inst:text-white">
                      <span className="font-heading font-bold text-sm text-[#05308d] group-hover/inst:text-white">2nd</span>
                    </div>
                    <p className="font-heading font-bold text-[#0a1e3d] text-lg mb-1">30% of Course Fee</p>
                    <p className="font-body text-xs text-gray-500">Within 45 days from admission</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-xl p-4">
                  <HiOutlineExclamationCircle className="w-5 h-5 text-[#fbbf24] flex-shrink-0 mt-0.5" />
                  <p className="font-body text-sm text-gray-700">
                    Admission will be confirmed only after payment of <span className="font-semibold">₹499 registration fee + 70% course fee</span>.
                  </p>
                </div>
              </div>
            </PolicyAccordion>

            {/* LATE PAYMENT */}
            <PolicyAccordion title="Late Payment Fine" icon={HiOutlineClock}>
              <ul className="space-y-3">
                {[
                  'If the second installment is not paid within 45 days, a late payment fine of ₹50 per day will be charged.',
                  'Late fee will be calculated from the 46th day onwards.',
                  'Late fee must be paid along with the pending installment.',
                  'Non-payment beyond 60 days may result in cancellation of admission without any refund.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 font-body text-sm text-gray-600 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </PolicyAccordion>

            {/* REFUND POLICY */}
            <PolicyAccordion title="Refund Policy (15-Day Rule)" icon={HiOutlineShieldCheck}>
              <div className="space-y-5">
                {/* Before commencement */}
                <div className="border border-green-200 bg-green-50/50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <HiOutlineCheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-heading font-bold text-[#0a1e3d] text-sm">Before Commencement of Classes</h4>
                  </div>
                  <ul className="space-y-2 ml-7">
                    <li className="font-body text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></span>
                      80% refund of course fee
                    </li>
                    <li className="font-body text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0"></span>
                      Registration fee (₹499) is strictly non-refundable
                    </li>
                  </ul>
                </div>

                {/* Within 15 days */}
                <div className="border border-yellow-200 bg-yellow-50/50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <HiOutlineExclamationCircle className="w-5 h-5 text-yellow-600" />
                    <h4 className="font-heading font-bold text-[#0a1e3d] text-sm">Within 15 Days from Class Commencement</h4>
                  </div>
                  <ul className="space-y-2 ml-7">
                    <li className="font-body text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0"></span>
                      50% refund of course fee
                    </li>
                    <li className="font-body text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-1.5 flex-shrink-0"></span>
                      Registration fee (₹499), study material charges, and attended classes will be deducted
                    </li>
                  </ul>
                </div>

                {/* After 15 days */}
                <div className="border border-red-200 bg-red-50/50 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <HiOutlineExclamationCircle className="w-5 h-5 text-red-500" />
                    <h4 className="font-heading font-bold text-[#0a1e3d] text-sm">After 15 Days</h4>
                  </div>
                  <ul className="space-y-2 ml-7">
                    <li className="font-body text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                      No refund of course fee under any circumstances
                    </li>
                    <li className="font-body text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                      Registration fee remains non-refundable
                    </li>
                  </ul>
                </div>

                {/* Important conditions */}
                <div className="border border-gray-200 bg-gray-50/50 rounded-xl p-5">
                  <h4 className="font-heading font-bold text-[#0a1e3d] text-sm mb-3">Important Refund Conditions</h4>
                  <ul className="space-y-2">
                    {[
                      'Course fee once paid is non-transferable and non-adjustable',
                      'Installment amounts are non-refundable',
                      'No refund for Foundation / JEE / NEET / NDA / Olympiad batches',
                      'Refund requests will be processed only through written application',
                    ].map((item, i) => (
                      <li key={i} className="font-body text-sm text-gray-600 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 flex-shrink-0"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </PolicyAccordion>

            {/* TERMS & CONDITIONS */}
            <PolicyAccordion title="Terms & Conditions" icon={HiOutlineDocumentText}>
              <ol className="space-y-3">
                {termsConditions.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 font-body text-sm text-gray-600 leading-relaxed">
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[#05308d]/5 flex items-center justify-center text-[10px] font-heading font-bold text-[#05308d] mt-0.5">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </PolicyAccordion>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* ADMISSION DECLARATION */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-5">
          <div className="relative bg-gradient-to-br from-[#0a1e3d] to-[#05308d] rounded-2xl p-8 sm:p-12 overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#fbbf24]/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center">
                  <HiOutlineClipboardCheck className="w-6 h-6 text-[#fbbf24]" />
                </div>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-white">
                  Admission Declaration
                </h3>
              </div>
              <blockquote className="font-body text-white/70 text-sm sm:text-base leading-relaxed italic border-l-4 border-[#fbbf24]/40 pl-5">
                "I have read and understood the fee structure, registration fee, installment plan, late payment fine, refund policy, and terms & conditions of Be Educated. I agree to abide by all the rules and regulations of the institute."
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA SECTION */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
            Ready to Begin?
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] mb-4">
            Take the First Step Today
          </h2>
          <p className="font-body text-gray-500 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Secure your seat with just ₹499 registration fee. Limited seats available for each batch.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="group relative inline-flex items-center justify-center gap-2 bg-[#05308d] text-white px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline overflow-hidden transition-all duration-300 hover:bg-[#1a56db] hover:shadow-lg hover:shadow-[#05308d]/25 hover:-translate-y-0.5"
            >
              <span className="relative z-10">Enquire Now</span>
              <svg
                className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="tel:+919876543210"
              className="group inline-flex items-center justify-center gap-2 bg-white border-2 border-[#05308d]/15 text-[#05308d] px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline transition-all duration-300 hover:border-[#05308d]/30 hover:shadow-md hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Call Us
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeeStructure;
