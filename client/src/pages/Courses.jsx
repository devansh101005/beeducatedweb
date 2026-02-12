import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineClipboardCheck,
  HiOutlineChartBar,
  HiOutlineChatAlt2,
  HiOutlineDocumentText,
  HiOutlineUserGroup,
  HiOutlineDesktopComputer,
  HiOutlineCheckCircle,
  HiOutlineLightningBolt,
  HiOutlineGlobe,
  HiOutlinePlay,
  HiOutlineClock,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import Footer from '../components/Footer';

/* ──────────────────────────────────────────────
   DATA
   ────────────────────────────────────────────── */

/* Offline batch – what you get */
const offlineFeatures = [
  { icon: HiOutlineBookOpen, text: 'Concept-based classroom lectures' },
  { icon: HiOutlineAcademicCap, text: 'Complete NCERT + Competitive level coverage' },
  { icon: HiOutlineClipboardCheck, text: 'Daily Practice Problems (DPP)' },
  { icon: HiOutlineChartBar, text: 'Weekly / Monthly Test Series' },
  { icon: HiOutlineLightningBolt, text: 'Detailed Performance Analysis' },
  { icon: HiOutlineChatAlt2, text: 'Dedicated Doubt Clearing Sessions' },
  { icon: HiOutlineDocumentText, text: 'Study Material & Notes' },
  { icon: HiOutlineUserGroup, text: 'Parent Progress Updates' },
  { icon: HiOutlineDesktopComputer, text: 'Hybrid Academic Support (Revision / Extra Guidance)' },
];

/* Offline class cards */
const offlineClasses = [
  { class: '6', subjects: ['Math', 'Science', 'English', 'SST'], tag: 'Foundation' },
  { class: '7', subjects: ['Math', 'Science', 'English', 'SST'], tag: 'Foundation' },
  { class: '8', subjects: ['Math', 'Science', 'English', 'SST'], tag: 'Foundation' },
  { class: '9', subjects: ['Math', 'Science', 'English', 'SST'], tag: 'JEE / NEET Foundation' },
  { class: '10', subjects: ['Math', 'Science', 'English', 'SST'], tag: 'JEE / NEET Foundation' },
  { class: '11', subjects: ['Physics', 'Chemistry', 'Math / Biology'], tag: 'JEE / NEET' },
  { class: '12', subjects: ['Physics', 'Chemistry', 'Math / Biology'], tag: 'JEE / NEET' },
];

/* Online features */
const onlineFeatures = [
  { icon: HiOutlinePlay, text: 'Live interactive classes with expert faculty' },
  { icon: HiOutlineGlobe, text: 'Learn from anywhere — no location barrier' },
  { icon: HiOutlineDesktopComputer, text: 'Recorded lectures for revision' },
  { icon: HiOutlineChatAlt2, text: 'Live doubt solving during class' },
  { icon: HiOutlineClipboardCheck, text: 'Digital assignments & DPPs' },
  { icon: HiOutlineChartBar, text: 'Online test series with instant results' },
  { icon: HiOutlineClock, text: 'Flexible scheduling & weekend batches' },
  { icon: HiOutlineShieldCheck, text: 'Parent dashboard for progress tracking' },
];

/* ──────────────────────────────────────────────
   COURSES PAGE
   ────────────────────────────────────────────── */
