import React, { useState } from 'react';
import Footer from '../components/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'student',
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          role: 'student',
          message: '',
        });
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
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-100">
      
      {/* Header / Hero Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-24 text-center">
          <span className="text-blue-600 font-semibold tracking-wide uppercase text-sm">Get in touch</span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 font-['Poppins']">
            Contact Our Institute
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto font-['Open_Sans']">
            Have questions about admissions or courses? We're here to help. Reach out to us directly or fill out the form below.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Left Column: Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 font-['Poppins']">Contact Information</h3>
              <p className="text-gray-600 mb-8 font-['Open_Sans']">
                Visit our campus to experience our learning environment firsthand. Our counselors are available during office hours.
              </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-6">
              <ContactCard 
                icon={<MapPinIcon />}
                title="Our Location"
                content={
                  <>
                    Saraswati Mod, Lalganj Ajhara <br />
                    Pratapgarh, Uttar Pradesh, 230132 <br />
                    India
                  </>
                }
                action={
                  <a 
                    href="https://maps.app.goo.gl/ukWj2xa2bHVWekvy8" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors mt-2"
                  >
                    View on Google Maps &rarr;
                  </a>
                }
              />

              <ContactCard 
                icon={<PhoneIcon />}
                title="Phone Numbers"
                content={
                  <>
                    <a href="tel:+919721145364" className="hover:text-blue-600 transition">+91 9721145364</a> <br />
                    <a href="tel:+918601575896" className="hover:text-blue-600 transition">+91 8601575896</a>
                  </>
                }
              />

              <ContactCard 
                icon={<MailIcon />}
                title="Email Address"
                content={
                  <a href="mailto:Officialbe.educated@gmail.com" className="hover:text-blue-600 transition">
                    Officialbe.educated@gmail.com
                  </a>
                }
              />

              <ContactCard 
                icon={<ClockIcon />}
                title="Office Hours"
                content={
                  <>
                    <span className="font-medium">Mon - Fri:</span> 8:00 AM - 7:30 PM <br />
                    <span className="font-medium">Saturday:</span> 9:00 AM - 6:00 PM <br />
                    <span className="font-medium">Sunday:</span> 9:00 AM - 5:00 PM
                  </>
                }
              />
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10 lg:p-12 relative overflow-hidden">
            {/* Decorative gradient blob */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-gradient-to-br from-blue-50 to-teal-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2 relative z-10 font-['Poppins']">Send us a Message</h3>
            <p className="text-gray-500 mb-8 relative z-10">Fill out the form below and we'll get back to you within 24 hours.</p>

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 relative z-10">
                <p className="font-medium">Message sent successfully!</p>
                <p className="text-sm">We'll get back to you within 24 hours.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 relative z-10">
                <p className="font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none bg-gray-50 focus:bg-white"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none bg-gray-50 focus:bg-white"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none bg-gray-50 focus:bg-white"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">I am a *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none bg-gray-50 focus:bg-white"
                >
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="4"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none bg-gray-50 focus:bg-white resize-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold py-4 rounded-lg shadow-lg hover:shadow-xl hover:opacity-90 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

// --- Helper Components (For cleaner code) ---

const ContactCard = ({ icon, title, content, action }) => (
  <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300 border border-transparent hover:border-gray-100">
    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-teal-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
      {icon}
    </div>
    <div>
      <h4 className="text-lg font-semibold text-gray-900 font-['Poppins']">{title}</h4>
      <div className="mt-1 text-gray-600 leading-relaxed text-sm font-['Open_Sans']">
        {content}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  </div>
);

// --- SVG Icons (No external libraries needed) ---

const MapPinIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default Contact;