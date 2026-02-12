import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineDeviceMobile,
  HiOutlineHome,
  HiOutlineChartBar,
  HiOutlineOfficeBuilding,
  HiOutlineLightBulb,
  HiOutlineChevronDown,
  HiOutlineSearch,
} from 'react-icons/hi';
import Footer from '../components/Footer';

/* ──────────────────────────────────────────────
   FAQ DATA — organised by category
   ────────────────────────────────────────────── */
const categories = [
  {
    id: 'admissions',
    label: 'Admissions & Eligibility',
    icon: HiOutlineAcademicCap,
    questions: [
      {
        q: 'What is the admission process for the Foundation Program?',
        a: 'Students can apply through direct registration at the institute or by filling out the registration form. Admission is confirmed after counseling, document verification, and fee submission.',
      },
      {
        q: 'What classes/grades do you offer coaching for?',
        a: 'We offer coaching for:',
        list: [
          'Class 6 to 12 (CBSE / ICSE / State Boards)',
          'IIT-JEE Foundation (Class 6–10)',
          'NEET Foundation (Class 6–10)',
          'IIT-JEE & NEET Preparation (Class 11–12)',
          'Home Tuition (Nursery–12)',
        ],
      },
      {
        q: 'Is there an entrance test for admission?',
        a: 'Yes, a basic assessment test may be conducted to evaluate academic level and determine scholarship eligibility.',
      },
      {
        q: 'When do new batches start?',
        a: 'New batches generally start in April and June/July. Mid-session admission may be allowed based on seat availability.',
      },
      {
        q: 'Is there limited seat availability?',
        a: 'Yes, seats are limited to maintain quality education and proper academic monitoring.',
      },
      {
        q: 'Can students join mid-session?',
        a: 'Yes, subject to assessment and seat availability.',
      },
    ],
  },
  {
    id: 'courses',
    label: 'Courses & Teaching',
    icon: HiOutlineBookOpen,
    questions: [
      {
        q: 'What subjects are covered in the IIT-JEE Foundation Program?',
        a: 'Mathematics, Physics, Chemistry, Logical Reasoning, and Olympiad-level concepts.',
      },
      {
        q: 'What subjects are covered in the NEET Foundation Program?',
        a: 'Biology, Physics, Chemistry, and NEET-aligned conceptual preparation.',
      },
      {
        q: 'Do you prepare students for Olympiads and scholarship exams?',
        a: 'Yes, preparation is provided for NTSE, Olympiads, scholarship exams, and competitive foundations.',
      },
      {
        q: 'How is your teaching methodology different from other institutes?',
        a: 'We follow a concept-first approach with regular doubt-clearing sessions, weekly tests, hybrid learning support, and a strong focus on fundamentals.',
      },
      {
        q: 'Do you provide study material and notes?',
        a: 'Yes, we provide structured notes, worksheets, question banks, and exam-pattern-based practice material.',
      },
      {
        q: 'Are doubt-clearing sessions available?',
        a: 'Yes, regular doubt sessions and additional support before exams are provided.',
      },
      {
        q: 'Do you provide digital or recorded classes?',
        a: 'Yes, hybrid learning support is available for revision and missed classes.',
      },
    ],
  },
  {
    id: 'schedule',
    label: 'Schedule & Timings',
    icon: HiOutlineClock,
    questions: [
      {
        q: 'What are the class timings and weekly schedule?',
        a: 'Classes are conducted after school hours. Each session is 1 hour 15 minutes with a 10-minute break between sessions. Sunday remains off except for scheduled tests.',
      },
      {
        q: 'Do you offer weekend-only batches?',
        a: 'Yes, weekend batches are available for selected programs and revision courses.',
      },
      {
        q: 'What happens if a student misses a class?',
        a: 'Notes are provided and doubt sessions are arranged. Backup classes may be available when possible.',
      },
      {
        q: 'Is attendance compulsory?',
        a: 'Yes, regular attendance is important for consistent academic improvement.',
      },
    ],
  },
  {
    id: 'fees',
    label: 'Fees & Payments',
    icon: HiOutlineCurrencyRupee,
    questions: [
      {
        q: 'What is the fee structure for different programs?',
        a: 'Fees vary depending on class, grade, and program. Please contact the institute for detailed fee information.',
      },
      {
        q: 'Are there any scholarships or fee concessions available?',
        a: 'Yes, scholarships are available based on entrance test performance and academic merit (terms and conditions apply).',
      },
      {
        q: 'What are the payment options?',
        a: 'Full payment and installment options are available. Payments can be made via UPI, online transfer, bank payment, or cash.',
      },
    ],
  },
  {
    id: 'parent',
    label: 'Parent Login & Attendance',
    icon: HiOutlineDeviceMobile,
    questions: [
      {
        q: 'Do you provide a Parent Login facility?',
        a: 'Yes. Parents receive a dedicated login ID and password to:',
        list: [
          "View their child's test performance",
          'Check marks and progress reports',
          'Track attendance records',
          'Monitor academic improvement',
        ],
      },
      {
        q: 'How does the attendance system work?',
        a: 'Students are provided with an ID card. When entering the class, they punch/scan their card and an automatic attendance message is sent to parents. If the student is absent, an absence notification is sent to parents. This ensures complete transparency and real-time monitoring.',
      },
    ],
  },
  {
    id: 'tuition',
    label: 'Home Tuition',
    icon: HiOutlineHome,
    questions: [
      {
        q: 'How does the Home Tuition service work?',
        a: 'Qualified faculty visit the student\'s home with a customized study plan, flexible timing, and regular performance tracking.',
      },
      {
        q: 'Which areas do you cover for Home Tuition?',
        a: 'Home tuition is available in nearby local areas. Please contact the office for confirmation.',
      },
    ],
  },
  {
    id: 'performance',
    label: 'Performance & Support',
    icon: HiOutlineChartBar,
    questions: [
      {
        q: 'Do you conduct regular tests?',
        a: 'Yes, we conduct weekly tests, monthly assessments, chapter-wise tests, and major test series.',
      },
      {
        q: 'Do you share progress reports with parents?',
        a: 'Yes, performance reports are regularly shared through the Parent Login system and during PTMs.',
      },
      {
        q: 'Are Parent-Teacher Meetings conducted?',
        a: 'Yes, regular PTMs are organized to discuss academic progress and improvement strategies.',
      },
      {
        q: 'Do you provide individual mentoring?',
        a: 'Yes, students receive academic mentoring, study planning guidance, and career direction support.',
      },
    ],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: HiOutlineOfficeBuilding,
    questions: [
      {
        q: 'What facilities are available at the institute?',
        a: 'Air-conditioned classrooms, smart teaching support, CCTV monitoring, comfortable seating, and a dedicated counseling area.',
      },
    ],
  },
  {
    id: 'career',
    label: 'Career Guidance',
    icon: HiOutlineLightBulb,
    questions: [
      {
        q: 'Do you provide career counseling?',
        a: 'Yes, we guide students regarding IIT-JEE and NEET roadmaps, stream selection after Class 10, and long-term career planning.',
      },
    ],
  },
];

