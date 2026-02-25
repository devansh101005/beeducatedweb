import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  HiOutlineAcademicCap,
  HiOutlineDesktopComputer,
  HiOutlineDocumentText,
  HiOutlineHome,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import type { CourseType } from '../types';
import Footer from '../../../components/Footer';

/* ── Icon mapping (DB sends icon name as string) ── */
const iconMap: Record<string, React.ElementType> = {
  School: HiOutlineAcademicCap,
  Monitor: HiOutlineDesktopComputer,
  FileText: HiOutlineDocumentText,
  Home: HiOutlineHome,
};

export function CoursesPage() {
  const navigate = useNavigate();
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourseTypes();
  }, []);

  const fetchCourseTypes = async () => {
    try {
      const res = await fetch('/api/v2/course-types');
      const data = await res.json();

      if (data.success) {
        setCourseTypes(data.data);
      } else {
        setError('Failed to load courses');
      }
    } catch {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (courseType: CourseType) => {
    if (courseType.isActive) {
      navigate(`/courses/${courseType.slug}`);
    } else if (courseType.slug?.includes('home-tuition') || courseType.slug?.includes('home_tuition') || courseType.name?.toLowerCase().includes('home tuition')) {
      navigate('/courses/home-tuition');
    }
  };

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-[80px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#05308d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-body text-gray-500">Loading courses...</p>
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-[80px]">
        <div className="text-center">
          <p className="font-body text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchCourseTypes}
            className="px-6 py-3 bg-[#05308d] text-white rounded-xl font-heading font-bold text-sm hover:bg-[#1a56db] transition-colors cursor-pointer border-none"
          >
            Try Again
          </button>
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
        className="relative pt-[80px] min-h-[50vh] flex items-center justify-center text-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=80')`,
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
      {/* COURSE TYPE CARDS */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
              Choose Your Path
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] mb-3">
              Select a Program
            </h2>
            <p className="font-body text-gray-500 max-w-xl mx-auto">
              Quality education designed for your success
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {courseTypes.map((courseType) => {
              const IconComponent = iconMap[courseType.icon || 'School'] || HiOutlineAcademicCap;
              const isActive = courseType.isActive;

              return (
                <div
                  key={courseType.id}
                  onClick={() => handleCardClick(courseType)}
                  className={`group/card relative bg-white rounded-2xl border overflow-hidden transition-all duration-300 ${
                    isActive
                      ? 'border-gray-200 hover:border-[#05308d]/30 hover:shadow-xl hover:-translate-y-2 cursor-pointer'
                      : 'border-gray-100 opacity-80'
                  }`}
                >
                  {/* Top accent bar */}
                  <div
                    className={`h-1.5 transition-all duration-500 ${
                      isActive
                        ? 'bg-[#05308d] group-hover/card:bg-gradient-to-r group-hover/card:from-[#05308d] group-hover/card:to-[#fbbf24]'
                        : 'bg-gray-200'
                    }`}
                  ></div>

                  {/* Status Badge */}
                  <div className="absolute top-6 right-6 z-10">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-heading font-bold">
                        <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fbbf24]/10 text-[#0a1e3d] rounded-full text-xs font-heading font-bold">
                        <HiOutlineClock className="w-3.5 h-3.5" />
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {/* Corner glow */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#05308d]/5 rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>

                  <div className="p-8">
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                        isActive
                          ? 'bg-[#05308d]/5 text-[#05308d] group-hover/card:bg-[#05308d] group-hover/card:text-white group-hover/card:scale-110 group-hover/card:rotate-3'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <IconComponent className="w-7 h-7" />
                    </div>

                    {/* Title & Description */}
                    <h3 className={`font-heading text-xl sm:text-2xl font-bold mb-1 transition-colors duration-300 ${
                      isActive ? 'text-[#0a1e3d] group-hover/card:text-[#05308d]' : 'text-gray-400'
                    }`}>
                      {courseType.slug?.includes('offline')
                        ? 'Offline Batch — Hybrid Classroom Program'
                        : courseType.slug?.includes('online')
                        ? 'Online Batch — Live Interactive Program'
                        : courseType.name}
                    </h3>
                    {courseType.slug?.includes('offline') && (
                      <p className="font-heading text-xs font-semibold text-[#05308d]/60 uppercase tracking-wider mb-4">
                        IIT-JEE / NEET Foundation | Class 6–12
                      </p>
                    )}
                    {courseType.description && (
                      <p className="font-body text-gray-500 text-[15px] leading-relaxed mb-6 line-clamp-2">
                        {courseType.description}
                      </p>
                    )}

                    {/* Features */}
                    {courseType.features && courseType.features.length > 0 && (
                      <ul className="space-y-2.5 mb-8">
                        {courseType.features.slice(0, 4).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 font-body text-sm text-gray-600">
                            <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                              isActive ? 'bg-[#fbbf24]' : 'bg-gray-300'
                            }`}></span>
                            {feature.replace(/\s*\(max\s+\d+\s+students\)/i, '')}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* CTA */}
                    {isActive ? (
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-sm font-bold text-[#05308d] group-hover/card:text-[#1a56db] transition-colors duration-300">
                          View Classes & Enroll
                        </span>
                        <div className="w-10 h-10 rounded-full bg-[#05308d]/5 flex items-center justify-center transition-all duration-300 group-hover/card:bg-[#05308d] group-hover/card:translate-x-1">
                          <HiOutlineChevronRight className="w-5 h-5 text-[#05308d] group-hover/card:text-white transition-colors duration-300" />
                        </div>
                      </div>
                    ) : (courseType.slug?.includes('home-tuition') || courseType.slug?.includes('home_tuition') || courseType.name?.toLowerCase().includes('home tuition')) ? (
                      <div className="flex items-center justify-between">
                        <span className="font-heading text-sm font-bold text-[#05308d] group-hover/card:text-[#1a56db] transition-colors duration-300">
                          View Classes & Enroll
                        </span>
                        <div className="w-10 h-10 rounded-full bg-[#05308d]/5 flex items-center justify-center transition-all duration-300 group-hover/card:bg-[#05308d] group-hover/card:translate-x-1">
                          <HiOutlineChevronRight className="w-5 h-5 text-[#05308d] group-hover/card:text-white transition-colors duration-300" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-3 bg-gray-50 rounded-xl">
                        <p className="font-body text-sm text-gray-400">
                          {courseType.comingSoonMessage || 'This program is coming soon!'}
                        </p>
                      </div>
                    )}
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
      <section
        className="py-16 sm:py-20 relative overflow-hidden"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#0a1e3d]/90"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#05308d]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#fbbf24]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
          <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-4">
            Need Help Choosing?
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Not Sure Which Program to Choose?
          </h2>
          <p className="font-body text-white/60 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Our counselors are here to help you find the perfect learning path. Get personalized guidance based on your goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="group relative inline-flex items-center justify-center gap-2 bg-[#fbbf24] text-[#0a1e3d] px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-[#fbbf24]/25 hover:-translate-y-0.5"
            >
              <span className="relative z-10">Talk to a Counselor</span>
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
}

export default CoursesPage;
