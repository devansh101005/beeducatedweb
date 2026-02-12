import { useState } from 'react';
import { HiOutlineLocationMarker, HiOutlinePhone, HiOutlineMail, HiOutlineClock } from 'react-icons/hi';
import Footer from '../components/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'student',
    department: 'general',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/v2/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setFormData({ firstName: '', lastName: '', email: '', role: 'student', department: 'general', message: '' });
      } else {
        setError(data.message || 'Failed to send message. Please try again.');
      }
    } catch (err) {
      setError('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section
        className="relative pt-[80px] min-h-[50vh] flex items-center justify-center text-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#0a1e3d]/70"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-5 py-20">
          <span className="inline-block font-heading text-sm font-semibold text-[#fbbf24] uppercase tracking-[0.2em] mb-4">
            Get In Touch
          </span>
          <h1 className="font-heading text-[32px] sm:text-[42px] md:text-[50px] font-extrabold text-white mb-4 leading-tight">
            Contact Us
          </h1>
          <p className="font-body text-base sm:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            Have questions about admissions or courses? We're here to help. Reach out to us directly or fill out the form below.
          </p>
        </div>
      </section>

      {/* ============================================ */}
      {/* CONTACT INFO CARDS */}
      {/* ============================================ */}
      <section className="relative -mt-16 z-10 pb-10">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: HiOutlineLocationMarker,
                title: 'Our Location',
                line1: 'Lalganj Ajhara',
                line2: 'Pratapgarh, UP – 230132',
                link: { href: 'https://maps.app.goo.gl/AZtQsSZmwAHAjAtr7', label: 'View on Map' },
              },
              {
                icon: HiOutlinePhone,
                title: 'Phone Numbers',
                line1: '+91 8382970800',
                line2: '+91 8601575896',
                link: { href: 'tel:+918382970800', label: 'Call Now' },
              },
              {
                icon: HiOutlineMail,
                title: 'Email Address',
                line1: 'Officialbe.educated',
                line2: '@gmail.com',
                link: { href: 'mailto:Officialbe.educated@gmail.com', label: 'Send Email' },
              },
              {
                icon: HiOutlineClock,
                title: 'Office Hours',
                line1: 'Mon–Fri: 8:00 AM – 7:30 PM',
                line2: 'Sat–Sun: 9:00 AM – 5:00 PM',
              },
            ].map(({ icon: Icon, title, line1, line2, link }, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-2xl p-6 border border-gray-100 overflow-hidden hover:-translate-y-2 hover:shadow-elevated-lg transition-all duration-500 cursor-default"
              >
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#05308d] to-[#1a56db] group-hover:h-1.5 transition-all duration-500" />
                {/* Corner glow */}
                <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#05308d]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-[#05308d]/10 rounded-xl flex items-center justify-center text-[#05308d] mb-4 group-hover:bg-[#05308d] group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Icon className="text-xl" />
                  </div>
                  <h4 className="font-heading text-base font-bold text-[#0a1e3d] mb-2">{title}</h4>
                  <p className="font-body text-[13px] text-gray-500 leading-relaxed">{line1}</p>
                  <p className="font-body text-[13px] text-gray-500 leading-relaxed">{line2}</p>
                  {link && (
                    <a
                      href={link.href}
                      target={link.href.startsWith('http') ? '_blank' : undefined}
                      rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-1 font-body text-xs font-semibold text-[#05308d] no-underline mt-3 group-hover:gap-2 transition-all duration-300"
                    >
                      {link.label}
                      <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FORM + MAP SECTION */}
      {/* ============================================ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid lg:grid-cols-2 gap-10">

            {/* Left: Contact Form */}
            <div className="group relative bg-white rounded-2xl p-8 sm:p-10 border border-gray-100 overflow-hidden shadow-soft-md">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#05308d] to-[#1a56db]" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#05308d]/3 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#1a56db]/3 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <span className="inline-block font-heading text-xs font-semibold text-[#05308d] uppercase tracking-[0.2em] mb-2">
                  Enquiry Form
                </span>
                <h3 className="font-heading text-2xl font-bold text-[#0a1e3d] mb-1">Send us a Message</h3>
                <p className="font-body text-sm text-gray-400 mb-8">We'll get back to you within 24 hours.</p>

                {success && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-6 font-body text-sm">
                    <p className="font-semibold">Message sent successfully!</p>
                    <p className="text-emerald-600">We'll get back to you within 24 hours.</p>
                  </div>
                )}

                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6 font-body text-sm">
                    <p className="font-semibold">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="firstName" className="block font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">First Name</label>
                      <input
                        type="text" id="firstName" name="firstName"
                        value={formData.firstName} onChange={handleChange} required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm text-[#0a1e3d] bg-gray-50 outline-none focus:border-[#05308d] focus:ring-2 focus:ring-[#05308d]/10 focus:bg-white transition-all duration-300"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Last Name</label>
                      <input
                        type="text" id="lastName" name="lastName"
                        value={formData.lastName} onChange={handleChange} required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm text-[#0a1e3d] bg-gray-50 outline-none focus:border-[#05308d] focus:ring-2 focus:ring-[#05308d]/10 focus:bg-white transition-all duration-300"
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email" id="email" name="email"
                      value={formData.email} onChange={handleChange} required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm text-[#0a1e3d] bg-gray-50 outline-none focus:border-[#05308d] focus:ring-2 focus:ring-[#05308d]/10 focus:bg-white transition-all duration-300"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="role" className="block font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">I am a</label>
                      <select
                        id="role" name="role"
                        value={formData.role} onChange={handleChange} required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm text-[#0a1e3d] bg-gray-50 outline-none focus:border-[#05308d] focus:ring-2 focus:ring-[#05308d]/10 focus:bg-white transition-all duration-300 appearance-none cursor-pointer"
                      >
                        <option value="student">Student</option>
                        <option value="parent">Parent</option>
                        <option value="teacher">Teacher</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="department" className="block font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Inquiry For</label>
                      <select
                        id="department" name="department"
                        value={formData.department} onChange={handleChange} required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm text-[#0a1e3d] bg-gray-50 outline-none focus:border-[#05308d] focus:ring-2 focus:ring-[#05308d]/10 focus:bg-white transition-all duration-300 appearance-none cursor-pointer"
                      >
                        <option value="general">General Information</option>
                        <option value="admission">Admission</option>
                        <option value="technical">Technical Support</option>
                        <option value="accounts">Accounts & Finance</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block font-body text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message</label>
                    <textarea
                      id="message" name="message"
                      value={formData.message} onChange={handleChange} required rows="4"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 font-body text-sm text-[#0a1e3d] bg-gray-50 outline-none focus:border-[#05308d] focus:ring-2 focus:ring-[#05308d]/10 focus:bg-white transition-all duration-300 resize-none"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#05308d] text-white font-heading font-semibold py-3.5 rounded-xl hover:bg-[#1648b8] hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Map + Quick CTA */}
            <div className="flex flex-col gap-6">
              {/* Map */}
              <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-soft-md flex-1 min-h-[300px]">
                <iframe
                  title="Be Educated Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3606.0!2d81.95!3d25.89!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399be3d4b7f63cc7%3A0x6d0b7ca4a7e0a279!2sBe%20Educated!5e0!3m2!1sen!2sin!4v1700000000000"
                  className="w-full h-full absolute inset-0"
                  style={{ border: 0, minHeight: 300 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Quick Action Card */}
              <div className="group relative bg-gradient-to-r from-[#0a1e3d] to-[#05308d] rounded-2xl p-7 overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-4 right-4 w-24 h-24 border border-white/5 rounded-full" />
                <div className="absolute top-8 right-8 w-16 h-16 border border-white/5 rounded-full" />
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
                <div className="relative z-10">
                  <h3 className="font-heading text-xl font-bold text-white mb-2">Need Immediate Help?</h3>
                  <p className="font-body text-sm text-white/60 mb-5">
                    Call us directly for instant assistance with admissions and course details.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href="tel:+918382970800"
                      className="inline-flex items-center justify-center gap-2 bg-white text-[#05308d] px-5 py-2.5 rounded-lg no-underline font-heading font-semibold text-sm hover:bg-white/90 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <HiOutlinePhone className="text-base" />
                      Call Now
                    </a>
                    <a
                      href="https://wa.me/918382970800"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 border border-white/20 text-white px-5 py-2.5 rounded-lg no-underline font-heading font-semibold text-sm hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Contact;