/* ──────────────────────────────────────────────
   SINGLE ACCORDION ITEM
   ────────────────────────────────────────────── */
function AccordionItem({ question, answer, list, isOpen, onClick, index }) {
  return (
    <div
      className={`group/faq border border-gray-200 rounded-xl transition-all duration-300 ${
        isOpen
          ? 'bg-white shadow-lg shadow-[#05308d]/5 border-[#05308d]/20'
          : 'bg-white hover:shadow-md hover:border-[#05308d]/10'
      }`}
    >
      <button
        onClick={onClick}
        className="w-full flex items-start gap-4 p-5 sm:p-6 text-left cursor-pointer bg-transparent border-none"
      >
        {/* Number badge */}
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-heading font-bold transition-all duration-300 ${
            isOpen
              ? 'bg-[#05308d] text-white scale-110'
              : 'bg-[#05308d]/5 text-[#05308d] group-hover/faq:bg-[#05308d]/10'
          }`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Question text */}
        <span
          className={`flex-1 font-heading font-semibold text-[15px] sm:text-base leading-relaxed transition-colors duration-300 ${
            isOpen ? 'text-[#05308d]' : 'text-[#0a1e3d] group-hover/faq:text-[#05308d]'
          }`}
        >
          {question}
        </span>

        {/* Chevron */}
        <span
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? 'bg-[#05308d] text-white rotate-180'
              : 'bg-gray-100 text-gray-400 group-hover/faq:bg-[#05308d]/10 group-hover/faq:text-[#05308d]'
          }`}
        >
          <HiOutlineChevronDown className="w-4 h-4" />
        </span>
      </button>

      {/* Answer panel */}
      <div
        className={`overflow-hidden transition-all duration-400 ease-in-out ${
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pl-[4.25rem] sm:pl-[4.75rem]">
          <div className="w-10 h-[2px] bg-[#fbbf24] rounded-full mb-3"></div>
          <p className="font-body text-sm sm:text-[15px] text-gray-600 leading-relaxed">
            {answer}
          </p>
          {list && (
            <ul className="mt-3 space-y-2">
              {list.map((item, i) => (
                <li key={i} className="flex items-start gap-2 font-body text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fbbf24] mt-1.5 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   FAQ PAGE
   ────────────────────────────────────────────── */
function FAQ() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [openItems, setOpenItems] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (key) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ── Filter logic ── */
  const filteredCategories = categories
    .map((cat) => {
      if (activeCategory !== 'all' && cat.id !== activeCategory) return null;
      if (!searchQuery.trim()) return cat;

      const q = searchQuery.toLowerCase();
      const filtered = cat.questions.filter(
        (item) =>
          item.q.toLowerCase().includes(q) ||
          item.a.toLowerCase().includes(q) ||
          (item.list && item.list.some((l) => l.toLowerCase().includes(q)))
      );
      return filtered.length > 0 ? { ...cat, questions: filtered } : null;
    })
    .filter(Boolean);

  /* ── Global question counter ── */
  let globalIndex = 0;

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section
        className="relative pt-[80px] min-h-[50vh] flex items-center justify-center text-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#0a1e3d]/75"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-5 py-20">
          <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-4">
            FAQ
          </span>
          <h1 className="font-heading text-[32px] sm:text-[42px] md:text-[50px] font-extrabold text-white mb-4 leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="font-body text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed mb-8">
            Everything you need to know about admissions, courses, fees, and more at Be Educated.
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-5 py-4 rounded-xl bg-white/95 backdrop-blur-sm text-[#0a1e3d] font-body text-sm sm:text-base border-2 border-transparent focus:border-[#fbbf24] focus:outline-none shadow-xl transition-all duration-300 placeholder:text-gray-400"
            />
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CATEGORY FILTER PILLS */}
      {/* ============================================ */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 py-6">
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
            {/* "All" pill */}
            <button
              onClick={() => setActiveCategory('all')}
              className={`group/pill relative px-4 sm:px-5 py-2.5 rounded-xl font-heading text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer border-none overflow-hidden ${
                activeCategory === 'all'
                  ? 'bg-[#05308d] text-white shadow-lg shadow-[#05308d]/25'
                  : 'bg-white text-[#0a1e3d] hover:bg-[#05308d]/5 shadow-sm hover:shadow-md'
              }`}
            >
              <span className="relative z-10">All Questions</span>
              {activeCategory === 'all' && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#fbbf24]"></span>
              )}
            </button>

            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`group/pill relative flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-heading text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer border-none overflow-hidden ${
                    isActive
                      ? 'bg-[#05308d] text-white shadow-lg shadow-[#05308d]/25'
                      : 'bg-white text-[#0a1e3d] hover:bg-[#05308d]/5 shadow-sm hover:shadow-md'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-all duration-300 ${
                      isActive ? 'text-[#fbbf24]' : 'text-[#05308d]/50 group-hover/pill:text-[#05308d]'
                    }`}
                  />
                  <span className="relative z-10 hidden sm:inline">{cat.label}</span>
                  <span className="relative z-10 sm:hidden">{cat.label.split(' ')[0]}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#fbbf24]"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ CONTENT */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-5">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-20">
              <HiOutlineSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="font-heading text-xl font-bold text-[#0a1e3d] mb-2">
                No results found
              </h3>
              <p className="font-body text-gray-500">
                Try searching with different keywords or browse by category.
              </p>
            </div>
          ) : (
            filteredCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div key={cat.id} className="mb-14 last:mb-0">
                  {/* Category header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#05308d]/5 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#05308d]" />
                    </div>
                    <div>
                      <h2 className="font-heading text-xl sm:text-2xl font-bold text-[#0a1e3d]">
                        {cat.label}
                      </h2>
                      <p className="font-body text-xs text-gray-400 mt-0.5">
                        {cat.questions.length} question{cat.questions.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#05308d]/10 to-transparent ml-4"></div>
                  </div>

                  {/* Questions */}
                  <div className="space-y-3">
                    {cat.questions.map((item, qIdx) => {
                      const currentGlobalIndex = globalIndex++;
                      const key = `${cat.id}-${qIdx}`;
                      return (
                        <AccordionItem
                          key={key}
                          question={item.q}
                          answer={item.a}
                          list={item.list}
                          isOpen={!!openItems[key]}
                          onClick={() => toggleItem(key)}
                          index={currentGlobalIndex}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ============================================ */}
      {/* STILL HAVE QUESTIONS — CTA */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-[#0a1e3d] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#05308d]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#fbbf24]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
          <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-4">
            Still Have Questions?
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            We're Here to Help
          </h2>
          <p className="font-body text-white/60 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Can't find what you're looking for? Reach out to us directly and our team will get back to you promptly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="group relative inline-flex items-center justify-center gap-2 bg-[#fbbf24] text-[#0a1e3d] px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#fbbf24]/25 hover:-translate-y-0.5"
            >
              <span className="relative z-10">Contact Us</span>
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
            <a
              href="tel:+918382970800"
              className="group inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white/20 text-white px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline transition-all duration-300 hover:border-white/50 hover:bg-white/5 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Call Now
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default FAQ;
