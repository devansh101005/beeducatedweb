import React from "react";
import "../App.css";

const HomePage = () => (
  <div className="container">
    <img src="/logo.png" alt="Be Educated Logo" className="logo" />
    <h1>Be Educated Home Tutor</h1>
    <div className="tagline">Empowering Students, Enabling Teachers</div>
    <div className="intro">
      Personalized home tutoring for every learner.<br />
      Join us to experience quality education at your doorstep!
    </div>
    <div className="cta-buttons">
      <button onClick={() => window.location.href = '/student-register'}>Book a Demo</button>
      <button onClick={() => window.location.href = '/teacher-register'}>Join as Tutor</button>
    </div>
    <div className="highlights">
      <div className="highlight">
        <strong>Expert Tutors</strong><br />
        Verified, experienced, and passionate teachers.
      </div>
      <div className="highlight">
        <strong>Personalized Learning</strong><br />
        One-on-one sessions tailored to student needs.
      </div>
      <div className="highlight">
        <strong>Safe & Trusted</strong><br />
        Background-checked tutors and secure platform.
      </div>
      <div className="highlight">
        <strong>Flexible Scheduling</strong><br />
        Book sessions as per your convenience.
      </div>
      <div className="highlight">
        <strong>Online & Offline Support</strong><br />
        Access study material and support anytime.
      </div>
    </div>
    <div className="testimonials">
      <div className="testimonial">My son’s grades improved drastically! Highly recommend Be Educated.<b>- Parent</b></div>
      <div className="testimonial">The platform is easy to use and the tutors are very professional.<b>- Student</b></div>
      <div className="testimonial">I love the flexibility and the quality of teaching.<b>- Parent</b></div>
    </div>
    <div className="contact-info">
      <b>Contact Us:</b><br />
      Phone/WhatsApp: <a href="tel:+919999999999">+91-99999-99999</a><br />
      Email: <a href="mailto:info@beeducated.com">info@beeducated.com</a><br />
      Address: 123, Main Road, Your City, India
    </div>
    <div className="features">
      <h2>Why Choose Us?</h2>
      <div className="feature-list">
        <div className="feature-item">
          <span role="img" aria-label="certificate">🎓</span>
          <div>
            <b>Certified Tutors</b>
            <p>All our tutors are certified and undergo regular training.</p>
          </div>
        </div>
        <div className="feature-item">
          <span role="img" aria-label="support">💬</span>
          <div>
            <b>24/7 Support</b>
            <p>Get help anytime with our dedicated support team.</p>
          </div>
        </div>
        <div className="feature-item">
          <span role="img" aria-label="progress">📈</span>
          <div>
            <b>Progress Tracking</b>
            <p>Parents and students can track learning progress and attendance online.</p>
          </div>
        </div>
        <div className="feature-item">
          <span role="img" aria-label="community">🤝</span>
          <div>
            <b>Community Events</b>
            <p>Participate in webinars, workshops, and competitions for holistic growth.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default HomePage;
