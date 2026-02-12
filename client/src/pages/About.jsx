import { FaLinkedin, FaGithub } from "react-icons/fa";
import { HiOutlineAcademicCap, HiOutlineLightBulb, HiOutlineUserGroup, HiOutlineClipboardCheck, HiOutlineShieldCheck, HiOutlineHeart } from 'react-icons/hi';
import Rishabh from "../assets/Rishabh.png";
import Footer from '../components/Footer';

function About() {
  return (
    <div className="min-h-screen bg-white">

      {/* ============================================ */}
      {/* HERO SECTION - Image + overlay */}
      {/* ============================================ */}
      <section
        className="relative pt-[80px] min-h-[50vh] flex items-center justify-center text-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#0a1e3d]/70"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-5 py-20">
          <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-4">
            About Us
          </span>
          <h1 className="font-heading text-[32px] sm:text-[42px] md:text-[50px] font-extrabold text-white mb-4 leading-tight">
            About Be Educated
          </h1>
          <p className="font-body text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Building strong academic foundations through concept-based teaching, disciplined study, and personal attention.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* ABOUT CONTENT - Story Section */}
      {/* ============================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Left: Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-elevated">
                <img
                  src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80"
                  alt="Students studying together"
                  className="w-full h-[400px] object-cover"
                />
              </div>
              {/* Floating accent card */}
              <div className="absolute -bottom-6 -right-6 bg-[#05308d] text-white rounded-xl p-5 shadow-xl hidden md:block">
                <p className="font-heading text-3xl font-bold">Class 6–12</p>
                <p className="font-body text-sm text-white/70">Foundation Programs</p>
              </div>
            </div>

            {/* Right: Content */}
            <div>
              <span className="inline-block font-heading text-xs font-semibold text-[#05308d] uppercase tracking-[0.2em] mb-3">
                Our Story
              </span>
              <h2 className="font-heading text-[28px] sm:text-[34px] font-bold text-[#0a1e3d] mb-6 leading-tight">
                Dedicated to Academic Excellence
              </h2>
              <div className="space-y-4 font-body text-[15px] text-gray-600 leading-relaxed">
                <p>
                  Be Educated is a dedicated IIT-JEE & NEET Foundation Institute focused on building strong academic foundations from Class 6 onwards. Our teaching approach is centered on conceptual clarity, disciplined study patterns, and consistent practice.
                </p>
                <p>
                  We prepare students not only for school examinations but also for competitive exams like IIT-JEE and NEET through structured classroom programs, regular tests, and performance analysis.
                </p>
                <p>
                  With limited batch sizes and personal attention, we ensure that every student receives proper guidance and continuous academic improvement.
                </p>
                <p>
                  In addition to foundation programs for Classes 6–12, we also provide Home Tuition services from Nursery to Class 12 for personalized learning support.
                </p>
                <p className="font-medium text-[#0a1e3d]">
                  Our goal is simple — to develop confident, concept-strong students who achieve beyond limits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* VISION & MISSION */}
      {/* ============================================ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Vision Card */}
            <div className="group relative bg-white rounded-2xl p-8 md:p-10 border border-gray-100 overflow-hidden hover:-translate-y-2 hover:shadow-elevated-lg transition-all duration-500 cursor-default">
              {/* Top accent bar that expands on hover */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#05308d] to-[#1a56db] group-hover:h-1.5 transition-all duration-500" />
              {/* Subtle corner glow on hover */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#05308d]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#05308d]/10 rounded-xl flex items-center justify-center text-[#05308d] mb-6 group-hover:bg-[#05308d] group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <HiOutlineLightBulb className="text-2xl" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-[#0a1e3d] mb-4">Our Vision</h2>
                <p className="font-body text-[15px] text-gray-600 leading-relaxed">
                  To create academically strong and competitive students who are well-prepared for IIT-JEE, NEET, and future academic challenges.
                </p>
              </div>
            </div>

            {/* Mission Card */}
            <div className="group relative bg-white rounded-2xl p-8 md:p-10 border border-gray-100 overflow-hidden hover:-translate-y-2 hover:shadow-elevated-lg transition-all duration-500 cursor-default">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1a56db] to-[#05308d] group-hover:h-1.5 transition-all duration-500" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#05308d]/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-14 h-14 bg-[#05308d]/10 rounded-xl flex items-center justify-center text-[#05308d] mb-6 group-hover:bg-[#05308d] group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <HiOutlineAcademicCap className="text-2xl" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-[#0a1e3d] mb-4">Our Mission</h2>
                <ul className="space-y-3">
                  {[
                    'Provide concept-based teaching',
                    'Maintain limited batch sizes',
                    'Conduct regular tests and performance tracking',
                    'Build strong foundation from an early stage',
                    'Ensure personal attention and academic discipline',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 group/item">
                      <span className="w-2 h-2 rounded-full bg-[#05308d]/40 mt-1.5 shrink-0 group-hover/item:bg-[#05308d] group-hover/item:scale-125 transition-all duration-300" />
                      <span className="font-body text-[15px] text-gray-600 group-hover/item:text-[#0a1e3d] transition-colors duration-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* WHY US - Feature Strip */}
      {/* ============================================ */}
      <section
        className="relative py-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#0a1e3d]/80"></div>
        <div className="relative z-10 max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-3">
              Why Choose Us
            </span>
            <h2 className="font-heading text-3xl md:text-[40px] font-bold text-white leading-tight">
              What Sets Us Apart
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: HiOutlineAcademicCap, title: 'Concept-Based Teaching', desc: 'Focus on understanding, not rote memorization' },
              { icon: HiOutlineUserGroup, title: 'Limited Batch Sizes', desc: 'Small groups for better teacher-student interaction' },
              { icon: HiOutlineClipboardCheck, title: 'Regular Testing', desc: 'Weekly tests with detailed performance analysis' },
              { icon: HiOutlineShieldCheck, title: 'Disciplined Approach', desc: 'Structured study patterns and consistent practice' },
              { icon: HiOutlineHeart, title: 'Personal Attention', desc: 'Individual guidance for every student' },
              { icon: HiOutlineLightBulb, title: 'Early Foundation', desc: 'Building competitive readiness from Class 6' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-7 overflow-hidden hover:-translate-y-2 hover:bg-white/15 hover:border-white/20 transition-all duration-500 cursor-default">
                {/* Shimmer line at bottom on hover */}
                <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#fbbf24] to-[#fbbf24]/0 group-hover:w-full transition-all duration-700" />
                {/* Background glow */}
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#fbbf24]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center mb-4 group-hover:bg-[#fbbf24]/20 group-hover:scale-110 transition-all duration-500">
                    <Icon className="text-[#fbbf24] text-2xl group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-2 group-hover:text-[#fbbf24] transition-colors duration-300">{title}</h3>
                  <p className="font-body text-sm text-white/50 group-hover:text-white/70 transition-colors duration-300">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FOUNDERS SECTION */}
      {/* ============================================ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center mb-14">
            <span className="inline-block font-heading text-xs font-semibold text-[#05308d] uppercase tracking-[0.2em] mb-3">
              Leadership
            </span>
            <h2 className="font-heading text-3xl md:text-[40px] font-bold text-[#0a1e3d]">
              Meet the Founders
            </h2>
            <p className="font-body text-gray-500 mt-3 max-w-lg mx-auto">
              The visionaries behind Be Educated
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Founder 1: Rishabh */}
            <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:-translate-y-2 hover:shadow-elevated-lg transition-all duration-500 flex flex-col">
              <div className="h-36 bg-gradient-to-r from-[#0a1e3d] via-[#05308d] to-[#05308d] bg-[length:200%_100%] group-hover:animate-shimmer w-full relative">
                <div className="absolute top-4 right-4 w-20 h-20 border border-white/10 rounded-full" />
                <div className="absolute top-8 right-8 w-12 h-12 border border-white/5 rounded-full" />
                <div className="absolute -bottom-14 left-8 p-1.5 bg-white rounded-full shadow-lg group-hover:shadow-xl transition-shadow duration-500">
                  <img src={Rishabh} alt="Rishabh Pandey" className="w-24 h-24 rounded-full object-cover ring-4 ring-white group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
              <div className="pt-18 pb-8 px-8 flex-1 flex flex-col">
                <h3 className="font-heading text-2xl font-bold text-[#0a1e3d] group-hover:text-[#05308d] transition-colors duration-300">Rishabh Pandey</h3>
                <span className="inline-block font-body text-[#05308d] font-medium text-xs mb-4 bg-[#05308d]/8 px-3 py-1 rounded-full w-fit">Founder</span>
                <p className="font-body text-gray-600 text-[15px] leading-relaxed mb-6 flex-1">
                  With strong roots in Lalganj Ajhara, Pratapgarh, Rishabh Pandey founded Be Educated with a clear vision — to bring high-quality IIT-JEE & NEET foundation education directly to students, both at centre and at home. Understanding that every student learns differently, he built a personalized home tuition model supported by expert subject teachers, structured study plans, and regular performance tracking. From Nursery to Class 12, students receive concept-focused guidance that builds a strong academic base for boards as well as competitive exams. His mission is simple yet powerful — deliver disciplined, result-oriented, and affordable education to every household.
                </p>
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <a href="https://www.linkedin.com/in/rishabh-pandey-6209542ba/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#05308d] transition-all duration-300">
                    <FaLinkedin size={18} />
                  </a>
                </div>
              </div>
            </div>

            {/* Founder 2: Devansh */}
            <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:-translate-y-2 hover:shadow-elevated-lg transition-all duration-500 flex flex-col">
              {/* Banner with animated gradient */}
              <div className="h-36 bg-gradient-to-r from-[#0a1e3d] via-[#05308d] to-[#0a1e3d] bg-[length:200%_100%] group-hover:animate-shimmer w-full relative">
                {/* Decorative circles */}
                <div className="absolute top-4 right-4 w-20 h-20 border border-white/10 rounded-full" />
                <div className="absolute top-8 right-8 w-12 h-12 border border-white/5 rounded-full" />
                <div className="absolute -bottom-14 left-8 p-1.5 bg-white rounded-full shadow-lg group-hover:shadow-xl transition-shadow duration-500">
                  <div className="w-24 h-24 rounded-full bg-[#0a1e3d] text-white flex items-center justify-center text-3xl font-heading font-bold ring-4 ring-white group-hover:scale-105 transition-transform duration-500">
                    DP
                  </div>
                </div>
              </div>
              <div className="pt-18 pb-8 px-8 flex-1 flex flex-col">
                <h3 className="font-heading text-2xl font-bold text-[#0a1e3d] group-hover:text-[#05308d] transition-colors duration-300">Devansh Pandey</h3>
                <span className="inline-block font-body text-[#05308d] font-medium text-xs mb-4 bg-[#05308d]/8 px-3 py-1 rounded-full w-fit">Co-Founder & Tech Lead</span>
                <p className="font-body text-gray-600 text-[15px] leading-relaxed mb-6 flex-1">
                  A passionate developer and educator who envisioned a platform where education is not a privilege, but a right. Devansh combined his love for coding and community impact to launch Be Educated.
                </p>
                <div className="flex gap-2 pt-4 border-t border-gray-100">
                  <a href="https://www.linkedin.com/in/devansh-pandey-a71667218/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#05308d] transition-all duration-300">
                    <FaLinkedin size={18} />
                  </a>
                  <a href="https://github.com/devansh101005" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#0a1e3d] transition-all duration-300">
                    <FaGithub size={18} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA Section */}
      {/* ============================================ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#0a1e3d] mb-3">
            Ready to Begin?
          </h2>
          <p className="font-body text-gray-500 mb-8">
            Join Be Educated and give your child the academic foundation they deserve.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-block bg-[#05308d] text-white px-8 py-3.5 rounded-lg no-underline font-heading font-semibold text-sm hover:bg-[#1648b8] transition-colors duration-300 shadow-sm"
            >
              Enquire Now
            </a>
            <a
              href="tel:+918382970800"
              className="inline-block border-2 border-[#0a1e3d] text-[#0a1e3d] px-8 py-3.5 rounded-lg no-underline font-heading font-semibold text-sm hover:bg-[#0a1e3d] hover:text-white transition-colors duration-300"
            >
              Call Us
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default About;
