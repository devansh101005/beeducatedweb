
import "./Home.css"
import { Link } from "react-router-dom"

function Home() {
  return (
    <div className="home-wrapper">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-content">
            <div className="logo-section">
              <Link to="/" className="logo-link">
                <div className="logo-container">
                  <div className="logo-placeholder">
                    📚
                  </div>
                  <span className="logo-text">Excellence Academy</span>
                </div>
              </Link>
            </div>
            <div className="nav-links">
              <Link to="/about" className="nav-link">About</Link>
              <Link to="/courses" className="nav-link">Courses</Link>
              <Link to="/contact" className="nav-link">Contact</Link>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="btn btn-nav">Join Now</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background"></div>
        <div className="container">
          <div className="hero-content">
            <div className="logo-showcase">
              <div className="main-logo">
                <div className="logo-icon">🎓</div>
                <h1 className="institute-name">Excellence Academy</h1>
              </div>
              <p className="tagline">Empowering Minds, Shaping Futures</p>
            </div>
            
            <div className="intro-section">
              <h2 className="intro-title">Transform Your Learning Journey</h2>
              <p className="intro-text">
                Welcome to Excellence Academy, where we believe every student has the potential to achieve greatness. 
                Our expert faculty, innovative teaching methods, and personalized approach ensure your success in 
                competitive exams and beyond.
              </p>
            </div>

            <div className="cta-section">
              <Link to="/signup" className="btn btn-primary">
                <span>Start Your Journey</span>
                <div className="btn-shine"></div>
              </Link>
              <Link to="/courses" className="btn btn-outline">
                <span>Explore Courses</span>
              </Link>
              <Link to="/demo" className="btn btn-secondary">
                <span>Book Free Demo</span>
              </Link>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">10,000+</span>
                <span className="stat-label">Students Enrolled</span>
              </div>
              <div className="stat">
                <span className="stat-number">95%</span>
                <span className="stat-label">Success Rate</span>
              </div>
              <div className="stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">Expert Faculty</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Excellence Academy?</h2>
            <p>Discover what makes us the preferred choice for students and parents</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👨‍🏫</div>
              <h3>Expert Faculty</h3>
              <p>Learn from IIT/IIM alumni and industry experts with years of teaching experience.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Proven Results</h3>
              <p>95% success rate with students consistently achieving top ranks in competitive exams.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💻</div>
              <h3>Modern Learning</h3>
              <p>Interactive online classes, AI-powered doubt solving, and personalized study plans.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <h3>Comprehensive Material</h3>
              <p>Extensive study material, practice tests, and exam-specific preparation resources.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Short Intro Section */}
      <section className="short-intro">
        <div className="container">
          <div className="intro-content">
            <h2>About Excellence Academy</h2>
            <p>
              With over a decade of excellence in education, we have been the stepping stone for thousands of students 
              to achieve their academic dreams. Our commitment to quality education, personalized attention, and 
              result-oriented approach has made us a trusted name in competitive exam preparation.
            </p>
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
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <div className="section-header">
            <h2>Success Stories</h2>
            <p>Hear from our successful students who achieved their dreams</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-mark">"</div>
                <p>Excellence Academy transformed my approach to JEE preparation. The faculty's guidance and personalized attention helped me secure AIR 47 in JEE Advanced. The study material and mock tests were incredibly helpful.</p>
                <div className="testimonial-footer">
                  <div className="student-info">
                    <div className="student-avatar">AK</div>
                    <div className="student-details">
                      <h4>Arjun Kumar</h4>
                      <span>JEE Advanced AIR 47, IIT Delhi</span>
                    </div>
                  </div>
                  <div className="rating">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-mark">"</div>
                <p>The online classes at Excellence Academy are amazing! Even during the pandemic, I never felt disconnected from learning. The interactive sessions and doubt clearing made all the difference in my NEET preparation.</p>
                <div className="testimonial-footer">
                  <div className="student-info">
                    <div className="student-avatar">PS</div>
                    <div className="student-details">
                      <h4>Priya Sharma</h4>
                      <span>NEET AIR 156, AIIMS Delhi</span>
                    </div>
                  </div>
                  <div className="rating">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-content">
                <div className="quote-mark">"</div>
                <p>The mentorship program at Excellence Academy is exceptional. My mentor guided me through every step of CAT preparation, helping me achieve 99.8 percentile and secure admission to IIM Ahmedabad.</p>
                <div className="testimonial-footer">
                  <div className="student-info">
                    <div className="student-avatar">RG</div>
                    <div className="student-details">
                      <h4>Rahul Gupta</h4>
                      <span>CAT 99.8%ile, IIM Ahmedabad</span>
                    </div>
                  </div>
                  <div className="rating">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact & Address Section */}
      <section className="contact-section">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <h2>Get In Touch</h2>
              <p>Ready to start your journey to success? Contact us today!</p>
              
              <div className="contact-details">
                <div className="contact-item">
                  <div className="contact-icon">📍</div>
                  <div className="contact-text">
                    <h4>Our Address</h4>
                    <p>123 Education Hub, Knowledge Park<br />
                    Academic City, State 560001<br />
                    India</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">📞</div>
                  <div className="contact-text">
                    <h4>Phone Numbers</h4>
                    <p>+91 98765-43210<br />
                    +91 87654-32109<br />
                    Toll Free: 1800-123-4567</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">✉️</div>
                  <div className="contact-text">
                    <h4>Email Us</h4>
                    <p>info@excellenceacademy.com<br />
                    admissions@excellenceacademy.com<br />
                    support@excellenceacademy.com</p>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon">🕒</div>
                  <div className="contact-text">
                    <h4>Office Hours</h4>
                    <p>Monday - Friday: 8:00 AM - 8:00 PM<br />
                    Saturday: 9:00 AM - 6:00 PM<br />
                    Sunday: 10:00 AM - 4:00 PM</p>
                  </div>
                </div>
              </div>

              <div className="social-media">
                <h4>Follow Us</h4>
                <div className="social-links">
                  <a href="#" className="social-link facebook">📘</a>
                  <a href="#" className="social-link twitter">🐦</a>
                  <a href="#" className="social-link instagram">📷</a>
                  <a href="#" className="social-link youtube">📺</a>
                  <a href="#" className="social-link linkedin">💼</a>
                </div>
              </div>
            </div>

            <div className="contact-form-container">
              <div className="contact-form">
                <h3>Send Us a Message</h3>
                <form>
                  <div className="form-row">
                    <div className="form-group">
                      <input type="text" placeholder="Your Name" required />
                    </div>
                    <div className="form-group">
                      <input type="email" placeholder="Your Email" required />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <input type="tel" placeholder="Phone Number" />
                    </div>
                    <div className="form-group">
                      <select>
                        <option>Select Course</option>
                        <option>JEE Preparation</option>
                        <option>NEET Preparation</option>
                        <option>CAT Preparation</option>
                        <option>Foundation Course</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <textarea placeholder="Your Message" rows="5"></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    <span>Send Message</span>
                    <div className="btn-shine"></div>
                  </button>
                </form>
              </div>
            </div>
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
                  <div className="logo-icon">🎓</div>
                  <span className="logo-text">Excellence Academy</span>
                </div>
                <p>Empowering minds and shaping futures through quality education and innovative teaching methods.</p>
              </div>
            </div>

            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/courses">Courses</Link></li>
                <li><Link to="/faculty">Faculty</Link></li>
                <li><Link to="/results">Results</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Courses</h4>
              <ul>
                <li><a href="#">JEE Preparation</a></li>
                <li><a href="#">NEET Preparation</a></li>
                <li><a href="#">CAT Preparation</a></li>
                <li><a href="#">Foundation</a></li>
                <li><a href="#">Online Classes</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Student Portal</a></li>
                <li><a href="#">Download App</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 Excellence Academy. All rights reserved. | Designed with ❤️ for student success</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
