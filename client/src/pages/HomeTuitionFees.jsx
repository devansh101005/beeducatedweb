import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineAcademicCap,
  HiOutlineCash,
  HiOutlineClipboardCheck,
  HiOutlineShieldCheck,
  HiOutlineDocumentText,
  HiOutlineExclamationCircle,
  HiOutlineChevronDown,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineBadgeCheck,
} from 'react-icons/hi';
import Footer from '../components/Footer';

/* ──────────────────────────────────────────────
   FEE DATA
   ────────────────────────────────────────────── */
const feeData = [
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
];

/* Format number as Indian currency (no decimals) */
const fmt = (n) => Math.round(n).toLocaleString('en-IN');

/* ──────────────────────────────────────────────
   ACCORDION
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
        className={`transition-all duration-300 ease-in-out ${
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
   OPTION CARD
   ────────────────────────────────────────────── */
function OptionCard({ letter, label, badge, badgeColor, accentColor, children }) {
  const colors = {
    gray:   { bar: 'bg-gray-200',                                badge: 'bg-gray-100 text-gray-500'              },
    blue:   { bar: 'bg-blue-200',                                badge: 'bg-blue-50 text-blue-600'               },
    green:  { bar: 'bg-gradient-to-r from-green-400 to-green-500', badge: 'bg-green-100 text-green-700'           },
    gold:   { bar: 'bg-gradient-to-r from-[#fbbf24] to-yellow-500', badge: 'bg-[#fbbf24]/20 text-yellow-700'    },
  };
  const c = colors[accentColor] || colors.gray;

  return (
    <div
      className={`relative rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        accentColor === 'gold'
          ? 'border-[#fbbf24]/30 bg-gradient-to-br from-[#fbbf24]/5 to-white hover:border-[#fbbf24]/50'
          : accentColor === 'green'
          ? 'border-green-200 bg-white hover:border-green-300'
          : 'border-gray-200 bg-white hover:border-[#05308d]/30'
      }`}
    >
      {/* Top accent bar */}
      <div className={`h-1.5 ${c.bar}`}></div>

      {/* Best Value tag */}
      {accentColor === 'gold' && (
        <div className="absolute top-4 right-4">
          <span className="bg-[#fbbf24] text-[#0a1e3d] text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Best Value
          </span>
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-heading text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Option {letter}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${c.badge}`}>
            {badge}
          </span>
        </div>
        <h3 className="font-heading text-base sm:text-lg font-bold text-[#0a1e3d] mb-4">{label}</h3>
        {children}
      </div>
    </div>
  );
}

/* Row helper inside option cards */
function Row({ label, sub, value, highlight }) {
  return (
    <div
      className={`flex justify-between items-center py-2 px-3 rounded-lg ${
        highlight ? 'bg-[#05308d]/5 border border-[#05308d]/10' : 'bg-gray-50'
      }`}
    >
      <div>
        <span className={`font-body text-xs block ${highlight ? 'font-semibold text-[#05308d]' : 'text-gray-500'}`}>
          {label}
        </span>
        {sub && <span className="font-body text-[10px] text-gray-400">{sub}</span>}
      </div>
      <span className={`font-heading text-sm font-bold ${highlight ? 'text-[#05308d]' : 'text-[#0a1e3d]'}`}>
        {value}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────
   PAGE
   ────────────────────────────────────────────── */
const HomeTuitionFees = () => {
  const [selectedClass, setSelectedClass] = useState(null);

  const selected = feeData.find((f) => f.class === selectedClass);

  const calc = selected
    ? (() => {
        const { monthly, annual } = selected;
        // Option A
        const atAdmissionA = 499 + monthly * 2; // reg + current month + security
        // Option B (no discount, 4 installments: 25/33.33/31.67/10)
        const b1 = Math.round(annual * 0.25);
        const b2 = Math.round(annual * 0.3333);
        const b3 = Math.round(annual * 0.3167);
        const b4 = annual - b1 - b2 - b3; // absorb rounding
        // Option C (10% off, 2 installments)
        const annualC = Math.round(annual * 0.9);
        const c1 = Math.round(annualC / 2);
        const c2 = annualC - c1;
        // Option D (15% off, one-time)
        const annualD = Math.round(annual * 0.85);
        return { monthly, annual, atAdmissionA, b1, b2, b3, b4, annualC, c1, c2, annualD };
      })()
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================ */}
      {/* HERO */}
      {/* ============================================ */}
      <section
        className="relative pt-[80px] min-h-[50vh] flex items-center justify-center text-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#0a1e3d]/80"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-5 py-20">
          <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-4">
            Home Tuition
          </span>
          <h1 className="font-heading text-[32px] sm:text-[42px] md:text-[50px] font-extrabold text-white mb-4 leading-tight">
            Fee Structure & Payment Plans
          </h1>
          <p className="font-body text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Personalised learning at home — choose from monthly, installment, or one-time payment with exclusive discounts.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* REGISTRATION FEE BANNER */}
      {/* ============================================ */}
      <section className="relative -mt-10 z-10 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="group relative bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#05308d] via-[#fbbf24] to-[#05308d]"></div>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                <HiOutlineCash className="w-8 h-8 text-[#fbbf24]" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#0a1e3d] mb-1">
                  ₹499 Registration Fee
                </h3>
                <p className="font-body text-sm text-gray-500">
                  One-Time · Mandatory · Non-Refundable — payable at admission, separate from tuition fee.
                </p>
              </div>
              <Link
                to="/contact"
                className="flex-shrink-0 bg-[#05308d] text-white px-6 py-3 rounded-xl font-heading font-bold text-sm no-underline transition-all duration-300 hover:bg-[#1a56db] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#05308d]/25"
              >
                Enquire Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FEE CALCULATOR */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-10">
            <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
              Fee Calculator
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] mb-3">
              Select Class & See All Options
            </h2>
            <p className="font-body text-gray-500 max-w-lg mx-auto">
              Click your class below — all 4 payment plans update instantly
            </p>
          </div>

          {/* Class Selector Pills */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {feeData.map((f) => (
              <button
                key={f.class}
                onClick={() => setSelectedClass(f.class)}
                className={`px-4 py-2 rounded-xl font-heading font-bold text-sm transition-all duration-200 cursor-pointer border ${
                  selectedClass === f.class
                    ? 'bg-[#05308d] text-white border-[#05308d] shadow-md shadow-[#05308d]/25 scale-105'
                    : 'bg-white text-[#0a1e3d] border-gray-200 hover:border-[#05308d]/30 hover:text-[#05308d] hover:bg-[#05308d]/5'
                }`}
              >
                {f.class}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {!calc && (
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
              <HiOutlineAcademicCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-body text-gray-400">Select a class above to see all payment options</p>
            </div>
          )}

          {/* 4 Option Cards */}
          {calc && (
            <>
              <div className="text-center mb-6">
                <span className="inline-flex items-center gap-2 bg-[#05308d]/5 text-[#05308d] px-4 py-2 rounded-xl font-heading text-sm font-bold">
                  <HiOutlineAcademicCap className="w-4 h-4" />
                  Class {selectedClass} — Monthly ₹{fmt(calc.monthly)} · Annual ₹{fmt(calc.annual)}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">

                {/* OPTION A: Monthly */}
                <OptionCard letter="A" label="Monthly Plan" badge="No Discount" accentColor="gray">
                  <div className="space-y-2 mb-4">
                    <Row label="Monthly Fee" value={`₹${fmt(calc.monthly)}`} />
                    <Row label="Security Deposit" sub="1 month advance" value={`₹${fmt(calc.monthly)}`} />
                    <Row label="At Admission Total" sub="Reg + Month + Deposit" value={`₹${fmt(calc.atAdmissionA)}`} highlight />
                  </div>
                  <p className="font-body text-[10px] text-gray-400 leading-relaxed bg-gray-50 rounded-lg p-2.5">
                    Security deposit is interest-free and adjusted against the last month's fee on course completion.
                  </p>
                </OptionCard>

                {/* OPTION B: 4-Installment */}
                <OptionCard letter="B" label="4-Installment Plan" badge="No Discount" accentColor="blue">
                  <div className="space-y-2 mb-4">
                    <Row label="1st — At Admission" sub="25% of annual" value={`₹${fmt(calc.b1)}`} highlight />
                    <Row label="2nd — Day 75" sub="~33% of annual" value={`₹${fmt(calc.b2)}`} />
                    <Row label="3rd — Day 150" sub="~32% of annual" value={`₹${fmt(calc.b3)}`} />
                    <Row label="4th — Day 225" sub="10% of annual" value={`₹${fmt(calc.b4)}`} />
                  </div>
                  <p className="font-body text-[10px] text-gray-400 bg-gray-50 rounded-lg p-2.5">
                    Total: ₹{fmt(calc.annual)} (full annual fee, no discount)
                  </p>
                </OptionCard>

                {/* OPTION C: 2-Installment */}
                <OptionCard letter="C" label="2-Installment Plan" badge="10% OFF" accentColor="green">
                  <div className="mb-3">
                    <span className="font-body text-xs text-gray-400 line-through">₹{fmt(calc.annual)}</span>
                    <span className="font-heading text-2xl font-extrabold text-[#05308d] ml-2">
                      ₹{fmt(calc.annualC)}
                    </span>
                    <p className="font-body text-[10px] text-green-600 mt-0.5">
                      Save ₹{fmt(calc.annual - calc.annualC)} on annual fee
                    </p>
                  </div>
                  <div className="space-y-2 mb-4">
                    <Row label="1st — At Admission" sub="First 6 months" value={`₹${fmt(calc.c1)}`} highlight />
                    <Row label="2nd — Day 180" sub="Last 6 months" value={`₹${fmt(calc.c2)}`} />
                  </div>
                  <p className="font-body text-[10px] text-gray-400 bg-green-50 rounded-lg p-2.5">
                    Discount on tuition only. Reg fee & GST excluded.
                  </p>
                </OptionCard>

                {/* OPTION D: One-Time */}
                <OptionCard letter="D" label="One-Time Full Payment" badge="15% OFF" accentColor="gold">
                  <div className="mb-3">
                    <p className="font-body text-xs text-gray-400 line-through">₹{fmt(calc.annual)}</p>
                    <p className="font-heading text-3xl font-extrabold text-[#05308d]">₹{fmt(calc.annualD)}</p>
                    <p className="font-body text-[10px] text-yellow-700 mt-0.5">
                      Save ₹{fmt(calc.annual - calc.annualD)} — maximum savings
                    </p>
                  </div>
                  <div className="py-3 px-3 rounded-lg bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-center mb-3">
                    <span className="font-body text-xs text-gray-600 font-semibold">Full payment at admission</span>
                    <p className="font-body text-[10px] text-gray-400 mt-0.5">No further installments</p>
                  </div>
                  <p className="font-body text-[10px] text-gray-400 bg-gray-50 rounded-lg p-2.5">
                    Discount on tuition only. Reg fee & GST excluded.
                  </p>
                </OptionCard>

              </div>
            </>
          )}
        </div>
      </section>

      {/* ============================================ */}
      {/* FULL FEE TABLE */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-10">
            <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
              Reference Table
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#0a1e3d] mb-2">
              All Classes Fee Overview
            </h2>
            <p className="font-body text-gray-500 text-sm">
              Click any row to load it into the calculator above
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-[#0a1e3d]">
                    <th className="px-5 py-4 text-left font-heading text-xs font-bold text-white uppercase tracking-wider">Class</th>
                    <th className="px-5 py-4 text-right font-heading text-xs font-bold text-white uppercase tracking-wider">Monthly</th>
                    <th className="px-5 py-4 text-right font-heading text-xs font-bold text-white uppercase tracking-wider">Annual</th>
                    <th className="px-5 py-4 text-right font-heading text-xs font-bold text-[#fbbf24] uppercase tracking-wider">10% OFF<br/><span className="font-normal normal-case">(2 Inst.)</span></th>
                    <th className="px-5 py-4 text-right font-heading text-xs font-bold text-[#fbbf24] uppercase tracking-wider">15% OFF<br/><span className="font-normal normal-case">(One-time)</span></th>
                  </tr>
                </thead>
                <tbody>
                  {feeData.map((f, i) => {
                    const isSelected = selectedClass === f.class;
                    return (
                      <tr
                        key={f.class}
                        onClick={() => {
                          setSelectedClass(f.class);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`border-b border-gray-100 cursor-pointer transition-colors duration-150 ${
                          isSelected
                            ? 'bg-[#05308d]/5'
                            : i % 2 === 0
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-gray-50/50 hover:bg-gray-100/50'
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <span className={`font-heading font-bold text-sm ${isSelected ? 'text-[#05308d]' : 'text-[#0a1e3d]'}`}>
                            {f.class}
                          </span>
                          {isSelected && (
                            <span className="ml-2 text-[10px] bg-[#05308d] text-white px-1.5 py-0.5 rounded font-bold">
                              ↑ Selected
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-body text-sm text-gray-600">₹{fmt(f.monthly)}</td>
                        <td className="px-5 py-3.5 text-right font-body text-sm text-gray-600">₹{fmt(f.annual)}</td>
                        <td className="px-5 py-3.5 text-right font-heading text-sm font-semibold text-green-700">₹{fmt(f.annual * 0.9)}</td>
                        <td className="px-5 py-3.5 text-right font-heading text-sm font-semibold text-[#05308d]">₹{fmt(f.annual * 0.85)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <p className="font-body text-xs text-gray-400">
                ₹499 registration fee is additional and not included · Discounts apply on tuition fee only
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* PLAN SUMMARY CARDS */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-[#0a1e3d] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#05308d]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#fbbf24]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-5">
          <div className="text-center mb-12">
            <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.15em] mb-3">
              Payment Plans
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
              Which Plan Is Right For You?
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                letter: 'A',
                title: 'Monthly',
                sub: 'No Discount',
                tag: 'Most Flexible',
                tagColor: 'bg-white/10 text-white/70',
                desc: 'Pay monthly. Ideal if you prefer smaller recurring payments.',
                points: ['1 month security deposit', 'Adjusted in last month', 'Pay by 5th of each month'],
                icon: HiOutlineRefresh,
              },
              {
                letter: 'B',
                title: '4 Installments',
                sub: 'No Discount',
                tag: 'Spread the Cost',
                tagColor: 'bg-blue-500/20 text-blue-300',
                desc: 'Spread annual fee across 4 payments every 75 days.',
                points: ['25% at admission', '33% at day 75', '32% at day 150', '10% at day 225'],
                icon: HiOutlineClipboardCheck,
              },
              {
                letter: 'C',
                title: '2 Installments',
                sub: '10% OFF',
                tag: 'Save 10%',
                tagColor: 'bg-green-500/20 text-green-300',
                desc: 'Pay in two halves — save 10% on total annual tuition fee.',
                points: ['50% at admission', '50% at day 180', '10% discount on annual'],
                icon: HiOutlineBadgeCheck,
              },
              {
                letter: 'D',
                title: 'One-Time',
                sub: '15% OFF',
                tag: 'Best Value',
                tagColor: 'bg-[#fbbf24]/20 text-[#fbbf24]',
                desc: 'Pay the full year upfront and get the maximum 15% discount.',
                points: ['Full payment at admission', '15% discount on annual', 'No further dues'],
                icon: HiOutlineCash,
              },
            ].map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.letter}
                  className="group/plan bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:-translate-y-1 hover:border-white/20"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#fbbf24]/10 flex items-center justify-center transition-all duration-300 group-hover/plan:scale-110">
                      <Icon className="w-6 h-6 text-[#fbbf24]" />
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${plan.tagColor}`}>
                      {plan.tag}
                    </span>
                  </div>
                  <h3 className="font-heading text-base font-bold text-white mb-0.5">{plan.title}</h3>
                  <p className="font-body text-xs text-white/50 mb-3">{plan.sub}</p>
                  <p className="font-body text-sm text-white/70 mb-4 leading-relaxed">{plan.desc}</p>
                  <ul className="space-y-1.5">
                    {plan.points.map((pt, i) => (
                      <li key={i} className="font-body text-xs text-white/60 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24]/60 mt-1 flex-shrink-0"></span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* POLICIES */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
              Policies
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] mb-3">
              Important Policies
            </h2>
            <p className="font-body text-gray-500 max-w-xl mx-auto">
              Please read all policies carefully before enrolling
            </p>
          </div>

          <div className="space-y-4">
            {/* Late Fee */}
            <PolicyAccordion title="Late Fee Policy" icon={HiOutlineClock} defaultOpen={true}>
              <div className="space-y-3">
                {[
                  'A late fee of ₹50 per day will be charged after the due date.',
                  'Delay beyond 7 days may lead to temporary suspension of home tuition classes.',
                  'Classes will resume only after full payment clearance including all accumulated late fees.',
                  'For monthly plan students, payment is due by the 5th of each month.',
                  'Installment due dates are calculated automatically from the date of admission.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 font-body text-sm text-gray-600 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                    {item}
                  </div>
                ))}
              </div>
            </PolicyAccordion>

            {/* Security Deposit */}
            <PolicyAccordion title="Security Deposit Rules (Option A — Monthly)" icon={HiOutlineShieldCheck}>
              <div className="space-y-3">
                {[
                  'Security deposit is equal to 1 month of tuition fee, payable at the time of admission.',
                  'The deposit is completely interest-free.',
                  'It will be adjusted against the last month\'s fee on successful course completion.',
                  'In case of early discontinuation, the security deposit may be partially or fully forfeited.',
                  'The institute may adjust the security deposit against any pending dues or misconduct penalties.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 font-body text-sm text-gray-600 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                    {item}
                  </div>
                ))}
              </div>
            </PolicyAccordion>

            {/* Refund */}
            <PolicyAccordion title="Refund & Cancellation Policy" icon={HiOutlineExclamationCircle}>
              <div className="space-y-3">
                {[
                  'Registration fee of ₹499 is strictly non-refundable under any circumstances.',
                  'Tuition fee once paid is non-refundable.',
                  'No adjustment or refund will be made on mid-session discontinuation.',
                  'The institute reserves the right to change the assigned teacher or class schedule.',
                  'Course fee is non-transferable and cannot be adjusted for another student or session.',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 font-body text-sm text-gray-600 leading-relaxed">
                    <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0"></span>
                    {item}
                  </div>
                ))}
              </div>
            </PolicyAccordion>

            {/* Discount Rules */}
            <PolicyAccordion title="Discount Rules" icon={HiOutlineBadgeCheck}>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                {[
                  { plan: 'Monthly Plan (Option A)', discount: 'No discount', color: 'gray' },
                  { plan: '4-Installment (Option B)', discount: 'No discount', color: 'gray' },
                  { plan: '2-Installment (Option C)', discount: '10% OFF', color: 'green' },
                  { plan: 'One-Time (Option D)', discount: '15% OFF', color: 'gold' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      item.color === 'green' ? 'bg-green-50 border-green-200' :
                      item.color === 'gold' ? 'bg-[#fbbf24]/5 border-[#fbbf24]/20' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span className="font-body text-sm text-gray-700">{item.plan}</span>
                    <span className={`font-heading text-sm font-bold ${
                      item.color === 'green' ? 'text-green-700' :
                      item.color === 'gold' ? 'text-yellow-700' :
                      'text-gray-500'
                    }`}>{item.discount}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-3 bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-xl p-4">
                <HiOutlineExclamationCircle className="w-5 h-5 text-[#fbbf24] flex-shrink-0 mt-0.5" />
                <p className="font-body text-sm text-gray-700">
                  Only one payment option can be selected. Discounts cannot be combined. Discount applies on tuition fee only — registration fee and GST are excluded.
                </p>
              </div>
            </PolicyAccordion>

            {/* General Terms */}
            <PolicyAccordion title="General Terms & Conditions" icon={HiOutlineDocumentText}>
              <ol className="space-y-3">
                {[
                  'Payments are accepted online only via the website.',
                  'Installment due dates are auto-calculated from the admission date.',
                  'Only one payment plan can be selected per enrollment.',
                  'Discounts cannot be combined — only one discount applies per enrollment.',
                  'The discount is applied on tuition fee only; registration fee and GST are excluded.',
                  'Fee structure is valid for the current session; fees may be revised for new admissions.',
                  'GST will be applied as per government regulations (CGST 9% + SGST 9% if registered).',
                  'All disputes are subject to local jurisdiction only.',
                  'The management\'s decision shall be final and binding in all matters.',
                ].map((item, i) => (
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
      {/* CTA */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
            Get Started
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] mb-4">
            Book Your Home Tuition Today
          </h2>
          <p className="font-body text-gray-500 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Personalised one-on-one learning by experienced faculty — at your doorstep. Limited slots available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="group inline-flex items-center justify-center gap-2 bg-[#05308d] text-white px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline transition-all duration-300 hover:bg-[#1a56db] hover:shadow-lg hover:shadow-[#05308d]/25 hover:-translate-y-0.5"
            >
              <span>Enquire Now</span>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <a
              href="tel:+918382970800"
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-[#05308d]/15 text-[#05308d] px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline transition-all duration-300 hover:border-[#05308d]/30 hover:shadow-md hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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

export default HomeTuitionFees;
