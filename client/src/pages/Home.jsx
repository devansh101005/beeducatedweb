


import "./Home.css"
import logo from "../assets/logo.png";
import { Link } from "react-router-dom"
import { useState,useEffect } from "react"
import {FaFacebook,FaInstagram,FaWhatsapp,FaLinkedin} from 'react-icons/fa';
import AnnouncementModal from "../components/AnnouncementModal";

function Home() {
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
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/announcements/latest`);
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
    <div className="home-wrapper">


      {showAnnouncement && (
        <AnnouncementModal
          message={announcement?.message}
          onClose={() => {
            if (announcement?.id) {
              localStorage.setItem("seenAnnouncementId", String(announcement.id));
            }
            setShowAnnouncement(false);
          }}
        />
      )}
      

      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <div className="logo-section">
              <Link to="/" className="logo-link">
                <div className="logo-container">
                  <img src={logo} alt="Be Educated Logo" className="logo-image" />
                  <div className="logo-content">
                    <span className="logo-text">Be Educated</span>
                    <span className="logo-tagline">Achieve Beyond Limits</span>
                  </div>
                </div>
              </Link>
            </div>
            <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
              <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}></span>
            </button>
            <div className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
              <Link to="/about" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                About
              </Link>
              <Link to="/courses" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Courses
              </Link>
              <Link to="/contact" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Contact
              </Link>
              <Link to="/login" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Login
              </Link>
              <Link to="/signup" className="btn btn-nav" onClick={() => setIsMobileMenuOpen(false)}>
                Join Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Logo + Tagline Section */}
      <section className="logo-tagline-section">
        <div className="container">
          <div className="logo-showcase">
            <span className="main-logo-icon">🎓</span>
            <h1 className="institute-name">Be Educated</h1>
            <p className="tagline">Building Bright Minds Since 2025</p>
          </div>
        </div>
      </section>

      {/* Short Intro Section */}
      <section className="short-intro">
        <div className="container">
          <div className="intro-content">
            <h2>Personalized Learning for Classes 9-12 & Home Tutoring</h2>
            <p>
              We specialize in providing quality education through small batch sizes and personalized attention. Our
              experienced faculty focuses on conceptual clarity and individual student growth, ensuring every student
              reaches their full potential in board exams and competitive preparations.
            </p>
            <p>
              With flexible home tutoring options and comprehensive classroom programs, we adapt to each student's
              learning style and pace, making education accessible and effective for all.
            </p>

            {/* Intro Highlights */}
            <div className="intro-highlights">
              <div className="highlight">
                <span className="highlight-number">15+</span>
                <span className="highlight-text">Years of Excellence</span>
              </div>
              <div className="highlight">
                <span className="highlight-number">500+</span>
                <span className="highlight-text">Top Rank Holders</span>
              </div>
              <div className="highlight">
                <span className="highlight-number">98%</span>
                <span className="highlight-text">Parent Satisfaction</span>
              </div>
            </div>

            {/* Student Portal Button */}
            <div className="student-portal-section">
              <h3>🎓 Access Your Learning Resources</h3>
              <p>Students can access study materials, assignments, and resources through our secure portal.</p>
              <Link to="/student-portal" className="student-portal-btn">
                🚀 Student Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Highlight Section */}
      <section className="highlights">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Be Educated?</h2>
            <p>Discover what makes us the preferred choice for students and parents</p>
          </div>
          <div className="highlights-grid">
            <div className="highlight-card">
              <div className="highlight-icon">
                <span>🏆</span>
              </div>
              <h3>98% Board Pass Rate</h3>
              <p>Consistently high success rate in CBSE & State Board examinations</p>
            </div>
            <div className="highlight-card">
              <div className="highlight-icon">
                <span>👨‍🏫</span>
              </div>
              <h3>1:1 Doubt Solving</h3>
              <p>Personal attention with dedicated doubt clearing sessions</p>
            </div>
            <div className="highlight-card">
              <div className="highlight-icon">
                <span>📚</span>
              </div>
              <h3>Free Study Materials</h3>
              <p>Comprehensive notes, practice papers, and reference materials</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <div className="testimonials-heading-wrapper" style={{textAlign: 'center', margin: '4rem 0 2rem 0'}}>
            <h2 style={{fontSize: '2.5rem', fontWeight: 700, color: '#1f2937', fontFamily: 'Poppins, sans-serif', marginBottom: '0.5rem'}}>What Our Students & Parents Say</h2>
            <p style={{fontSize: '1.25rem', color: '#374151', fontFamily: 'Open Sans, sans-serif'}}>Real experiences from our learning community</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-content">
                  <div className="quote-mark">"</div>
                  <p>{testimonial.quote}</p>
                  <div className="testimonial-footer">
                    <div className="student-info">
                      <div className="student-avatar">{testimonial.avatar}</div>
                      <div className="student-details">
                        <h4>{testimonial.name}</h4>
                        <span>{testimonial.role}</span>
                      </div>
                    </div>
                    <div className="rating">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <span key={i}>⭐</span>
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
      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Visit Our Institute</h2>
              <p>Come and experience our learning environment firsthand</p>

              <div className="contact-details">
                <div className="contact-item">
                  <div className="contact-icon">
                    <span>📍</span>
                  </div>
                  <div className="contact-text">
                    <h4>Our Address</h4>
                    <p>
                      Saraswati Mod,Lalganj Ajhara
                      <br />
                      Pratapgarh, UttarPradesh, 230132
                      <br />
                      India
                    </p>
                    <a href="https://maps.app.goo.gl/ukWj2xa2bHVWekvy8" target="_blank" rel="noopener noreferrer" className="maps-link">
                      📍 View on Google Maps
                    </a>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <span>📞</span>
                  </div>
                  <div className="contact-text">
                    <h4>Phone Numbers</h4>
                    <p>
                      +91 9721145364
                      <br />
                      +91 8601575896
                      <br />
                    </p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <span>✉️</span>
                  </div>
                  <div className="contact-text">
                    <h4>Email Us</h4>
                    <p>
                      Officialbe.educated@gmail.com
                      <br />
                      
                    </p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">
                    <span>🕒</span>
                  </div>
                  <div className="contact-text">
                    <h4>Office Hours</h4>
                    <p>
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

            <div className="additional-info">
              <div className="info-card">
                <span className="info-icon">👥</span>
                <h3>Small Batch Sizes</h3>
                <p>Maximum 15 students per batch for personalized attention</p>
              </div>
              <div className="info-card">
                <span className="info-icon">🏠</span>
                <h3>Home Tutoring</h3>
                <p>Qualified teachers available for one-on-one home sessions</p>
              </div>
              <div className="info-card">
                <span className="info-icon">🏅</span>
                <h3>Experienced Faculty</h3>
                <p>10+ years of teaching experience with proven track record</p>
              </div>
              <div className="info-card">
                <span className="info-icon">💡</span>
                <h3>Conceptual Learning</h3>
                <p>Focus on understanding fundamentals rather than rote learning</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Icons */}
      <section className="social-section">
        <div className="container">
          <h3>Connect With Us</h3>
          <div className="social-links">
            <a href="https://www.instagram.com/officialbe.educated/?igsh=MXJpOXV0eXliOHV6Mw%3D%3D#" className="social-link instagram" aria-label="Instagram">
              <FaInstagram/>
            </a>
            <a href="https://www.facebook.com/share/14FMyCY2J8D/" className="social-link Facebook" aria-label="Facebook">
              <FaFacebook/>
            </a>
            <a href="https://www.linkedin.com/company/be-educated-official/" className="social-link Linkedin" aria-label="Linkedin">
              <FaLinkedin/>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-logo">
                <div className="logo-container">
                  <img src={logo} alt="Excellence Coaching Logo" className="logo-image" />
                  <div className="logo-content">
                    <span className="logo-text">Be Educated</span>
                    <span className="logo-tagline">Achieve Beyond Limits</span>
                  </div>
                </div>
                <p>Building bright minds through quality education and personalized attention.</p>
              </div>
            </div>

            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li>
                  <Link to="/about">About Us</Link>
                </li>
                <li>
                  <Link to="/courses">Courses</Link>
                </li>
                <li>
                  <Link to="/faculty">Faculty</Link>
                </li>
                <li>
                  <Link to="/contact">Contact</Link>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Programs</h4>
              <ul>
                <li>
                  <a href="#">Class 9-10 Foundation</a>
                </li>
                <li>
                  <a href="#">Class 11-12 Board Prep</a>
                </li>
                <li>
                  <a href="#">Home Tutoring</a>
                </li>
                <li>
                  <a href="#">Competitive Exam Prep</a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li>
                  <Link to="/student-portal">Student Portal</Link>
                </li>
                <li>
                  <a href="#">Parent Login</a>
                </li>
                <li>
                  <a href="#">Fee Structure</a>
                </li>
                <li>
                  <a href="#">Admission Process</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 Be Educated. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home




// src/pages/Home.jsx

// import "./Home.css";
// import logo from "../assets/logo.png";
// import { Link } from "react-router-dom";
// import { useState } from "react";

// function Home() {
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

//   const toggleMobileMenu = () => {
//     setIsMobileMenuOpen(!isMobileMenuOpen);
//   };

//   const testimonials = [
//     {
//       name: "Arjun Sharma",
//       role: "Class 12 Student",
//       quote:
//         "The personalized attention and small batch sizes helped me improve my Physics score from 60% to 95% in just 6 months. The teachers here truly care about each student's progress.",
//       avatar: "AS",
//       rating: 5,
//     },
//     {
//       name: "Mrs. Priya Gupta",
//       role: "Parent",
//       quote:
//         "My daughter's confidence has grown tremendously since joining. The regular parent-teacher meetings and progress reports keep us well-informed about her development.",
//       avatar: "PG",
//       rating: 5,
//     },
//     {
//       name: "Rajesh Kumar",
//       role: "Mathematics Teacher",
//       quote:
//         "Working here has been incredibly rewarding. The institute's focus on conceptual clarity and individual attention creates an ideal learning environment for students.",
//       avatar: "RK",
//       rating: 5,
//     },
//   ];

//   return (
//     <div className="home-wrapper">
//       {/* Navigation */}
//       <nav className="navbar">
//         <div className="container">
//           <div className="nav-content">
//             <div className="logo-section">
//               <Link to="/" className="logo-link">
//                 <div className="logo-container">
//                   <img src={logo} alt="Be Educated Logo" className="logo-image" />
//                   <div className="logo-content">
//                     <span className="logo-text">Be Educated</span>
//                     <span className="logo-tagline">Achieve Beyond Limits</span>
//                   </div>
//                 </div>
//               </Link>
//             </div>
//             <button
//               className="mobile-menu-toggle"
//               onClick={toggleMobileMenu}
//               aria-label="Toggle mobile menu"
//               aria-expanded={isMobileMenuOpen}
//             >
//               <span className={`hamburger ${isMobileMenuOpen ? "open" : ""}`}></span>
//             </button>
//             <div className={`nav-links ${isMobileMenuOpen ? "active" : ""}`}>
//               <Link to="/about" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
//               <Link to="/courses" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Courses</Link>
//               <Link to="/contact" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>
//               <Link to="/login" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
//               <Link to="/signup" className="btn btn-nav" onClick={() => setIsMobileMenuOpen(false)}>Join Now</Link>
//             </div>
//           </div>
//         </div>
//       </nav>

//       {/* Logo + Tagline Section */}
//       <section className="logo-tagline-section">
//         <div className="container">
//           <div className="logo-showcase">
//             <span className="main-logo-icon">🎓</span>
//             <h1 className="institute-name">Excellence Coaching Institute</h1>
//             <p className="tagline">Building Bright Minds Since 2010</p>
//           </div>
//         </div>
//       </section>

//       {/* Short Intro */}
//       <section className="short-intro">
//         <div className="container">
//           <div className="intro-content">
//             <h2>Personalized Learning for Classes 9-12 & Home Tutoring</h2>
//             <p>
//               We specialize in providing quality education through small batch sizes and personalized attention. Our experienced faculty focuses on conceptual clarity and individual student growth, ensuring every student reaches their full potential in board exams and competitive preparations.
//             </p>
//             <p>
//               With flexible home tutoring options and comprehensive classroom programs, we adapt to each student's learning style and pace, making education accessible and effective for all.
//             </p>

//             <div className="intro-highlights">
//               <div className="highlight">
//                 <span className="highlight-number">15+</span>
//                 <span className="highlight-text">Years of Excellence</span>
//               </div>
//               <div className="highlight">
//                 <span className="highlight-number">500+</span>
//                 <span className="highlight-text">Top Rank Holders</span>
//               </div>
//               <div className="highlight">
//                 <span className="highlight-number">98%</span>
//                 <span className="highlight-text">Parent Satisfaction</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Highlight Section */}
//       <section className="highlights">
//         <div className="container">
//           <div className="section-header">
//             <h2>Why Choose Excellence Coaching?</h2>
//             <p>Discover what makes us the preferred choice for students and parents</p>
//           </div>
//           <div className="highlights-grid">
//             <div className="highlight-card">
//               <div className="highlight-icon">🏆</div>
//               <h3>98% Board Pass Rate</h3>
//               <p>Consistently high success rate in CBSE & State Board examinations</p>
//             </div>
//             <div className="highlight-card">
//               <div className="highlight-icon">👨‍🏫</div>
//               <h3>1:1 Doubt Solving</h3>
//               <p>Personal attention with dedicated doubt clearing sessions</p>
//             </div>
//             <div className="highlight-card">
//               <div className="highlight-icon">📚</div>
//               <h3>Free Study Materials</h3>
//               <p>Comprehensive notes, practice papers, and reference materials</p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Testimonials Section */}
//       <section className="testimonials">
//         <div className="container">
//           <div className="testimonials-heading-wrapper" style={{ textAlign: "center", margin: "17rem 0 2rem" }}>
//             <h2 style={{ fontSize: "2.5rem", fontWeight: 700, color: "#1f2937", fontFamily: "Poppins, sans-serif" }}>
//               What Our Students & Parents Say
//             </h2>
//             <p style={{ fontSize: "1.25rem", color: "#374151", fontFamily: "Open Sans, sans-serif" }}>
//               Real experiences from our learning community
//             </p>
//           </div>
//           <div className="testimonials-grid">
//             {testimonials.map((testimonial, index) => (
//               <div key={index} className="testimonial-card">
//                 <div className="testimonial-content">
//                   <div className="quote-mark">"</div>
//                   <p>{testimonial.quote}</p>
//                   <div className="testimonial-footer">
//                     <div className="student-info">
//                       <div className="student-avatar">{testimonial.avatar}</div>
//                       <div className="student-details">
//                         <h4>{testimonial.name}</h4>
//                         <span>{testimonial.role}</span>
//                       </div>
//                     </div>
//                     <div className="rating">
//                       {[...Array(testimonial.rating)].map((_, i) => (
//                         <span key={i}>⭐</span>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Contact Section */}
//       <section className="contact-section">
//         <div className="container">
//           <div className="contact-grid">
//             <div className="contact-info">
//               <h2>Visit Our Institute</h2>
//               <p>Come and experience our learning environment firsthand</p>

//               <div className="contact-details">
//                 {/* Address */}
//                 <div className="contact-item">
//                   <div className="contact-icon">📍</div>
//                   <div className="contact-text">
//                     <h4>Our Address</h4>
//                     <p>
//                       123 Education Hub, Knowledge Park<br />
//                       Academic City, State 560001<br />
//                       India
//                     </p>
//                     <a href="https://maps.app.goo.gl/ukWj2xa2bHVWekvy8" target="_blank" rel="noopener noreferrer" className="maps-link">
//                       📍 View on Google Maps
//                     </a>
//                   </div>
//                 </div>

//                 {/* Phone */}
//                 <div className="contact-item">
//                   <div className="contact-icon">📞</div>
//                   <div className="contact-text">
//                     <h4>Phone Numbers</h4>
//                     <p>
//                       +91 98765-43210<br />
//                       +91 87654-32109<br />
//                       Toll Free: 1800-123-4567
//                     </p>
//                   </div>
//                 </div>

//                 {/* Email */}
//                 <div className="contact-item">
//                   <div className="contact-icon">✉️</div>
//                   <div className="contact-text">
//                     <h4>Email Us</h4>
//                     <p>
//                       info@excellencecoaching.com<br />
//                       admissions@excellencecoaching.com
//                     </p>
//                   </div>
//                 </div>

//                 {/* Office Hours */}
//                 <div className="contact-item">
//                   <div className="contact-icon">🕒</div>
//                   <div className="contact-text">
//                     <h4>Office Hours</h4>
//                     <p>
//                       Monday - Friday: 8:00 AM - 8:00 PM<br />
//                       Saturday: 9:00 AM - 6:00 PM<br />
//                       Sunday: 10:00 AM - 4:00 PM
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Additional Info Cards */}
//             <div className="additional-info">
//               <div className="info-card">
//                 <span className="info-icon">👥</span>
//                 <h3>Small Batch Sizes</h3>
//                 <p>Maximum 15 students per batch for personalized attention</p>
//               </div>
//               <div className="info-card">
//                 <span className="info-icon">🏠</span>
//                 <h3>Home Tutoring</h3>
//                 <p>Qualified teachers available for one-on-one home sessions</p>
//               </div>
//               <div className="info-card">
//                 <span className="info-icon">🏅</span>
//                 <h3>Experienced Faculty</h3>
//                 <p>10+ years of teaching experience with proven track record</p>
//               </div>
//               <div className="info-card">
//                 <span className="info-icon">💡</span>
//                 <h3>Conceptual Learning</h3>
//                 <p>Focus on understanding fundamentals rather than rote learning</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Social Media */}
//       <section className="social-section">
//         <div className="container">
//           <h3>Connect With Us</h3>
//           <div className="social-links">
//             <a href="#" className="social-link facebook" aria-label="Facebook">📘</a>
//             <a href="#" className="social-link instagram" aria-label="Instagram">📷</a>
//             <a href="#" className="social-link whatsapp" aria-label="WhatsApp">💬</a>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="footer">
//         <div className="container">
//           <div className="footer-content">
//             <div className="footer-section">
//               <div className="footer-logo">
//                 <div className="logo-container">
//                   <img src={logo} alt="Excellence Coaching Logo" className="logo-image" />
//                   <div className="logo-content">
//                     <span className="logo-text">Be Educated</span>
//                     <span className="logo-tagline">Achieve Beyond Limits</span>
//                   </div>
//                 </div>
//                 <p>Building bright minds through quality education and personalized attention.</p>
//               </div>
//             </div>

//             <div className="footer-section">
//               <h4>Quick Links</h4>
//               <ul>
//                 <li><Link to="/about">About Us</Link></li>
//                 <li><Link to="/courses">Courses</Link></li>
//                 <li><Link to="/faculty">Faculty</Link></li>
//                 <li><Link to="/contact">Contact</Link></li>
//               </ul>
//             </div>

//             <div className="footer-section">
//               <h4>Programs</h4>
//               <ul>
//                 <li><a href="#">Class 9-10 Foundation</a></li>
//                 <li><a href="#">Class 11-12 Board Prep</a></li>
//                 <li><a href="#">Home Tutoring</a></li>
//                 <li><a href="#">Competitive Exam Prep</a></li>
//               </ul>
//             </div>

//             <div className="footer-section">
//               <h4>Support</h4>
//               <ul>
//                 <li><a href="#">Student Portal</a></li>
//                 <li><a href="#">Parent Login</a></li>
//                 <li><a href="#">Fee Structure</a></li>
//                 <li><a href="#">Admission Process</a></li>
//               </ul>
//             </div>
//           </div>
//           <div className="footer-bottom">
//             <p>&copy; 2024 Be Educated. All rights reserved.</p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

// export default Home;


