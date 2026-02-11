import logo from "../assets/logo.png";
import { Link } from "react-router-dom"
import { useState,useEffect } from "react"
import {FaFacebook,FaInstagram,FaWhatsapp,FaLinkedin,FaYoutube} from 'react-icons/fa';
import AnnouncementModal from "../components/AnnouncementModal";
import { useAuth, UserButton } from '@clerk/clerk-react';
import Footer from "../components/Footer";

function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [announcement, setAnnouncement] = useState(null);
    const [showAnnouncement, setShowAnnouncement] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };



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

  const testimonials = [
    {
      name: "Arjun Sharma",
      role: "Class 12 Student",
      quote:
        "The personalized attention and small batch sizes helped me improve my Physics score from 60% to 95% in just 6 months. The teachers here truly care about each student's progress.",
      avatar: "AS",
      rating: 5,
    },
    {
      name: "Mrs. Priya Gupta",
      role: "Parent",
      quote:
        "My daughter's confidence has grown tremendously since joining. The regular parent-teacher meetings and progress reports keep us well-informed about her development.",
      avatar: "PG",
      rating: 5,
    },
    {
      name: "Rajesh Kumar",
      role: "Mathematics Teacher",
      quote:
        "Working here has been incredibly rewarding. The institute's focus on conceptual clarity and individual attention creates an ideal learning environment for students.",
      avatar: "RK",
      rating: 5,
    },
  ]

  return (
    <div className="overflow-x-hidden w-full pt-0 mt-0 bg-gray-50">


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


      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-[1000] transition-all duration-300 h-20">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="flex justify-between items-center py-4 h-full">
            <div className="flex items-center">
              <Link to="/" className="no-underline">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Be Educated Logo" className="w-20 h-15 object-contain rounded-lg" />
                  <div className="flex flex-col items-start">
                    <span className="font-['Poppins'] text-2xl font-bold text-blue-600">Be Educated</span>
                    <span className="font-['Open_Sans'] text-xs font-normal text-gray-500 -mt-0.5 leading-none">Achieve Beyond Limits</span>
                  </div>
                </div>
              </Link>
            </div>
            <button className="md:hidden bg-none border-none cursor-pointer p-2.5 z-[1001]" onClick={toggleMobileMenu}>
              <span className={`block w-6 h-0.5 bg-gray-700 relative transition-all duration-300 ${isMobileMenuOpen ? 'bg-transparent before:rotate-45 before:top-0 after:-rotate-45 after:bottom-0' : ''} before:content-[''] before:absolute before:w-6 before:h-0.5 before:bg-gray-700 before:transition-all before:duration-300 before:-top-2 after:content-[''] after:absolute after:w-6 after:h-0.5 after:bg-gray-700 after:transition-all after:duration-300 after:-bottom-2`}></span>
            </button>
            <div className={`flex gap-8 items-center max-md:fixed max-md:top-20 max-md:left-0 max-md:right-0 max-md:bg-white max-md:flex-col max-md:p-8 max-md:gap-6 max-md:shadow-lg max-md:transition-all max-md:duration-300 ${isMobileMenuOpen ? 'max-md:translate-y-0 max-md:opacity-100 max-md:visible' : 'max-md:-translate-y-full max-md:opacity-0 max-md:invisible'}`}>
              <Link to="/about" className="no-underline text-gray-700 font-medium font-['Open_Sans'] transition-all duration-300 hover:text-blue-600" onClick={() => setIsMobileMenuOpen(false)}>
                About
              </Link>
              <Link to="/courses" className="no-underline text-gray-700 font-medium font-['Open_Sans'] transition-all duration-300 hover:text-blue-600" onClick={() => setIsMobileMenuOpen(false)}>
                Courses
              </Link>
               <Link to="/fee-structure" className="no-underline text-gray-700 font-medium font-['Open_Sans'] transition-all duration-300 hover:text-blue-600" onClick={() => setIsMobileMenuOpen(false)}>
                Fee Structure
              </Link>
              <Link to="/contact" className="no-underline text-gray-700 font-medium font-['Open_Sans'] transition-all duration-300 hover:text-blue-600" onClick={() => setIsMobileMenuOpen(false)}>
                Contact
              </Link>
              {isLoaded && isSignedIn ? (
                <>
                  <Link to="/dashboard" className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-6 py-3 rounded-lg no-underline font-semibold transition-all duration-300 hover:from-blue-700 hover:to-teal-700 hover:-translate-y-0.5 shadow-lg" onClick={() => setIsMobileMenuOpen(false)}>
                    Go to Dashboard
                  </Link>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: 'w-10 h-10 rounded-full border-2 border-blue-600 hover:border-blue-700 transition-all',
                        userButtonPopoverCard: 'shadow-2xl',
                      },
                    }}
                  />
                </>
              ) : (
                <>
                  <Link to="/sign-in" className="no-underline text-gray-700 font-medium font-['Open_Sans'] transition-all duration-300 hover:text-blue-600" onClick={() => setIsMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/sign-up" className="bg-blue-600 text-white px-6 py-3 rounded-lg no-underline font-semibold transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5" onClick={() => setIsMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Logo + Tagline Section */}
      <section className="pt-[120px] pb-20 bg-gradient-to-br from-blue-600 to-teal-600 text-white text-center">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="max-w-[600px] mx-auto">
            <img src={logo} alt="Be Educated Logo" className="w-32 h-24 object-contain rounded-lg mx-auto mb-6" />
            <h1 className="font-['Poppins'] text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">Be Educated</h1>
            <p className="font-['Open_Sans'] text-xl opacity-90 italic">Building Bright Minds Since 2025</p>
          </div>
        </div>
      </section>

      {/* Short Intro Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-['Poppins'] text-3xl md:text-4xl font-bold text-gray-800 mb-6 text-center">Personalized Learning for Classes 9-12 & Home Tutoring</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4 font-['Open_Sans']">
              We specialize in providing quality education through small batch sizes and personalized attention. Our
              experienced faculty focuses on conceptual clarity and individual student growth, ensuring every student
              reaches their full potential in board exams and competitive preparations.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-8 font-['Open_Sans']">
              With flexible home tutoring options and comprehensive classroom programs, we adapt to each student's
              learning style and pace, making education accessible and effective for all.
            </p>

            {/* Intro Highlights */}
            <div className="flex flex-col md:flex-row justify-around gap-8 md:gap-4 mt-12 mb-12">
              <div className="flex flex-col items-center text-center bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
                <span className="text-5xl font-bold text-blue-600 font-['Poppins'] mb-2">15+</span>
                <span className="text-gray-600 font-medium font-['Open_Sans']">Years of Excellence</span>
              </div>
              <div className="flex flex-col items-center text-center bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
                <span className="text-5xl font-bold text-blue-600 font-['Poppins'] mb-2">500+</span>
                <span className="text-gray-600 font-medium font-['Open_Sans']">Top Rank Holders</span>
              </div>
              <div className="flex flex-col items-center text-center bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
                <span className="text-5xl font-bold text-blue-600 font-['Poppins'] mb-2">98%</span>
                <span className="text-gray-600 font-medium font-['Open_Sans']">Parent Satisfaction</span>
              </div>
            </div>

            {/* Dashboard/Portal Button */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-2xl text-center text-white shadow-2xl mt-8">
              <h3 className="text-3xl font-bold mb-2">
                {isLoaded && isSignedIn ? 'Access Your Dashboard' : 'Join Our Platform'}
              </h3>
              <p className="text-lg mb-6 opacity-90">
                {isLoaded && isSignedIn
                  ? 'Access your courses, exams, study materials, and track your progress.'
                  : 'Sign up to access study materials, assignments, and personalized learning resources.'}
              </p>
              <Link
                to={isLoaded && isSignedIn ? "/dashboard" : "/sign-up"}
                className="inline-block bg-white text-indigo-600 px-8 py-4 rounded-full no-underline font-bold text-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                {isLoaded && isSignedIn ? 'Go to Dashboard' : 'Get Started Now'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Highlight Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="text-center mb-12">
            <h2 className="font-['Poppins'] text-3xl md:text-4xl font-bold text-gray-800 mb-4">Why Choose Be Educated?</h2>
            <p className="text-lg text-gray-600 font-['Open_Sans']">Discover what makes us the preferred choice for students and parents</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                <span className="text-4xl">🏆</span>
              </div>
              <h3 className="font-['Poppins'] text-xl font-semibold text-gray-800 mb-3 text-center">98% Board Pass Rate</h3>
              <p className="text-gray-600 text-center font-['Open_Sans'] leading-relaxed">Consistently high success rate in CBSE & State Board examinations</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                <span className="text-4xl">👨‍🏫</span>
              </div>
              <h3 className="font-['Poppins'] text-xl font-semibold text-gray-800 mb-3 text-center">1:1 Doubt Solving</h3>
              <p className="text-gray-600 text-center font-['Open_Sans'] leading-relaxed">Personal attention with dedicated doubt clearing sessions</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100">
              <div className="bg-gradient-to-br from-blue-500 to-teal-500 w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto shadow-lg">
                <span className="text-4xl">📚</span>
              </div>
              <h3 className="font-['Poppins'] text-xl font-semibold text-gray-800 mb-3 text-center">Free Study Materials</h3>
              <p className="text-gray-600 text-center font-['Open_Sans'] leading-relaxed">Comprehensive notes, practice papers, and reference materials</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="text-center mb-16">
            <h2 className="font-['Poppins'] text-4xl md:text-5xl font-bold text-gray-800 mb-4">What Our Students & Parents Say</h2>
            <p className="text-xl text-gray-600 font-['Open_Sans']">Real experiences from our learning community</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 relative">
                <div className="absolute -top-4 -left-4 text-8xl text-blue-100 font-serif leading-none select-none">"</div>
                <div className="relative z-10">
                  <p className="text-gray-700 mb-6 italic font-['Open_Sans'] leading-relaxed">{testimonial.quote}</p>
                  <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h4 className="font-['Poppins'] font-semibold text-gray-800 mb-0.5">{testimonial.name}</h4>
                        <span className="text-sm text-gray-500 font-['Open_Sans']">{testimonial.role}</span>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i} className="text-lg">⭐</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Address + Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="font-['Poppins'] text-3xl md:text-4xl font-bold text-gray-800 mb-4">Visit Our Institute</h2>
              <p className="text-lg text-gray-600 mb-8 font-['Open_Sans']">Come and experience our learning environment firsthand</p>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center text-2xl shadow-md">
                      <span>📍</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-['Poppins'] font-semibold text-gray-800 mb-2">Our Address</h4>
                      <p className="text-gray-600 mb-3 font-['Open_Sans'] leading-relaxed">
                        Saraswati Mod,Lalganj Ajhara
                        <br />
                        Pratapgarh, UttarPradesh, 230132
                        <br />
                        India
                      </p>
                      <a href="https://maps.app.goo.gl/ukWj2xa2bHVWekvy8" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium no-underline transition-colors">
                        <span>📍</span> View on Google Maps
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center text-2xl shadow-md">
                      <span>📞</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-['Poppins'] font-semibold text-gray-800 mb-2">Phone Numbers</h4>
                      <p className="text-gray-600 font-['Open_Sans'] leading-relaxed">
                        +91 9721145364
                        <br />
                        +91 8601575896
                        <br />
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center text-2xl shadow-md">
                      <span>✉️</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-['Poppins'] font-semibold text-gray-800 mb-2">Email Us</h4>
                      <p className="text-gray-600 font-['Open_Sans'] leading-relaxed">
                        Officialbe.educated@gmail.com
                        <br />

                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center text-2xl shadow-md">
                      <span>🕒</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-['Poppins'] font-semibold text-gray-800 mb-2">Office Hours</h4>
                      <p className="text-gray-600 font-['Open_Sans'] leading-relaxed">
                        Monday - Friday: 8:00 AM - 7:30 PM
                        <br />
                        Saturday: 9:00 AM - 6:00 PM
                        <br />
                        Sunday: 9:00 AM - 5:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 content-start">
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 text-center">
                <span className="inline-block text-5xl mb-4">👥</span>
                <h3 className="font-['Poppins'] font-semibold text-gray-800 mb-2">Small Batch Sizes</h3>
                <p className="text-gray-600 text-sm font-['Open_Sans'] leading-relaxed">Maximum 15 students per batch for personalized attention</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 text-center">
                <span className="inline-block text-5xl mb-4">🏠</span>
                <h3 className="font-['Poppins'] font-semibold text-gray-800 mb-2">Home Tutoring</h3>
                <p className="text-gray-600 text-sm font-['Open_Sans'] leading-relaxed">Qualified teachers available for one-on-one home sessions</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 text-center">
                <span className="inline-block text-5xl mb-4">🏅</span>
                <h3 className="font-['Poppins'] font-semibold text-gray-800 mb-2">Experienced Faculty</h3>
                <p className="text-gray-600 text-sm font-['Open_Sans'] leading-relaxed">10+ years of teaching experience with proven track record</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 text-center">
                <span className="inline-block text-5xl mb-4">💡</span>
                <h3 className="font-['Poppins'] font-semibold text-gray-800 mb-2">Conceptual Learning</h3>
                <p className="text-gray-600 text-sm font-['Open_Sans'] leading-relaxed">Focus on understanding fundamentals rather than rote learning</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Icons */}
      <section className="py-16 bg-gray-50 text-center">
        <div className="max-w-7xl mx-auto px-5 w-full">
          <h3 className="font-['Poppins'] text-2xl font-semibold mb-8 text-gray-800">Connect With Us</h3>
          <div className="flex justify-center gap-6">
            <a href="https://www.instagram.com/officialbe.educated/?igsh=MXJpOXV0eXliOHV6Mw%3D%3D#" className="w-16 h-16 rounded-full flex items-center justify-center text-2xl no-underline text-white bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 hover:-translate-y-1 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-2xl" aria-label="Instagram">
              <FaInstagram/>
            </a>
            <a href="https://www.facebook.com/share/14FMyCY2J8D/" className="w-16 h-16 rounded-full flex items-center justify-center text-2xl no-underline text-white bg-[#1877f2] hover:-translate-y-1 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-2xl" aria-label="Facebook">
              <FaFacebook/>
            </a>
            <a href="https://www.linkedin.com/company/be-educated-official/" className="w-16 h-16 rounded-full flex items-center justify-center text-2xl no-underline text-white bg-[#0077b5] hover:-translate-y-1 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-2xl" aria-label="Linkedin">
              <FaLinkedin/>
            </a>
            <a href="https://youtube.com/@be-beeducated?si=1yE_tdN05ir1dmHq" className="w-16 h-16 rounded-full flex items-center justify-center text-2xl no-underline text-white bg-[#ff0000] hover:-translate-y-1 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-2xl" aria-label="Youtube">
              <FaYoutube/>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Home

