import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';
import AnnouncementModal from "../components/AnnouncementModal";
import Footer from "../components/Footer";

function Home() {
  const [announcement, setAnnouncement] = useState(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL}/api/v2/announcements/latest`);
        const data = await res.json();
        if (!cancelled && data?.success && data.announcement?.message) {
          const seenId = localStorage.getItem("seenAnnouncementId");
          if (String(seenId) !== String(data.announcement.id)) {
            setAnnouncement(data.announcement);
            setShowAnnouncement(true);
          }
        }
      } catch (e) {
        console.error("Failed to load announcement:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="overflow-x-hidden w-full pt-0 mt-0 bg-white">

      {showAnnouncement && (
        <AnnouncementModal
          message={announcement?.message}
          onClose={() => {
            if (announcement?.id) {
              //localStorage.setItem("seenAnnouncementId", String(announcement.id));
            }
            setShowAnnouncement(false);
          }}
        />
      )}

      {/* ============================================ */}
      {/* HERO SECTION - Dark overlay classroom bg */}
      {/* ============================================ */}
      <section
        className="relative pt-[80px] min-h-[90vh] flex items-center justify-center text-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#0a1e3d]/60"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-5 py-16">
          {/* Tagline */}
          <p className="font-heading text-[13px] sm:text-[14px] font-semibold tracking-[0.25em] uppercase text-white/80 mb-5">
            Achieve Beyond Limits
          </p>

          {/* Main Heading */}
          <h1 className="font-heading text-[30px] sm:text-[40px] md:text-[48px] lg:text-[54px] font-extrabold text-white mb-3 leading-tight">
            IIT-JEE & NEET Foundation Institute
          </h1>

          {/* Location */}
          {/* <p className="font-heading text-[20px] sm:text-[24px] md:text-[28px] font-bold text-white/90 mb-5">
            Pratapgarh
          </p> */}

          {/* Subheading */}
          <p className="font-body text-[15px] sm:text-[17px] md:text-[19px] font-medium text-white/80 mb-4">
            Foundation Program (Class 6–12) | Home Tuition Service (Nursery–12)
          </p>

          {/* Trust Line */}
          <p className="font-body text-[13px] md:text-[15px] font-normal text-white/60 mb-10 tracking-wide">
            Concept Based Teaching &bull; Weekly Tests &bull; Limited Batches &bull; Personal Attention
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-block bg-[#05308d] text-white px-9 py-4 rounded-lg no-underline font-heading font-bold text-base sm:text-lg hover:bg-[#1648b8] transition-colors duration-300 shadow-xl"
            >
              Enquire Now
            </Link>
            <a
              href="tel:+919721145364"
              className="inline-block border-2 border-white text-white px-9 py-4 rounded-lg no-underline font-heading font-bold text-base sm:text-lg hover:bg-white hover:text-[#0a1e3d] transition-colors duration-300"
            >
              Call for Admission
            </a>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 2 - OUR PROGRAMS */}
      {/* ============================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0a1e3d] mb-3">Our Programs</h2>
            <p className="font-body text-[15px] md:text-base text-gray-500 max-w-xl mx-auto">Structured programs designed to build strong fundamentals and competitive edge</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* IIT-JEE & NEET Foundation */}
            <div className="bg-gray-50 rounded-2xl p-8 md:p-10 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#0a1e3d] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-heading text-xl md:text-2xl font-bold text-[#0a1e3d]">IIT-JEE & NEET Foundation (Class 6–12)</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Strong Concept Building',
                  'Competitive Level Practice',
                  'Regular Test Series',
                  'Doubt Clearing Sessions',
                  'Career Guidance Support',
                  'Small Batch Size',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#1a56db] mt-0.5 flex-shrink-0 font-bold">&#10003;</span>
                    <span className="font-body text-[14px] md:text-[15px] text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Home Tuition Service */}
            <div className="bg-gray-50 rounded-2xl p-8 md:p-10 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#0a1e3d] rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏠</span>
                </div>
                <h3 className="font-heading text-xl md:text-2xl font-bold text-[#0a1e3d]">Home Tuition Service (Nursery–12)</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'One-to-One Teaching',
                  'All Subjects Available',
                  'Flexible Timing',
                  'Experienced Teachers',
                  'Personal Performance Monitoring',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#1a56db] mt-0.5 flex-shrink-0 font-bold">&#10003;</span>
                    <span className="font-body text-[14px] md:text-[15px] text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 3 - WHY CHOOSE US */}
      {/* ============================================ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0a1e3d] mb-3">Why Choose Be Educated?</h2>
            <p className="font-body text-[15px] md:text-base text-gray-500 max-w-xl mx-auto">What sets us apart from the rest</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '👥', title: 'Limited Students Per Batch', desc: 'Small batches ensure every student gets individual attention and focused learning.' },
              { icon: '📝', title: 'Weekly Performance Tests', desc: 'Regular assessments to track progress, identify gaps, and keep students exam-ready.' },
              { icon: '💬', title: 'Personal Doubt Support', desc: 'Dedicated doubt-clearing sessions so no question goes unanswered.' },
              { icon: '📋', title: 'Discipline & Study Monitoring', desc: 'Structured study plans with regular monitoring for consistent academic growth.' },
              { icon: '🎓', title: 'Experienced & Dedicated Faculty', desc: 'Teachers with years of experience in competitive and board exam coaching.' },
              { icon: '💡', title: 'Concept-Based Teaching', desc: 'Focus on deep understanding of fundamentals rather than rote memorization.' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-7 rounded-xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 bg-[#0a1e3d] rounded-lg flex items-center justify-center mb-5">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <h3 className="font-heading text-lg font-semibold text-[#0a1e3d] mb-2">{item.title}</h3>
                <p className="font-body text-[14px] md:text-[15px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 4 - ACADEMIC EXCELLENCE */}
      {/* ============================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#0a1e3d] mb-6">Academic Excellence</h2>
              <p className="font-body text-[14px] md:text-base text-gray-500 mb-8 leading-relaxed">
                Our results-driven approach ensures every student is prepared not just for exams, but for academic success at every level.
              </p>
              <div className="space-y-5">
                {[
                  { icon: '🎯', text: 'Focus on Board & Competitive Success' },
                  { icon: '📚', text: 'NCERT + Advanced Study Material' },
                  { icon: '📊', text: 'Weekly Performance Reports' },
                  { icon: '🏆', text: 'Targeting 90%+ Academic Results' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="w-11 h-11 bg-[#0a1e3d] rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">{item.icon}</span>
                    </div>
                    <span className="font-body text-[15px] md:text-base font-medium text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-5">
              <div className="bg-[#0a1e3d] p-7 rounded-2xl text-center">
                <span className="font-heading text-4xl md:text-5xl font-extrabold text-white block mb-2">500+</span>
                <span className="font-body text-sm text-white/70">Students Taught</span>
              </div>
              <div className="bg-[#0a1e3d] p-7 rounded-2xl text-center">
                <span className="font-heading text-4xl md:text-5xl font-extrabold text-white block mb-2">98%</span>
                <span className="font-body text-sm text-white/70">Board Pass Rate</span>
              </div>
              <div className="bg-[#0a1e3d] p-7 rounded-2xl text-center">
                <span className="font-heading text-4xl md:text-5xl font-extrabold text-white block mb-2">15+</span>
                <span className="font-body text-sm text-white/70">Years Experience</span>
              </div>
              <div className="bg-[#0a1e3d] p-7 rounded-2xl text-center">
                <span className="font-heading text-4xl md:text-5xl font-extrabold text-white block mb-2">100%</span>
                <span className="font-body text-sm text-white/70">Parent Satisfaction</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 5 - FINAL CTA (Physics/Math bg) */}
      {/* ============================================ */}
      <section
        className="relative py-24"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#0a1e3d]/75"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-5 text-center">
          <h2 className="font-heading text-3xl md:text-4xl lg:text-[42px] font-bold text-white mb-4 leading-tight">
            Start Your Child's Success Journey Today
          </h2>
          <p className="font-heading text-lg md:text-xl font-semibold text-[#fbbf24] mb-2">
            Limited Seats Available
          </p>
          <p className="font-body text-base md:text-lg text-white/70 mb-10">
            Book Your Free Demo Class Now
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="inline-block bg-[#05308d] text-white px-9 py-4 rounded-lg no-underline font-heading font-bold text-base sm:text-lg hover:bg-[#1648b8] transition-colors duration-300 shadow-xl"
            >
              Enquire Now
            </Link>
            <a
              href="tel:+919721145364"
              className="inline-block border-2 border-white text-white px-9 py-4 rounded-lg no-underline font-heading font-bold text-base sm:text-lg hover:bg-white hover:text-[#0a1e3d] transition-colors duration-300"
            >
              Call Now
            </a>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CONNECT WITH US */}
      {/* ============================================ */}
      {/* <section className="py-14 bg-gray-50 text-center">
        <h3 className="font-heading text-2xl font-semibold mb-6 text-[#0a1e3d]">Connect With Us</h3>
        <div className="flex justify-center gap-5">
          <a href="https://www.instagram.com/officialbe.educated/?igsh=MXJpOXV0eXliOHV6Mw%3D%3D#" className="w-13 h-13 rounded-full flex items-center justify-center text-xl no-underline text-white bg-[#0a1e3d] hover:-translate-y-1 hover:bg-[#1a56db] transition-all duration-300 shadow-md" style={{width: 52, height: 52}} aria-label="Instagram">
            <FaInstagram/>
          </a>
          <a href="https://www.facebook.com/share/14FMyCY2J8D/" className="w-13 h-13 rounded-full flex items-center justify-center text-xl no-underline text-white bg-[#0a1e3d] hover:-translate-y-1 hover:bg-[#1a56db] transition-all duration-300 shadow-md" style={{width: 52, height: 52}} aria-label="Facebook">
            <FaFacebook/>
          </a>
          <a href="https://www.linkedin.com/company/be-educated-official/" className="w-13 h-13 rounded-full flex items-center justify-center text-xl no-underline text-white bg-[#0a1e3d] hover:-translate-y-1 hover:bg-[#1a56db] transition-all duration-300 shadow-md" style={{width: 52, height: 52}} aria-label="Linkedin">
            <FaLinkedin/>
          </a>
          <a href="https://youtube.com/@be-beeducated?si=1yE_tdN05ir1dmHq" className="w-13 h-13 rounded-full flex items-center justify-center text-xl no-underline text-white bg-[#0a1e3d] hover:-translate-y-1 hover:bg-[#1a56db] transition-all duration-300 shadow-md" style={{width: 52, height: 52}} aria-label="Youtube">
            <FaYoutube/>
          </a>
        </div>
      </section> */}

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Home
