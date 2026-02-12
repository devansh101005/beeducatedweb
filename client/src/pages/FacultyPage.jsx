import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const FacultyPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
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
            Our Team
          </span>
          <h1 className="font-heading text-[32px] sm:text-[42px] md:text-[50px] font-extrabold text-white mb-4 leading-tight">
            Our Faculty
          </h1>
          <p className="font-body text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Meet the expert educators who make Be Educated a centre of academic excellence.
          </p>
        </div>
      </section>

      {/* COMING SOON */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-3xl mx-auto px-5 text-center">
          {/* Animated icon */}
          <div className="w-20 h-20 rounded-2xl bg-[#05308d]/5 flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-[#05308d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>

          <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-[0.15em] mb-3">
            Coming Soon
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#0a1e3d] mb-4">
            Faculty Profiles Are on the Way
          </h2>
          <p className="font-body text-gray-500 text-base sm:text-lg max-w-xl mx-auto leading-relaxed mb-10">
            We're preparing detailed profiles of our experienced educators. Check back soon to meet the team behind your academic success.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="group relative inline-flex items-center justify-center gap-2 bg-[#05308d] text-white px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline overflow-hidden transition-all duration-300 hover:bg-[#1a56db] hover:shadow-lg hover:shadow-[#05308d]/25 hover:-translate-y-0.5"
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
            </Link>
            <Link
              to="/courses"
              className="group inline-flex items-center justify-center gap-2 bg-transparent border-2 border-[#05308d]/15 text-[#05308d] px-8 py-4 rounded-xl font-heading font-bold text-sm sm:text-base no-underline transition-all duration-300 hover:border-[#05308d]/30 hover:bg-[#05308d]/5 hover:-translate-y-0.5"
            >
              Explore Courses
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FacultyPage;