const Courses = () => {
  const [activeTab, setActiveTab] = useState('offline');

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section
        className="relative pt-[80px] min-h-[50vh] flex items-center justify-center text-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1523050854058-8df90110c476?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#0a1e3d]/75"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-5 py-20">
          <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-4">
            Our Programs
          </span>
          <h1 className="font-heading text-[32px] sm:text-[42px] md:text-[50px] font-extrabold text-white mb-4 leading-tight">
            Courses We Offer
          </h1>
          <p className="font-body text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Our Hybrid Classroom Program combines structured offline teaching with additional academic support to ensure strong conceptual clarity and consistent performance improvement for IIT-JEE, NEET, and Board examinations.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* TAB SWITCHER */}
      {/* ============================================ */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-5 py-6">
          <div className="flex gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => setActiveTab('offline')}
              className={`group/tab relative flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-xl font-heading text-sm sm:text-base font-bold transition-all duration-300 cursor-pointer border-none overflow-hidden ${
                activeTab === 'offline'
                  ? 'bg-[#05308d] text-white shadow-lg shadow-[#05308d]/25'
                  : 'bg-white text-[#0a1e3d] hover:bg-[#05308d]/5 shadow-sm hover:shadow-md'
              }`}
            >
              <HiOutlineAcademicCap
                className={`w-5 h-5 transition-colors duration-300 ${
                  activeTab === 'offline' ? 'text-[#fbbf24]' : 'text-[#05308d]/50'
                }`}
              />
              <span className="hidden sm:inline">Offline Batch</span>
              <span className="sm:hidden">Offline</span>
              {activeTab === 'offline' && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#fbbf24]"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('online')}
              className={`group/tab relative flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-xl font-heading text-sm sm:text-base font-bold transition-all duration-300 cursor-pointer border-none overflow-hidden ${
                activeTab === 'online'
                  ? 'bg-[#05308d] text-white shadow-lg shadow-[#05308d]/25'
                  : 'bg-white text-[#0a1e3d] hover:bg-[#05308d]/5 shadow-sm hover:shadow-md'
              }`}
            >
              <HiOutlineDesktopComputer
                className={`w-5 h-5 transition-colors duration-300 ${
                  activeTab === 'online' ? 'text-[#fbbf24]' : 'text-[#05308d]/50'
                }`}
              />
              <span className="hidden sm:inline">Online Batch</span>
              <span className="sm:hidden">Online</span>
              {activeTab === 'online' && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#fbbf24]"></span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* OFFLINE BATCH SECTION */}
      {/* ============================================ */}
      {activeTab === 'offline' && (
        <>
          {/* Program Header */}
          <section className="py-16 sm:py-20 bg-white">
            <div className="max-w-6xl mx-auto px-5">
              <div className="text-center mb-14">
                <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
                  Currently Active
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl md:text-[38px] font-bold text-[#0a1e3d] mb-3 leading-tight">
                  Offline Batch — Hybrid Classroom Program
                </h2>
                <p className="font-body text-gray-500 max-w-2xl mx-auto">
                  IIT-JEE / NEET Foundation | Class 6–12
                </p>
              </div>

              {/* Class Cards Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {offlineClasses.map((item, index) => {
                  const isAdvanced = item.class === '11' || item.class === '12';
                  return (
                    <div
                      key={item.class}
                      className={`group/card relative rounded-2xl border overflow-hidden transition-all duration-300 cursor-default bg-white hover:shadow-xl hover:-translate-y-1.5 hover:border-[#05308d]/30 ${
                        isAdvanced ? 'border-[#05308d]/20' : 'border-gray-200'
                      }`}
                    >
                      {/* Top accent bar */}
                      <div className={`h-1.5 transition-all duration-500 group-hover/card:bg-gradient-to-r group-hover/card:from-[#05308d] group-hover/card:to-[#fbbf24] ${
                        isAdvanced ? 'bg-[#05308d]' : 'bg-gray-200'
                      }`}></div>

                      {/* Popular tag for 11, 12 */}
                      {isAdvanced && (
                        <div className="absolute top-4 right-4">
                          <span className="bg-[#fbbf24] text-[#0a1e3d] text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                            {item.tag}
                          </span>
                        </div>
                      )}

                      {/* Corner glow */}
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#05308d]/5 rounded-full blur-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>

                      <div className="p-6">
                        {/* Class label */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-xl bg-[#05308d]/5 text-[#05308d] flex items-center justify-center transition-all duration-300 group-hover/card:bg-[#05308d] group-hover/card:text-white group-hover/card:scale-110">
                            <HiOutlineAcademicCap className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-heading text-xl font-bold text-[#0a1e3d] group-hover/card:text-[#05308d] transition-colors duration-300">
                              Class {item.class}
                            </h3>
                            {!isAdvanced && (
                              <p className="font-body text-[11px] text-gray-400">{item.tag}</p>
                            )}
                          </div>
                        </div>

                        {/* Subjects */}
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {item.subjects.map((sub, i) => (
                            <span
                              key={i}
                              className="px-2.5 py-1 bg-[#05308d]/[0.04] text-[#05308d] text-[11px] font-heading font-semibold rounded-lg group-hover/card:bg-[#05308d]/[0.08] transition-colors duration-300"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>

                        {/* CTA */}
                        <Link
                          to="/contact"
                          className={`block w-full py-2.5 text-center rounded-xl font-heading font-bold text-sm no-underline transition-all duration-300 ${
                            isAdvanced
                              ? 'bg-[#05308d] text-white hover:bg-[#1a56db] hover:shadow-lg hover:shadow-[#05308d]/25'
                              : 'bg-[#05308d]/5 text-[#05308d] hover:bg-[#05308d] hover:text-white'
                          }`}
                        >
                          Enquire Now
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* What You Get — Offline */}
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
                {offlineFeatures.map((item, index) => {
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
        </>
      )}

      {/* ============================================ */}
      {/* ONLINE BATCH SECTION */}
      {/* ============================================ */}
      {activeTab === 'online' && (
        <>
          {/* Coming Soon Banner */}
          <section className="py-16 sm:py-20 bg-white">
            <div className="max-w-4xl mx-auto px-5">
              <div className="text-center mb-14">
                <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
                  Coming Soon
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl md:text-[38px] font-bold text-[#0a1e3d] mb-3 leading-tight">
                  Online Batch — Live Interactive Program
                </h2>
                <p className="font-body text-gray-500 max-w-2xl mx-auto">
                  Our online program is being designed to deliver the same quality education with the convenience of learning from home.
                </p>
              </div>

              {/* Coming soon card */}
              <div className="relative bg-gradient-to-br from-[#0a1e3d] to-[#05308d] rounded-2xl p-8 sm:p-12 overflow-hidden mb-14">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#fbbf24]/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div className="absolute top-4 right-4 w-20 h-20 border border-white/5 rounded-full"></div>
                <div className="absolute top-8 right-8 w-12 h-12 border border-white/5 rounded-full"></div>

                <div className="relative z-10 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-[#fbbf24]/10 flex items-center justify-center mx-auto mb-6">
                    <HiOutlineDesktopComputer className="w-10 h-10 text-[#fbbf24]" />
                  </div>
                  <h3 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-3">
                    Launching Soon
                  </h3>
                  <p className="font-body text-white/60 max-w-lg mx-auto mb-8 leading-relaxed">
                    We're building an online learning experience that matches the excellence of our offline program. Stay tuned for live interactive classes with top faculty.
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 bg-[#fbbf24] text-[#0a1e3d] px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline transition-all duration-300 hover:shadow-lg hover:shadow-[#fbbf24]/25 hover:-translate-y-0.5"
                  >
                    Get Notified
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* What to expect */}
              <div className="text-center mb-10">
                <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
                  What to Expect
                </span>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#0a1e3d]">
                  Planned Features
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {onlineFeatures.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={index}
                      className="group/feat relative flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-[#05308d]/20 overflow-hidden"
                    >
                      {/* Top accent */}
                      <div className="absolute top-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#05308d] to-[#fbbf24] group-hover/feat:w-full transition-all duration-500"></div>
                      {/* Glow */}
                      <div className="absolute -top-8 -right-8 w-20 h-20 bg-[#05308d]/5 rounded-full blur-2xl opacity-0 group-hover/feat:opacity-100 transition-opacity duration-500"></div>

                      <div className="w-10 h-10 rounded-xl bg-[#05308d]/5 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover/feat:bg-[#05308d] group-hover/feat:text-white group-hover/feat:scale-110">
                        <Icon className="w-5 h-5 text-[#05308d] group-hover/feat:text-white transition-colors duration-300" />
                      </div>
                      <div className="pt-1.5">
                        <p className="font-body text-sm text-gray-600 group-hover/feat:text-[#0a1e3d] transition-colors duration-300">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </>
      )}

      {/* ============================================ */}
      {/* WHY CHOOSE US */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
              Why Be Educated
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] mb-3">
              The Be Educated Advantage
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: HiOutlineAcademicCap, title: 'Expert Faculty', desc: 'Subject-wise specialist teachers with years of experience' },
              { icon: HiOutlineChartBar, title: 'Result Oriented', desc: 'Structured approach focused on consistent performance improvement' },
              { icon: HiOutlineUserGroup, title: 'Limited Batches', desc: 'Small batch sizes ensuring personal attention for every student' },
              { icon: HiOutlineShieldCheck, title: 'Parent Transparency', desc: 'Regular updates, PTMs, and parent login for progress tracking' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="group/adv relative bg-white rounded-2xl border border-gray-100 p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-[#05308d]/20 overflow-hidden text-center"
                >
                  {/* Top accent bar */}
                  <div className="absolute top-0 left-0 w-0 h-1 bg-gradient-to-r from-[#05308d] to-[#fbbf24] group-hover/adv:w-full transition-all duration-500"></div>
                  {/* Corner glow */}
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#05308d]/5 rounded-full blur-2xl opacity-0 group-hover/adv:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-[#05308d]/5 flex items-center justify-center mx-auto mb-5 transition-all duration-300 group-hover/adv:bg-[#05308d] group-hover/adv:scale-110 group-hover/adv:rotate-3">
                      <Icon className="w-7 h-7 text-[#05308d] group-hover/adv:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[#0a1e3d] mb-2 group-hover/adv:text-[#05308d] transition-colors duration-300">
                      {item.title}
                    </h3>
                    <p className="font-body text-sm text-gray-500 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA SECTION */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-[#0a1e3d] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#05308d]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#fbbf24]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
          <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-4">
            Start Your Journey
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Achieve Beyond Limits?
          </h2>
          <p className="font-body text-white/60 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join Be Educated and give your child the academic foundation they deserve. Limited seats available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="group relative inline-flex items-center justify-center gap-2 bg-[#fbbf24] text-[#0a1e3d] px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#fbbf24]/25 hover:-translate-y-0.5"
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
              <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            </Link>
            <Link
              to="/fee-structure"
              className="group inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/20 text-white px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline transition-all duration-300 hover:border-white/50 hover:bg-white/5 hover:-translate-y-0.5"
            >
              View Fee Structure
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Courses;
