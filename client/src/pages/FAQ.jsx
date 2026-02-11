import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

function FAQ() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-5 py-24">
        <div className="text-center max-w-lg">
          <span className="inline-block font-heading text-sm font-semibold text-[#05308d] uppercase tracking-widest mb-4">
            FAQ
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#0a1e3d] mb-4">
            Coming Soon
          </h1>
          <p className="font-body text-base text-gray-500 mb-8 leading-relaxed">
            We're putting together answers to frequently asked questions about admissions, courses, fees, and more. Check back soon!
          </p>
          <Link
            to="/"
            className="inline-block bg-[#05308d] text-white px-7 py-3 rounded-lg no-underline font-heading font-semibold text-sm hover:bg-[#1648b8] transition-colors duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default FAQ;
